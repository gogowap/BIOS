// tests/loanService.test.ts
// Anggota C & D - Unit Testing Modul Peminjaman & Pengembalian

import { LoanService, calculateFine, getTodayString, getDueDateString } from "../src/services/loanService";
import { LoanModel } from "../src/models/loanModel";
import { BookModel } from "../src/models/bookModel";
import { MemberModel } from "../src/models/memberModel";

jest.mock("../src/models/loanModel");
jest.mock("../src/models/bookModel");
jest.mock("../src/models/memberModel");

const MockLoanModel = LoanModel as jest.Mocked<typeof LoanModel>;
const MockBookModel = BookModel as jest.Mocked<typeof BookModel>;
const MockMemberModel = MemberModel as jest.Mocked<typeof MemberModel>;

describe("LoanService - Unit Tests", () => {

  beforeEach(() => jest.clearAllMocks());

  const mockBook = { id: 1, title: "Clean Code", author: "Robert Martin", isbn: "9780132350884", stock: 3 };
  const mockMember = { id: 1, name: "Budi", email: "budi@email.com", status: "active" as const };

  // ========================
  // calculateFine - helper
  // ========================
  describe("calculateFine()", () => {
    it("harus mengembalikan 0 jika dikembalikan tepat waktu", () => {
      const fine = calculateFine("2025-01-01", "2025-01-01");
      expect(fine).toBe(0);
    });

    it("harus menghitung denda jika terlambat 3 hari", () => {
      const fine = calculateFine("2025-01-01", "2025-01-04");
      expect(fine).toBe(3000); // 3 hari x Rp 1000
    });

    it("harus mengembalikan 0 jika dikembalikan sebelum jatuh tempo", () => {
      const fine = calculateFine("2025-01-10", "2025-01-05");
      expect(fine).toBe(0);
    });
  });

  // ========================
  // getDueDateString
  // ========================
  describe("getDueDateString()", () => {
    it("harus menambahkan hari dengan benar", () => {
      const result = getDueDateString("2025-01-01", 14);
      expect(result).toBe("2025-01-15");
    });
  });

  // ========================
  // createLoan
  // ========================
  describe("createLoan()", () => {
    it("harus berhasil membuat peminjaman valid", async () => {
      MockLoanModel.updateOverdueStatus.mockResolvedValue(undefined);
      MockBookModel.findById.mockResolvedValue(mockBook);
      MockMemberModel.findById.mockResolvedValue(mockMember);
      MockMemberModel.countActiveLoans.mockResolvedValue(0);
      MockBookModel.decrementStock.mockResolvedValue(true);
      MockLoanModel.create.mockResolvedValue(1);
      MockLoanModel.findById.mockResolvedValue({
        id: 1, book_id: 1, member_id: 1,
        loan_date: "2025-01-01", due_date: "2025-01-15", status: "borrowed"
      });

      const result = await LoanService.createLoan(1, 1);
      expect(result.id).toBe(1);
      expect(result.status).toBe("borrowed");
    });

    it("harus throw error jika stok buku habis", async () => {
      MockBookModel.findById.mockResolvedValue({ ...mockBook, stock: 0 });
      MockMemberModel.findById.mockResolvedValue(mockMember);
      await expect(LoanService.createLoan(1, 1)).rejects.toThrow("habis");
    });

    it("harus throw error jika anggota disuspend", async () => {
      MockBookModel.findById.mockResolvedValue(mockBook);
      MockMemberModel.findById.mockResolvedValue({ ...mockMember, status: "suspended" });
      await expect(LoanService.createLoan(1, 1)).rejects.toThrow("disuspend");
    });

    it("harus throw error jika melebihi batas pinjaman", async () => {
      MockBookModel.findById.mockResolvedValue(mockBook);
      MockMemberModel.findById.mockResolvedValue(mockMember);
      MockMemberModel.countActiveLoans.mockResolvedValue(3);
      await expect(LoanService.createLoan(1, 1)).rejects.toThrow("maks");
    });

    it("harus throw error jika ID tidak valid", async () => {
      await expect(LoanService.createLoan(-1, 1)).rejects.toThrow("ID buku harus integer positif");
    });
  });

  // ========================
  // returnLoan - Automata
  // ========================
  describe("returnLoan() - Automata State Machine", () => {
    it("harus berhasil memproses pengembalian dari status borrowed", async () => {
      const mockLoan = { id: 1, book_id: 1, member_id: 1, loan_date: "2025-01-01", due_date: "2099-12-31", status: "borrowed" as const };
      MockLoanModel.findById
        .mockResolvedValueOnce(mockLoan)
        .mockResolvedValueOnce({ ...mockLoan, status: "returned" });
      MockLoanModel.processReturn.mockResolvedValue(true);
      MockBookModel.incrementStock.mockResolvedValue(true);

      const result = await LoanService.returnLoan(1);
      expect(result.loan.status).toBe("returned");
      expect(result.fine).toBe(0);
    });

    it("harus throw error jika status sudah returned (invalid transition)", async () => {
      MockLoanModel.findById.mockResolvedValue({
        id: 1, book_id: 1, member_id: 1,
        loan_date: "2025-01-01", due_date: "2025-01-15",
        status: "returned" as const
      });
      await expect(LoanService.returnLoan(1)).rejects.toThrow("Tidak bisa mengembalikan");
    });

    it("harus berhasil memproses pengembalian dari status overdue", async () => {
      const mockLoan = { id: 1, book_id: 1, member_id: 1, loan_date: "2025-01-01", due_date: "2025-01-15", status: "overdue" as const };
      MockLoanModel.findById
        .mockResolvedValueOnce(mockLoan)
        .mockResolvedValueOnce({ ...mockLoan, status: "returned" });
      MockLoanModel.processReturn.mockResolvedValue(true);
      MockBookModel.incrementStock.mockResolvedValue(true);

      const result = await LoanService.returnLoan(1);
      expect(result.fine).toBeGreaterThan(0);
    });
  });
});

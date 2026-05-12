import { LoanModel, Loan } from "../models/loanModel";
import { BookModel } from "../models/bookModel";
import { MemberModel } from "../models/memberModel";
import { appConfig } from "../config/appConfig";

// ============================================================
// AUTOMATA: State machine untuk status peminjaman
// State: borrowed -> returned
//        borrowed -> overdue
//        overdue  -> returned
// ============================================================
type LoanStatus = "borrowed" | "overdue" | "returned";

const LOAN_STATE_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  borrowed: ["returned", "overdue"],
  overdue: ["returned"],
  returned: [], // final state
};

function isValidTransition(from: LoanStatus, to: LoanStatus): boolean {
  return LOAN_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// DESIGN BY CONTRACT (DbC)
// ============================================================
function assertPrecondition(condition: boolean, message: string): void {
  if (!condition) {
    const err: any = new Error(`[Precondition Failed] ${message}`);
    err.statusCode = 400;
    throw err;
  }
}

function assertPostcondition(condition: boolean, message: string): void {
  if (!condition) {
    const err: any = new Error(`[Postcondition Failed] ${message}`);
    err.statusCode = 500;
    throw err;
  }
}

// ============================================================
// CODE REUSE: Fungsi kalkulasi denda (dipakai di beberapa tempat)
// ============================================================
export function calculateFine(dueDate: string, returnDate: string): number {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  const diffMs = ret.getTime() - due.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return diffDays * appConfig.library.finePerDay;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDueDateString(loanDate: string, days: number): string {
  const date = new Date(loanDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export const LoanService = {
  async getAllLoans(): Promise<Loan[]> {
    await LoanModel.updateOverdueStatus();
    const loans = await LoanModel.findAll();
    assertPostcondition(Array.isArray(loans), "getAllLoans harus mengembalikan array");
    return loans;
  },

  async getOverdueLoans(): Promise<Loan[]> {
    await LoanModel.updateOverdueStatus();
    return await LoanModel.findOverdue();
  },

  async createLoan(bookId: number, memberId: number): Promise<Loan> {
    // Precondition: ID valid
    assertPrecondition(Number.isInteger(bookId) && bookId > 0, "ID buku harus integer positif");
    assertPrecondition(Number.isInteger(memberId) && memberId > 0, "ID anggota harus integer positif");

    // Precondition: buku harus ada
    const book = await BookModel.findById(bookId);
    assertPrecondition(book !== null, `Buku dengan ID ${bookId} tidak ditemukan`);

    // Precondition: stok buku harus > 0
    assertPrecondition(book!.stock > 0, `Stok buku "${book!.title}" habis`);

    // Precondition: anggota harus ada dan aktif
    const member = await MemberModel.findById(memberId);
    assertPrecondition(member !== null, `Anggota dengan ID ${memberId} tidak ditemukan`);
    assertPrecondition(member!.status === "active", `Anggota "${member!.name}" sedang disuspend`);

    // Precondition: jumlah pinjaman aktif tidak melebihi batas
    const activeLoans = await MemberModel.countActiveLoans(memberId);
    assertPrecondition(
      activeLoans < appConfig.library.maxLoansPerMember,
      `Anggota sudah meminjam ${activeLoans} buku (maks ${appConfig.library.maxLoansPerMember})`
    );

    const today = getTodayString();
    const dueDate = getDueDateString(today, appConfig.library.maxLoanDays);

    // Kurangi stok buku
    await BookModel.decrementStock(bookId);

    const insertId = await LoanModel.create({
      book_id: bookId,
      member_id: memberId,
      loan_date: today,
      due_date: dueDate,
    });

    assertPostcondition(insertId > 0, "Gagal membuat peminjaman");

    const created = await LoanModel.findById(insertId);
    assertPostcondition(created !== null, "Peminjaman tidak ditemukan setelah dibuat");
    return created!;
  },

  async returnLoan(loanId: number): Promise<{ loan: Loan; fine: number }> {
    assertPrecondition(Number.isInteger(loanId) && loanId > 0, "ID peminjaman harus integer positif");

    const loan = await LoanModel.findById(loanId);
    assertPrecondition(loan !== null, `Peminjaman dengan ID ${loanId} tidak ditemukan`);

    // AUTOMATA: validasi transisi state
    const currentStatus = loan!.status as LoanStatus;
    assertPrecondition(
      isValidTransition(currentStatus, "returned"),
      `Tidak bisa mengembalikan buku dengan status "${currentStatus}"`
    );

    const today = getTodayString();
    const fine = calculateFine(loan!.due_date, today);

    await LoanModel.processReturn(loanId, today, fine);

    // Kembalikan stok buku
    await BookModel.incrementStock(loan!.book_id);

    const updated = await LoanModel.findById(loanId);
    assertPostcondition(updated!.status === "returned", "Status peminjaman tidak terupdate");

    return { loan: updated!, fine };
  },
};

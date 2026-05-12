// tests/performance.test.ts
// Performance Testing - semua anggota

import { calculateFine, getDueDateString, getTodayString } from "../src/services/loanService";
import { BookModel } from "../src/models/bookModel";
import { MemberModel } from "../src/models/memberModel";

jest.mock("../src/models/bookModel");
jest.mock("../src/models/memberModel");

const MockBookModel = BookModel as jest.Mocked<typeof BookModel>;
const MockMemberModel = MemberModel as jest.Mocked<typeof MemberModel>;

// Helper: ukur waktu eksekusi
async function measureTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

describe("Performance Tests", () => {

  // ========================
  // Anggota A - Book Search Performance
  // ========================
  describe("Anggota A - calculateFine() performance", () => {
    it("harus menghitung 10.000 denda dalam < 100ms", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        calculateFine("2025-01-01", "2025-01-15");
      }
      const duration = performance.now() - start;
      console.log(`[Perf] 10.000x calculateFine: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });
  });

  // ========================
  // Anggota B - getDueDateString performance
  // ========================
  describe("Anggota B - getDueDateString() performance", () => {
    it("harus menghitung 10.000 due date dalam < 100ms", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        getDueDateString("2025-01-01", 14);
      }
      const duration = performance.now() - start;
      console.log(`[Perf] 10.000x getDueDateString: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });
  });

  // ========================
  // Anggota C - Automata state transition performance
  // ========================
  describe("Anggota C - State transition validation performance", () => {
    type LoanStatus = "borrowed" | "overdue" | "returned";
    const TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
      borrowed: ["returned", "overdue"],
      overdue: ["returned"],
      returned: [],
    };

    function isValid(from: LoanStatus, to: LoanStatus): boolean {
      return TRANSITIONS[from]?.includes(to) ?? false;
    }

    it("harus memvalidasi 100.000 transisi state dalam < 200ms", () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        isValid("borrowed", "returned");
        isValid("returned", "borrowed");
        isValid("overdue", "returned");
      }
      const duration = performance.now() - start;
      console.log(`[Perf] 100.000x state transition check: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });
  });

  // ========================
  // Anggota D - Fine calculation bulk performance
  // ========================
  describe("Anggota D - Bulk fine calculation performance", () => {
    it("harus menghitung denda untuk 1.000 pinjaman sekaligus dalam < 50ms", () => {
      const loans = Array.from({ length: 1000 }, (_, i) => ({
        due_date: "2025-01-01",
        return_date: `2025-01-${String(i % 28 + 1).padStart(2, "0")}`,
      }));

      const start = performance.now();
      loans.forEach((l) => calculateFine(l.due_date, l.return_date));
      const duration = performance.now() - start;
      console.log(`[Perf] 1.000x bulk fine calculation: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });
  });

  // ========================
  // Anggota E - Table-driven validation performance
  // ========================
  describe("Anggota E - Table-driven validation performance", () => {
    const RULES = [
      { validate: (v: any) => typeof v === "string" && v.length > 0, message: "title required" },
      { validate: (v: any) => typeof v === "string" && v.length > 0, message: "author required" },
      { validate: (v: any) => /^[0-9-]{10,17}$/.test(v), message: "isbn invalid" },
      { validate: (v: any) => typeof v === "number" && v >= 0, message: "stock invalid" },
    ];
    const values = ["Clean Code", "Robert Martin", "9780132350884", 5];

    it("harus memvalidasi 50.000 buku dalam < 500ms", () => {
      const start = performance.now();
      for (let i = 0; i < 50000; i++) {
        RULES.forEach((rule, idx) => rule.validate(values[idx]));
      }
      const duration = performance.now() - start;
      console.log(`[Perf] 50.000x table-driven validation: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
    });
  });
});

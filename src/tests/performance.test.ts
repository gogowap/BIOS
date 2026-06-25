import { BukuService } from "../services/bukuService";

describe("Performance & Stress Tests", () => {

  // ── Automata FSM Validation ────────────────────────────────
  describe("Validasi State Transition Automata Performance", () => {
    type StatusTransaksi = "borrowed" | "overdue" | "returned";

    const ATURAN_TRANSISI: Record<StatusTransaksi, StatusTransaksi[]> = {
      borrowed: ["returned", "overdue"],
      overdue:  ["returned"],
      returned: [],
    };

    function cekValidasiAutomata(dari: StatusTransaksi, ke: StatusTransaksi): boolean {
      return ATURAN_TRANSISI[dari]?.includes(ke) ?? false;
    }

    it("harus mampu memvalidasi 100.000 siklus state automata dalam waktu < 50ms", () => {
      const start = performance.now();

      for (let i = 0; i < 100000; i++) {
        cekValidasiAutomata("borrowed", "returned");
        cekValidasiAutomata("returned", "borrowed");
        cekValidasiAutomata("overdue",  "returned");
      }

      const duration = performance.now() - start;
      console.log(`⚡ [Perf] 100.000x Validasi Automata FSM: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });
  });

  // ── Table-Driven Kategori Lookup ───────────────────────────
  describe("Table-Driven Kategori Lookup Performance", () => {
    it("harus mampu melakukan lookup aturan denda sebanyak 50.000 kali dalam < 50ms", () => {
      const start = performance.now();

      for (let i = 0; i < 50000; i++) {
        BukuService.ambilAturanKategori("Novel");
        BukuService.ambilAturanKategori("Ensiklopedi");
        BukuService.ambilAturanKategori("Umum");
      }

      const duration = performance.now() - start;
      console.log(`⚡ [Perf] 50.000x Table-Driven Lookup Kategori Buku: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });
  });

  // ── Defensive Programming Validation ──────────────────────
  describe("Table-Driven Data Validation Performance", () => {
    // Teknik b: validasi berbasis tabel aturan
    const ATURAN_VALIDASI = [
      { validate: (v: any) => typeof v === "string" && v.trim().length > 0, message: "Title wajib diisi" },
      { validate: (v: any) => typeof v === "string" && v.trim().length > 0, message: "Author wajib diisi" },
      { validate: (v: any) => typeof v === "string" && v.trim().length > 0, message: "ISBN wajib diisi"   },
      { validate: (v: any) => typeof v === "number" && v >= 0,              message: "Stok tidak boleh negatif" },
    ];
    const mockValues = ["Clean Code", "Robert Martin", "9780132350884", 5];

    it("harus mampu memvalidasi 50.000 data input buku dalam waktu < 100ms", () => {
      const start = performance.now();

      for (let i = 0; i < 50000; i++) {
        ATURAN_VALIDASI.forEach((aturan, idx) => aturan.validate(mockValues[idx]));
      }

      const duration = performance.now() - start;
      console.log(`⚡ [Perf] 50.000x Validasi Input Defensive Programming: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });
  });
});

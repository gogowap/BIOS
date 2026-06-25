import { BukuService } from "../services/bukuService";
import { BukuModel } from "../models/bukuModel";
import { AktivitasModel } from "../models/aktivitasModel";

// Mock model agar tidak menyentuh database sungguhan
jest.mock("../models/bukuModel");
jest.mock("../models/aktivitasModel");

const MockBukuModel = BukuModel as jest.Mocked<typeof BukuModel>;
const MockAktivitasModel = AktivitasModel as jest.Mocked<typeof AktivitasModel>;

describe("BukuService - tambahBuku()", () => {

  // Data buku valid sebagai acuan tiap test
  const dataValid = {
    title: "Avengers Telkom",
    author: "Ahmad Dhani Ibrahim",
    isbn: "9780132350884",
    stock: 3,
    category: "Edukasi"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockAktivitasModel.create.mockResolvedValue([]);
    MockBukuModel.create.mockResolvedValue([{ insertId: 1 }]);
  });

  // ── Skenario BERHASIL ─────────────────────────────────────

  it("berhasil menyimpan buku jika semua data valid", async () => {
    await expect(BukuService.tambahBuku(dataValid)).resolves.not.toThrow();
    expect(MockBukuModel.create).toHaveBeenCalledTimes(1);
  });

  // ── Skenario GAGAL: validasi input ───────────────────────

  it("throw error jika title kosong", async () => {
    await expect(
      BukuService.tambahBuku({ ...dataValid, title: "" })
    ).rejects.toThrow("Judul, penulis, dan ISBN wajib diisi!");
  });

  it("throw error jika author kosong", async () => {
    await expect(
      BukuService.tambahBuku({ ...dataValid, author: "" })
    ).rejects.toThrow("Judul, penulis, dan ISBN wajib diisi!");
  });

  it("throw error jika ISBN kosong", async () => {
    await expect(
      BukuService.tambahBuku({ ...dataValid, isbn: "" })
    ).rejects.toThrow("Judul, penulis, dan ISBN wajib diisi!");
  });

  it("throw error jika stok negatif", async () => {
    await expect(
      BukuService.tambahBuku({ ...dataValid, stock: -1 })
    ).rejects.toThrow("Stok tidak boleh negatif!");
  });

});

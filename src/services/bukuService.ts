import { BukuModel, Buku } from "../models/bukuModel";
import { AktivitasModel } from "../models/aktivitasModel";

export class BukuService {
  // TEKNIK b: TABLE-DRIVEN CONSTRUCTION
  // Aturan denda & batas hari pinjam per kategori — tanpa if-else bercabang
  private static ATURAN_KATEGORI: Record<string, { tarifDenda: number; batasHari: number }> = {
    "Novel":       { tarifDenda: 2000, batasHari: 7  },
    "Komik":       { tarifDenda: 1500, batasHari: 5  },
    "Edukasi":     { tarifDenda: 3000, batasHari: 10 },
    "Ensiklopedi": { tarifDenda: 5000, batasHari: 14 },
    "fiksi":       { tarifDenda: 2000, batasHari: 7  },
    "nonfiksi":    { tarifDenda: 2500, batasHari: 10 },
    "Umum":        { tarifDenda: 1000, batasHari: 7  }, // default
  };

  static ambilAturanKategori(kategori: string) {
    return this.ATURAN_KATEGORI[kategori] ?? this.ATURAN_KATEGORI["Umum"];
  }

  static async ambilSemuaBuku() {
    return await BukuModel.findAll();
  }

  static async ambilBukuById(id: number) {
    const buku = await BukuModel.findById(id);
    if (!buku) throw new Error("Buku tidak ditemukan!");
    return buku;
  }

  static async cariBuku(kataKunci: string) {
    if (!kataKunci?.trim()) throw new Error("Kata kunci pencarian tidak boleh kosong!");
    return await BukuModel.findByKeyword(kataKunci.trim());
  }

  static async tambahBuku(data: Buku, id_user?: number) {
    // Defensive Programming: validasi input wajib
    if (!data.title?.trim() || !data.author?.trim() || !data.isbn?.trim()) {
      throw new Error("Judul, penulis, dan ISBN wajib diisi!");
    }
    if (data.stock < 0) throw new Error("Stok tidak boleh negatif!");

    const hasil: any = await BukuModel.create(data);
    await AktivitasModel.create({
      id_user: id_user ?? null,
      action: "TAMBAH_BUKU",
      target: data.title,
      detail: `ISBN: ${data.isbn}, Stok: ${data.stock}`
    });
    return hasil;
  }

  static async ubahBuku(id: number, data: Partial<Buku>, id_user?: number) {
    const ada = await BukuModel.findById(id);
    if (!ada) throw new Error("Buku tidak ditemukan!");
    if (data.stock !== undefined && data.stock < 0) throw new Error("Stok tidak boleh negatif!");

    const hasil = await BukuModel.update(id, { ...ada, ...data });
    await AktivitasModel.create({
      id_user: id_user ?? null,
      action: "UBAH_BUKU",
      target: data.title ?? ada.title,
      detail: `ID: ${id}`
    });
    return hasil;
  }

  static async hapusBuku(id: number, id_user?: number) {
    const ada = await BukuModel.findById(id);
    if (!ada) throw new Error("Buku tidak ditemukan!");

    const hasil = await BukuModel.delete(id);
    await AktivitasModel.create({
      id_user: id_user ?? null,
      action: "HAPUS_BUKU",
      target: ada.title,
      detail: `ID: ${id}`
    });
    return hasil;
  }
}

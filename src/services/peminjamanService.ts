import { PeminjamanModel } from "../models/peminjamanModel";
import { BukuModel } from "../models/bukuModel";
import { AnggotaModel } from "../models/anggotaModel";
import { AktivitasModel } from "../models/aktivitasModel";
import { BukuService } from "./bukuService";
import { FormatUtilitas } from "../utils/formatUtilitas";

export class PeminjamanService {
  // TEKNIK a: AUTOMATA — State Transition Matrix
  // Status yang legal: borrowed → overdue/returned, overdue → returned
  private static TRANSISI_VALID: Record<string, string[]> = {
    "borrowed": ["overdue", "returned"],
    "overdue":  ["returned"],
    "returned": [],
  };

  private static isTransisiValid(dari: string, ke: string): boolean {
    return this.TRANSISI_VALID[dari]?.includes(ke) ?? false;
  }

  static async ambilSemuaPeminjaman() {
    await PeminjamanModel.updateOverdue(); // auto-update status overdue
    return await PeminjamanModel.findAll();
  }

  static async ambilPinjamanByMember(memberId: number) {
    return await PeminjamanModel.findByMember(memberId);
  }

  static async pinjamBuku(bookId: number, memberId: number, id_user?: number) {
    const buku = await BukuModel.findById(bookId);
    if (!buku) throw new Error("Buku tidak ditemukan!");
    if (buku.stock <= 0) throw new Error("Stok buku sedang kosong!");

    const anggota = await AnggotaModel.findById(memberId);
    if (!anggota) throw new Error("Anggota tidak ditemukan!");
    if (anggota.status !== "active") throw new Error("Akun anggota tidak aktif!");

    // TABLE-DRIVEN: ambil batas hari dari kategori buku
    const aturan = BukuService.ambilAturanKategori(buku.category ?? "Umum");
    const tanggalPinjam = new Date().toISOString().split("T")[0];
    const batasTempo = new Date(Date.now() + aturan.batasHari * 86400000).toISOString().split("T")[0];

    await BukuModel.decreaseStock(bookId);
    const hasil = await PeminjamanModel.create({
      id_book: bookId, id_member: memberId,
      loan_date: tanggalPinjam, due_date: batasTempo, status: "borrowed"
    });

    await AktivitasModel.create({
      id_user: id_user ?? null,
      action: "PINJAM_BUKU",
      target: buku.title,
      detail: `Anggota: ${anggota.name}, Jatuh tempo: ${batasTempo}`
    });
    return hasil;
  }

  static async kembalikanBuku(id: number, id_user?: number) {
    const pinjaman = await PeminjamanModel.findById(id);
    if (!pinjaman) throw new Error("Data peminjaman tidak ditemukan!");

    // AUTOMATA: validasi transisi status
    if (!this.isTransisiValid(pinjaman.status, "returned")) {
      throw new Error(`Transisi status [${pinjaman.status}] → [returned] tidak valid!`);
    }

    const buku = await BukuModel.findById(pinjaman.id_book);
    if (!buku) throw new Error("Data buku tidak konsisten!");

    const tanggalKembali = new Date().toISOString().split("T")[0];

    // CODE REUSE: hitung denda via FormatUtilitas + BukuService
    const aturan = BukuService.ambilAturanKategori(buku.category ?? "Umum");
    const selisihHari = FormatUtilitas.hitungSelisihHari(pinjaman.due_date, tanggalKembali);
    const totalDenda = selisihHari * aturan.tarifDenda;

    await BukuModel.increaseStock(pinjaman.id_book);
    await PeminjamanModel.updateReturn(id, tanggalKembali, totalDenda);

    await AktivitasModel.create({
      id_user: id_user ?? null,
      action: "KEMBALI_BUKU",
      target: buku.title,
      detail: `Denda: ${FormatUtilitas.keRupiah(totalDenda)}`
    });

    return { dendaTeks: FormatUtilitas.keRupiah(totalDenda), nominalDenda: totalDenda };
  }
}

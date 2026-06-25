import { AnggotaModel, Member } from "../models/anggotaModel";
import { AktivitasModel } from "../models/aktivitasModel";

export class AnggotaService {
  static async ambilSemuaAnggota() {
    return await AnggotaModel.findAll();
  }

  static async ambilAnggotaById(id: number) {
    const anggota = await AnggotaModel.findById(id);
    if (!anggota) throw new Error("Anggota tidak ditemukan!");
    return anggota;
  }

  static async tambahAnggota(data: Member, id_user?: number) {
    // Defensive Programming
    if (!data.email?.includes("@")) throw new Error("Format email tidak valid!");
    if (data.phone && data.phone.length < 10) throw new Error("Nomor telepon minimal 10 digit!");

    const emailAda = await AnggotaModel.findByEmail(data.email);
    if (emailAda) throw new Error("Email sudah terdaftar!");

    const hasil = await AnggotaModel.create({ ...data, status: "active" });
    await AktivitasModel.create({
      id_user: id_user ?? null,
      action: "TAMBAH_ANGGOTA",
      target: data.name,
      detail: `Email: ${data.email}`
    });
    return hasil;
  }

  static async ubahAnggota(id: number, data: Partial<Member>, id_user?: number) {
    const ada = await AnggotaModel.findById(id);
    if (!ada) throw new Error("Anggota tidak ditemukan!");

    const hasil = await AnggotaModel.update(id, { ...ada, ...data });
    await AktivitasModel.create({
      id_user: id_user ?? null,
      action: "UBAH_ANGGOTA",
      target: data.name ?? ada.name,
      detail: `ID: ${id}`
    });
    return hasil;
  }

  static async hapusAnggota(id: number, id_user?: number) {
    const ada = await AnggotaModel.findById(id);
    if (!ada) throw new Error("Anggota tidak ditemukan!");

    // Design by Contract: cegah hapus jika masih ada pinjaman aktif
    const pinjamanAktif = await AnggotaModel.countActiveLoans(id);
    if (pinjamanAktif > 0) {
      throw new Error(`Gagal: "${ada.name}" masih memiliki ${pinjamanAktif} pinjaman aktif!`);
    }

    const hasil = await AnggotaModel.delete(id);
    await AktivitasModel.create({
      id_user: id_user ?? null,
      action: "HAPUS_ANGGOTA",
      target: ada.name,
      detail: `ID: ${id}`
    });
    return hasil;
  }
}

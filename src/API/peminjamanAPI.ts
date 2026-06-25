import { Router, Response } from "express";
import { PeminjamanService } from "../services/peminjamanService";
import { AnggotaModel } from "../models/anggotaModel";
import { authMiddleware, adminOnly, CustomRequest } from "../middlewares/auth";

const router = Router();

// Admin: semua peminjaman
router.get("/", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    const data = await PeminjamanService.ambilSemuaPeminjaman();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User: peminjaman milik sendiri (lookup id_member dari id_user)
router.get("/saya", authMiddleware, async (req: CustomRequest, res: Response) => {
  try {
    const member = await AnggotaModel.findByUserId(req.user!.id_user);
    if (!member) {
      res.json({ success: true, data: [] });
      return;
    }
    const data = await PeminjamanService.ambilPinjamanByMember(member.id_member!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: tambah peminjaman
router.post("/", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    const { id_book, id_member } = req.body;
    if (!id_book || !id_member) {
      res.status(400).json({ success: false, message: "Pilih buku dan anggota terlebih dahulu!" });
      return;
    }
    await PeminjamanService.pinjamBuku(
      Number(id_book), 
      Number(id_member), 
      req.user!.id_user
    );
    res.status(201).json({ success: true, message: "Peminjaman berhasil dicatat!" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: kembalikan buku
router.put("/:id/return", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    const hasil = await PeminjamanService.kembalikanBuku(
      Number(req.params.id),
      req.user!.id_user
    );
    res.json({
      success: true,
      message: hasil.nominalDenda > 0
        ? `Buku berhasil dikembalikan. Denda: ${hasil.dendaTeks}`
        : "Buku berhasil dikembalikan. Bebas denda.",
      data: hasil
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;


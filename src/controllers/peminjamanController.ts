import { Response, NextFunction } from "express";
import { PeminjamanService } from "../services/peminjamanService";
import { CustomRequest } from "../middlewares/auth";

export const PeminjamanController = {
  async ambilSemua(_req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = await PeminjamanService.ambilSemuaPeminjaman();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async pinjam(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id_book, id_member } = req.body;
      await PeminjamanService.pinjamBuku(Number(id_book), Number(id_member), req.user?.id_user);
      res.status(201).json({ success: true, message: "Peminjaman berhasil dibuat" });
    } catch (err) { next(err); }
  },

  async kembalikan(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const result = await PeminjamanService.kembalikanBuku(Number(req.params.id), req.user?.id_user);
      res.json({ success: true, data: result, message: "Pengembalian berhasil" });
    } catch (err) { next(err); }
  },
};

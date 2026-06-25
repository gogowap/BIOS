import { Response, NextFunction } from "express";
import { BukuService } from "../services/bukuService";
import { CustomRequest } from "../middlewares/auth";

export const BukuController = {
  async ambilSemua(_req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = await BukuService.ambilSemuaBuku();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async ambilById(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = await BukuService.ambilBukuById(Number(req.params.id));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async tambah(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      await BukuService.tambahBuku(req.body, req.user?.id_user);
      res.status(201).json({ success: true, message: "Buku berhasil ditambahkan" });
    } catch (err) { next(err); }
  },

  async update(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      await BukuService.ubahBuku(Number(req.params.id), req.body, req.user?.id_user);
      res.json({ success: true, message: "Buku berhasil diupdate" });
    } catch (err) { next(err); }
  },

  async hapus(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      await BukuService.hapusBuku(Number(req.params.id), req.user?.id_user);
      res.json({ success: true, message: "Buku berhasil dihapus" });
    } catch (err) { next(err); }
  },

  async cari(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = await BukuService.cariBuku(String(req.query.q || ""));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};

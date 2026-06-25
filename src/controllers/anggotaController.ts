import { Response, NextFunction } from "express";
import { AnggotaService } from "../services/anggotaService";
import { CustomRequest } from "../middlewares/auth";

// Controller layer — routing utama sudah ada di anggotaAPI.ts
export const MemberController = {
  async getAll(_req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnggotaService.ambilSemuaAnggota();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getById(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnggotaService.ambilAnggotaById(Number(req.params.id));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      await AnggotaService.tambahAnggota(req.body, req.user?.id_user);
      res.status(201).json({ success: true, message: "Anggota berhasil ditambahkan" });
    } catch (err) { next(err); }
  },

  async update(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      await AnggotaService.ubahAnggota(Number(req.params.id), req.body, req.user?.id_user);
      res.json({ success: true, message: "Anggota berhasil diupdate" });
    } catch (err) { next(err); }
  },

  async delete(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      await AnggotaService.hapusAnggota(Number(req.params.id), req.user?.id_user);
      res.json({ success: true, message: "Anggota berhasil dihapus" });
    } catch (err) { next(err); }
  },
};

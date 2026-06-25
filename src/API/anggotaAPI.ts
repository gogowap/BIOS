import { Router, Response } from "express";
import { AnggotaService } from "../services/anggotaService";
import { authMiddleware, adminOnly, CustomRequest } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    const data = await AnggotaService.ambilSemuaAnggota();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    const data = await AnggotaService.ambilAnggotaById(Number(req.params.id));
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

router.post("/", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    await AnggotaService.tambahAnggota(req.body, req.user!.id_user);
    res.status(201).json({ success: true, message: "Anggota berhasil ditambahkan!" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put("/:id", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    await AnggotaService.ubahAnggota(Number(req.params.id), req.body, req.user!.id_user);
    res.json({ success: true, message: "Data anggota berhasil diperbarui!" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/:id", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    await AnggotaService.hapusAnggota(Number(req.params.id), req.user!.id_user);
    res.json({ success: true, message: "Anggota berhasil dihapus!" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

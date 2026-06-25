import { Router, Response } from "express";
import { AktivitasModel } from "../models/aktivitasModel";
import { authMiddleware, adminOnly, CustomRequest } from "../middlewares/auth";

const router = Router();

// Hanya admin yang bisa lihat log aktivitas
router.get("/", authMiddleware, adminOnly, async (_req: CustomRequest, res: Response) => {
  try {
    const data = await AktivitasModel.findAll();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

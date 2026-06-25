import { Router, Response } from "express";
import { BukuService } from "../services/bukuService";
import { authMiddleware, adminOnly, CustomRequest } from "../middlewares/auth";

// TEKNIK f: API — semua endpoint buku di-group di sini
const router = Router();

// GET /api/buku?search=xxx  — publik (user & admin bisa akses)
router.get("/", authMiddleware, async (req: CustomRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const data = search
      ? await BukuService.cariBuku(search)
      : await BukuService.ambilSemuaBuku();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buku/:id
router.get("/:id", authMiddleware, async (req: CustomRequest, res: Response) => {
  try {
    const data = await BukuService.ambilBukuById(Number(req.params.id));
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// POST /api/buku  — hanya admin
router.post("/", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    await BukuService.tambahBuku(req.body, req.user!.id_user);
    res.status(201).json({ success: true, message: "Buku berhasil ditambahkan!" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/buku/:id  — hanya admin
router.put("/:id", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    await BukuService.ubahBuku(Number(req.params.id), req.body, req.user!.id_user);
    res.json({ success: true, message: "Data buku berhasil diperbarui!" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/buku/:id  — hanya admin
router.delete("/:id", authMiddleware, adminOnly, async (req: CustomRequest, res: Response) => {
  try {
    await BukuService.hapusBuku(Number(req.params.id), req.user!.id_user);
    res.json({ success: true, message: "Buku berhasil dihapus!" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

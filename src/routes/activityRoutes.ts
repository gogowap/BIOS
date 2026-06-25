import { Router, Request, Response } from "express";
import { getLogs } from "../models/activityLogModel";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const logs = await getLogs(100);
    res.json({ success: true, data: logs });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

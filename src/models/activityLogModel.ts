import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface ActivityLog {
  id?: number;
  actor: string;
  action: string;
  target: string;
  detail?: string;
  created_at?: Date;
}

// Tambah log aktivitas
export async function addLog(actor: string, action: string, target: string, detail?: string): Promise<void> {
  try {
    await pool.execute<ResultSetHeader>(
      "INSERT INTO activity_logs (actor, action, target, detail) VALUES (?, ?, ?, ?)",
      [actor, action, target, detail || null]
    );
  } catch (e) {
    // Log error tidak perlu crash app
    console.error("Failed to write activity log:", e);
  }
}

// Ambil semua log (terbaru dulu)
export async function getLogs(limit = 50): Promise<ActivityLog[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows as ActivityLog[];
}

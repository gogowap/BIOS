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

const ACTION_ICON: Record<string, string> = {
  "Tambah Buku": " ",
  "Edit Buku": " ",
  "Hapus Buku": " ",
  "Tambah Anggota": " ",
  "Edit Anggota": " ",
  "Hapus Anggota": " ",
  "Pinjam Buku": " ",
  "Kembalikan Buku": " ",
  "Tambah Rak": " ",
  "Edit Rak": " ",
  "Hapus Rak": " ",
};

export const ActivityService = {
  async log(actor: string, action: string, target: string, detail?: string): Promise<void> {
    try {
      await pool.execute<ResultSetHeader>(
        "INSERT INTO activity_logs (actor, action, target, detail) VALUES (?, ?, ?, ?)",
        [actor, action, target, detail || null]
      );
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  },

  async getAll(limit = 50): Promise<ActivityLog[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    return rows as ActivityLog[];
  },

  getIcon(action: string): string {
    return ACTION_ICON[action] || "📌";
  },
};

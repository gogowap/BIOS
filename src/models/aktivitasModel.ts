import { DatabaseHelper } from "../config/databaseHelper";

export interface Aktivitas {
  id?: number;
  id_user?: number | null;
  action: string;
  target: string;
  detail?: string | null;
  created_at?: string;
  // joined field
  nama_user?: string;
}

export class AktivitasModel {
  // TEKNIK c: Generics — findAll<Aktivitas>
  static async findAll(): Promise<Aktivitas[]> {
    return await DatabaseHelper.eksekusiQuery<Aktivitas>(`
      SELECT al.*, u.name AS nama_user
      FROM activity_logs al
      LEFT JOIN users u ON al.id_user = u.id_user
      ORDER BY al.id DESC
    `);
  }

  // Tambah log — id_user, action, target, detail
  static async create(data: {
    id_user?: number | null;
    action: string;
    target: string;
    detail?: string | null;
  }): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "INSERT INTO activity_logs (id_user, action, target, detail) VALUES (?, ?, ?, ?)",
      [data.id_user ?? null, data.action, data.target, data.detail ?? null]
    );
  }
}

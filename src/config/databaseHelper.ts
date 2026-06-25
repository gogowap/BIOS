import pool from "./database";

// TEKNIK c: Generics — eksekusiQuery<T> bisa dipakai ulang untuk semua tipe data
export class DatabaseHelper {
  static async eksekusiQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  }

  static async eksekusiQuerySatu<T>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.eksekusiQuery<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
}

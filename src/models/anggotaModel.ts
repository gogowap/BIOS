import { DatabaseHelper } from "../config/databaseHelper";

export interface Member {
  id_member?: number;
  id_user?: number;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "suspended";
  created_at?: string;
  updated_at?: string;
}

export class AnggotaModel {
  static async findAll(): Promise<Member[]> {
    return await DatabaseHelper.eksekusiQuery<Member>(
      "SELECT * FROM members ORDER BY id_member DESC"
    );
  }

  static async findById(id: number): Promise<Member | null> {
    return await DatabaseHelper.eksekusiQuerySatu<Member>(
      "SELECT * FROM members WHERE id_member = ?", [id]
    );
  }

  static async findByEmail(email: string): Promise<Member | null> {
    return await DatabaseHelper.eksekusiQuerySatu<Member>(
      "SELECT * FROM members WHERE email = ?", [email]
    );
  }

  static async findByUserId(id_user: number): Promise<Member | null> {
    return await DatabaseHelper.eksekusiQuerySatu<Member>(
      "SELECT * FROM members WHERE id_user = ?", [id_user]
    );
  }

  static async create(data: Omit<Member, "id_member" | "created_at" | "updated_at">): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "INSERT INTO members (id_user, name, email, phone, status) VALUES (?, ?, ?, ?, ?)",
      [data.id_user ?? null, data.name, data.email, data.phone ?? null, data.status]
    );
  }

  static async update(id: number, data: Partial<Member>): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "UPDATE members SET name = ?, email = ?, phone = ?, status = ? WHERE id_member = ?",
      [data.name, data.email, data.phone ?? null, data.status, id]
    );
  }

  static async delete(id: number): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "DELETE FROM members WHERE id_member = ?", [id]
    );
  }

  static async countActiveLoans(memberId: number): Promise<number> {
    const hasil = await DatabaseHelper.eksekusiQuery<any>(
      "SELECT COUNT(*) as jumlah FROM loans WHERE id_member = ? AND status = 'borrowed'",
      [memberId]
    );
    return hasil[0].jumlah;
  }
}

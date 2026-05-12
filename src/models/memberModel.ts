import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface Member {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  status?: "active" | "suspended";
  created_at?: Date;
  updated_at?: Date;
}

export const MemberModel = {
  async findAll(): Promise<Member[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM members ORDER BY created_at DESC"
    );
    return rows as Member[];
  },

  async findById(id: number): Promise<Member | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM members WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? (rows[0] as Member) : null;
  },

  async findByEmail(email: string): Promise<Member | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM members WHERE email = ?",
      [email]
    );
    return rows.length > 0 ? (rows[0] as Member) : null;
  },

  async create(member: Member): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO members (name, email, phone, status) VALUES (?, ?, ?, ?)",
      [member.name, member.email, member.phone || null, member.status || "active"]
    );
    return result.insertId;
  },

  async update(id: number, member: Partial<Member>): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE members SET name=?, email=?, phone=?, status=? WHERE id=?",
      [member.name, member.email, member.phone || null, member.status, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM members WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  async countActiveLoans(memberId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM loans WHERE member_id = ? AND status = 'borrowed'",
      [memberId]
    );
    return (rows[0] as any).count;
  },
};

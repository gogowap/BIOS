import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface Loan {
  id?: number;
  book_id: number;
  member_id: number;
  loan_date: string;
  due_date: string;
  return_date?: string | null;
  status?: "borrowed" | "returned" | "overdue";
  fine?: number;
  created_at?: Date;
}

export const LoanModel = {
  async findAll(): Promise<Loan[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT l.*, b.title as book_title, m.name as member_name
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
      ORDER BY l.created_at DESC
    `);
    return rows as Loan[];
  },

  async findById(id: number): Promise<Loan | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM loans WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? (rows[0] as Loan) : null;
  },

  async findOverdue(): Promise<Loan[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT l.*, b.title as book_title, m.name as member_name
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
      WHERE l.status = 'borrowed' AND l.due_date < CURDATE()
    `);
    return rows as Loan[];
  },

  async create(loan: Loan): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO loans (book_id, member_id, loan_date, due_date, status) VALUES (?, ?, ?, ?, 'borrowed')",
      [loan.book_id, loan.member_id, loan.loan_date, loan.due_date]
    );
    return result.insertId;
  },

  async processReturn(id: number, returnDate: string, fine: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE loans SET return_date=?, status='returned', fine=? WHERE id=?",
      [returnDate, fine, id]
    );
    return result.affectedRows > 0;
  },

  async updateOverdueStatus(): Promise<void> {
    await pool.execute(
      "UPDATE loans SET status='overdue' WHERE status='borrowed' AND due_date < CURDATE()"
    );
  },
};

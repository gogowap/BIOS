import { DatabaseHelper } from "../config/databaseHelper";

export interface Peminjaman {
  id_loan?: number;
  id_book: number;
  id_member: number;
  loan_date: string;
  due_date: string;
  return_date?: string | null;
  status: "borrowed" | "returned" | "overdue";
  fine?: number;
  created_at?: string;
  // joined fields
  title?: string;
  nama_anggota?: string;
}

export class PeminjamanModel {
  static async findAll(): Promise<Peminjaman[]> {
    return await DatabaseHelper.eksekusiQuery<Peminjaman>(`
      SELECT l.*, b.title, m.name AS nama_anggota
      FROM loans l
      JOIN books b ON l.id_book = b.id_book
      JOIN members m ON l.id_member = m.id_member
      ORDER BY l.id_loan DESC
    `);
  }

  static async findById(id: number): Promise<Peminjaman | null> {
    return await DatabaseHelper.eksekusiQuerySatu<Peminjaman>(
      "SELECT * FROM loans WHERE id_loan = ?", [id]
    );
  }

  static async findByMember(memberId: number): Promise<Peminjaman[]> {
    return await DatabaseHelper.eksekusiQuery<Peminjaman>(`
      SELECT l.*, b.title, b.author
      FROM loans l
      JOIN books b ON l.id_book = b.id_book
      WHERE l.id_member = ?
      ORDER BY l.id_loan DESC
    `, [memberId]);
  }

  static async create(data: Omit<Peminjaman, "id_loan" | "created_at" | "title" | "nama_anggota">): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "INSERT INTO loans (id_book, id_member, loan_date, due_date, status) VALUES (?, ?, ?, ?, ?)",
      [data.id_book, data.id_member, data.loan_date, data.due_date, data.status]
    );
  }

  static async updateReturn(id: number, returnDate: string, fine: number): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "UPDATE loans SET return_date = ?, fine = ?, status = 'returned' WHERE id_loan = ?",
      [returnDate, fine, id]
    );
  }

  static async updateOverdue(): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "UPDATE loans SET status = 'overdue' WHERE status = 'borrowed' AND due_date < CURDATE()"
    );
  }
}

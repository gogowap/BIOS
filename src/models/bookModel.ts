import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface Book {
  id?: number;
  title: string;
  author: string;
  isbn: string;
  stock: number;
  category?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const BookModel = {
  async findAll(): Promise<Book[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM books ORDER BY created_at DESC"
    );
    return rows as Book[];
  },

  async findById(id: number): Promise<Book | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM books WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? (rows[0] as Book) : null;
  },

  async findByIsbn(isbn: string): Promise<Book | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM books WHERE isbn = ?",
      [isbn]
    );
    return rows.length > 0 ? (rows[0] as Book) : null;
  },

  async create(book: Book): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO books (title, author, isbn, stock, category) VALUES (?, ?, ?, ?, ?)",
      [book.title, book.author, book.isbn, book.stock, book.category || null]
    );
    return result.insertId;
  },

  async update(id: number, book: Partial<Book>): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE books SET title=?, author=?, isbn=?, stock=?, category=? WHERE id=?",
      [book.title, book.author, book.isbn, book.stock, book.category || null, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM books WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  async search(keyword: string): Promise<Book[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR category LIKE ?",
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );
    return rows as Book[];
  },

  async decrementStock(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE books SET stock = stock - 1 WHERE id = ? AND stock > 0",
      [id]
    );
    return result.affectedRows > 0;
  },

  async incrementStock(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE books SET stock = stock + 1 WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};

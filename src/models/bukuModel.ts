import { DatabaseHelper } from "../config/databaseHelper";

// TEKNIK c: Generics — interface Buku jadi type param untuk semua query
export interface Buku {
  id_book?: number;
  title: string;
  author: string;
  isbn: string;
  stock: number;
  category?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export class BukuModel {
  static async findAll(): Promise<Buku[]> {
    return await DatabaseHelper.eksekusiQuery<Buku>(
      "SELECT * FROM books ORDER BY id_book DESC"
    );
  }

  static async findById(id: number): Promise<Buku | null> {
    return await DatabaseHelper.eksekusiQuerySatu<Buku>(
      "SELECT * FROM books WHERE id_book = ?", [id]
    );
  }

  static async findByKeyword(kataKunci: string): Promise<Buku[]> {
    return await DatabaseHelper.eksekusiQuery<Buku>(
      "SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR category LIKE ?",
      [`%${kataKunci}%`, `%${kataKunci}%`, `%${kataKunci}%`]
    );
  }

  static async create(data: Omit<Buku, "id_book" | "created_at" | "updated_at">): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "INSERT INTO books (title, author, isbn, stock, category, description) VALUES (?, ?, ?, ?, ?, ?)",
      [data.title, data.author, data.isbn, data.stock, data.category ?? null, data.description ?? null]
    );
  }

  static async update(id: number, data: Partial<Buku>): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "UPDATE books SET title = ?, author = ?, isbn = ?, stock = ?, category = ?, description = ? WHERE id_book = ?",
      [data.title, data.author, data.isbn, data.stock, data.category ?? null, data.description ?? null, id]
    );
  }

  static async delete(id: number): Promise<any> {
    return await DatabaseHelper.eksekusiQuery("DELETE FROM books WHERE id_book = ?", [id]);
  }

  static async decreaseStock(id: number): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "UPDATE books SET stock = stock - 1 WHERE id_book = ? AND stock > 0", [id]
    );
  }

  static async increaseStock(id: number): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "UPDATE books SET stock = stock + 1 WHERE id_book = ?", [id]
    );
  }
}

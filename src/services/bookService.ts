import { BookModel, Book } from "../models/bookModel";

// ============================================================
// TABLE-DRIVEN: Aturan validasi buku dalam bentuk tabel
// ============================================================
const BOOK_VALIDATION_RULES: Array<{
  field: keyof Book;
  validate: (val: any) => boolean;
  message: string;
}> = [
  { field: "title", validate: (v) => typeof v === "string" && v.trim().length > 0, message: "Title tidak boleh kosong" },
  { field: "author", validate: (v) => typeof v === "string" && v.trim().length > 0, message: "Author tidak boleh kosong" },
  { field: "isbn", validate: (v) => typeof v === "string" && /^[0-9-]{10,17}$/.test(v), message: "ISBN tidak valid (10-17 digit angka/strip)" },
  { field: "stock", validate: (v) => typeof v === "number" && v >= 0, message: "Stock harus angka >= 0" },
];

// ============================================================
// DESIGN BY CONTRACT (DbC)
// ============================================================
function assertPrecondition(condition: boolean, message: string): void {
  if (!condition) {
    const err: any = new Error(`[Precondition Failed] ${message}`);
    err.statusCode = 400;
    throw err;
  }
}

function assertPostcondition(condition: boolean, message: string): void {
  if (!condition) {
    const err: any = new Error(`[Postcondition Failed] ${message}`);
    err.statusCode = 500;
    throw err;
  }
}

// Validasi menggunakan tabel aturan (Table-driven)
function validateBook(book: Partial<Book>): void {
  for (const rule of BOOK_VALIDATION_RULES) {
    assertPrecondition(rule.validate(book[rule.field]), rule.message);
  }
}

export const BookService = {
  async getAllBooks(): Promise<Book[]> {
    const books = await BookModel.findAll();
    // Postcondition: hasil harus array
    assertPostcondition(Array.isArray(books), "getAllBooks harus mengembalikan array");
    return books;
  },

  async getBookById(id: number): Promise<Book> {
    // Precondition
    assertPrecondition(Number.isInteger(id) && id > 0, "ID buku harus integer positif");

    const book = await BookModel.findById(id);
    assertPostcondition(book !== null, `Buku dengan ID ${id} tidak ditemukan`);
    return book!;
  },

  async createBook(data: Book): Promise<Book> {
    // Precondition: validasi semua field via tabel
    validateBook(data);

    // Precondition: ISBN harus unik
    const existing = await BookModel.findByIsbn(data.isbn);
    assertPrecondition(existing === null, `ISBN ${data.isbn} sudah terdaftar`);

    const insertId = await BookModel.create(data);

    // Postcondition: ID harus valid
    assertPostcondition(insertId > 0, "Gagal membuat buku baru");

    const created = await BookModel.findById(insertId);
    assertPostcondition(created !== null, "Buku tidak ditemukan setelah dibuat");
    return created!;
  },

  async updateBook(id: number, data: Partial<Book>): Promise<Book> {
    // Precondition
    assertPrecondition(Number.isInteger(id) && id > 0, "ID buku harus integer positif");
    validateBook(data as Book);

    const existing = await BookModel.findById(id);
    assertPrecondition(existing !== null, `Buku dengan ID ${id} tidak ditemukan`);

    // Cek ISBN unik jika berubah
    if (data.isbn && data.isbn !== existing!.isbn) {
      const isbnUsed = await BookModel.findByIsbn(data.isbn);
      assertPrecondition(isbnUsed === null, `ISBN ${data.isbn} sudah digunakan buku lain`);
    }

    await BookModel.update(id, data);
    const updated = await BookModel.findById(id);
    assertPostcondition(updated !== null, "Buku tidak ditemukan setelah diupdate");
    return updated!;
  },

  async deleteBook(id: number): Promise<void> {
    assertPrecondition(Number.isInteger(id) && id > 0, "ID buku harus integer positif");
    const existing = await BookModel.findById(id);
    assertPrecondition(existing !== null, `Buku dengan ID ${id} tidak ditemukan`);

    const deleted = await BookModel.delete(id);
    assertPostcondition(deleted, "Gagal menghapus buku");
  },

  async searchBooks(keyword: string): Promise<Book[]> {
    assertPrecondition(typeof keyword === "string" && keyword.trim().length > 0, "Keyword pencarian tidak boleh kosong");
    return await BookModel.search(keyword.trim());
  },
};

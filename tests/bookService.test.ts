// tests/bookService.test.ts
// Anggota A - Unit Testing Modul Buku

import { BookService } from "../src/services/bookService";
import { BookModel } from "../src/models/bookModel";

// Mock BookModel agar tidak perlu koneksi DB saat testing
jest.mock("../src/models/bookModel");
const MockBookModel = BookModel as jest.Mocked<typeof BookModel>;

describe("BookService - Unit Tests", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================
  // getAllBooks
  // ========================
  describe("getAllBooks()", () => {
    it("harus mengembalikan array buku", async () => {
      const mockBooks = [
        { id: 1, title: "Clean Code", author: "Robert Martin", isbn: "9780132350884", stock: 5, category: "Programming" },
      ];
      MockBookModel.findAll.mockResolvedValue(mockBooks);
      const result = await BookService.getAllBooks();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it("harus mengembalikan array kosong jika tidak ada buku", async () => {
      MockBookModel.findAll.mockResolvedValue([]);
      const result = await BookService.getAllBooks();
      expect(result).toEqual([]);
    });
  });

  // ========================
  // getBookById
  // ========================
  describe("getBookById()", () => {
    it("harus mengembalikan buku jika ID valid dan ada", async () => {
      const mockBook = { id: 1, title: "Clean Code", author: "Robert Martin", isbn: "9780132350884", stock: 5 };
      MockBookModel.findById.mockResolvedValue(mockBook);
      const result = await BookService.getBookById(1);
      expect(result).toEqual(mockBook);
    });

    it("harus throw error jika ID bukan integer positif", async () => {
      await expect(BookService.getBookById(-1)).rejects.toThrow("ID buku harus integer positif");
      await expect(BookService.getBookById(0)).rejects.toThrow("ID buku harus integer positif");
    });

    it("harus throw error jika buku tidak ditemukan", async () => {
      MockBookModel.findById.mockResolvedValue(null);
      await expect(BookService.getBookById(999)).rejects.toThrow("tidak ditemukan");
    });
  });

  // ========================
  // createBook
  // ========================
  describe("createBook()", () => {
    const validBook = { title: "Clean Code", author: "Robert Martin", isbn: "9780132350884", stock: 5, category: "Programming" };

    it("harus berhasil membuat buku dengan data valid", async () => {
      MockBookModel.findByIsbn.mockResolvedValue(null);
      MockBookModel.create.mockResolvedValue(1);
      MockBookModel.findById.mockResolvedValue({ id: 1, ...validBook });

      const result = await BookService.createBook(validBook);
      expect(result.id).toBe(1);
      expect(result.title).toBe(validBook.title);
    });

    it("harus throw error jika title kosong", async () => {
      await expect(BookService.createBook({ ...validBook, title: "" })).rejects.toThrow("Title tidak boleh kosong");
    });

    it("harus throw error jika author kosong", async () => {
      await expect(BookService.createBook({ ...validBook, author: "" })).rejects.toThrow("Author tidak boleh kosong");
    });

    it("harus throw error jika ISBN tidak valid", async () => {
      await expect(BookService.createBook({ ...validBook, isbn: "123" })).rejects.toThrow("ISBN tidak valid");
    });

    it("harus throw error jika stock negatif", async () => {
      await expect(BookService.createBook({ ...validBook, stock: -1 })).rejects.toThrow("Stock harus angka >= 0");
    });

    it("harus throw error jika ISBN sudah terdaftar", async () => {
      MockBookModel.findByIsbn.mockResolvedValue({ id: 2, ...validBook });
      await expect(BookService.createBook(validBook)).rejects.toThrow("sudah terdaftar");
    });
  });

  // ========================
  // deleteBook
  // ========================
  describe("deleteBook()", () => {
    it("harus berhasil menghapus buku yang ada", async () => {
      MockBookModel.findById.mockResolvedValue({ id: 1, title: "Clean Code", author: "Robert Martin", isbn: "9780132350884", stock: 5 });
      MockBookModel.delete.mockResolvedValue(true);
      await expect(BookService.deleteBook(1)).resolves.not.toThrow();
    });

    it("harus throw error jika ID tidak valid", async () => {
      await expect(BookService.deleteBook(0)).rejects.toThrow("ID buku harus integer positif");
    });
  });

  // ========================
  // searchBooks
  // ========================
  describe("searchBooks()", () => {
    it("harus mengembalikan hasil pencarian", async () => {
      const mockBooks = [{ id: 1, title: "Clean Code", author: "Robert Martin", isbn: "9780132350884", stock: 5 }];
      MockBookModel.search.mockResolvedValue(mockBooks);
      const result = await BookService.searchBooks("Clean");
      expect(result).toHaveLength(1);
    });

    it("harus throw error jika keyword kosong", async () => {
      await expect(BookService.searchBooks("")).rejects.toThrow("Keyword pencarian tidak boleh kosong");
    });
  });
});

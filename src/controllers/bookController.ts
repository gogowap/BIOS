import { Request, Response, NextFunction } from "express";
import { BookService } from "../services/bookService";
import { addLog } from "../models/activityLogModel";

const actor = (req: any) => req.user?.name || req.user?.email || "admin";

export const BookController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try { const books = await BookService.getAllBooks(); res.json({ success: true, data: books }); }
    catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try { const book = await BookService.getBookById(Number(req.params.id)); res.json({ success: true, data: book }); }
    catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const book = await BookService.createBook(req.body);
      await addLog(actor(req), "TAMBAH_BUKU", book.title, `Kode: ${book.isbn}, Stok: ${book.stock}`);
      res.status(201).json({ success: true, data: book, message: "Buku berhasil ditambahkan" });
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const book = await BookService.updateBook(Number(req.params.id), req.body);
      await addLog(actor(req), "EDIT_BUKU", book.title, `Kode: ${book.isbn}, Stok: ${book.stock}`);
      res.json({ success: true, data: book, message: "Buku berhasil diupdate" });
    } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await BookService.deleteBook(Number(req.params.id));
      await addLog(actor(req), "HAPUS_BUKU", `ID #${req.params.id}`);
      res.json({ success: true, message: "Buku berhasil dihapus" });
    } catch (err) { next(err); }
  },
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const keyword = String(req.query.q || "");
      const books = await BookService.searchBooks(keyword);
      res.json({ success: true, data: books });
    } catch (err) { next(err); }
  },
};

import { Request, Response, NextFunction } from "express";
import { LoanService } from "../services/loanService";
import { addLog } from "../models/activityLogModel";

const actor = (req: any) => req.user?.name || req.user?.email || "admin";

export const LoanController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try { const loans = await LoanService.getAllLoans(); res.json({ success: true, data: loans }); }
    catch (err) { next(err); }
  },
  async getOverdue(_req: Request, res: Response, next: NextFunction) {
    try { const loans = await LoanService.getOverdueLoans(); res.json({ success: true, data: loans }); }
    catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { book_id, member_id } = req.body;
      const loan = await LoanService.createLoan(Number(book_id), Number(member_id));
      await addLog(actor(req), "PINJAM_BUKU", `Buku #${book_id}`, `Anggota #${member_id}, Jatuh tempo: ${loan.due_date}`);
      res.status(201).json({ success: true, data: loan, message: "Peminjaman berhasil dibuat" });
    } catch (err) { next(err); }
  },
  async returnBook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LoanService.returnLoan(Number(req.params.id));
      const dendaInfo = result.fine > 0 ? `, Denda: Rp ${result.fine.toLocaleString("id-ID")}` : ", Tidak ada denda";
      await addLog(actor(req), "KEMBALI_BUKU", `Peminjaman #${req.params.id}`, `Buku #${result.loan.book_id}${dendaInfo}`);
      res.json({
        success: true, data: result.loan, fine: result.fine,
        message: result.fine > 0
          ? `Pengembalian berhasil. Denda: Rp ${result.fine.toLocaleString("id-ID")}`
          : "Pengembalian berhasil. Tidak ada denda.",
      });
    } catch (err) { next(err); }
  },
};

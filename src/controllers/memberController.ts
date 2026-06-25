import { Request, Response, NextFunction } from "express";
import { MemberService } from "../services/memberService";
import { addLog } from "../models/activityLogModel";

const actor = (req: any) => req.user?.name || req.user?.email || "admin";

export const MemberController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try { const members = await MemberService.getAllMembers(); res.json({ success: true, data: members }); }
    catch (err) { next(err); }
  },
  async getById(req: Request, res: Response , next: NextFunction) {
    try { const member = await MemberService.getMemberById(Number(req.params.id)); res.json({ success: true, data: member }); }
    catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await MemberService.createMember(req.body);
      await addLog(actor(req), "TAMBAH_ANGGOTA", member.name, `Email: ${member.email}`);
      res.status(201).json({ success: true, data: member, message: "Anggota berhasil ditambahkan" });
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await MemberService.updateMember(Number(req.params.id), req.body);
      await addLog(actor(req), "EDIT_ANGGOTA", member.name, `Status: ${member.status}`);
      res.json({ success: true, data: member, message: "Anggota berhasil diupdate" });
    } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await MemberService.deleteMember(Number(req.params.id));
      await addLog(actor(req), "HAPUS_ANGGOTA", `ID #${req.params.id}`);
      res.json({ success: true, message: "Anggota berhasil dihapus" });
    } catch (err) { next(err); }
  },
};

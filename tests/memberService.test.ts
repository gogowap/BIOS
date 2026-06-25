// tests/memberService.test.ts
// Anggota B - Unit Testing Modul Anggota

import { MemberService } from "../src/services/memberService";
import { MemberModel } from "../src/models/memberModel";

jest.mock("../src/models/memberModel");
const MockMemberModel = MemberModel as jest.Mocked<typeof MemberModel>;

describe("MemberService - Unit Tests", () => {

  beforeEach(() => jest.clearAllMocks());

  const validMember = { name: "Budi Santoso", email: "budi@email.com", phone: "08123456789", status: "active" as const };

  describe("getAllMembers()", () => {
    it("harus mengembalikan array anggota", async () => {
      MockMemberModel.findAll.mockResolvedValue([{ id: 1, ...validMember }]);
      const result = await MemberService.getAllMembers();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createMember()", () => {
    it("harus berhasil membuat anggota dengan data valid", async () => {
      MockMemberModel.findByEmail.mockResolvedValue(null);
      MockMemberModel.create.mockResolvedValue(1);
      MockMemberModel.findById.mockResolvedValue({ id: 1, ...validMember });

      const result = await MemberService.createMember(validMember);
      expect(result.id).toBe(1);
      expect(result.email).toBe(validMember.email);
    });

    it("harus throw error jika name kosong", async () => {
      await expect(MemberService.createMember({ ...validMember, name: "" })).rejects.toThrow("name");
    });

    it("harus throw error jika email kosong", async () => {
      await expect(MemberService.createMember({ ...validMember, email: "" })).rejects.toThrow("email");
    });

    it("harus throw error jika format email tidak valid", async () => {
      await expect(MemberService.createMember({ ...validMember, email: "bukan-email" })).rejects.toThrow("Format email tidak valid");
    });

    it("harus throw error jika email sudah terdaftar", async () => {
      MockMemberModel.findByEmail.mockResolvedValue({ id: 2, ...validMember });
      await expect(MemberService.createMember(validMember)).rejects.toThrow("sudah terdaftar");
    });

    it("harus throw error jika status tidak valid", async () => {
      MockMemberModel.findByEmail.mockResolvedValue(null);
      await expect(MemberService.createMember({ ...validMember, status: "banned" as any })).rejects.toThrow("status");
    });
  });

  describe("deleteMember()", () => {
    it("harus throw error jika anggota masih punya pinjaman aktif", async () => {
      MockMemberModel.findById.mockResolvedValue({ id: 1, ...validMember });
      MockMemberModel.countActiveLoans.mockResolvedValue(2);
      await expect(MemberService.deleteMember(1)).rejects.toThrow("peminjaman aktif");
    });

    it("harus berhasil hapus anggota tanpa pinjaman aktif", async () => {
      MockMemberModel.findById.mockResolvedValue({ id: 1, ...validMember });
      MockMemberModel.countActiveLoans.mockResolvedValue(0);
      MockMemberModel.delete.mockResolvedValue(true);
      await expect(MemberService.deleteMember(1)).resolves.not.toThrow();
    });
  });
});

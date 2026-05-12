import { MemberModel, Member } from "../models/memberModel";
import { appConfig } from "../config/appConfig";

// ============================================================
// PARAMETERIZATION / GENERICS
// Fungsi generik untuk validasi field wajib pada entitas apapun
// ============================================================
function validateRequiredFields<T extends object>(
  data: T,
  requiredFields: (keyof T)[],
  entityName: string
): void {
  for (const field of requiredFields) {
    const val = data[field];
    if (val === undefined || val === null || String(val).trim() === "") {
      const err: any = new Error(`[Precondition Failed] ${entityName}: field '${String(field)}' wajib diisi`);
      err.statusCode = 400;
      throw err;
    }
  }
}

// Generik fungsi untuk cek nilai dalam enum
function validateEnum<T>(value: T, allowed: T[], fieldName: string): void {
  if (!allowed.includes(value)) {
    const err: any = new Error(`[Precondition Failed] ${fieldName} harus salah satu dari: ${allowed.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
}

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

export const MemberService = {
  async getAllMembers(): Promise<Member[]> {
    const members = await MemberModel.findAll();
    assertPostcondition(Array.isArray(members), "getAllMembers harus mengembalikan array");
    return members;
  },

  async getMemberById(id: number): Promise<Member> {
    assertPrecondition(Number.isInteger(id) && id > 0, "ID anggota harus integer positif");
    const member = await MemberModel.findById(id);
    assertPostcondition(member !== null, `Anggota dengan ID ${id} tidak ditemukan`);
    return member!;
  },

  async createMember(data: Member): Promise<Member> {
    // Gunakan fungsi generik validasi
    validateRequiredFields(data, ["name", "email"], "Member");

    // Validasi format email
    assertPrecondition(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
      "Format email tidak valid"
    );

    // Cek duplikat email
    const existing = await MemberModel.findByEmail(data.email);
    assertPrecondition(existing === null, `Email ${data.email} sudah terdaftar`);

    // Gunakan generik validasi enum
    if (data.status) {
      validateEnum(data.status, ["active", "suspended"], "status");
    }

    const insertId = await MemberModel.create(data);
    assertPostcondition(insertId > 0, "Gagal membuat anggota baru");

    const created = await MemberModel.findById(insertId);
    assertPostcondition(created !== null, "Anggota tidak ditemukan setelah dibuat");
    return created!;
  },

  async updateMember(id: number, data: Partial<Member>): Promise<Member> {
    assertPrecondition(Number.isInteger(id) && id > 0, "ID anggota harus integer positif");

    const existing = await MemberModel.findById(id);
    assertPrecondition(existing !== null, `Anggota dengan ID ${id} tidak ditemukan`);

    if (data.email && data.email !== existing!.email) {
      assertPrecondition(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        "Format email tidak valid"
      );
      const emailUsed = await MemberModel.findByEmail(data.email);
      assertPrecondition(emailUsed === null, `Email ${data.email} sudah digunakan`);
    }

    if (data.status) {
      validateEnum(data.status, ["active", "suspended"], "status");
    }

    await MemberModel.update(id, data);
    const updated = await MemberModel.findById(id);
    assertPostcondition(updated !== null, "Anggota tidak ditemukan setelah diupdate");
    return updated!;
  },

  async deleteMember(id: number): Promise<void> {
    assertPrecondition(Number.isInteger(id) && id > 0, "ID anggota harus integer positif");
    const existing = await MemberModel.findById(id);
    assertPrecondition(existing !== null, `Anggota dengan ID ${id} tidak ditemukan`);

    // Precondition: anggota tidak boleh punya pinjaman aktif
    const activeLoans = await MemberModel.countActiveLoans(id);
    assertPrecondition(activeLoans === 0, "Anggota masih memiliki peminjaman aktif, tidak bisa dihapus");

    const deleted = await MemberModel.delete(id);
    assertPostcondition(deleted, "Gagal menghapus anggota");
  },
};

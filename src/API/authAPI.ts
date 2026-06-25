import { Router, Request, Response } from "express";
import { UserModel } from "../models/userModel";
import { AnggotaModel } from "../models/anggotaModel";
import { AktivitasModel } from "../models/aktivitasModel";
import { appConfig } from "../config/appConfig";
import { authMiddleware, CustomRequest } from "../middlewares/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = Router();

// ─── POST /api/auth/login ────────────────────────────────────────────────────
// Login untuk admin (dari tabel users) maupun user biasa (dari tabel users, role='user')
// Admin harus di-INSERT langsung ke DB — tidak bisa register lewat UI
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Defensive Programming: validasi input
    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email dan password wajib diisi!" });
      return;
    }
    if (!email.includes("@")) {
      res.status(400).json({ success: false, message: "Format email tidak valid!" });
      return;
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: "Email atau password salah!" });
      return;
    }

    // Verifikasi password (bcrypt)
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      res.status(401).json({ success: false, message: "Email atau password salah!" });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id_user: user.id_user, name: user.name, email: user.email, role: user.role },
      appConfig.jwtSecret,
      { expiresIn: "8h" }
    );

    await AktivitasModel.create({
      id_user: user.id_user,
      action: "LOGIN",
      target: user.email,
      detail: `Role: ${user.role}`
    });

    res.status(200).json({
      success: true,
      token,
      user: { id_user: user.id_user, name: user.name, email: user.email, role: user.role }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Registrasi user biasa → simpan ke users (role='user') + members
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    // Defensive Programming
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Nama, email, dan password wajib diisi!" });
      return;
    }
    if (!email.includes("@")) {
      res.status(400).json({ success: false, message: "Format email tidak valid!" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Password minimal 6 karakter!" });
      return;
    }
    if (phone && phone.length < 10) {
      res.status(400).json({ success: false, message: "Nomor telepon minimal 10 digit!" });
      return;
    }

    const sudahAda = await UserModel.findByEmail(email);
    if (sudahAda) {
      res.status(400).json({ success: false, message: "Email sudah terdaftar!" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Simpan ke tabel users
    const hasilUser: any = await UserModel.create({
      name, email, password: hashedPassword,
      phone: phone || null, role: "user"
    });
    const id_user = hasilUser.insertId;

    // 2. Simpan ke tabel members (linked by id_user)
    await AnggotaModel.create({
      id_user, name, email,
      phone: phone || null,
      status: "active"
    });

    await AktivitasModel.create({
      id_user,
      action: "REGISTRASI",
      target: email,
      detail: `Anggota baru: ${name}`
    });

    res.status(201).json({ success: true, message: "Registrasi berhasil! Silakan login." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
// Ambil data user yang sedang login
router.get("/me", authMiddleware, async (req: CustomRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.id_user);
    if (!user) {
      res.status(404).json({ success: false, message: "User tidak ditemukan!" });
      return;
    }
    // Jangan kirim password
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

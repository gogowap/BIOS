//sistem keamanan API menggunakan middleware authentication.  
//Fungsi utamanya adalah:

//mengecek token login,
//memvalidasi user,
//dan membatasi akses endpoint API.
import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (username) {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      res.json({ success: true, message: "Login berhasil", token: `admin:admin`, user: { name: "Administrator", role: "admin" } });
    } else {
      res.status(401).json({ success: false, message: "Username atau password salah" });
    }
    return;
  }

  if (email) {
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || user.password !== password) {
      res.status(401).json({ success: false, message: "Email atau password salah" });
      return;
    }
    res.json({
      success: true, message: "Login berhasil",
      token: `user:${user.email}`,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: "user" },
    });
    return;
  }

  res.status(400).json({ success: false, message: "Username/email dan password wajib diisi" });
};

export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: "Nama, email, dan password wajib diisi" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: "Format email tidak valid" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ success: false, message: "Password minimal 6 karakter" });
    return;
  }
  try {
    const [existing] = await pool.execute<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) {
      res.status(400).json({ success: false, message: "Email sudah terdaftar" });
      return;
    }
    await pool.execute(
      "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'user')",
      [name, email, password, phone || null]
    );
    res.status(201).json({ success: true, message: "Registrasi berhasil! Silakan login." });
  } catch (e: any) {
    res.status(500).json({ success: false, message: "Gagal registrasi: " + e.message });
  }
};

export const authMiddleware = (req: any, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  const token = authHeader.replace("Bearer ", "");
  const [role, ...rest] = token.split(":");
  const identifier = rest.join(":");
  if (!role || !identifier) {
    res.status(401).json({ success: false, message: "Token tidak valid" });
    return;
  }
  if (role === "admin" && identifier === "admin") {
    req.user = { role: "admin", name: "Administrator" };
    next(); return;
  }
  if (role === "user") {
    req.user = { role: "user", email: identifier };
    next(); return;
  }
  res.status(401).json({ success: false, message: "Token tidak valid" });
};

export const adminOnly = (req: any, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya admin yang diizinkan." });
    return;
  }
  next();
};

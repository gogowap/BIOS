import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Runtime Configuration - semua config dibaca dari environment variable
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "perpustakaan_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

export const testConnection = async (): Promise<void> => {
  const conn = await pool.getConnection();
  console.log(" Database connected successfully");
  console.log("✅ Database connected successfully");
  conn.release();
};

export default pool;

import dotenv from "dotenv";

dotenv.config();

// Runtime Configuration - semua nilai dikonfigurasi via .env
export const appConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  library: {
    finePerDay: Number(process.env.FINE_PER_DAY) || 1000,      // Rp 1.000/hari
    maxLoanDays: Number(process.env.MAX_LOAN_DAYS) || 7,       // 14 hari
    maxLoansPerMember: Number(process.env.MAX_LOANS_PER_MEMBER) || 3, // maks 3 buku
  },
};

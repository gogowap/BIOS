import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { testConnection } from "./config/database";
import { initializeDatabase } from "./config/initDb";
import { appConfig } from "./config/appConfig";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import { loginHandler, registerHandler, authMiddleware, adminOnly } from "./middlewares/auth";

import bookRoutes from "./routes/bookRoutes";
import memberRoutes from "./routes/memberRoutes";
import loanRoutes from "./routes/loanRoutes";
import activityRoutes from "./routes/activityRoutes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.post("/api/auth/login", loginHandler);
app.post("/api/auth/register", registerHandler);

app.use("/api/books", authMiddleware, bookRoutes);
app.use("/api/members", authMiddleware, adminOnly, memberRoutes);
app.use("/api/loans", authMiddleware, loanRoutes);
app.use("/api/activity", authMiddleware, adminOnly, activityRoutes);

app.get("/", (_req, res) => res.redirect("/login.html"));

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await testConnection();
  await initializeDatabase();
  app.listen(appConfig.port, () => {
    console.log(`🚀 Server: http://localhost:${appConfig.port}`);
    console.log(`🔑 Admin: admin / admin123`);
  });
};

startServer().catch(console.error);
export default app;

-- ============================================================
-- Database: perpustakaan_db
-- Versi Final — sesuai struktur project Tugas Besar KPL CLO2
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- Hapus tabel lama jika ada (urutan sesuai foreign key)
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `loans`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `books`;
DROP TABLE IF EXISTS `users`;

-- ─── Tabel users ────────────────────────────────────────────
-- Admin di-INSERT langsung via SQL (bukan lewat UI/register)
-- User biasa mendaftar lewat halaman register → tersimpan di sini + members
CREATE TABLE `users` (
  `id_user`    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(255)    NOT NULL,
  `email`      VARCHAR(255)    NOT NULL UNIQUE,
  `password`   VARCHAR(255)    NOT NULL,         -- bcrypt hash
  `phone`      VARCHAR(20)     DEFAULT NULL,
  `role`       ENUM('admin','user') DEFAULT 'user',
  `created_at` TIMESTAMP       NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabel books ─────────────────────────────────────────────
CREATE TABLE `books` (
  `id_book`     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(255)    NOT NULL,
  `author`      VARCHAR(255)    NOT NULL,
  `isbn`        VARCHAR(20)     NOT NULL UNIQUE,
  `stock`       INT             DEFAULT 0,
  `category`    VARCHAR(100)    DEFAULT NULL,
  `description` TEXT            DEFAULT NULL,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT current_timestamp(),
  `updated_at`  TIMESTAMP       NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_book`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabel members ───────────────────────────────────────────
-- Setiap user biasa yang register otomatis masuk ke sini
-- id_user = FK ke tabel users
CREATE TABLE `members` (
  `id_member`  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `id_user`    INT UNSIGNED    NOT NULL,
  `name`       VARCHAR(255)    NOT NULL,
  `email`      VARCHAR(255)    NOT NULL UNIQUE,
  `phone`      VARCHAR(20)     DEFAULT NULL,
  `status`     ENUM('active','suspended') DEFAULT 'active',
  `created_at` TIMESTAMP       NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP       NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_member`),
  CONSTRAINT `fk_members_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabel loans ─────────────────────────────────────────────
CREATE TABLE `loans` (
  `id_loan`     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `id_book`     INT UNSIGNED    NOT NULL,
  `id_member`   INT UNSIGNED    NOT NULL,
  `loan_date`   DATE            NOT NULL,
  `due_date`    DATE            NOT NULL,
  `return_date` DATE            DEFAULT NULL,
  `status`      ENUM('borrowed','returned','overdue') DEFAULT 'borrowed',
  `fine`        DECIMAL(10,2)   DEFAULT 0.00,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_loan`),
  CONSTRAINT `fk_loans_books`   FOREIGN KEY (`id_book`)   REFERENCES `books`   (`id_book`)   ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_loans_members` FOREIGN KEY (`id_member`) REFERENCES `members` (`id_member`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabel activity_logs ─────────────────────────────────────
-- id_user = siapa yang melakukan aksi (bisa NULL jika sistem)
-- action  = kode aksi (TAMBAH_BUKU, PINJAM_BUKU, dll)
-- target  = nama objek yang dikenai aksi
-- detail  = info tambahan
CREATE TABLE `activity_logs` (
  `id`         INT             NOT NULL AUTO_INCREMENT,
  `id_user`    INT UNSIGNED    DEFAULT NULL,
  `action`     VARCHAR(100)    NOT NULL,
  `target`     VARCHAR(255)    NOT NULL,
  `detail`     TEXT            DEFAULT NULL,
  `created_at` TIMESTAMP       NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_logs_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA: Insert akun admin pertama
-- Password default: Admin1234! (sudah di-hash dengan bcrypt)
-- WAJIB GANTI PASSWORD setelah pertama kali login!
-- 
-- Untuk menambah admin baru, jalankan query INSERT berikut
-- dengan password yang sudah di-hash bcrypt:
--
-- Hash password baru via Node.js:
-- node -e "const b=require('bcryptjs'); b.hash('PasswordBaru123!',10).then(h=>console.log(h))"
-- ============================================================
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Super Admin', 'admin@perpustakaan.id', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Password di atas = "password" (demo only, GANTI SEGERA!)

COMMIT;

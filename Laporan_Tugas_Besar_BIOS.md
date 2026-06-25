# LAPORAN TUGAS BESAR — SISTEM INFORMASI PERPUSTAKAAN (BIOS)

---

## BAB 1: PENDAHULUAN

### 1.1 Latar Belakang

Perpustakaan merupakan salah satu pilar penting dalam institusi pendidikan. Pengelolaan data buku, anggota, peminjaman, dan pengembalian secara manual rentan terhadap kesalahan pencatatan, keterlambatan informasi, dan inefisiensi operasional. Oleh karena itu, diperlukan sebuah **Sistem Informasi Perpustakaan** berbasis web yang mampu mengelola seluruh proses bisnis perpustakaan secara digital, akurat, dan real-time.

Proyek **BIOS (Book Inventory & Operation System)** adalah aplikasi perpustakaan berbasis **Node.js + TypeScript + MySQL** dengan antarmuka web frontend vanilla HTML/JS. Sistem ini dirancang untuk menangani:

- Manajemen koleksi buku (CRUD, stok, rak/kategori)
- Manajemen anggota (registrasi, status aktif/suspended)
- Proses peminjaman dan pengembalian buku
- Perhitungan denda otomatis
- Audit trail aktivitas admin
- Notifikasi jatuh tempo pada dashboard

### 1.2 Tujuan

1. Membangun sistem basis data relasional untuk perpustakaan
2. Mengimplementasikan **Design by Contract (DbC)** di service layer
3. Menerapkan **State Machine / Automata** untuk status peminjaman
4. Menerapkan **table-driven validation** untuk validasi data buku
5. Menerapkan **generic programming** untuk validasi field wajib
6. Menyediakan API RESTful untuk frontend

### 1.3 Lingkup Sistem

| Komponen | Teknologi |
|----------|-----------|
| Bahasa | TypeScript 5.x |
| Runtime | Node.js |
| Database | MySQL (via `mysql2/promise`) |
| Framework HTTP | Express.js |
| Validasi | Table-driven + Generics |
| State Management | Automata-based loan state machine |
| Arsitektur | 3-layer: Controller → Service → Model |

---

## BAB 2: ENTITY RELATIONSHIP DIAGRAM (ERD)

### 2.1 Diagram ERD

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   ┌──────────────┐          ┌──────────────────┐          ┌──────────────┐
│   │    users      │          │     members       │          │    books      │
│   ├──────────────┤          ├──────────────────┤          ├──────────────┤
│   │ id (PK)      │          │ id (PK)          │          │ id (PK)      │
│   │ name         │          │ name             │          │ title        │
│   │ email (UQ)   │          │ email (UQ)       │          │ author       │
│   │ password     │          │ phone            │          │ isbn (UQ)    │
│   │ phone        │          │ status           │          │ stock        │
│   │ role         │          │ created_at       │          │ category     │
│   │ created_at   │          │ updated_at       │          │ description  │
│   └──────────────┘          └───────┬──────────┘          │ created_at   │
│                                     │                     │ updated_at   │
│                                     │                     └───────┬──────┘
│                                     │                             │
│                                     │     ┌──────────────┐        │
│                                     │     │    loans      │        │
│                                     │     ├──────────────┤        │
│                                     ├─────┤ member_id(FK)│────────┘
│                                     │     │ book_id (FK) │
│                                     │     │ id (PK)      │
│                                     │     │ loan_date    │
│                                     │     │ due_date     │
│                                     │     │ return_date  │
│                                     │     │ status       │
│                                     │     │ fine         │
│                                     │     │ created_at   │
│                                     │     └──────────────┘
│                                     │
│   ┌──────────────────┐              │
│   │  activity_logs   │              │
│   ├──────────────────┤              │
│   │ id (PK)          │              │
│   │ actor            │              │
│   │ action           │              │
│   │ target           │              │
│   │ detail           │              │
│   │ created_at       │              │
│   └──────────────────┘              │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 Entitas dan Atribut

| Entitas | Atribut | Keterangan |
|---------|---------|------------|
| **users** | id, name, email, password, phone, role, created_at | Menyimpan data pengguna/admin |
| **books** | id, title, author, isbn, stock, category, description, created_at, updated_at | Menyimpan data buku |
| **members** | id, name, email, phone, status, created_at, updated_at | Menyimpan data anggota perpustakaan |
| **loans** | id, book_id, member_id, loan_date, due_date, return_date, status, fine, created_at | Mencatat transaksi peminjaman |
| **activity_logs** | id, actor, action, target, detail, created_at | Audit trail semua aktivitas admin |

### 2.3 Relasi Antar Entitas

| Relasi | Kardinalitas | Keterangan |
|--------|-------------|------------|
| members → loans | **1 : N** | Satu anggota dapat memiliki banyak peminjaman |
| books → loans | **1 : N** | Satu buku dapat dipinjam berkali-kali |
| users → activity_logs | **1 : N** | Satu user/admin melakukan banyak aktivitas |

**Penjelasan:**
- `loans` adalah **tabel asosiatif (junction)** yang menghubungkan `books` ↔ `members` dengan relasi many-to-many
- Foreign Key `book_id` di `loans` mereferensi `books(id)` dengan constraint `ON DELETE RESTRICT`
- Foreign Key `member_id` di `loans` mereferensi `members(id)` dengan constraint `ON DELETE RESTRICT`
- `ON DELETE RESTRICT` mencegah penghapusan buku/anggota yang masih memiliki peminjaman aktif

---

## BAB 3: MODEL RELASIONAL

### 3.1 Skema Relasional

Berikut adalah model relasional hasil mapping dari ERD ke dalam bentuk tabel-tabel yang telah dinormalisasi:

**users** (**id**, name, email, password, phone, role, created_at)

**books** (**id**, title, author, isbn, stock, category, description, created_at, updated_at)

**members** (**id**, name, email, phone, status, created_at, updated_at)

**loans** (**id**, book_id, member_id, loan_date, due_date, return_date, status, fine, created_at)
- *book_id* foreign key → books(id)
- *member_id* foreign key → members(id)

**activity_logs** (**id**, actor, action, target, detail, created_at)

> **Keterangan:** Primary key ditandai **bold**. Foreign key ditandai dengan indentasi dan penjelasan.

### 3.2 Normalisasi

Sistem ini sudah memenuhi bentuk normal:

| Bentuk Normal | Pemenuhan |
|---------------|-----------|
| **1NF** | Semua atribut bernilai atomik. Tidak ada atribut multi-value atau nested table |
| **2NF** | Tidak ada partial dependency. Setiap atribut non-key bergantung penuh pada primary key |
| **3NF** | Tidak ada transitive dependency. Semua atribut non-key hanya bergantung pada primary key. Contoh: `title` di `books` hanya bergantung pada `id`, bukan pada atribut lain |
| **BCNF** | Semua determinant adalah candidate key. Terpenuhi karena setiap tabel hanya memiliki satu candidate key |

### 3.3 Ketergantungan Fungsional (Functional Dependencies)

**Tabel books:**
- id → { title, author, isbn, stock, category, description, created_at, updated_at }
- isbn → { id, title, author, stock, category, ... } *(isbn juga candidate key)*

**Tabel members:**
- id → { name, email, phone, status, created_at, updated_at }
- email → { id, name, phone, status, ... } *(email juga candidate key)*

**Tabel loans:**
- id → { book_id, member_id, loan_date, due_date, return_date, status, fine, created_at }
- { book_id, member_id, loan_date } → { id, due_date, return_date, status, fine, created_at }

**Tabel activity_logs:**
- id → { actor, action, target, detail, created_at }

**Tabel users:**
- id → { name, email, password, phone, role, created_at }
- email → { id, name, password, phone, role, ... }

---

## BAB 4: STRUKTUR TABEL

### 4.1 Tabel `users`

| Field | Tipe Data | Constraint | Deskripsi |
|-------|-----------|------------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID unik pengguna |
| name | VARCHAR(255) | NOT NULL | Nama lengkap |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email (unique) |
| password | VARCHAR(255) | NOT NULL | Password (hashed) |
| phone | VARCHAR(20) | NULL | Nomor telepon |
| role | ENUM('admin', 'user') | DEFAULT 'user' | Role pengguna |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pendaftaran |

### 4.2 Tabel `books`

| Field | Tipe Data | Constraint | Deskripsi |
|-------|-----------|------------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID unik buku |
| title | VARCHAR(255) | NOT NULL | Judul buku |
| author | VARCHAR(255) | NOT NULL | Nama pengarang |
| isbn | VARCHAR(20) | UNIQUE, NOT NULL | Kode buku (unique) |
| stock | INT | DEFAULT 0 | Jumlah stok tersedia |
| category | VARCHAR(100) | NULL | Kategori / nama rak |
| description | TEXT | NULL | Deskripsi buku |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu data dibuat |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Waktu data terakhir diupdate |

### 4.3 Tabel `members`

| Field | Tipe Data | Constraint | Deskripsi |
|-------|-----------|------------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID unik anggota |
| name | VARCHAR(255) | NOT NULL | Nama lengkap anggota |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email (unique) |
| phone | VARCHAR(20) | NULL | Nomor telepon |
| status | ENUM('active', 'suspended') | DEFAULT 'active' | Status keanggotaan |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pendaftaran |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Waktu data terakhir diupdate |

### 4.4 Tabel `loans`

| Field | Tipe Data | Constraint | Deskripsi |
|-------|-----------|------------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID unik peminjaman |
| book_id | INT | NOT NULL, FOREIGN KEY → books(id) ON DELETE RESTRICT | ID buku yang dipinjam |
| member_id | INT | NOT NULL, FOREIGN KEY → members(id) ON DELETE RESTRICT | ID anggota peminjam |
| loan_date | DATE | NOT NULL | Tanggal peminjaman |
| due_date | DATE | NOT NULL | Tanggal jatuh tempo (loan_date + 7 hari) |
| return_date | DATE | NULL | Tanggal pengembalian (NULL jika belum kembali) |
| status | ENUM('borrowed', 'returned', 'overdue') | DEFAULT 'borrowed' | Status peminjaman |
| fine | DECIMAL(10,2) | DEFAULT 0 | Denda keterlambatan (Rp) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu record dibuat |

### 4.5 Tabel `activity_logs`

| Field | Tipe Data | Constraint | Deskripsi |
|-------|-----------|------------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID unik log |
| actor | VARCHAR(255) | NOT NULL | Nama/email pelaku aktivitas |
| action | VARCHAR(100) | NOT NULL | Jenis aksi (TAMBAH_BUKU, PINJAM_BUKU, dll) |
| target | VARCHAR(255) | NOT NULL | Objek yang dikenai aksi |
| detail | TEXT | NULL | Informasi tambahan |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu aktivitas |

### 4.6 Indeks

| Tabel | Indeks | Tipe | Keterangan |
|-------|--------|------|------------|
| books | PRIMARY (id) | Primary Key | Clustered index |
| books | UNIQUE (isbn) | Unique Index | Pencarian buku via kode |
| members | PRIMARY (id) | Primary Key | Clustered index |
| members | UNIQUE (email) | Unique Index | Pencarian & validasi duplikat |
| loans | PRIMARY (id) | Primary Key | Clustered index |
| loans | INDEX (book_id) | Foreign Key Index | Join query |
| loans | INDEX (member_id) | Foreign Key Index | Join query |
| loans | INDEX (status, due_date) | Composite (implied) | Optimasi query overdue |
| users | PRIMARY (id) | Primary Key | Clustered index |
| users | UNIQUE (email) | Unique Index | Login lookup |
| activity_logs | PRIMARY (id) | Primary Key | Clustered index |

### 4.7 State Machine Peminjaman (Automata)

```
        ┌──────────┐
        │ borrowed │──────────── return ────────────┐
        └────┬─────┘                                │
             │                                      ▼
             │ overdue (due_date < CURDATE())  ┌──────────┐
             └──────────────────────────────► │ overdue   │
                                              └────┬─────┘
                                                   │
                                                   │ return
                                                   ▼
                                              ┌──────────┐
                                              │ returned │ (final state)
                                              └──────────┘
```

| Transisi | Kondisi |
|----------|---------|
| borrowed → overdue | `status='borrowed' AND due_date < CURDATE()` (dijalankan cron/trigger di service) |
| borrowed → returned | Admin melakukan pengembalian via `PUT /loans/:id/return` |
| overdue → returned | Admin melakukan pengembalian (dengan denda) |

---

## BAB 5: SCRIPT SQL

### 5.1 DDL (Data Definition Language) — Pembuatan Database & Tabel

```sql
-- ============================================================
-- DATABASE: perpustakaan_db
-- Sistem Informasi Perpustakaan (BIOS)
-- ============================================================

CREATE DATABASE IF NOT EXISTS perpustakaan_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE perpustakaan_db;

-- ------------------------------------------------------------
-- Tabel: users
-- Menyimpan data user/admin yang dapat login ke sistem
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    UNIQUE NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    phone       VARCHAR(20),
    role        ENUM('admin', 'user') DEFAULT 'user',
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: books
-- Menyimpan data koleksi buku perpustakaan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(255)    NOT NULL,
    author      VARCHAR(255)    NOT NULL,
    isbn        VARCHAR(20)     UNIQUE NOT NULL,
    stock       INT             DEFAULT 0,
    category    VARCHAR(100),
    description TEXT,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: members
-- Menyimpan data anggota perpustakaan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    UNIQUE NOT NULL,
    phone       VARCHAR(20),
    status      ENUM('active', 'suspended') DEFAULT 'active',
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: loans
-- Mencatat transaksi peminjaman & pengembalian buku
-- Foreign Key: book_id → books(id), member_id → members(id)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loans (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    book_id     INT             NOT NULL,
    member_id   INT             NOT NULL,
    loan_date   DATE            NOT NULL,
    due_date    DATE            NOT NULL,
    return_date DATE,
    status      ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    fine        DECIMAL(10,2)   DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id)   REFERENCES books(id)   ON DELETE RESTRICT,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabel: activity_logs
-- Audit trail — mencatat semua aktivitas yang dilakukan admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    actor       VARCHAR(255)    NOT NULL,
    action      VARCHAR(100)    NOT NULL,
    target      VARCHAR(255)    NOT NULL,
    detail      TEXT,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

### 5.2 DML (Data Manipulation Language) — Operasi CRUD

```sql
-- ============================================================
-- OPERASI: BOOKS
-- ============================================================

-- 1. Tambah buku baru
INSERT INTO books (title, author, isbn, stock, category, description)
VALUES ('Pemrograman Web Modern', 'John Doe', '978-602-1234-56-7', 5, 'Teknologi', 'Buku panduan lengkap pengembangan web');

-- 2. Lihat semua buku
SELECT * FROM books ORDER BY created_at DESC;

-- 3. Lihat buku berdasarkan ID
SELECT * FROM books WHERE id = 1;

-- 4. Cari buku berdasarkan keyword (judul, pengarang, atau kategori)
SELECT * FROM books
WHERE title LIKE '%pemrograman%'
   OR author LIKE '%pemrograman%'
   OR category LIKE '%pemrograman%';

-- 5. Update data buku
UPDATE books
SET title = 'Pemrograman Web Modern Edisi 2',
    stock = 10,
    category = 'Teknologi'
WHERE id = 1;

-- 6. Hapus buku
DELETE FROM books WHERE id = 1;

-- 7. Kurangi stok (saat peminjaman)
UPDATE books SET stock = stock - 1 WHERE id = 1 AND stock > 0;

-- 8. Tambah stok (saat pengembalian)
UPDATE books SET stock = stock + 1 WHERE id = 1;

-- ============================================================
-- OPERASI: MEMBERS
-- ============================================================

-- 1. Tambah anggota baru
INSERT INTO members (name, email, phone, status)
VALUES ('Rina Andriani', 'rina.andriani@email.com', '081234567890', 'active');

-- 2. Lihat semua anggota
SELECT * FROM members ORDER BY created_at DESC;

-- 3. Lihat anggota berdasarkan ID
SELECT * FROM members WHERE id = 1;

-- 4. Update data anggota
UPDATE members
SET name = 'Rina Andriani Putri', phone = '081298765432', status = 'suspended'
WHERE id = 1;

-- 5. Hapus anggota
DELETE FROM members WHERE id = 1;

-- 6. Cek jumlah pinjaman aktif seorang anggota
SELECT COUNT(*) AS active_loans
FROM loans
WHERE member_id = 1 AND status = 'borrowed';

-- ============================================================
-- OPERASI: LOANS
-- ============================================================

-- 1. Buat peminjaman baru
INSERT INTO loans (book_id, member_id, loan_date, due_date, status)
VALUES (1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'borrowed');

-- 2. Lihat semua peminjaman (join dengan books & members)
SELECT l.*, b.title AS book_title, m.name AS member_name
FROM loans l
JOIN books b   ON l.book_id = b.id
JOIN members m ON l.member_id = m.id
ORDER BY l.created_at DESC;

-- 3. Lihat peminjaman yang terlambat (overdue)
SELECT l.*, b.title AS book_title, m.name AS member_name
FROM loans l
JOIN books b   ON l.book_id = b.id
JOIN members m ON l.member_id = m.id
WHERE l.status = 'borrowed' AND l.due_date < CURDATE();

-- 4. Update status overdue secara massal
UPDATE loans
SET status = 'overdue'
WHERE status = 'borrowed' AND due_date < CURDATE();

-- 5. Proses pengembalian buku
UPDATE loans
SET return_date = CURDATE(),
    status = 'returned',
    fine = GREATEST(0, DATEDIFF(CURDATE(), due_date)) * 1000
WHERE id = 1;

-- ============================================================
-- OPERASI: ACTIVITY LOGS
-- ============================================================

-- 1. Tulis log aktivitas
INSERT INTO activity_logs (actor, action, target, detail)
VALUES ('admin', 'TAMBAH_BUKU', 'Pemrograman Web Modern', 'Kode: 978-602-1234-56-7, Stok: 5');

-- 2. Lihat log aktivitas (50 terbaru)
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50;

-- ============================================================
-- OPERASI: DASHBOARD / STATISTIK
-- ============================================================

-- Total buku
SELECT COUNT(*) AS total_books FROM books;

-- Total anggota aktif
SELECT COUNT(*) AS active_members FROM members WHERE status = 'active';

-- Total peminjaman aktif
SELECT COUNT(*) AS active_loans FROM loans WHERE status IN ('borrowed', 'overdue');

-- Total denda terkumpul
SELECT SUM(fine) AS total_fine FROM loans WHERE fine > 0;

-- Peminjaman overdue hari ini
SELECT COUNT(*) AS overdue_count
FROM loans
WHERE status = 'borrowed' AND due_date < CURDATE();
```

### 5.3 DCL (Data Control Language) — Hak Akses

```sql
-- Buat user khusus untuk aplikasi BIOS
CREATE USER IF NOT EXISTS 'bios_app'@'localhost' IDENTIFIED BY 'bios_password_secure';

-- Berikan hak akses (SELECT, INSERT, UPDATE, DELETE) ke database perpustakaan_db
GRANT SELECT, INSERT, UPDATE, DELETE ON perpustakaan_db.* TO 'bios_app'@'localhost';

-- Terapkan perubahan
FLUSH PRIVILEGES;
```

### 5.4 Seed Data — Data Awal

```sql
-- Admin default
INSERT INTO users (name, email, password, role)
VALUES ('Admin Perpustakaan', 'admin@perpus.ac.id', '$2b$10$...', 'admin');

-- Buku sampel
INSERT INTO books (title, author, isbn, stock, category, description) VALUES
('Clean Code', 'Robert C. Martin', '978-013-2350-88-4', 3, 'Teknologi', 'Panduan menulis kode yang bersih'),
('Design Patterns', 'GoF', '978-020-1633-61-0', 2, 'Teknologi', 'Pola desain klasik dalam software engineering'),
('Laskar Pelangi', 'Andrea Hirata', '978-979-3062-79-2', 5, 'Fiksi', 'Novel inspiratif tentang pendidikan di Belitung'),
('Bumi Manusia', 'Pramoedya Ananta Toer', '978-979-9731-23-4', 4, 'Fiksi', 'Novel sejarah era kolonial');

-- Anggota sampel
INSERT INTO members (name, email, phone, status) VALUES
('Andi Pratama', 'andi@email.com', '081234567890', 'active'),
('Budi Santoso', 'budi@email.com', '081234567891', 'active'),
('Citra Dewi', 'citra@email.com', '081234567892', 'suspended');

-- Peminjaman sampel
INSERT INTO loans (book_id, member_id, loan_date, due_date, status) VALUES
(1, 1, '2024-06-01', '2024-06-08', 'returned'),
(2, 2, '2024-06-05', '2024-06-12', 'borrowed');
```

### 5.5 Stored Routine — Utility

```sql
-- ============================================================
-- Stored Procedure: Proses pengembalian buku
-- ============================================================
DELIMITER //
CREATE PROCEDURE ProcessReturn(
    IN p_loan_id  INT,
    IN p_return_date DATE
)
BEGIN
    DECLARE v_due_date DATE;
    DECLARE v_book_id INT;
    DECLARE v_late_days INT;
    DECLARE v_fine DECIMAL(10,2);

    -- Cek apakah loan valid dan belum dikembalikan
    SELECT due_date, book_id
    INTO v_due_date, v_book_id
    FROM loans
    WHERE id = p_loan_id AND return_date IS NULL;

    -- Hitung denda (Rp 1.000/hari)
    SET v_late_days = GREATEST(0, DATEDIFF(p_return_date, v_due_date));
    SET v_fine = v_late_days * 1000;

    -- Update status loan
    UPDATE loans
    SET return_date = p_return_date,
        status = 'returned',
        fine = v_fine
    WHERE id = p_loan_id;

    -- Kembalikan stok buku
    UPDATE books
    SET stock = stock + 1
    WHERE id = v_book_id;

    SELECT v_fine AS total_fine;
END //
DELIMITER ;

-- Contoh pemanggilan:
-- CALL ProcessReturn(1, CURDATE());

-- ============================================================
-- Trigger: Otomatis log aktivitas ke activity_logs
-- (Opsional — saat ini logging dilakukan via aplikasi Node.js)
-- ============================================================

-- Event: Update status overdue setiap malam (opsional via cron)
-- Kode aplikasi sudah menangani ini di LoanService.updateOverdueStatus()
```

---

## LAMPIRAN: Konfigurasi Aplikasi (appConfig.ts)

```typescript
export const appConfig = {
  library: {
    maxLoanDays: 7,           // Durasi peminjaman (hari)
    maxLoansPerMember: 3,     // Maks buku yang bisa dipinjam per anggota
    finePerDay: 1000,         // Denda per hari (Rp)
  },
};
```

---

## KESIMPULAN

Sistem **BIOS** mengimplementasikan basis data perpustakaan dengan **5 tabel utama** yang saling berelasi melalui foreign key. Arsitektur aplikasi menggunakan **3-layer pattern** (Controller → Service → Model dengan Design by Contract) dan **Automata-based state machine** untuk status peminjaman.

Beberapa penerapan konsep basis data lanjutan dalam sistem ini:
- **Normalisasi BCNF** — semua tabel bebas dari anomali update/insert/delete
- **Referential Integrity** via `ON DELETE RESTRICT` — mencegah orphan records
- **State Machine** — status peminjaman (`borrowed → overdue → returned`) dikelola secara terstruktur
- **Audit Trail** — tabel `activity_logs` mencatat setiap aksi admin
- **Table-driven validation** — aturan validasi buku disimpan sebagai data, bukan kode
- **Generic programming** — validasi field wajib menggunakan TypeScript generics

---

**Dibuat oleh:** Tim BIOS — Sistem Informasi Perpustakaan  
**Tanggal:** Juni 2026

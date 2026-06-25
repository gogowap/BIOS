// TEKNIK d: Runtime Config — base URL API dibaca dari satu konstanta
const API = '/api';

// ── Auth Helpers ──────────────────────────────────────────────────────────────
function requireAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/autentikasi/autentikasi.html';
        return null;
    }
    return token;
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('auth_user') || '{}'); }
    catch { return {}; }
}

function isAdmin() { return getUser().role === 'admin'; }

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    };
}

// TEKNIK e: Code Reuse — satu fungsi apiCall dipakai di semua halaman
async function apiCall(method, path, body) {
    requireAuth();
    const opts = { method, headers: getHeaders() };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(API + path, opts);
    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
        logout();
        return;
    }
    if (!data.success) throw new Error(data.message || 'Terjadi kesalahan pada server');
    return data;
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/autentikasi/autentikasi.html';
}

function toast(msg, type = 'success') {
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(c);
    }
    const el = document.createElement('div');
    el.style.cssText = `padding:10px 16px;border-radius:8px;font-size:.83rem;font-weight:500;max-width:320px;${
        type === 'success'
            ? 'background:#1a3326;border:1px solid #2d5c42;color:#7dcb96;'
            : 'background:#3a1a17;border:1px solid #6b2e27;color:#e87c6e;'
    }`;
    el.textContent = (type === 'success' ? '✓  ' : '✕  ') + msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function renderNav(activePage) {
    const user = getUser();
    const admin = user.role === 'admin';

    const adminPages = [
        { id: 'dashboard',  label: 'Dashboard',  href: '/dashboard/dashboard.html' },
        { id: 'rak',        label: 'Rak Buku',   href: '/manajemen_rak/manajemen_rak.html' },
        { id: 'buku',       label: 'Buku',        href: '/buku/kelola_buku.html' },
        { id: 'anggota',    label: 'Anggota',     href: '/manajemen_anggota/manajemen_anggota.html' },
        { id: 'peminjaman', label: 'Peminjaman',  href: '/peminjaman/peminjaman.html' },
        { id: 'denda',      label: 'Denda',       href: '/denda/denda.html' },
        { id: 'aktivitas',  label: 'Aktivitas',   href: '/log-aktivitas/log-aktivitas.html' },
    ];
    const userPages = [
        { id: 'beranda_pengguna',    label: 'Beranda',         href: '/portal_pengguna/beranda_pengguna/beranda_pengguna.html' },
        { id: 'rak_pengguna',        label: 'Rak Buku',        href: '/manajemen_rak/manajemen_rak.html' },
        { id: 'buku_pengguna',       label: 'Koleksi Buku',    href: '/buku/kelola_buku.html' },
        { id: 'peminjaman_pengguna', label: 'Peminjaman Saya', href: '/portal_pengguna/pinjaman_pengguna/pinjaman_pengguna.html' },
    ];

    const pages = admin ? adminPages : userPages;
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    nav.innerHTML = `
        <div class="nav-brand">📚 Perpustakaan</div>
        <div class="nav-tabs">
            ${pages.map(p => `<a class="nav-tab${p.id === activePage ? ' active' : ''}" href="${p.href}">${p.label}</a>`).join('')}
        </div>
        <div class="nav-right">
            <span class="nav-user">${admin ? '🛡️' : '👤'} ${user.name || 'User'}</span>
            <button class="btn-logout" onclick="logout()">Keluar</button>
        </div>
    `;
}

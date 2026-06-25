// Kalau sudah login, langsung redirect sesuai role
if (localStorage.getItem('auth_token')) {
    try {
        const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
        window.location.href = user.role === 'admin'
            ? '/dashboard/dashboard.html'
            : '/portal_pengguna/beranda_pengguna/beranda_pengguna.html';
    } catch {
        localStorage.clear();
    }
}

let tabAktif = 'user';

function handleSwitchTab(jenis) {
    tabAktif = jenis;
    document.getElementById('tabUser').classList.toggle('active', jenis === 'user');
    document.getElementById('tabAdmin').classList.toggle('active', jenis === 'admin');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(jenis === 'admin' ? 'panel-admin-login' : 'panel-user-login').classList.add('active');
    bersihkanAlert();
}

function handleSwitchPanel(jenis) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(jenis === 'register' ? 'panel-user-register' : 'panel-user-login').classList.add('active');
    bersihkanAlert();
}

function bersihkanAlert() {
    document.querySelectorAll('.alert').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

function tampilError(id, pesan) {
    const el = document.getElementById(id);
    if (el) { el.textContent = pesan; el.style.display = 'block'; }
}

function tampilSukses(id, pesan) {
    const el = document.getElementById(id);
    if (el) { el.textContent = pesan; el.style.display = 'block'; }
}

// ── Login User ────────────────────────────────────────────────────────────────
async function executeLoginUser() {
    const email    = document.getElementById('loginUserEmail').value.trim();
    const password = document.getElementById('loginUserPassword').value.trim();

    if (!email || !password) {
        tampilError('userLoginErr', 'Email dan password wajib diisi');
        return;
    }

    try {
        const res  = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user',  JSON.stringify(data.user));
            // Redirect sesuai role yang dikembalikan server
            window.location.href = data.user.role === 'admin'
                ? '/dashboard/dashboard.html'
                : '/portal_pengguna/beranda_pengguna/beranda_pengguna.html';
        } else {
            tampilError('userLoginErr', data.message);
        }
    } catch {
        tampilError('userLoginErr', 'Tidak dapat terhubung ke server');
    }
}

// ── Login Admin (pakai tab admin, email + password) ───────────────────────────
async function executeLoginAdmin() {
    const email    = document.getElementById('loginAdminUsername').value.trim();
    const password = document.getElementById('loginAdminPassword').value.trim();

    if (!email || !password) {
        tampilError('adminLoginErr', 'Email dan password wajib diisi');
        return;
    }

    try {
        const res  = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success && data.user.role === 'admin') {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user',  JSON.stringify(data.user));
            window.location.href = '/dashboard/dashboard.html';
        } else if (data.success && data.user.role !== 'admin') {
            tampilError('adminLoginErr', 'Akun ini bukan akun admin!');
        } else {
            tampilError('adminLoginErr', data.message);
        }
    } catch {
        tampilError('adminLoginErr', 'Tidak dapat terhubung ke server');
    }
}

// ── Register User ─────────────────────────────────────────────────────────────
async function executeRegisterUser() {
    const name     = document.getElementById('registerName').value.trim();
    const email    = document.getElementById('registerEmail').value.trim();
    const phone    = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!name || !email || !password) {
        tampilError('registerErr', 'Nama, email, dan password wajib diisi');
        return;
    }

    try {
        const res  = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });
        const data = await res.json();

        if (data.success) {
            handleSwitchPanel('login');
            tampilSukses('userLoginOk', 'Registrasi berhasil! Silakan login.');
            document.getElementById('loginUserEmail').value = email;
        } else {
            tampilError('registerErr', data.message);
        }
    } catch {
        tampilError('registerErr', 'Tidak dapat terhubung ke server');
    }
}

// Enter key shortcut
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (tabAktif === 'admin') {
        executeLoginAdmin();
    } else if (document.getElementById('panel-user-login').classList.contains('active')) {
        executeLoginUser();
    } else {
        executeRegisterUser();
    }
});

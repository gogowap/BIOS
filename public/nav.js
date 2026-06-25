const API = 'http://localhost:3000/api';

function requireAuth() {
  const token = localStorage.getItem('auth_token');
  if (!token) { window.location.href = '/login.html'; return null; }
  return token;
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('auth_user') || '{}'); } catch { return {}; }
}

function isAdmin() { return getUser().role === 'admin'; }

function getHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` };
}

async function apiCall(method, path, body) {
  requireAuth();
  const opts = { method, headers: getHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (res.status === 401) { logout(); return; }
  if (!data.success) throw new Error(data.message || 'Terjadi kesalahan');
  return data;
}

function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.location.href = '/login.html';
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
  el.style.cssText = `padding:10px 16px;border-radius:8px;font-size:.83rem;font-weight:500;max-width:320px;${type==='success'?'background:#1a3326;border:1px solid #2d5c42;color:#7dcb96;':'background:#3a1a17;border:1px solid #6b2e27;color:#e87c6e;'}`;
  el.textContent = (type === 'success' ? '✓  ' : '✕  ') + msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function renderNav(activePage) {
  const user = getUser();
  const admin = user.role === 'admin';

  // Admin: semua menu | User: hanya Buku, Rak, Peminjaman Saya
  const adminPages = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard.html' },
    { id: 'rak', label: 'Rak Buku', href: '/rak.html' },
    { id: 'books', label: 'Buku', href: '/books.html' },
    { id: 'members', label: 'Anggota', href: '/members.html' },
    { id: 'loans', label: 'Peminjaman', href: '/loans.html' },
    { id: 'denda', label: 'Denda', href: '/denda.html' },
    { id: 'activity', label: 'Aktivitas', href: '/activity.html' },
  ];
  const userPages = [
    { id: 'user-home', label: 'Beranda', href: '/user-home.html' },
    { id: 'rak', label: 'Rak Buku', href: '/rak.html' },
    { id: 'books', label: 'Koleksi Buku', href: '/books.html' },
    { id: 'user-loans', label: 'Peminjaman Saya', href: '/user-loans.html' },
  ];

  const pages = admin ? adminPages : userPages;
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  nav.innerHTML = `
    <div class="nav-brand">📚 Perpustakaan</div>
    <div class="nav-tabs">
      ${pages.map(p => `<a class="nav-tab${p.id===activePage?' active':''}" href="${p.href}">${p.label}</a>`).join('')}
    </div>
    <div class="nav-right">
      <span class="nav-user">${admin?'🛡️':'👤'} ${user.name||'User'}</span>
      <button class="btn-logout" onclick="logout()">Keluar</button>
    </div>
  `;
}

const sharedCSS = `
<style>
:root{--bg:#0f0e0c;--surface:#1a1814;--surface2:#242018;--border:#2e2a22;--gold:#c9a84c;--gold-light:#e4c170;--gold-dim:rgba(201,168,76,0.15);--text:#f0ead8;--text-muted:#8a8070;--red:#e05a4a;--green:#5a9e6f;--blue:#4a8ec9;--radius:10px;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh;}
nav#mainNav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(15,14,12,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:60px;gap:12px;}
.nav-brand{font-family:'Playfair Display',serif;font-size:1.15rem;color:var(--gold);letter-spacing:.05em;white-space:nowrap;}
.nav-tabs{display:flex;gap:3px;}
.nav-tab{padding:6px 13px;border-radius:6px;color:var(--text-muted);font-size:.82rem;text-decoration:none;transition:all .2s;white-space:nowrap;}
.nav-tab:hover{color:var(--text);background:var(--surface);}
.nav-tab.active{color:var(--gold);background:var(--gold-dim);}
.nav-right{display:flex;align-items:center;gap:10px;}
.nav-user{font-size:.78rem;color:var(--text-muted);white-space:nowrap;}
.btn-logout{padding:5px 13px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-muted);font-size:.78rem;cursor:pointer;transition:all .2s;}
.btn-logout:hover{color:var(--red);border-color:rgba(224,90,74,.4);}
main{padding-top:72px;max-width:1150px;margin:0 auto;padding-left:24px;padding-right:24px;padding-bottom:40px;}
.page-header{margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.page-title{font-family:'Playfair Display',serif;font-size:1.7rem;color:var(--text);}
.page-title span{color:var(--gold);}
.btn{padding:8px 18px;border-radius:7px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.84rem;font-weight:500;transition:all .2s;display:inline-flex;align-items:center;gap:5px;}
.btn-primary{background:var(--gold);color:#0f0e0c;}.btn-primary:hover{background:var(--gold-light);}
.btn-danger{background:transparent;color:var(--red);border:1px solid rgba(224,90,74,.3);}.btn-danger:hover{background:rgba(224,90,74,.1);}
.btn-edit{background:transparent;color:var(--blue);border:1px solid rgba(74,142,201,.3);}.btn-edit:hover{background:rgba(74,142,201,.1);}
.btn-return{background:transparent;color:var(--green);border:1px solid rgba(90,158,111,.3);}.btn-return:hover{background:rgba(90,158,111,.1);}
.btn-sm{padding:4px 10px;font-size:.76rem;}
.btn-ghost{background:transparent;color:var(--text-muted);border:1px solid var(--border);}.btn-ghost:hover{color:var(--text);}
.toolbar{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.toolbar input,.toolbar select{padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:7px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:.84rem;outline:none;transition:border .2s;}
.toolbar input{flex:1;min-width:160px;}.toolbar input:focus,.toolbar select:focus{border-color:var(--gold);}
.toolbar select option{background:var(--surface2);}
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
table{width:100%;border-collapse:collapse;}
thead{background:var(--surface2);}
th{padding:10px 14px;text-align:left;font-size:.72rem;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;}
td{padding:11px 14px;font-size:.855rem;border-top:1px solid var(--border);}
tr:hover td{background:rgba(201,168,76,.03);}
.empty-state{text-align:center;padding:44px;color:var(--text-muted);font-size:.86rem;}
.empty-state .icon{font-size:2rem;margin-bottom:8px;opacity:.3;}
.badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:.71rem;font-weight:500;}
.badge-active{background:rgba(90,158,111,.15);color:#7dcb96;}
.badge-suspended{background:rgba(224,90,74,.15);color:#e87c6e;}
.badge-borrowed{background:rgba(201,168,76,.15);color:var(--gold);}
.badge-returned{background:rgba(90,158,111,.15);color:#7dcb96;}
.badge-overdue{background:rgba(224,90,74,.15);color:#e87c6e;}
.modal-overlay{display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);align-items:center;justify-content:center;}
.modal-overlay.open{display:flex;}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:14px;width:100%;max-width:480px;padding:26px;animation:modalIn .25s ease;max-height:90vh;overflow-y:auto;}
@keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.modal-title{font-family:'Playfair Display',serif;font-size:1.1rem;margin-bottom:18px;color:var(--gold);}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
.form-group{margin-bottom:12px;}
.form-group label{display:block;font-size:.74rem;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em;}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:.875rem;outline:none;transition:border .2s;}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:var(--gold);}
.form-group select option{background:var(--surface2);}
.form-group textarea{resize:vertical;min-height:65px;}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:24px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:17px 19px;}
.stat-label{font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;}
.stat-value{font-family:'Playfair Display',serif;font-size:1.85rem;color:var(--gold);}
.stat-sub{font-size:.75rem;color:var(--text-muted);margin-top:3px;}
.section-label{font-size:.73rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;margin-top:18px;}
.fine-preview{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;margin:12px 0;font-size:.84rem;}
.fine-row{display:flex;justify-content:space-between;margin-bottom:7px;align-items:center;}
.fine-row:last-child{margin-bottom:0;padding-top:9px;border-top:1px solid var(--border);font-weight:600;}
@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
`;

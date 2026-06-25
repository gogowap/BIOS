requireAuth();
if (!isAdmin()) window.location.href = '/portal_pengguna/beranda_pengguna/beranda_pengguna.html';
renderNav('aktivitas');

const REFRESH_INTERVAL_MS = 30000;
let activityLogs = [];

// TEKNIK b: Table-Driven — label aksi dipetakan lewat tabel, bukan if-else
const ACTION_LABELS = {
    LOGIN:          { label: 'Login',           warna: 'act-info'    },
    REGISTRASI:     { label: 'Registrasi',      warna: 'act-info'    },
    TAMBAH_BUKU:    { label: 'Tambah Buku',     warna: 'act-tambah'  },
    UBAH_BUKU:      { label: 'Edit Buku',       warna: 'act-ubah'    },
    HAPUS_BUKU:     { label: 'Hapus Buku',      warna: 'act-hapus'   },
    TAMBAH_ANGGOTA: { label: 'Tambah Anggota',  warna: 'act-tambah'  },
    UBAH_ANGGOTA:   { label: 'Edit Anggota',    warna: 'act-ubah'    },
    HAPUS_ANGGOTA:  { label: 'Hapus Anggota',   warna: 'act-hapus'   },
    PINJAM_BUKU:    { label: 'Pinjam Buku',     warna: 'act-pinjam'  },
    KEMBALI_BUKU:   { label: 'Kembali Buku',    warna: 'act-kembali' },
};

async function fetchAndRenderLogs() {
    try {
        const { data } = await apiCall('GET', '/aktivitas');
        activityLogs = data;
        renderLogTable(activityLogs);
        populateFilterOptions();
    } catch (err) {
        toast(err.message, 'error');
    }
}

function renderLogTable(logs) {
    const tbody = document.getElementById('logTable');
    if (!logs?.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><div class="icon">📋</div>Belum ada aktivitas tercatat</td></tr>`;
        return;
    }
    tbody.innerHTML = logs.map(log => {
        const aksi = ACTION_LABELS[log.action] ?? { label: log.action, warna: '' };
        return `
        <tr>
            <td>
                <div style="font-size:.83rem">${formatFullDate(log.created_at)}</div>
                <div style="font-size:.75rem;color:var(--text-muted)">${calculateTimeAgo(log.created_at)}</div>
            </td>
            <td style="font-weight:500">${log.nama_user || '<em style="color:var(--text-muted)">Sistem</em>'}</td>
            <td><span class="action-badge ${aksi.warna}">${aksi.label}</span></td>
            <td><strong style="font-size:.84rem">${log.target || '-'}</strong></td>
            <td style="font-size:.82rem;color:var(--text-muted)">${log.detail || '-'}</td>
        </tr>`;
    }).join('');
}

function populateFilterOptions() {
    const sel = document.getElementById('filterAction');
    if (!sel) return;
    const actions = [...new Set(activityLogs.map(l => l.action))];
    sel.innerHTML = '<option value="">Semua Aktivitas</option>' +
        actions.map(a => {
            const lbl = ACTION_LABELS[a]?.label ?? a;
            return `<option value="${a}">${lbl}</option>`;
        }).join('');
}

function filterLogsByAction() {
    const val = document.getElementById('filterAction')?.value;
    renderLogTable(val ? activityLogs.filter(l => l.action === val) : activityLogs);
}

function calculateTimeAgo(dateString) {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60)   return `${seconds} detik lalu`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    return `${Math.floor(seconds / 86400)} hari lalu`;
}

function formatFullDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

fetchAndRenderLogs();
setInterval(fetchAndRenderLogs, REFRESH_INTERVAL_MS);

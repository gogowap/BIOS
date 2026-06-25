/**
 * Modul Pinjaman Pengguna - Logic Only
 */

// Defensive Check: Pastikan fungsi global ada
const LABEL = { borrowed: 'Dipinjam', returned: 'Dikembalikan', overdue: 'Terlambat' };

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    if (isAdmin()) window.location.href = '/dashboard/dashboard.html';
    renderNav('pinjaman_pengguna');
    init();
});

const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-';
const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

async function init() {
    const user = getUser();
    if (!user) return;

    try {
        // SESUDAH
        const loansRes = await apiCall('GET', '/peminjaman/saya');
        const user = getUser();

        const tb = document.getElementById('loansTable');
        const infoBox = document.getElementById('infoBox');

        document.getElementById('memberNameInfo').textContent = user.name || '-';

        const myLoans = loansRes.data || [];

        if (myLoans.length === 0) {
            tb.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada riwayat peminjaman</td></tr>';
            return;
        }

        tb.innerHTML = myLoans.map(l => `
    <tr>
        <td><strong>${l.title || 'Buku #' + l.id_book}</strong></td>
        <td>${fmt(l.loan_date)}</td>
        <td>${fmt(l.due_date)}</td>
        <td>${fmt(l.return_date)}</td>
        <td><span class="badge badge-${l.status}">${LABEL[l.status] || l.status}</span></td>
        <td class="${l.fine > 0 ? 'text-danger' : 'text-muted'}">${l.fine > 0 ? fmtRp(l.fine) : '-'}</td>
    </tr>
`).join('');

    } catch (e) {
        if (typeof toast === 'function') toast(e.message, 'error');
        else console.error(e);
    }
}
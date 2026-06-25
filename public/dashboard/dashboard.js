requireAuth();
renderNav('dashboard');

const STATUS_LABEL = {
    borrowed: 'Dipinjam',
    returned: 'Dikembalikan',
    overdue: 'Terlambat'
};

const formatTgl = (date) => date ? new Date(date).toLocaleDateString('id-ID') : '-';
const formatRupiah = (angka) => 'Rp ' + Number(angka || 0).toLocaleString('id-ID');

function hitungSelisihHari(tglAwal, tglAkhir) {
    const hari = 86400000; // milidetik dalam sehari
    return Math.ceil((new Date(tglAkhir) - new Date(tglAwal)) / hari);
}

const today = new Date();
document.getElementById('tanggalHari').textContent = today.toLocaleDateString('id-ID', {
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
});

async function inisialisasiDashboard() {
    try {
        const [resBuku, resMember, resPinjam] = await Promise.all([
            apiCall('GET', '/buku'),
            apiCall('GET', '/anggota'),
            apiCall('GET', '/peminjaman')
        ]);

        tampilkanStatistik(resBuku.data, resMember.data, resPinjam.data);
        tampilkanNotifikasi(resPinjam.data);
        tampilkanTabelTerbaru(resPinjam.data);

    } catch (error) {
        toast(error.message, 'error');
    }
}

function tampilkanStatistik(buku, member, pinjam) {
    document.getElementById('statBooks').textContent = buku.length;
    document.getElementById('statMembers').textContent = member.filter(m => m.status === 'active').length;
    
    const pinjamAktif = pinjam.filter(p => p.status === 'borrowed' || p.status === 'overdue').length;
    document.getElementById('statLoans').textContent = pinjamAktif;
    
    const totalDenda = pinjam.reduce((total, p) => total + Number(p.fine || 0), 0);
    document.getElementById('statFine').textContent = formatRupiah(totalDenda);
}

function tampilkanNotifikasi(loans) {
    const tglHariIni = new Date().toISOString().split('T')[0];
    const groups = { overdue: [], today: [], tomorrow: [], soon: [] };

    loans.filter(l => l.status === 'borrowed' || l.status === 'overdue').forEach(loan => {
        const tglTempo = (loan.due_date || '').split('T')[0];
        const selisih = hitungSelisihHari(tglHariIni, tglTempo);

        if (selisih < 0 || loan.status === 'overdue') groups.overdue.push(loan);
        else if (selisih === 0) groups.today.push(loan);
        else if (selisih === 1) groups.tomorrow.push(loan);
        else if (selisih >= 2 && selisih <= 3) groups.soon.push(loan);
    });

    const container = document.getElementById('notifWrap');
    container.innerHTML = '';

    if (groups.overdue.length) {
        container.innerHTML += templateNotif('notif-overdue', '🚨', `${groups.overdue.length} peminjaman melewati jatuh tempo!`, groups.overdue);
    }
    if (groups.today.length) {
        container.innerHTML += templateNotif('notif-soon', '⚠️', `Ada ${groups.today.length} peminjaman jatuh tempo HARI INI!`, groups.today);
    }
    if (groups.tomorrow.length) {
        container.innerHTML += templateNotif('notif-soon', '📅', `${groups.tomorrow.length} peminjaman jatuh tempo besok`, groups.tomorrow);
    }
}

function templateNotif(cssClass, icon, title, dataList) {
    const listHtml = dataList.slice(0, 3).map(l => `
        <div class="notif-item">• ${l.title || 'Buku'} — ${l.nama_anggota || 'Anggota'}</div>
    `).join('');
    
    const sisa = dataList.length > 3 ? `<div class="notif-item">...dan ${dataList.length - 3} lainnya</div>` : '';

    return `
        <div class="notif ${cssClass}">
            <div class="notif-icon">${icon}</div>
            <div class="notif-text">
                <strong>${title}</strong>
                <div class="notif-list">${listHtml}${sisa}</div>
            </div>
        </div>`;
}

function tampilkanTabelTerbaru(loans) {
    const tableBody = document.getElementById('dashLoans');
    const dataTerbaru = loans.slice(0, 8);

    if (!dataTerbaru.length) {
        tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada data peminjaman</td></tr>';
        return;
    }

    tableBody.innerHTML = dataTerbaru.map(l => `
        <tr>
            <td><strong>${l.title || 'Buku'}</strong></td>
            <td>${l.nama_anggota || 'Anggota'}</td>
            <td style="color:var(--text-muted)">${formatTgl(l.due_date)}</td>
            <td><span class="badge badge-${l.status}">${STATUS_LABEL[l.status] || l.status}</span></td>
        </tr>
    `).join('');
}

inisialisasiDashboard();
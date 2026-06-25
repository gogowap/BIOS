requireAuth();
renderNav('denda');

const TARIF_DENDA_PER_HARI = 1000;

const formatTanggalLokal = (tanggalStr) => tanggalStr ? new Date(tanggalStr).toLocaleDateString('id-ID') : '-';
const formatRupiah = (nominal) => 'Rp ' + Number(nominal || 0).toLocaleString('id-ID');

function hitungSelisihHari(tanggalAwal, tanggalAkhir) {
    const miliDetikPerHari = 86400000;
    return Math.ceil((new Date(tanggalAkhir) - new Date(tanggalAwal)) / miliDetikPerHari);
}

async function inisialisasiHalamanDenda() {
    try {
        const { data: daftarPinjaman } = await apiCall('GET', '/peminjaman');
        
        tampilkanStatistikDenda(daftarPinjaman);
        tampilkanTabelDenda(daftarPinjaman);

    } catch (error) {
        toast(error.message, 'error');
    }
}

function tampilkanStatistikDenda(daftarPinjaman) {
    const totalDendaTerkumpul = daftarPinjaman.reduce((total, pinjaman) => total + Number(pinjaman.fine || 0), 0);
    const jumlahPinjamanTerlambat = daftarPinjaman.filter(pinjaman => pinjaman.status === 'overdue').length;
    
    document.getElementById('dendaTotal').textContent = formatRupiah(totalDendaTerkumpul);
    document.getElementById('dendaOverdue').textContent = jumlahPinjamanTerlambat;
}

function tampilkanTabelDenda(daftarPinjaman) {
    const tableBody = document.getElementById('dendaTable');
    if (!tableBody) return;

    const dataDendaTerfilter = daftarPinjaman.filter(pinjaman => pinjaman.fine > 0 || pinjaman.status === 'overdue');
    
    if (dataDendaTerfilter.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="icon">💰</div>Tidak ada riwayat denda</td></tr>';
        return;
    }

    const tanggalHariIni = new Date().toISOString().split('T')[0];

    tableBody.innerHTML = dataDendaTerfilter.map(pinjaman => {
        const tanggalTempo = (pinjaman.due_date || '').split('T')[0];
        const tanggalKembali = pinjaman.return_date ? (pinjaman.return_date || '').split('T')[0] : null;
        
        const targetTanggalAkhir = tanggalKembali || tanggalHariIni;
        const totalHariTerlambat = Math.max(0, hitungSelisihHari(tanggalTempo, targetTanggalAkhir));
        
        const nominalDenda = pinjaman.fine > 0 ? pinjaman.fine : (totalHariTerlambat * TARIF_DENDA_PER_HARI);

        return `
            <tr>
                <td><strong>${pinjaman.title || 'Buku #' + pinjaman.id_book}</strong></td>
                <td>${pinjaman.nama_anggota || 'Anggota #' + pinjaman.id_member}</td>
                <td>${formatTanggalLokal(tanggalTempo)}</td>
                <td>${tanggalKembali ? formatTanggalLokal(tanggalKembali) : '<span style="color:var(--red)">Belum kembali</span>'}</td>
                <td style="color:var(--red)">${totalHariTerlambat} hari</td>
                <td style="color:var(--red); font-weight:600">${formatRupiah(nominalDenda)}</td>
            </tr>`;
    }).join('');
}

inisialisasiHalamanDenda();
// Inisialisasi awal halaman peminjaman
requireAuth();
renderNav('loans');

let listAllLoans = [];
const TARIF_DENDA_PER_HARI = 1000;

const STATUS_LABEL = {
    borrowed: 'Dipinjam',
    returned: 'Dikembalikan',
    overdue: 'Terlambat'
};

// Utils / Helper Functions
const formatTanggalLokal = (tanggalStr) => tanggalStr ? new Date(tanggalStr).toLocaleDateString('id-ID') : '-';
const formatRupiah = (nominal) => 'Rp ' + Number(nominal || 0).toLocaleString('id-ID');

function hitungSelisihHari(tanggalAwal, tanggalAkhir) {
    const d1 = new Date(tanggalAwal);
    const d2 = new Date(tanggalAkhir);
    if (isNaN(d1) || isNaN(d2)) return 0;
    const miliDetikPerHari = 86400000;
    return Math.ceil((new Date(tanggalAkhir) - new Date(tanggalAwal)) / miliDetikPerHari);
}

// 1. Memuat Data Utama dari API
async function fetchAndRenderLoans() {
    try {
        const { data } = await apiCall('GET', '/peminjaman');
        listAllLoans = data;
        renderLoansTable(listAllLoans);
    } catch (error) {
        toast(error.message, 'error');
    }
}

// 2. Merender Tabel Daftar Peminjaman
function renderLoansTable(loans) {
    const tableBody = document.getElementById('loansTable');
    if (!tableBody) return;

    if (!loans || loans.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="empty-state"><div class="icon">🔄</div>Belum ada peminjaman</td></tr>';
        return;
    }

    tableBody.innerHTML = loans.map(loan => `
        <tr>
            <td><strong>${loan.title || 'Buku #' + loan.id_book}</strong></td>
            <td>${loan.nama_anggota || 'Anggota #' + loan.id_member}</td>
            <td style="color:var(--text-muted)">${formatTanggalLokal(loan.loan_date)}</td>
            <td style="color:var(--text-muted)">${formatTanggalLokal(loan.due_date)}</td>
            <td><span class="badge badge-${loan.status}">${STATUS_LABEL[loan.status] || loan.status}</span></td>
            <td style="color:${loan.fine > 0 ? 'var(--red)' : 'var(--text-muted)'}">${loan.fine > 0 ? formatRupiah(loan.fine) : '-'}</td>
            <td>
                ${loan.status !== 'returned' ? `<button class="btn btn-return btn-sm" onclick="openReturnModal(${loan.id_loan})">↩ Kembali</button>` : '-'}
            </td>
        </tr>
    `).join('');
}

// 3. Logika Pencarian / Filter Berdasarkan Status
function handleFilterLoans() {
    const selectedStatus = document.getElementById('filterStatus').value;
    const filteredLoans = selectedStatus ? listAllLoans.filter(loan => loan.status === selectedStatus) : listAllLoans;
    renderLoansTable(filteredLoans);
}

// 4. Manajemen Modal Box: Jalur Peminjaman Baru
async function openLoanModal() {
    try {
        const [resBooks, resMembers] = await Promise.all([
            apiCall('GET', '/buku'),
            apiCall('GET', '/anggota')
        ]);
        
        // Render dropdown buku yang stoknya masih tersedia
        document.getElementById('loanBook').innerHTML = '<option value="">-- Pilih Buku --</option>' + 
            resBooks.data.filter(book => book.stock > 0).map(book => `<option value="${book.id_book}">${book.title} (stok: ${book.stock})</option>`).join('');
        
        // Render dropdown anggota yang statusnya aktif
        document.getElementById('loanMember').innerHTML = '<option value="">-- Pilih Anggota --</option>' + 
            resMembers.data.filter(member => member.status === 'active').map(member => `<option value="${member.id_member}">${member.name}</option>`).join('');
        
        document.getElementById('modalLoan').classList.add('open');
    } catch (error) {
        toast(error.message, 'error');
    }
}

function closeLoanModal() {
    document.getElementById('modalLoan').classList.remove('open');
}

async function submitLoanForm() {
    const bookId = document.getElementById('loanBook').value;
    const memberId = document.getElementById('loanMember').value;
    
    if (!bookId || !memberId) {
        toast('Pilih buku dan anggota terlebih dahulu', 'error');
        return;
    }
    
    try {
        await apiCall('POST', '/peminjaman', { 
            id_book: Number(bookId), 
            id_member: Number(memberId) 
        });
        toast('Peminjaman berhasil!');
        closeLoanModal();
        fetchAndRenderLoans();
    } catch (error) {
        toast(error.message, 'error');
    }
}

// 5. Manajemen Modal Box: Jalur Pengembalian Buku
function openReturnModal(loanId) {
    const currentLoan = listAllLoans.find(loan => loan.id_loan === loanId);
    if (!currentLoan) return;

    document.getElementById('returnLoanId').value = loanId;
    
    const tanggalHariIni = new Date().toISOString().split('T')[0];
    const tanggalTempo = (currentLoan.due_date || '').split('T')[0];
    
    // Hitung jumlah hari terlambat dan estimasi dendanya
    const totalHariTerlambat = Math.max(0, hitungSelisihHari(tanggalTempo, tanggalHariIni));
    const nominalDenda = totalHariTerlambat * TARIF_DENDA_PER_HARI;

    document.getElementById('returnPreview').innerHTML = `
        <div class="fine-row"><span>Buku</span><strong>${currentLoan.title || 'Buku #' + currentLoan.id_book}</strong></div>
        <div class="fine-row"><span>Peminjam</span><strong>${currentLoan.nama_anggota || 'Anggota #' + currentLoan.id_member}</strong></div>
        <div class="fine-row"><span>Jatuh Tempo</span><span>${formatTanggalLokal(tanggalTempo)}</span></div>
        <div class="fine-row"><span>Keterlambatan</span><span style="color:${totalHariTerlambat > 0 ? 'var(--red)' : 'var(--green)'}">${totalHariTerlambat} hari</span></div>
        <div class="fine-row"><span>Denda</span><span style="color:${nominalDenda > 0 ? 'var(--red)' : 'var(--green)'}">${nominalDenda > 0 ? formatRupiah(nominalDenda) : 'Tidak ada denda ✓'}</span></div>
    `;
    
    document.getElementById('modalReturn').classList.add('open');
}

function closeReturnModal() {
    document.getElementById('modalReturn').classList.remove('open');
}

async function confirmReturnForm() {
    const loanId = document.getElementById('returnLoanId').value;
    try {
        const { message } = await apiCall('POST', `/peminjaman/kembali/${loanId}`);
        toast(message || 'Buku berhasil dikembalikan');
        closeReturnModal();
        fetchAndRenderLoans();
    } catch (error) {
        toast(error.message, 'error');
    }
}

// Jalankan pengambilan data saat pertama kali dimuat
fetchAndRenderLoans();
/**
 * Modul Manajemen Anggota - Mengatur data keanggotaan, pencarian, serta otomasi suspensi akun terlambat
 */

// Inisialisasi awal halaman manajemen anggota
requireAuth();
renderNav('members');

let listAllMembers = [];
let listAllLoans = [];

// 1. Ambil Data Utama dari API (Members & Loans secara Paralel)
async function fetchAndRenderData() {
    try {
        const [resMembers, resLoans] = await Promise.all([
            apiCall('GET', '/anggota'),
            apiCall('GET', '/peminjaman')
        ]);
        
        listAllMembers = resMembers.data;
        listAllLoans = resLoans.data;
        
        renderMembersTable(listAllMembers);
        periksaPeringatanKeterlambatan();
    } catch (error) {
        toast(error.message, 'error');
    }
}

// 2. Helper: Kalkulasi Status Riwayat Pinjaman Anggota
function dapatkanJumlahPinjamanAktif(memberId) {
    return listAllLoans.filter(loan => 
        loan.id_member === memberId && (loan.status === 'borrowed' || loan.status === 'overdue')
    ).length;
}

function dapatkanJumlahPinjamanTerlambat(memberId) {
    return listAllLoans.filter(loan => 
        loan.id_member === memberId && loan.status === 'overdue'
    ).length;
}

// 3. Deteksi Otomatis Anggota Terlambat & Tampilkan Banner Notifikasi
function periksaPeringatanKeterlambatan() {
    const daftarAnggotaBermasalah = listAllMembers.filter(member => 
        member.status === 'active' && dapatkanJumlahPinjamanTerlambat(member.id_member) > 0
    );
    
    const bannerContainer = document.getElementById('warningBanner');
    if (!bannerContainer) return;

    if (daftarAnggotaBermasalah.length > 0) {
        bannerContainer.style.display = 'block';
        bannerContainer.innerHTML = `
            <div class="alert-banner alert-warning">
                ⚠️ <span>Ada <strong>${daftarAnggotaBermasalah.length} anggota</strong> dengan pinjaman terlambat. Klik "Auto Nonaktif" untuk mengubah status mereka secara otomatis.</span>
                <button class="btn btn-danger btn-sm" onclick="eksekusiAutoSuspend()">Auto Nonaktif</button>
            </div>`;
    } else {
        bannerContainer.style.display = 'none';
    }
}

// 4. Merender Struktur Tabel Anggota ke HTML
function renderMembersTable(members) {
    const tableBody = document.getElementById('membersTable');
    if (!tableBody) return;

    if (!members || members.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="icon">👥</div>Belum ada data anggota</td></tr>';
        return;
    }

    tableBody.innerHTML = members.map(member => {
        const totalPinjamAktif = dapatkanJumlahPinjamanAktif(member.id_member);
        const totalPinjamTerlambat = dapatkanJumlahPinjamanTerlambat(member.id_member);
        
        const tampilanPinjaman = totalPinjamAktif > 0 
            ? `<span style="color:var(--gold)">${totalPinjamAktif} buku</span>` 
            : '<span style="color:var(--text-muted)">-</span>';
            
        const tampilanTerlambat = totalPinjamTerlambat > 0 
            ? `<span style="color:var(--red); margin-left:6px; font-size:.76rem">(${totalPinjamTerlambat} terlambat)</span>` 
            : '';

        return `
            <tr>
                <td><strong>${member.name}</strong></td>
                <td style="color:var(--text-muted)">${member.email}</td>
                <td style="color:var(--text-muted)">${member.phone || '-'}</td>
                <td>${tampilanPinjaman}${tampilanTerlambat}</td>
                <td>
                    <span class="badge badge-${member.status === 'active' ? 'active' : 'suspended'}">
                        ${member.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td style="display:flex; gap:5px">
                    <button class="btn btn-edit btn-sm" onclick="openMemberModal(${member.id_member})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMemberData(${member.id_member})">Hapus</button>
                </td>
            </tr>`;
    }).join('');
}

// 5. Pencarian & Filter Berdasarkan Nama, Email, atau Status
function handleFilterMembers() {
    const kataKunci = document.getElementById('searchMember').value.toLowerCase();
    const statusTerpilih = document.getElementById('filterStatus').value;
    
    const hasilFilter = listAllMembers.filter(member => {
        const cocokKataKunci = !kataKunci || (member.name + member.email).toLowerCase().includes(kataKunci);
        const cocokStatus = !statusTerpilih || member.status === statusTerpilih;
        return cocokKataKunci && cocokStatus;
    });
    
    renderMembersTable(hasilFilter);
}

// 6. Fitur Cerdas: Otomasi Suspensi Akun Terlambat Massal
async function eksekusiAutoSuspend() {
    const daftarTarget = listAllMembers.filter(member => 
        member.status === 'active' && dapatkanJumlahPinjamanTerlambat(member.id_member) > 0
    );
    
    if (daftarTarget.length === 0) {
        toast('Tidak ada anggota yang perlu dinonaktifkan');
        return;
    }
    
    if (!confirm(`Nonaktifkan ${daftarTarget.length} anggota yang memiliki pinjaman terlambat?`)) return;
    
    let suksesCounter = 0;
    for (const member of daftarTarget) {
        try {
            await apiCall('PUT', `/members/${member.id_member}`, { ...member, status: 'suspended' });
            suksesCounter++;
        } catch (error) {
            console.error(`Gagal menonaktifkan member ID: ${member.id_member}`);
        }
    }
    
    toast(`${suksesCounter} anggota berhasil dinonaktifkan`);
    fetchAndRenderData();
}

// 7. Manajemen Modal Box Form (Tambah / Edit Anggota)
function openMemberModal(memberId) {
    document.getElementById('editMemberId').value = memberId || '';
    
    if (memberId) {
        const memberData = listAllMembers.find(member => member.id_member === memberId);
        if (!memberData) return;

        document.getElementById('modalTitle').textContent = 'Edit Anggota';
        document.getElementById('formName').value = memberData.name;
        document.getElementById('formEmail').value = memberData.email;
        document.getElementById('formPhone').value = memberData.phone || '';
        document.getElementById('formStatus').value = memberData.status;
        document.getElementById('statusField').style.display = 'block';
    } else {
        document.getElementById('modalTitle').textContent = 'Tambah Anggota Baru';
        document.getElementById('formName').value = '';
        document.getElementById('formEmail').value = '';
        document.getElementById('formPhone').value = '';
        document.getElementById('statusField').style.display = 'none';
    }
    
    document.getElementById('memberModal').classList.add('open');
}

function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('open');
}

async function submitMemberForm() {
    const targetId = document.getElementById('editMemberId').value;
    const formBody = {
        name: document.getElementById('formName').value.trim(),
        email: document.getElementById('formEmail').value.trim(),
        phone: document.getElementById('formPhone').value.trim(),
        status: document.getElementById('formStatus').value
    };
    
    if (!formBody.name || !formBody.email) {
        toast('Nama dan Email wajib diisi', 'error');
        return;
    }
    
    try {
        if (targetId) {
            await apiCall('PUT', `/members/${targetId}`, formBody);
            toast('Data anggota berhasil diperbarui!');
        } else {
            await apiCall('POST', '/members', formBody);
            toast('Anggota baru berhasil ditambahkan!');
        }
        closeMemberModal();
        fetchAndRenderData();
    } catch (error) {
        toast(error.message, 'error');
    }
}

// 8. Operasi Menghapus Data Anggota
async function deleteMemberData(memberId) {
    if (!confirm('Apakah Anda yakin ingin menghapus data anggota ini?')) return;
    
    try {
        await apiCall('DELETE', `/members/${memberId}`);
        toast('Data anggota berhasil dihapus');
        fetchAndRenderData();
    } catch (error) {
        toast(error.message, 'error');
    }
}

// Eksekusi pengambilan data saat pertama kali halaman dimuat
fetchAndRenderData();
// Inisialisasi awal
requireAuth();
renderNav('rak');

let listAllRak = [];
let listAllBooks = [];

// 1. Helper LocalStorage untuk simulasi data Rak
const getStoredRak = () => {
    try {
        return JSON.parse(localStorage.getItem('rak_list') || '[]');
    } catch {
        return [];
    }
};

const saveStoredRak = (data) => {
    localStorage.setItem('rak_list', JSON.stringify(data));
};

// 2. Inisialisasi Halaman
async function initializeRakPage() {
    // Tampilkan tombol tambah hanya untuk admin
    if (isAdmin()) {
        const actionContainer = document.getElementById('adminActionsContainer');
        actionContainer.innerHTML = '<button class="btn btn-primary" onclick="openRakModal(null)">+ Tambah Rak</button>';
    }

    try {
        // Ambil data buku dari API untuk menghitung jumlah buku per rak
        const response = await apiCall('GET', '/buku');
        listAllBooks = response.data;
    } catch (error) {
        console.error("Gagal mengambil data buku:", error);
    }

    listAllRak = getStoredRak();
    renderRakGrid();
}

// 3. Render Grid Kartu Rak
function renderRakGrid() {
    const gridContainer = document.getElementById('rakGridContainer');
    
    if (listAllRak.length === 0) {
        const pesanKosong = isAdmin() 
            ? 'Belum ada rak. Silakan klik "+ Tambah Rak".' 
            : 'Belum ada rak tersedia.';
        gridContainer.innerHTML = `<div style="color:var(--text-muted); grid-column:1/-1; padding:16px">${pesanKosong}</div>`;
        return;
    }

    gridContainer.innerHTML = listAllRak.map(rak => {
        // Hitung jumlah buku yang kategorinya sama dengan nama rak
        const bookCount = listAllBooks.filter(book => book.category === rak.name).length;
        
        const adminButtons = isAdmin() ? `
            <div class="rak-actions">
                <button class="btn btn-edit btn-sm" onclick="event.stopPropagation(); openRakModal('${rak.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteRakData('${rak.id}')">Hapus</button>
            </div>` : '';

        return `
            <div class="rak-card" id="card-${rak.id}" onclick="handleShowRakBooks('${rak.id}')">
                ${adminButtons}
                <div class="rak-name">${rak.name}</div>
                <div class="rak-count">${bookCount} buku tersedia</div>
                ${rak.desc ? `<div class="rak-desc">${rak.desc}</div>` : ''}
            </div>`;
    }).join('');
}

// 4. Menampilkan Daftar Buku di Dalam Rak Terpilih
function handleShowRakBooks(rakId) {
    const selectedRak = listAllRak.find(rak => rak.id === rakId);
    if (!selectedRak) return;

    // Update Label & Tampilkan Section
    document.getElementById('activeRakLabel').textContent = selectedRak.name;
    document.getElementById('rakBooksDetailSection').style.display = 'block';

    // Filter buku yang ada di rak ini
    const filteredBooks = listAllBooks.filter(book => book.category === selectedRak.name);
    const tableBody = document.getElementById('rakBooksTableBody');

    if (filteredBooks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Tidak ada buku di rak ini</td></tr>';
    } else {
        tableBody.innerHTML = filteredBooks.map(book => `
            <tr>
                <td><strong>${book.title}</strong></td>
                <td>${book.author}</td>
                <td style="color:var(--text-muted); font-size:.78rem">${book.isbn}</td>
                <td style="color:${book.stock > 0 ? 'var(--green)' : 'var(--red)'}">${book.stock}</td>
            </tr>`).join('');
    }

    // Highlight kartu yang aktif
    document.querySelectorAll('.rak-card').forEach(card => {
        card.classList.toggle('active-rak', card.id === `card-${rakId}`);
    });
}

// 5. Manajemen Modal (Tambah / Edit)
function openRakModal(rakId) {
    if (!isAdmin()) return;

    const modalTitle = document.getElementById('rakModalTitle');
    const inputId = document.getElementById('editRakId');
    const inputName = document.getElementById('formRakName');
    const inputDesc = document.getElementById('formRakDesc');

    inputId.value = rakId || '';

    if (rakId) {
        const rakData = listAllRak.find(r => r.id === rakId);
        modalTitle.textContent = 'Edit Rak';
        inputName.value = rakData.name;
        inputDesc.value = rakData.desc || '';
    } else {
        modalTitle.textContent = 'Tambah Rak Baru';
        inputName.value = '';
        inputDesc.value = '';
    }

    document.getElementById('rakModal').classList.add('open');
}

function closeRakModal() {
    document.getElementById('rakModal').classList.remove('open');
}

// 6. Submit Form Rak
function submitRakForm() {
    const nameValue = document.getElementById('formRakName').value.trim();
    const descValue = document.getElementById('formRakDesc').value.trim();
    const editId = document.getElementById('editRakId').value;

    if (!nameValue) {
        toast('Nama rak wajib diisi', 'error');
        return;
    }

    let tempRakList = getStoredRak();

    if (editId) {
        tempRakList = tempRakList.map(rak => 
            rak.id === editId ? { ...rak, name: nameValue, desc: descValue } : rak
        );
        toast('Rak berhasil diperbarui');
    } else {
        tempRakList.push({
            id: 'rak_' + Date.now(),
            name: nameValue,
            desc: descValue
        });
        toast('Rak baru berhasil ditambahkan');
    }

    saveStoredRak(tempRakList);
    listAllRak = tempRakList;
    
    renderRakGrid();
    closeRakModal();
}

// 7. Hapus Data Rak
function deleteRakData(rakId) {
    if (!confirm('Apakah Anda yakin ingin menghapus rak ini?')) return;

    const updatedList = getStoredRak().filter(rak => rak.id !== rakId);
    saveStoredRak(updatedList);
    listAllRak = updatedList;

    renderRakGrid();
    document.getElementById('rakBooksDetailSection').style.display = 'none';
    toast('Rak berhasil dihapus');
}

// Jalankan inisialisasi
initializeRakPage();
requireAuth();

// Helper fungsi untuk mengecek admin (jaga-jaga jika belum ada di file global)
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    return user.role === 'admin';
}

// Redirect jika admin nyasar ke portal pengguna
if (isAdmin()) {
    window.location.href = '/dashboard/dashboard.html';
}

// Render menu navigasi khusus user
renderNav('beranda_pengguna');

// 2. Tampilkan Nama User
const currentUser = getUser();
const userNameField = document.getElementById('userNameField');
if (userNameField) {
    userNameField.textContent = currentUser.name || 'Pengguna';
}

// 3. Inisialisasi Data Utama
async function initializeDashboardData() {
    try {
        // Ambil data buku
        const response = await apiCall('GET', '/buku');
        const listAllBooks = response.data;
        
        // Ambil data rak (asumsi dari localStorage)
        const listAllRak = JSON.parse(localStorage.getItem('rak_list') || '[]');
        
        // Update statistik di layar
        document.getElementById('statTotalBooks').textContent = listAllBooks.length;
        document.getElementById('statTotalRak').textContent = listAllRak.length;
        document.getElementById('statAvailableBooks').textContent = listAllBooks.filter(book => book.stock > 0).length;
        
        // Render tabel buku terbaru (ambil 8 data pertama)
        renderRecentBooksTable(listAllBooks.slice(0, 8));
        
    } catch (error) {
        // Tampilkan pesan error jika gagal fetch
        if (typeof toast !== 'undefined') {
            toast(error.message, 'error');
        } else {
            console.error('Error:', error.message);
        }
    }
}

// 4. Fungsi Render Tabel
function renderRecentBooksTable(books) {
    const tableBody = document.getElementById('recentBooksTableBody');
    if (!tableBody) return;

    if (!books || books.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada koleksi buku terbaru</td></tr>';
        return;
    }

    tableBody.innerHTML = books.map(book => {
        const subDescription = book.description 
            ? `<div style="font-size: .74rem; color: var(--text-muted)">${book.description}</div>` 
            : '';
        const textCategory = book.category 
            ? `<span style="font-size: .76rem; color: var(--gold)">${book.category}</span>` 
            : '-';
        const textStock = book.stock > 0 
            ? `<span style="color: var(--green)">${book.stock} tersedia</span>` 
            : '<span style="color: var(--red)">Habis</span>';

        return `
            <tr>
                <td><strong>${book.title}</strong>${subDescription}</td>
                <td>${book.author}</td>
                <td>${textCategory}</td>
                <td>${textStock}</td>
            </tr>`;
    }).join('');
}

// Jalankan inisialisasi
initializeDashboardData();
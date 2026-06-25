const BOOKS_API_PATH = '/buku';
let catalogBooks = [];

function initPage() {
    requireAuth();
    renderNav('books');
    
    setupAdminInterface();
    
    populateRakDropdowns();
    fetchAndRenderBooks();
}

function setupAdminInterface() {
    const adminActionsContainer = document.getElementById('adminActions');
    const tableHeaderAction = document.getElementById('aksiHead');
    
    if (isAdmin()) {
        if (adminActionsContainer) {
            adminActionsContainer.innerHTML = `<button class="btn btn-primary" onclick="openBookModal(null)">+ Tambah Buku</button>`;
        }
        if (tableHeaderAction) {
            tableHeaderAction.textContent = 'Aksi';
        }
    }
}

function getRakLocalStorageData() {
    try {
        const localData = localStorage.getItem('rak_list');
        return localData ? JSON.parse(localData) : [];
    } catch (error) {
        console.error("Gagal membaca storage rak_list:", error.message);
        return [];
    }
}

function populateRakDropdowns() {
    const shelfList = getRakLocalStorageData();
    const filterSelect = document.getElementById('filterRak');
    const formSelect = document.getElementById('formRak');

    const optionsHtml = shelfList.map(shelf => `<option value="${shelf.name}">${shelf.name}</option>`).join('');
    
    if (filterSelect) filterSelect.innerHTML = '<option value="">Semua Rak</option>' + optionsHtml;
    if (formSelect) formSelect.innerHTML = '<option value="">-- Pilih Rak --</option>' + optionsHtml;
}

async function fetchAndRenderBooks() {
    try {
        const { data } = await apiCall('GET', BOOKS_API_PATH);
        
        if (!Array.isArray(data)) {
            throw new Error("Format data catalog buku dari server tidak sesuai.");
        }
        
        catalogBooks = data;
        renderBooksTable(catalogBooks);
    } catch (error) {
        toast(error.message, 'error');
    }
}

function renderBooksTable(books) {
    const tableBody = document.getElementById('booksTable');
    if (!tableBody) return;

    if (!books || books.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="icon">📖</div>Belum ada buku</td></tr>`;
        return;
    }

    tableBody.innerHTML = books.map(book => `
        <tr>
            <td>
                <strong>${book.title}</strong>
                ${book.description ? `<div style="font-size:.74rem;color:var(--text-muted)">${book.description}</div>` : ''}
            </td>
            <td>${book.author}</td>
            <td style="color:var(--text-muted);font-size:.78rem;font-family:monospace">${book.isbn}</td>
            <td>${book.category ? `<span style="font-size:.76rem;color:var(--gold)">${book.category}</span>` : '-'}</td>
            <td><span style="color:${book.stock > 0 ? 'var(--green)' : 'var(--red)'};font-weight:500">${book.stock}</span></td>
            <td>${renderAdminRowButtons(book.id_book)}</td>
        </tr>
    `).join('');
}

function renderAdminRowButtons(bookId) {
    if (!isAdmin()) return '';
    return `
        <div style="display:flex;gap:5px">
            <button class="btn btn-edit btn-sm" onclick="openBookModal(${bookId})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteBook(${bookId})">Hapus</button>
        </div>`;
}

function handleFilterBooks() {
    const searchQuery = document.getElementById('searchBook').value.toLowerCase().trim();
    const selectedShelf = document.getElementById('filterRak').value;

    const filteredBooks = catalogBooks.filter(book => {
        const matchesSearch = !searchQuery || (book.title + book.author).toLowerCase().includes(searchQuery);
        const matchesShelf = !selectedShelf || book.category === selectedShelf;
        return matchesSearch && matchesShelf;
    });

    renderBooksTable(filteredBooks);
}

function openBookModal(bookId = null) {
    populateRakDropdowns();
    document.getElementById('editBookId').value = bookId || '';
    
    if (bookId) {
        const currentBook = catalogBooks.find(book => book.id_book === bookId);
        
        if (!currentBook) {
            toast("Data buku tidak ditemukan!", "error");
            return;
        }

        document.getElementById('modalTitle').textContent = 'Edit Buku';
        document.getElementById('formTitle').value = currentBook.title;
        document.getElementById('formAuthor').value = currentBook.author;
        document.getElementById('formIsbn').value = currentBook.isbn;
        document.getElementById('formStock').value = currentBook.stock;
        document.getElementById('formRak').value = currentBook.category || '';
        document.getElementById('formYear').value = currentBook.year || '';
        document.getElementById('formDesc').value = currentBook.description || '';
    } else {
        document.getElementById('modalTitle').textContent = 'Tambah Buku Baru';
        ['formTitle', 'formAuthor', 'formIsbn', 'formYear', 'formDesc'].forEach(fieldId => {
            document.getElementById(fieldId).value = '';
        });
        document.getElementById('formStock').value = '0';
        document.getElementById('formRak').value = '';
    }
    
    document.getElementById('bookModal').classList.add('open');
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('open');
}

async function submitBookForm() {
    const editBookId = document.getElementById('editBookId').value;
    
    const requestBody = {
        title: document.getElementById('formTitle').value.trim(),
        author: document.getElementById('formAuthor').value.trim(),
        isbn: document.getElementById('formIsbn').value.trim(),
        stock: Number(document.getElementById('formStock').value) || 0,
        category: document.getElementById('formRak').value || null,
        year: Number(document.getElementById('formYear').value) || null,
        description: document.getElementById('formDesc').value.trim() || null
    };

    try {
        if (!requestBody.title) throw new Error("Judul buku wajib diisi!");
        if (!requestBody.author) throw new Error("Nama pengarang wajib diisi!");
        if (!requestBody.isbn) throw new Error("Kode buku / ISBN wajib diisi!");
        if (requestBody.stock < 0) throw new Error("Jumlah stok tidak boleh minus!");

        if (editBookId) {
            await apiCall('PUT', `${BOOKS_API_PATH}/${editBookId}`, requestBody);
            toast('Buku berhasil diperbarui!');
        } else {
            await apiCall('POST', BOOKS_API_PATH, requestBody);
            toast('Buku berhasil ditambahkan!');
        }

        closeBookModal();
        fetchAndRenderBooks();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function handleDeleteBook(bookId) {
    if (!bookId) return; 
    
    if (!confirm('Apakah Anda yakin ingin menghapus buku ini?')) return;

    try {
        await apiCall('DELETE', `${BOOKS_API_PATH}/${bookId}`);
        toast('Buku berhasil dihapus');
        fetchAndRenderBooks();
    } catch (error) {
        toast(error.message, 'error');
    }
}

initPage();
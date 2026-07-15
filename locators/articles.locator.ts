export const articlesLocators = {
  nav: {
    link: 'a[href="/articles"]',
  },

  list: {
    table: 'table',
    rows: 'table tbody tr',
    createButton: 'a[href="/articles/create"] button',
    heading: 'h2:has-text("ARTIKEL")',
    searchInput: 'input[placeholder*="Cari judul artikel"]',
    searchButton: 'button:has-text("Cari")',
    filterButton: 'button:has-text("Filter")',
    resetFilterButton: 'button:has-text("Reset")',
    applyFilterButton: 'button:has-text("Terapkan Filter")',
    kebabButton: 'td:last-child button',
    dropdownMenu: {
      editArticle: 'a:has-text("Edit Artikel"), span:has-text("Edit Artikel")',
      deleteArticle: 'button:has-text("Hapus Artikel"), span:has-text("Hapus Artikel")',
    },
    paginationNext: 'button:has-text("Next"), button[aria-label*="next" i]',
    paginationPrev: 'button:has-text("Prev"), button[aria-label*="prev" i]',
  },

  create: {
    heading: 'h1:has-text("BUAT ARTIKEL"), h1:has-text("EDIT ARTIKEL")',
    backLink: 'button:has-text("Kembali")',

    // ── Main Content ──
    snackbarInput: 'input[placeholder="Tambahkan Snackbar"]',
    upperdeckInput: 'input[placeholder="Tulis upperdeck atau judul kecil"]',
    judulTextarea: 'textarea[placeholder="Tulis judul artikel*"]',
    deskripsiTextarea: 'textarea[placeholder="Tulis deskripsi singkat atau lead artikel di sini*"]',
    captionInput: 'input[placeholder="Tulis caption foto*"]',
    poinPenting1: 'input[placeholder="Poin penting 1"]',
    poinPenting2: 'input[placeholder="Poin penting 2"]',
    poinPenting3: 'input[placeholder="Poin penting 3"]',

    // ── File Upload ──
    fileInput: 'input[type="file"][accept="image/*"]',
    uploadArea: 'div:has(> input[type="file"][accept="image/*"]) > div',

    // ── Rich Text Editors ──
    editorContainer: '.slate-editor',

    // ── Right Panel: Tayang Tab ──
    tayangTab: 'button:has-text("Tayang")',
    seoTab: 'button:has-text("SEO")',
    timTab: 'button:has-text("Tim")',

    // ── Tayang Settings ──
    domainSelect: 'select:near(:text("Domain*"))',
    rubrikInput: 'input[placeholder="Pilih Rubrik..."]',
    subRubrikInput: 'input[placeholder="Pilih Sub Rubrik..."]',
    waktuTayangButton: 'button:has-text("Pilih Waktu Tayang")',
    waktuTayangConfirm: 'button:has-text("Confirm")',
    beritaUtamaCheckbox: 'input[type="checkbox"]:near(:text("Jadikan berita utama"))',
    aksesArtikelSelect: 'select:near(:text("Akses Artikel*"))',
    tipeArtikelSelect: 'select:near(:text("Tipe Artikel*"))',
    kategoriInput: 'input[placeholder="Pilih Kategori"]',
    userModelInput: 'input[placeholder="Pilih User Need Model"]',

    // ── SEO Settings ──
    judulSeoInput: 'input[placeholder="Masukkan judul SEO"]',
    permalinkInput: 'input[placeholder="judul-berita-anda"]',
    metaDescriptionTextarea: 'textarea[placeholder="Deskripsi singkat untuk mesin pencari..."]',
    tagInput: 'input[placeholder="Cari dan pilih tag..."]',

    // ── Tim Settings ──
    roleSelect: 'select:near(:text("Role"))',
    namaRedaksiInput: 'input[placeholder="Pilih nama redaksi"]',
    displayAuthorNormal: 'input[name="display_author"][value="normal"]',
    displayAuthorTop: 'input[name="display_author"][value="top"]',
    displayAuthorHidden: 'input[name="display_author"][value="hidden"]',

    // ── Buttons ──
    pengaturanButton: 'button:has-text("Pengaturan")',
    simpanButton: 'button:has-text("Simpan"):not(:has-text("Aksi"))',
    aksiLainnyaButton: 'button:has-text("Aksi Lainnya")',
    tambahArtikelButton: 'button:has-text("Tambah Artikel")',
    previewButton: 'button:has-text("Preview")',
  },

  fileModal: {
    container: '.fixed.inset-0.z-\\[999\\]',
    heading: 'h3:has-text("Pilih Foto")',
    tabTeco: 'button:has-text("Foto Master Teco")',
    tabTM: 'button:has-text("Foto Master TM")',
    imageCards: '.grid.grid-cols-3 > div[class*="cursor-pointer"]',
    selectButton: 'button:has-text("Pilih Foto")',
    cancelButton: 'button:has-text("Batal")',
  },

  confirmModal: {
    confirmButton: 'button:has-text("Simpan"), button:has-text("Ya"), button:has-text("Konfirmasi"), button:has-text("Buat Artikel")',
    cancelButton: 'button:has-text("Batal")',
  },

  deleteModal: {
    confirmButton: 'button:has-text("Hapus")',
    cancelButton: 'button:has-text("Batal")',
  },

  toast: {
    success: '[class*="success"], :has-text("berhasil"), :has-text("success")',
  },

  // ── Autocomplete Dropdown ──
  autocomplete: {
    dropdown: '.absolute.z-50:has(button[type="button"])',
    options: '.absolute.z-50 button[type="button"]',
  },
};

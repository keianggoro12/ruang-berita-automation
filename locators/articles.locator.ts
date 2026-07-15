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
    kebabButton: 'td:last-child button',
    paginationNext: 'button:has-text("Next"), button[aria-label*="next" i]',
    paginationPrev: 'button:has-text("Prev"), button[aria-label*="prev" i]',
    dropdownMenu: {
      editArticle: 'a:has-text("Edit Artikel"), span:has-text("Edit Artikel")',
      deleteArticle: 'button:has-text("Hapus Artikel"), span:has-text("Hapus Artikel")',
    },
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

    // ── Tab Navigation ──
    tayangTab: 'button:has-text("Tayang")',
    seoTab: 'button:has-text("SEO")',
    timTab: 'button:has-text("Tim")',

    // ── Tayang Settings ──
    rubrikInput: 'input[placeholder="Pilih Rubrik..."]',
    subRubrikInput: 'input[placeholder="Pilih Sub Rubrik..."]',
    waktuTayangButton: 'button:has-text("Pilih Waktu Tayang"), button:has-text("WIB")',
    waktuTayangPicker: 'div.absolute.top-full',
    waktuTayangMonthSelect: 'select[aria-label="Month"]',
    waktuTayangDayGrid: 'div.grid button:not([disabled]):not([class*="gray-300"])',
    waktuTayangConfirm: 'button:has-text("Confirm")',
    aksesArtikelSelect: 'label:has-text("Akses Artikel") ~ div select',
    tipeArtikelSelect: 'label:has-text("Tipe Artikel") ~ div select',
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
    simpanButton: 'button:has-text("Simpan"):not(:has-text("Aksi"))',
    submitButton: 'button:has-text("Simpan"):not(:has-text("Aksi"))',
  },

  fileModal: {
    container: '.fixed.inset-0.z-\\[999\\], .fixed.inset-0.z-\\[60\\]',
    heading: 'h3:has-text("Pilih Foto")',
    tabTeco: 'button:has-text("Foto Master Teco")',
    tabTM: 'button:has-text("Foto Master TM")',
    imageCards: '[class*="cursor-pointer"]:has(img)',
    selectButton: 'button:has-text("Pilih Foto")',
    cancelButton: 'button:has-text("Batal"), button:has-text("Tutup"), button:has-text("Close")',
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

  autocomplete: {
    dropdown: '.absolute.z-50:visible',
    options: '.absolute.z-50:visible button[type="button"]',
  },
};

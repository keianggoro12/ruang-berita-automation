export const keranjangMentahLocators = {
  nav: {
    link: 'a[href="/drafts"]',
  },

  list: {
    table: 'table',
    rows: 'table tbody tr',
    createButton: 'a:has-text("Buat Keranjang Mentah")',
    heading: 'h2:has-text("KERANJANG MENTAH")',
    searchInput: 'input[placeholder*="Cari judul"]',
    searchButton: 'button:has-text("Cari")',
    filterButton: 'button:has-text("Filter")',
    resetFilterButton: 'button:has-text("Reset")',
    applyFilterButton: 'button:has-text("Terapkan Filter")',
    detailLink: 'a:has-text("Lihat Detail")',
    kebabButton: 'td:last-child button',
    dropdownMenu: {
      editKeranjangMentah: 'a:has-text("Edit Keranjang Mentah")',
      useKeranjangMentah: 'button:has-text("Gunakan Keranjang Mentah")',
      deleteKeranjangMentah: 'button:has-text("Hapus Keranjang Mentah")',
    },
    paginationNext: 'button:has-text("Next"), button[aria-label*="next" i]',
    paginationPrev: 'button:has-text("Prev"), button[aria-label*="prev" i]',
  },

  detail: {
    heading: 'h1, h2, h3',
  },

  create: {
    heading: 'h1:has-text("Buat Keranjang Mentah"), h1:has-text("EDIT KERANJANG MENTAH")',
    backLink: 'a:has-text("Kembali")',
    submitButton: 'button[type="submit"]:has-text("Simpan")',

    rubrikInput: 'input[placeholder="Pilih Rubrik"]',
    judulInput: 'input[placeholder="Masukkan judul artikel"]',
    deskripsiInput: 'textarea[placeholder="Deskripsi singkat artikel"]',
    isiEditor: '[id^="e-r"]',

    radioPaid: 'input[name="articleType"][value="PAID"]',
    radioFree: 'input[name="articleType"][value="FREE"]',

    usulanInput: 'input[placeholder="Pilih Usulan"]',

    pilihFileButton: 'button:has-text("Pilih File")',

    narasumber: {
      addButton: 'button:has-text("Tambah Narasumber"), button:has-text("Tambah")',
      nameInput: 'input[placeholder*="nama" i]',
      jabatanInput: 'input[placeholder*="jabatan" i]',
      kontakInput: 'input[placeholder*="telepon" i], input[placeholder*="kontak" i], input[placeholder*="no" i]',
    },
  },

  fileModal: {
    container: '.fixed.inset-0.z-\\[999\\]',
    heading: 'h3:has-text("Pilih Foto")',
    tabTeco: 'button:has-text("Foto Master Teco")',
    tabTM: 'button:has-text("Foto Master TM")',
    imageCards: '.grid.grid-cols-3 > div[class*="cursor-pointer"]',
    searchInput: 'input[placeholder="Cari berdasarkan judul"]',
    searchButton: 'button:has-text("Cari")',
    refreshButton: 'button:has-text("Refresh Foto")',
    loadMoreButton: 'button:has-text("Muat Lebih Banyak")',
    selectButton: 'button:has-text("Pilih Foto")',
    cancelButton: 'button:has-text("Batal")',
    closeButton: 'button[aria-label="Tutup modal"]',
  },

  confirmModal: {
    confirmButton: 'button:has-text("Simpan"), button:has-text("Ya"), button:has-text("Konfirmasi")',
    cancelButton: 'button:has-text("Batal")',
  },

  deleteModal: {
    confirmButton: 'button:has-text("Hapus")',
    cancelButton: 'button:has-text("Batal")',
  },

  toast: {
    success: '[class*="success"], :has-text("berhasil"), :has-text("success")',
  },
};

export const keranjangMentahLocators = {
  nav: {
    link: 'a[href="/drafts"]',
  },

  list: {
    table: 'table',
    rows: 'table tbody tr',
    usulanCell: 'td:nth-child(5)',
    heading: 'h2:has-text("KERANJANG MENTAH")',
    createButton: 'button:has-text("Buat Keranjang Mentah"), a:has-text("Buat Keranjang Mentah")',
    searchInput: 'input[placeholder*="Cari judul"]',
    searchButton: 'button:has-text("Cari")',
    emptyState: ':has-text("Tidak ada data"), :has-text("No data"), :has-text("Belum ada")',
    kebabButton: 'td:last-child button',
    detailLink: 'a:has-text("Lihat Detail")',
    paginationNext: 'button:has-text("Next"), button[aria-label*="next" i]',
    paginationPrev: 'button:has-text("Prev"), button[aria-label*="prev" i]',
    dropdownMenu: {
      editKeranjangMentah: 'a:has-text("Edit Keranjang Mentah"), span:has-text("Edit Keranjang Mentah")',
      useKeranjangMentah: 'button:has-text("Gunakan Keranjang Mentah"), span:has-text("Gunakan Keranjang Mentah")',
      deleteKeranjangMentah: 'button:has-text("Hapus Keranjang Mentah"), span:has-text("Hapus Keranjang Mentah")',
    },
  },

  filter: {
    toggleButton: 'button:has-text("Filter"):not(:has-text("Terapkan Filter"))',
    rubrikInput: 'input[placeholder="Pilih rubrik"]',
    createdByInput: 'input[placeholder="Dibuat oleh"]',
    jenisSelect: 'select:has(option[value="FREE"])',
    applyButton: 'button:has-text("Terapkan Filter")',
    resetButton: 'button:has-text("Reset")',
  },

  create: {
    heading: 'h1:has-text("Buat Keranjang Mentah"), h1:has-text("EDIT KERANJANG MENTAH")',
    backLink: 'a:has-text("Kembali")',
    rubrikInput: 'input[placeholder="Pilih Rubrik"]',
    judulInput: 'input[placeholder="Masukkan judul artikel"]',
    deskripsiInput: 'textarea[placeholder="Deskripsi singkat artikel"]',
    isiEditor: '[id^="e-r"]',
    articleTypeRadio: 'input[name="articleType"]',
    usulanInput: 'input[placeholder="Pilih Usulan"]',
    usulanClearIcon: 'svg.lucide-x',
    dropdownOption: 'button.text-left',
    pilihFileButton: 'button:has-text("Pilih File")',
    submitButton: 'button[type="submit"]:has-text("Simpan")',
    narasumber: {
      addButton: 'button:has-text("Tambah Narasumber"), button:has-text("Tambah")',
      nameInput: 'input[placeholder*="nama" i]',
      jabatanInput: 'input[placeholder*="jabatan" i]',
      kontakInput: 'input[placeholder*="telepon" i], input[placeholder*="kontak" i], input[placeholder*="no" i]',
    },
    confirmModal: {
      confirmButton: 'button:has-text("Simpan"), button:has-text("Ya"), button:has-text("Konfirmasi")',
      cancelButton: 'button:has-text("Batal")',
    },
  },

  fileModal: {
    container: '.fixed.inset-0.overflow-y-auto',
    heading: 'h3:has-text("Pilih Foto")',
    tabTeco: 'button:has-text("Foto Master Teco")',
    tabTM: 'button:has-text("Foto Master TM")',
    tabDailymotion: 'button:has-text("Video Dailymotion")',
    imageCards: 'div.cursor-pointer',
    selectedCard: 'div.cursor-pointer.ring-2',
    searchInput: 'input[placeholder="Cari berdasarkan judul"]',
    searchButton: 'button:has-text("Cari")',
    refreshButton: 'button:has-text("Refresh Foto")',
    loadMoreButton: 'button:has-text("Muat Lebih Banyak")',
    selectButton: 'button:has-text("Pilih Foto")',
    cancelButton: 'button:has-text("Batal")',
    closeButton: 'button[aria-label="Tutup modal"]',
  },

  delete: {
    confirmModal: {
      confirmButton: 'button:has-text("Hapus"):not(:has-text("Hapus Keranjang Mentah"))',
      cancelButton: 'button:has-text("Batal")',
    },
  },

  toast: {
    success: '[class*="success"], :has-text("berhasil"), :has-text("success")',
  },
};

export const usulanLocators = {
  nav: {
    link: 'a[href="/proposals"]',
  },

  list: {
    table: 'table',
    rows: 'table tbody tr',
    createButton: 'button:has-text("Buat Usulan"), a:has-text("Buat Usulan")',
    searchInput: 'input[placeholder*="Cari" i]',
    emptyState: ':has-text("Tidak ada data"), :has-text("No data"), :has-text("Belum ada")',
    kebabButton: 'td:last-child button',
    paginationNext: 'button:has-text("Next"), button[aria-label*="next" i]',
    paginationPrev: 'button:has-text("Prev"), button[aria-label*="prev" i]',
    paginationButton: 'button:has-text("1"), button:has-text("2"), button:has-text("3")',
    dropdownMenu: {
      editUsulan: 'a:has-text("Edit Usulan"), span:has-text("Edit Usulan")',
      approveUsulan: 'button:has-text("Setujui Usulan"), span:has-text("Setujui Usulan")',
      deleteUsulan: 'button:has-text("Hapus Usulan"), span:has-text("Hapus Usulan")',
    },
  },

  filter: {
    toggleButton: 'button:has-text("Filter")',
    statusDropdown: 'label:has-text("Status Usulan") + select',
    masaBerlakuDropdown: 'label:has-text("Masa Berlaku") + select',
    applyButton: 'button:has-text("Terapkan Filter")',
    resetButton: 'button:has-text("Reset")',
  },

  delete: {
    confirmModal: {
      confirmButton: 'button:has-text("Hapus"):not(:has-text("Hapus Usulan"))',
      cancelButton: 'button:has-text("Batal")',
    },
  },

  create: {
    heading: 'h1:has-text("BUAT USULAN"), h1:has-text("EDIT USULAN")',
    tanggalButton: 'button:has-text("Pilih tanggal")',
    tanggalEditButton: 'button:has-text("Tanggal Perencanaan Tayang") ~ button, button:has-text("25") ~ button, xpath=//div[contains(text(), "Tanggal Perencanaan Tayang")]/following-sibling::button',
    angleInput: '[placeholder="Tulis angle"]',
    latarBelakangEditor: '[contenteditable="true"]',
    submitButton: 'button:has-text("Submit"):not(:has-text("Approve"))',
    submitAndApproveButton: 'button:has-text("Submit & Approve")',
    narasumber: {
      addButton: 'button:has-text("Tambah Narasumber")',
      nameInput: '[placeholder="Masukkan nama dari narasumber"]',
      jabatanInput: '[placeholder="Masukkan jabatan dari narasumber"]',
      kontakInput: '[placeholder*="no telepon"]',
    },
    confirmModal: {
      confirmButton: 'button:has-text("Buat Usulan"), button:has-text("Buat & Setujui"), button:has-text("Simpan Perubahan"), button:has-text("Simpan & Setujui")',
      cancelButton: 'button:has-text("Batal")',
    },
  },

  edit: {
    heading: 'h1:has-text("EDIT USULAN")',
  },

  toast: {
    success: '[class*="success"], :has-text("berhasil"), :has-text("success")',
  },
};

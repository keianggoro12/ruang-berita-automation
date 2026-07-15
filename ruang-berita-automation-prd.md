PRD - Frontend Automation Testing Ruang Berita

Overview

Dokumen ini menjelaskan kebutuhan automation testing frontend untuk aplikasi Ruang Berita Staging.

Automation akan digunakan untuk melakukan validasi fungsionalitas frontend berdasarkan role dan permission yang tersedia pada sistem.

⸻

Technical Requirements

Automation Framework

* Language: TypeScript
* Automation Framework: Playwright

Automation Principles

Structure

Project harus memiliki struktur yang rapi dan mudah dikembangkan.

Locator, element, function, dan scenario wajib dipisahkan agar:

* Mudah dipelihara
* Mudah ditambahkan test baru
* Mudah melakukan update locator
* Mengurangi duplikasi code

Maintainability

Automation harus:

* Robust terhadap perubahan minor UI
* Mudah diupdate
* Mendukung penambahan test case baru tanpa mengubah struktur utama

Environment Configuration

Environment wajib dipisahkan menggunakan file environment.

Harus tersedia:

* .env
* .env.example

Configuration yang disimpan dalam environment:

* Base URL
* Credential
* Konfigurasi execution lainnya yang diperlukan

Execution

Automation harus mendukung:

* Menjalankan seluruh test
* Menjalankan sebagian test
* Mengatur jumlah pengulangan (run count)

⸻

Scope

Automation ini hanya mencakup:

* Frontend Automation Testing

Tidak mencakup:

* API Automation
* Backend Automation
* Performance Testing

⸻

Test Data

Dummy Data

Semua data dummy harus dibuat secara random.

Requirement:

* Data selalu unik
* Data mengikuti konteks field yang diisi
* Data tidak menggunakan hardcoded value

⸻

Environment

Staging URL

https://staging-ruang-berita.tempo.co/

Access Requirement

Environment hanya dapat diakses apabila:

* Terhubung ke VPN yang telah diizinkan
* IP Address telah masuk whitelist

Jika tidak memenuhi syarat tersebut maka akses akan diblokir oleh Cloudflare.

⸻

Authentication

Login Credential

Reporter

Email:

kei+reporter@gmail.com

Password:

Tempo@12345

⸻

Editor Muda

Email:

kei+editormuda@gmail.com

Password:

Tempo@12345

⸻

Editor Madya

Email:

kei+editormadya@gmail.com

Password:

Tempo@12345

⸻

Editor Senior

Email:

kei+editorsenior@gmail.com

Password:

Tempo@12345

⸻

Fotografer

Email:

kei+fotografer@gmail.com

Password:

Tempo@12345

⸻

Redaktur Bahasa

Email:

kei+redakturbahasa@gmail.com

Password:

Tempo@12345

⸻

Desainer

Email:

kei+desainer@gmail.com

Password:

Tempo@12345

⸻

Prodik

Email:

kei+prodik@gmail.com

Password:

Tempo@12345

⸻

Penulis Luar

Email:

kei+penulisluar@gmail.com

Password:

Tempo@12345

⸻

Super Admin

Email:

rusdiantisuki@gmail.com

Password:

Tempo@12345

⸻

Role & Permission Reference

Reporter

Usulan

* Lihat Usulan (List & Detail)
* Kelola Usulan (Buat, Edit, Hapus)
* Persetujuan Usulan (Setujui)

Keranjang Mentah

* Lihat Keranjang Mentah (List & Detail)
* Kelola Keranjang Mentah (Buat, Edit, Hapus)

Artikel

* Lihat Artikel (List & Detail)
* Kelola Artikel (Buat, Edit, Hapus)

⸻

Editor Muda

Usulan

* Lihat Usulan (List & Detail)
* Kelola Usulan (Buat, Edit, Hapus)
* Persetujuan Usulan (Setujui)

Keranjang Mentah

* Lihat Keranjang Mentah (List & Detail)
* Kelola Keranjang Mentah (Buat, Edit, Hapus)

Artikel

* Lihat Artikel (List & Detail)
* Kelola Artikel (Buat, Edit, Hapus)
* Persetujuan & Tayang (Setujui, Turunkan/Unpublish)
* Cetak Artikel (Status Siap Cetak)

Edisi

* Lihat Edisi (List & Detail)
* Kelola Edisi (Buat, Edit, Hapus, Sortir Artikel Edisi)

⸻

Editor Madya

Usulan

* Lihat Usulan (List & Detail)
* Kelola Usulan (Buat, Edit, Hapus)
* Persetujuan Usulan (Setujui)

Keranjang Mentah

* Lihat Keranjang Mentah (List & Detail)
* Kelola Keranjang Mentah (Buat, Edit, Hapus)

Artikel

* Lihat Artikel (List & Detail)
* Kelola Artikel (Buat, Edit, Hapus)
* Persetujuan & Tayang (Setujui, Turunkan/Unpublish)
* Cetak Artikel (Status Siap Cetak)

Edisi

* Lihat Edisi (List & Detail)
* Kelola Edisi (Buat, Edit, Hapus, Sortir Artikel Edisi)

Homepage Management

* Lihat Konten Homepage
* Kelola & Sortir Homepage

Homepage Rubrik

* Lihat Daftar & Konten Rubrik
* Kelola & Sortir Homepage Rubrik

Master

* Lihat Data Tag/Rubrik/Subrubrik

⸻

Editor Senior

Usulan

* Lihat Usulan (List & Detail)
* Kelola Usulan (Buat, Edit, Hapus)
* Persetujuan Usulan (Setujui)

Keranjang Mentah

* Lihat Keranjang Mentah (List & Detail)
* Kelola Keranjang Mentah (Buat, Edit, Hapus)

Artikel

* Lihat Artikel (List & Detail)
* Kelola Artikel (Buat, Edit, Hapus)
* Persetujuan & Tayang (Setujui, Turunkan/Unpublish)
* Cetak Artikel (Status Siap Cetak)

Edisi

* Lihat Edisi (List & Detail)
* Kelola Edisi (Buat, Edit, Hapus, Sortir Artikel Edisi)

Homepage Management

* Lihat Konten Homepage
* Kelola & Sortir Homepage

Homepage Rubrik

* Lihat Daftar & Konten Rubrik
* Kelola & Sortir Homepage Rubrik

Master

* Lihat Data
* Kelola Data

User

* Lihat User
* Kelola User

⸻

Fotografer

Artikel

* Lihat Artikel (List & Detail)
* Kelola Artikel (Buat, Edit, Hapus)

Edisi

* Lihat Edisi (List & Detail)

⸻

Redaktur Bahasa

Usulan

* Lihat Usulan (List & Detail)

Keranjang Mentah

* Lihat Keranjang Mentah (List & Detail)

Artikel

* Lihat Artikel (List & Detail)
* Kelola Artikel (Buat, Edit)
* Cetak Artikel

Edisi

* Lihat Edisi (List & Detail)
* Kelola Edisi (Buat, Edit, Hapus, Sortir Artikel Edisi)

⸻

Desainer

Usulan

* Lihat Usulan (List & Detail)

Keranjang Mentah

* Lihat Keranjang Mentah (List & Detail)

Artikel

* Lihat Artikel (List & Detail)
* Kelola Artikel (Buat, Edit)
* Cetak Artikel

Edisi

* Lihat Edisi (List & Detail)
* Kelola Edisi (Buat, Edit, Hapus, Sortir Artikel Edisi)

⸻

Superadmin

* All Menu
* All Permission

⸻

Prodik

Artikel

* Lihat Artikel (List & Detail)
* Kelola Artikel (Buat, Edit, Hapus)
* Persetujuan & Tayang (Setujui, Turunkan/Unpublish)

Master

* Lihat Data
* Kelola Data

⸻

Penulis Luar

Artikel

* Lihat Artikel (List & Detail)

⸻

Phase 1

Module

Usulan

Objective

Melakukan automation testing terhadap fitur Usulan.

Test Coverage

Access Usulan Page

Melakukan validasi:

* User dapat mengakses halaman Usulan sesuai permission role
* User yang tidak memiliki akses tidak dapat mengakses halaman Usulan

Create Usulan

Melakukan validasi:

* User dapat membuat Usulan
* Data tersimpan dengan benar
* Data tampil pada list Usulan

Edit Usulan

Melakukan validasi:

* User dapat mengubah data Usulan
* Perubahan tersimpan dengan benar
* Perubahan tampil pada list dan detail

Usulan List Verification

Melakukan validasi:

* Data tampil pada list
* Pencarian (search) berjalan dengan benar
* Filter berjalan dengan benar
* Hasil list sesuai dengan filter yang digunakan
# Ruang Berita Automation — Automation Newsroom

Automation testing **Playwright** untuk halaman staging Ruang Berita, dilengkapi
**Automation Newsroom**: sebuah UI lokal untuk menjalankan test per-kasus secara
visual — dengan log live, screenshot tiap langkah, rekaman video, artifact, dan
laporan PDF.

- **Staging target:** https://staging-ruang-berita.tempo.co/
- **Modul test:** Login, Articles, Keranjang Mentah, Usulan

---

## ⚡ Quick Start (1 perintah)

Yang dibutuhkan hanya **Node.js 18+** (dan `git`). Sisanya otomatis.

```bash
git clone https://github.com/keianggoro12/ruang-berita-automation.git
cd ruang-berita-automation
npm start
```

`npm start` akan:
1. Membuat `.env` dari `.env.example` bila belum ada.
2. Meng-install semua dependency (root, backend runner, UI) + browser Chromium.
3. Menjalankan backend runner (port `3001`) dan UI (port `5173`).
4. **Otomatis membuka browser** ke <http://localhost:5173>.

> Ingin menyiapkan tanpa menjalankan? `npm run setup`.

### Pengguna macOS — shortcut klik-ganda

Setelah clone, kamu cukup **double-click file `start.command`** di Finder.
Terminal akan terbuka dan Automation Newsroom langsung menyala di browser.

Windows: jalankan `npm start` dari PowerShell/Git Bash.
Linux: jalankan `npm start` (pastikan `xdg-open` ada agar browser otomatis terbuka).

---

## 🖥️ Menggunakan Automation Newsroom

1. Buka <http://localhost:5173> (terbuka otomatis).
2. Pilih test dari daftar di sidebar (mis. `usulan › 04-delete-usulan`).
3. Klik **Run** untuk menjalankan satu kasus, atau **Run All** untuk semua.
4. Pantau hasilnya melalui tab:
   - **Logs** — output step-by-step secara live (warna + auto-scroll).
   - **Steps** — screenshot tiap langkah, dikelompokkan per test.
   - **Video** — rekaman video tiap test (playlist).
   - **Artifacts** — file hasil test (trace, screenshot, dll).
   - **Report** — ringkasan pass/fail + tombol **Download PDF**.
5. Tombol **Stop** untuk menghentikan run, **Clear** untuk mereset hasil.

Menutup tab browser **tidak** menghentikan run — saat dibuka lagi, progress akan
dipulihkan otomatis (state disiarkan ulang oleh server).

---

## 🧰 Menjalankan Test via CLI

```bash
npm test                     # semua test
npm run test:usulan          # hanya modul Usulan
npm run test:keranjang-mentah
npx playwright test tests/usulan/04-delete-usulan.spec.ts   # satu kasus
npm run test:headed          # dengan browser terlihat
npm run test:debug           # Playwright Inspector
npm run report               # buka HTML report
npm run typecheck            # cek TypeScript
```

---

## ⚙️ Konfigurasi `.env`

File `.env` dibuat otomatis dari `.env.example`. Sesuaikan bila perlu:

| Variabel | Keterangan |
| --- | --- |
| `BASE_URL` | URL staging yang diuji |
| `<ROLE>_EMAIL` / `<ROLE>_PASSWORD` | Kredensial tiap role (reporter, editor muda, editor madya, editor senior, fotografer, redaktur bahasa, desainer, prodik, penulis luar, super admin) |
| `GEMINI_API_KEY` | API key Gemini untuk generate data usulan (opsional — ada fallback data dummy) |
| `GEMINI_TOPIC` | Tema untuk generator data AI |
| `RUN_COUNT` | Berapa kali test dijalankan |

> **`.env` tidak ikut ter-commit** (sudah masuk `.gitignore`). Jangan pernah
> commit kredensial asli.

---

## 📁 Struktur Project

```
ruang-berita-automation/
├── tests/                  # Spec Playwright (per modul)
│   ├── login/
│   ├── articles/
│   ├── keranjang-mentah/
│   └── usulan/
├── pages/                  # Page Object Model (POM)
├── locators/               # Selector terpusat
├── helpers/                # Fungsi bantu alur (auth, usulan)
├── fixtures/               # Data & role fixture
├── reporters/
│   └── step-reporter.ts    # Reporter custom → marker [STEP]/[TEST-*]
├── utils/                  # Util (timeout, snap, data-generator, ai-generator)
├── playwright.config.ts    # Konfigurasi Playwright (testDir: ./tests)
├── playwright-ui/          # Backend runner (Express + Socket.io, port 3001)
├── playwright-ui-react/    # UI Automation Newsroom (Vite + React, port 5173)
├── setup.sh                # Install dependency (dipanggil oleh start.sh)
├── start.sh                # 1-perintah: setup + jalankan + buka browser
├── start.command           # Shortcut klik-ganda untuk macOS
└── .env.example            # Template konfigurasi
```

Arsitektur saat menjalankan:

```
Browser  ──►  UI (Vite, :5173)  ──proxy /api,/results,/report,/videos──►  Runner (Express, :3001)
     ▲                                                                        │
     └──────────────────── Socket.io (log, status, artifacts) ◄──────────────┘
                                                                              │
                                                                    npx playwright test
```

---

## 🔒 Catatan Akses Jaringan

Staging berada di belakang **Cloudflare** dengan **whitelist IP**. Tanpa VPN /
IP yang diizinkan, login akan gagal dengan pesan *"Sorry, you have been blocked"*.
Pastikan jaringan kamu sudah diizinkan sebelum menjalankan test.

---

## 🩺 Troubleshooting

| Masalah | Solusi |
| --- | --- |
| **Port sudah dipakai** (`3001`/`5173`) | `start.sh` otomatis membebaskan port. Manual: `lsof -ti:5173 \| xargs kill -9` |
| **Browser belum terpasang** | `npx playwright install chromium` |
| **Login gagal / diblokir** | Nyalakan VPN & pastikan IP di-whitelist |
| **Video tidak jalan di Safari** | Install `ffmpeg` (`brew install ffmpeg`) untuk konversi webm → mp4 |
| **Login gagal sekali di awal** | Coba jalankan ulang — kadang gagal transien setelah cold start |
| **UI kosong / tidak terhubung** | Pastikan backend `:3001` jalan; cek terminal yang menjalankan `npm start` |
| **Test AI sering fallback** | Gemini kadang 503/429 — otomatis memakai data dummy (tidak masalah) |

---

## 📦 Kebutuhan Sistem

- **Node.js 18+** dan npm
- **git**
- **ffmpeg** (opsional — hanya untuk konversi video agar diputar di Safari)
- **VPN / IP whitelist** untuk mengakses staging

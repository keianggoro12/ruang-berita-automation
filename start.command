#!/usr/bin/env bash
#
# start.command — Klik-ganda (double-click) file ini di Finder untuk
# menjalankan Automation Newsroom tanpa perlu mengetik perintah.
#

cd "$(dirname "$0")"

# Auto-update: pull latest from GitHub
echo "🔄 Mengecek update terbaru dari GitHub..."
if command -v git >/dev/null 2>&1; then
  # Cek apakah ada perubahan lokal yang belum di-commit
  if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Ada perubahan lokal yang belum di-commit. Melewati auto-pull untuk menghindari konflik."
    echo "   Silakan commit/stash terlebih dahulu jika ingin update otomatis."
    echo ""
  else
    # Ambil dan pull update terbaru
    git fetch --quiet
    if git pull --ff-only --quiet 2>/dev/null; then
      echo "✅ Berhasil update ke versi terbaru."
      echo ""
    else
      echo "ℹ️  Sudah menggunakan versi terbaru atau gagal pull. Melanjutkan..."
      echo ""
    fi
  fi
else
  echo "⚠️  Git tidak ditemukan. Melewati auto-update."
  echo ""
fi

exec bash ./start.sh

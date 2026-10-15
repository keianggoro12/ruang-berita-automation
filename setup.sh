#!/usr/bin/env bash
#
# setup.sh — Siapkan semua dependency yang dibutuhkan Automation Newsroom.
# Aman dijalankan berulang kali (idempotent).
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

info() { printf "\033[1;36m▶ %s\033[0m\n" "$1"; }
ok()   { printf "\033[1;32m✔ %s\033[0m\n" "$1"; }
err()  { printf "\033[1;31m✘ %s\033[0m\n" "$1" >&2; }

if ! command -v node >/dev/null 2>&1; then
  err "Node.js belum terpasang. Install Node.js 18+ dulu (https://nodejs.org)."
  exit 1
fi
info "Node $(node -v) / npm $(npm -v)"

if [ ! -f .env ]; then
  cp .env.example .env
  ok "Membuat .env dari .env.example (sesuaikan kredensial bila perlu)."
else
  ok ".env sudah ada."
fi

info "Install dependency root (Playwright, faker)..."
[ -d node_modules ] || npm install

info "Install dependency backend runner (playwright-ui)..."
[ -d playwright-ui/node_modules ] || npm --prefix playwright-ui install

info "Install dependency UI (playwright-ui-react)..."
[ -d playwright-ui-react/node_modules ] || npm --prefix playwright-ui-react install

info "Install browser Playwright (chromium)..."
npx playwright install chromium

ok "Setup selesai. Jalankan Automation Newsroom dengan: npm start"

#!/usr/bin/env bash
#
# start.sh — Shortcut 1-perintah untuk Automation Newsroom.
# Melakukan setup bila perlu, lalu menjalankan backend runner + UI,
# dan otomatis membuka browser ke http://localhost:5173
#
# Set NO_OPEN=1 untuk tidak membuka browser (mis. di CI).
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

info() { printf "\033[1;36m▶ %s\033[0m\n" "$1"; }
ok()   { printf "\033[1;32m✔ %s\033[0m\n" "$1"; }

SERVER_PORT=3001
UI_PORT=5173
URL="http://localhost:${UI_PORT}"

# 1. Pastikan semua dependency & browser siap.
bash "$ROOT/setup.sh"

# 2. Bebaskan port bila masih dipakai proses lama.
free_port() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti:"$1" 2>/dev/null | xargs kill -9 2>/dev/null || true
  fi
}
free_port "$SERVER_PORT"
free_port "$UI_PORT"

# 3. Jalankan backend runner (Express + Socket.io).
info "Menjalankan backend runner di port ${SERVER_PORT}..."
npm --prefix playwright-ui start &
SERVER_PID=$!

# 4. Jalankan UI (Vite + React).
info "Menjalankan UI di port ${UI_PORT}..."
npm --prefix playwright-ui-react run dev &
VITE_PID=$!

cleanup() {
  kill "$SERVER_PID" "$VITE_PID" 2>/dev/null || true
  wait "$SERVER_PID" "$VITE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 5. Tunggu UI siap.
info "Menunggu UI siap di ${URL} ..."
i=0
while [ "$i" -lt 120 ]; do
  if curl -sf "$URL" >/dev/null 2>&1; then break; fi
  i=$((i + 1))
  sleep 0.5
done
ok "Automation Newsroom siap: ${URL}"

# 6. Buka browser.
if [ "${NO_OPEN:-0}" != "1" ]; then
  if command -v open >/dev/null 2>&1; then
    open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
  fi
fi

info "Tekan Ctrl+C untuk menghentikan."
wait

@echo off
setlocal enabledelayedexpansion
title Automation Newsroom

cd /d "%~dp0"

echo ==========================================================
echo   Automation Newsroom - Ruang Berita (Windows)
echo ==========================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js belum terpasang.
  echo     Install Node.js 18+ dulu dari https://nodejs.org
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo [i] Node %%v
echo.

REM --- 1. Siapkan file .env (otomatis, tidak perlu diisi manual) ---
if not exist ".env" (
  if exist ".env.example" (
    copy /y ".env.example" ".env" >nul
    echo [+] .env dibuat dari .env.example
  ) else (
    echo [!] .env.example tidak ditemukan - lewati pembuatan .env
  )
) else (
  echo [i] .env sudah ada
)
echo.

REM --- 2. Install dependency yang belum ada ---
if not exist "node_modules" (
  echo [i] Install dependency root...
  call npm install || goto error
)
if not exist "playwright-ui\node_modules" (
  echo [i] Install dependency backend runner...
  call npm --prefix playwright-ui install || goto error
)
if not exist "playwright-ui-react\node_modules" (
  echo [i] Install dependency UI...
  call npm --prefix playwright-ui-react install || goto error
)

echo [i] Memastikan browser Playwright (chromium) terpasang...
call npx playwright install chromium || goto error
echo.

REM --- 3. Jalankan backend + UI di jendela terpisah ---
echo [i] Menjalankan backend runner (port 3001)...
start "Automation Newsroom - Runner" cmd /k "npm --prefix playwright-ui start"
echo [i] Menjalankan UI (port 5173)...
start "Automation Newsroom - UI" cmd /k "npm --prefix playwright-ui-react run dev"
echo.

REM --- 4. Tunggu UI siap lalu buka browser ---
echo [i] Menunggu UI siap di http://localhost:5173 ...
where curl >nul 2>nul
if errorlevel 1 (
  timeout /t 8 /nobreak >nul
  goto ready
)
set /a tries=0
:waitloop
timeout /t 1 /nobreak >nul
curl -sf http://localhost:5173 >nul 2>nul && goto ready
set /a tries+=1
if !tries! lss 120 goto waitloop

:ready
start "" http://localhost:5173
echo.
echo [+] Automation Newsroom siap: http://localhost:5173
echo [i] Tutup jendela "Runner" dan "UI" untuk menghentikan.
echo.
pause
exit /b 0

:error
echo.
echo [X] Terjadi kesalahan saat setup. Lihat pesan di atas.
pause
exit /b 1

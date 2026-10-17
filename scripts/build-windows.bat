@echo off
chcp 65001 >nul
setlocal
title Telefon - Windows Derleme

echo ============================================================
echo   Telefon - Windows .exe derleyici
echo   (bir kez kurulur, sonra sadece cift tikla)
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi.
  echo   Kurun: https://nodejs.org  ^(LTS surumu yeterli^)
  echo   Kurulumdan sonra bu dosyayi tekrar calistirin.
  echo.
  pause
  exit /b 1
)

echo [1/3] Bagimliliklar yukleniyor (npm install - ilk seferde 2-5 dk)...
call npm install --no-audit --no-fund
if errorlevel 1 goto :hata

echo.
echo [2/3] Native veritabani modulu Electron icin derleniyor (better-sqlite3)...
call npm run rebuild:native
if errorlevel 1 (
  echo.
  echo [HATA] Native modul derlenemedi. Su ikisi kurulu olmali:
  echo   - Visual Studio Build Tools ^(C++ is yuku^): https://visualstudio.microsoft.com/visual-cpp-build-tools
  echo   - Python 3: https://www.python.org
  echo   Kurup bilgisayari yeniden baslattiktan sonra bu dosyayi tekrar calistirin.
  goto :hata
)

echo.
echo [3/3] Windows kurulumcusu uretiliyor (dist:win)...
call npm run dist:win
if errorlevel 1 goto :hata

echo.
echo ============================================================
echo   BASARILI!
echo   Kurulumcu dosyasi:  release\telefon-0.1.0-setup.exe
echo   Buna cift tiklayip kurun (Windows "bilinmeyen yayinci"
echo   uyarisi verirse: More info -^> Run anyway).
echo ============================================================
echo.
pause
exit /b 0

:hata
echo.
echo [HATA] Derleme basarisiz oldu. Yukaridaki hata ciktisini kontrol edin.
echo.
pause
exit /b 1

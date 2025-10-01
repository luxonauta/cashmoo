@echo off
setlocal enabledelayedexpansion

set SOURCE_IMAGE=assets/source-icon.png
set ASSETS_DIR=assets
set TEMP_DIR=temp_iconset

if not exist "%SOURCE_IMAGE%" (
  echo Error: Source image '%SOURCE_IMAGE%' not found!
  echo Please place a source-icon.png file (at least 1024x1024px) in the project root.
  exit /b 1
)

where magick >nul 2>nul
if %errorlevel% neq 0 (
  echo Error: ImageMagick is not installed!
  echo.
  echo Installation instructions:
  echo   1. Download from: https://imagemagick.org/script/download.php
  echo   2. Install ImageMagick (use default options)
  echo   3. Make sure to check "Add application directory to system path" during installation
  echo   4. Restart your command prompt after installation
  exit /b 1
)

if not exist "%ASSETS_DIR%" mkdir "%ASSETS_DIR%"

echo Generating icons from %SOURCE_IMAGE%...
echo.

echo 1. Generating Windows icon (icon.ico)...
magick "%SOURCE_IMAGE%" -resize 256x256 ^
  ( -clone 0 -resize 16x16 ) ^
  ( -clone 0 -resize 32x32 ) ^
  ( -clone 0 -resize 48x48 ) ^
  ( -clone 0 -resize 64x64 ) ^
  ( -clone 0 -resize 128x128 ) ^
  ( -clone 0 -resize 256x256 ) ^
  -delete 0 -colors 256 "%ASSETS_DIR%\icon.ico"
echo    ✓ Windows icon created: %ASSETS_DIR%\icon.ico
echo.

echo 2. Generating Linux icon (icon.png)...
magick "%SOURCE_IMAGE%" -resize 512x512 "%ASSETS_DIR%\icon.png"
echo    ✓ Linux icon created: %ASSETS_DIR%\icon.png
echo.

echo 3. Generating macOS icon (icon.icns)...
echo    → .icns generation requires macOS with iconutil
echo    → Use an online converter: https://cloudconvert.com/png-to-icns
echo    → Or run generate-icons.sh on macOS
echo.

echo ==========================================
echo Icon generation complete!
echo ==========================================
echo.
echo Generated files in '%ASSETS_DIR%':
dir /b "%ASSETS_DIR%\icon.*"
echo.
echo Next steps:
echo   1. Verify the icons look correct
echo   2. For macOS icon, use online converter or macOS system
echo   3. Run: npm start
echo.

pause
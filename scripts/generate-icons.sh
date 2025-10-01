#!/bin/bash

SOURCE_IMAGE="assets/source-icon.png"
ASSETS_DIR="assets"
TEMP_DIR="temp_iconset"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: Source image '$SOURCE_IMAGE' not found!"
  echo "Please place a source-icon.png file (at least 1024x1024px) in the project root."
  exit 1
fi

if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
  echo "Error: ImageMagick is not installed!"
  echo ""
  echo "Installation instructions:"
  echo "  macOS:   brew install imagemagick"
  echo "  Linux:   sudo apt-get install imagemagick"
  echo "  Windows: Download from https://imagemagick.org/script/download.php"
  exit 1
fi

MAGICK_CMD="magick"
if ! command -v magick &> /dev/null; then
  MAGICK_CMD="convert"
fi

mkdir -p "$ASSETS_DIR"

echo "Generating icons from $SOURCE_IMAGE..."
echo ""

echo "1. Generating Windows icon (icon.ico)..."
$MAGICK_CMD "$SOURCE_IMAGE" -resize 256x256 \
  \( -clone 0 -resize 16x16 \) \
  \( -clone 0 -resize 32x32 \) \
  \( -clone 0 -resize 48x48 \) \
  \( -clone 0 -resize 64x64 \) \
  \( -clone 0 -resize 128x128 \) \
  \( -clone 0 -resize 256x256 \) \
  -delete 0 -colors 256 "$ASSETS_DIR/icon.ico"
echo "   ✓ Windows icon created: $ASSETS_DIR/icon.ico"
echo ""

echo "2. Generating Linux icon (icon.png)..."
$MAGICK_CMD "$SOURCE_IMAGE" -resize 512x512 "$ASSETS_DIR/icon.png"
echo "   ✓ Linux icon created: $ASSETS_DIR/icon.png"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "3. Generating macOS icon (icon.icns)..."
  
  mkdir -p "$TEMP_DIR"
  
  sips -z 16 16     "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_16x16.png" > /dev/null 2>&1
  sips -z 32 32     "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_16x16@2x.png" > /dev/null 2>&1
  sips -z 32 32     "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_32x32.png" > /dev/null 2>&1
  sips -z 64 64     "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_32x32@2x.png" > /dev/null 2>&1
  sips -z 128 128   "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_128x128.png" > /dev/null 2>&1
  sips -z 256 256   "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_128x128@2x.png" > /dev/null 2>&1
  sips -z 256 256   "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_256x256.png" > /dev/null 2>&1
  sips -z 512 512   "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_256x256@2x.png" > /dev/null 2>&1
  sips -z 512 512   "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_512x512.png" > /dev/null 2>&1
  sips -z 1024 1024 "$SOURCE_IMAGE" --out "$TEMP_DIR/icon_512x512@2x.png" > /dev/null 2>&1
  
  iconutil -c icns "$TEMP_DIR" -o "$ASSETS_DIR/icon.icns"
  
  rm -rf "$TEMP_DIR"
  
  echo "   ✓ macOS icon created: $ASSETS_DIR/icon.icns"
else
  echo "3. Skipping macOS icon (icon.icns) - only available on macOS"
  echo "   → To generate .icns file, run this script on macOS"
  echo "   → Or use an online converter: https://cloudconvert.com/png-to-icns"
fi

echo ""
echo "=========================================="
echo "Icon generation complete!"
echo "=========================================="
echo ""
echo "Generated files in '$ASSETS_DIR/':"
ls -lh "$ASSETS_DIR"/icon.*
echo ""
echo "Next steps:"
echo "  1. Verify the icons look correct"
echo "  2. Run: npm start"
echo ""
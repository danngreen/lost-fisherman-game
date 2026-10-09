#!/bin/bash
# Builds "The Lost Fisherman.app" (universal: Intel + Apple Silicon, macOS 12+)
set -euo pipefail
cd "$(dirname "$0")"
NAME="The Lost Fisherman"
APP="build/$NAME.app"
rm -rf build
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" build/tmp

echo "Compiling..."
for ARCH in x86_64 arm64; do
  swiftc -O -swift-version 5 -target "$ARCH-apple-macos12.0" \
    -framework Cocoa -framework WebKit \
    mac/main.swift -o "build/tmp/LostFisherman-$ARCH"
done
lipo -create build/tmp/LostFisherman-x86_64 build/tmp/LostFisherman-arm64 -output "$APP/Contents/MacOS/LostFisherman"

echo "Bundling..."
cp mac/Info.plist "$APP/Contents/Info.plist"
cp -R game "$APP/Contents/Resources/game"

echo "Icon..."
ICONSET=build/tmp/AppIcon.iconset
mkdir -p "$ICONSET"
python3 mac/make_icon.py build/tmp/icon1024.png
for SZ in 16 32 128 256 512; do
  sips -z $SZ $SZ build/tmp/icon1024.png --out "$ICONSET/icon_${SZ}x${SZ}.png" >/dev/null
  D=$((SZ * 2))
  sips -z $D $D build/tmp/icon1024.png --out "$ICONSET/icon_${SZ}x${SZ}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

echo "Signing (ad-hoc)..."
codesign --force --deep --sign - "$APP"

echo "Zipping for AirDrop..."
ditto -c -k --sequesterRsrc --keepParent "$APP" "build/$NAME.zip"
rm -rf build/tmp
echo "Done: $APP"
lipo -info "$APP/Contents/MacOS/LostFisherman"

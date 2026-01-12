#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building web bundle for mac..."
npm run build:mac

echo "Building macOS app..."
xcodebuild -project macos/NeuroMarkMac.xcodeproj \
  -scheme NeuroMarkMac \
  -configuration Release \
  -derivedDataPath macos/DerivedData \
  build

APP_DIR="$ROOT_DIR/macos/DerivedData/Build/Products/Release"
APP_PATH="$APP_DIR/NeuroMarkMac.app"

if [[ ! -d "$APP_PATH" ]]; then
  echo "NeuroMarkMac.app not found at $APP_PATH"
  exit 1
fi

DMG_DIR="$ROOT_DIR/macos/Build"
DMG_PATH="$DMG_DIR/NeuroMarkMac.dmg"
mkdir -p "$DMG_DIR"

echo "Creating DMG..."
hdiutil create -volname "NeuroMark" -srcfolder "$APP_PATH" -ov -format UDZO "$DMG_PATH"

echo "DMG created at $DMG_PATH"

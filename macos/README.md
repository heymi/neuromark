# NeuroMark macOS (SwiftUI Shell)

This folder contains the SwiftUI shell that hosts the existing web app via `WKWebView`.
The goal is a Craft-style macOS UI with a native sidebar + unified toolbar.

## How to build (Xcode 26, macOS 26)
1) Build the web app for mac:
   - `VITE_TARGET=mac npm run build`
2) Copy `dist/` into `macos/Resources/dist/`
3) Open the Xcode project once it exists (see below), run `NeuroMarkMac`.

## Project generation
This repo stores sources and an `xcodegen.yml` so you can generate the `.xcodeproj`.
If you already have XcodeGen:
```
cd macos
xcodegen generate
```

## DMG workflow (outline)
1) Build web: `VITE_TARGET=mac npm run build`
2) Copy `dist/` → `macos/Resources/dist/`
3) Build archive in Xcode (Release)
4) Export `.app`, then create a DMG with your preferred tool

## Notes
- The sidebar and toolbar are native SwiftUI.
- The main content is still the React app inside `WKWebView`.
- A JS bridge stub exists for app ↔ web communication.

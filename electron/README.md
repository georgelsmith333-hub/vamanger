# VA Manager — Desktop App (Electron)

This folder contains a thin Electron wrapper that turns the hosted VA Manager web app into a native Windows / macOS / Linux desktop application.

> The wrapper points at your live URL (Render or Cloudflare). It does **not** bundle the web app — that means every desktop release automatically picks up the latest UI without needing a re-release.

## Prerequisites

* Node.js 20+
* On Windows, building a Windows installer also works on macOS/Linux (electron-builder cross-compiles).
* On macOS, an Apple Developer ID for signing (optional for personal use, required for App Store).
* On Linux, no extras — AppImage runs everywhere.

## 1. Install dependencies

```bash
cd electron
npm install
```

(We use plain `npm install` here because the desktop app is a separate workspace from the pnpm monorepo.)

## 2. Run in development

This launches Electron pointing at your hosted URL:

```bash
npm start
```

To point at a different environment temporarily:

```bash
VA_MANAGER_URL=https://staging.example.com npm start
```

## 3. Build native installers

| Platform | Command | Output |
|----------|---------|--------|
| Windows  | `npm run build:win`   | `dist/VA Manager Setup x.x.x.exe` |
| macOS    | `npm run build:mac`   | `dist/VA Manager-x.x.x.dmg` (Intel + Apple Silicon) |
| Linux    | `npm run build:linux` | `dist/VA Manager-x.x.x.AppImage` |

To build all three at once: `npm run build`.

## 4. Where to put the binaries

Copy the produced files into `artifacts/va-dashboard/public/downloads/` (create the folder if needed) so the `/download` page links resolve:

```
artifacts/va-dashboard/public/downloads/
  VA-Manager-Setup.exe
  VA-Manager.dmg
  VA-Manager.AppImage
```

Rename the build outputs to those exact filenames before copying.

## 5. Auto-update (optional)

If you want auto-updates, add `electron-updater` and host the release artifacts on GitHub Releases or S3. See https://www.electron.build/auto-update for the standard config.

## 6. Code signing (recommended)

* **Windows** — get an OV/EV code signing certificate from a CA (DigiCert, Sectigo, etc.). Set `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD` env vars before `npm run build:win`.
* **macOS** — set `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` env vars. electron-builder will sign and notarize automatically.
* **Linux** — AppImage does not need signing.

## 7. Set the production URL

The app loads `VA_MANAGER_URL` at runtime. Set it to your final domain before building:

```bash
VA_MANAGER_URL=https://app.yourdomain.com npm run build
```

If you do not set it, it defaults to `https://va-manager.onrender.com`.

## Troubleshooting

* **Blank window** — your URL is not reachable. Try opening it in Chrome first.
* **Login pops a new browser window and never returns** — Google OAuth uses pop-ups. Verify the OAuth client has `https://app.yourdomain.com` in Authorized JavaScript origins.
* **macOS "App is damaged"** — the build is unsigned. Either sign it (Step 6) or right-click → Open the first time.

# Building VA Manager as Native Mobile Apps (Capacitor)

This guide explains how to wrap the VA Manager web build into a native Android `.apk` and iOS `.ipa` using [Capacitor](https://capacitorjs.com).

> The configuration file (`capacitor.config.ts`) is already in place. The steps below are run from your local machine — Replit cannot sign or build mobile binaries directly.

## Prerequisites

| Platform | What you need |
|----------|---------------|
| Android  | Android Studio (latest), JDK 17, Android SDK 34, an emulator or a real device |
| iOS      | macOS, Xcode 15+, an Apple Developer account ($99/yr) |

## 1. Install Capacitor packages locally

```bash
cd artifacts/va-dashboard
pnpm add -D @capacitor/cli
pnpm add @capacitor/core @capacitor/android @capacitor/ios @capacitor/splash-screen @capacitor/status-bar
```

## 2. Build the web bundle

```bash
PORT=5173 BASE_PATH=/ pnpm build
```

This produces `dist/public/` which Capacitor will wrap.

## 3. Add the native projects (one-time)

```bash
npx cap add android
npx cap add ios          # macOS only
```

This creates `android/` and `ios/` folders next to `capacitor.config.ts`.

## 4. Sync your latest web build into the native projects

Run after every web change:

```bash
PORT=5173 BASE_PATH=/ pnpm build && npx cap sync
```

## 5. Open in the native IDE

```bash
npx cap open android   # Android Studio
npx cap open ios       # Xcode
```

### Android — produce the .apk

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
The signed/unsigned APK lands in `android/app/build/outputs/apk/`.

For a production-signed APK:
1. **Build → Generate Signed Bundle / APK → APK**
2. Create or pick a keystore, fill release info, tick **release** build variant.

### iOS — produce the .ipa

In Xcode: **Product → Archive**, then **Distribute App → App Store Connect** (for TestFlight) or **Ad Hoc**.

## 6. Where to drop the binaries for users

Copy the produced files into `artifacts/va-dashboard/public/downloads/` (create the folder), so the `/download` page links resolve:

```
public/downloads/
  va-manager.apk
  VA-Manager.dmg            (built via electron-builder, see ELECTRON.md)
  VA-Manager-Setup.exe
  VA-Manager.AppImage
```

For iOS use the public TestFlight invite link instead — Apple does not allow direct `.ipa` downloads.

## 7. Update the app version

Bump the version in three places before each release:

* `package.json` → `version`
* `android/app/build.gradle` → `versionCode` and `versionName`
* `ios/App/App.xcodeproj` → Info > Version & Build

## Troubleshooting

* **White screen in the native app** — your `webDir` (in `capacitor.config.ts`) does not contain an `index.html`. Run a fresh build first.
* **Network requests fail** — production build must point at your hosted API URL (Render or Cloudflare), not localhost. Set `VITE_API_URL` at build time.
* **Android Gradle errors** — open Android Studio → File → Invalidate Caches and Restart.

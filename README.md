<p align="center">
  <img src="./apps/chrome-extension/public/icons/icon128.png" width="180" alt="YTView logo" />
</p>

<h1 align="center">YTView</h1>

<p align="center">
  <strong>A focused floating YouTube player for macOS, Windows and Linux.</strong>
</p>

<p align="center">
  Watch YouTube in a compact, always-on-top window with
  Chrome integration, a persistent video queue and keyboard-first controls.
</p>

---

<p align="center">
  <img src="./assets/ytview-preview.png" alt="YTView running as a floating player" />
</p>

## Credits / Attribution

This project is based on **[YTView](https://github.com/DouglasPrado/youtube-pip-view)** by [Douglas Prado](https://github.com/DouglasPrado).

- Original repository: https://github.com/DouglasPrado/youtube-pip-view
- Releases (original): https://github.com/DouglasPrado/youtube-pip-view/releases

This fork extends the desktop app and documentation for **Windows** and **Linux** in addition to macOS. All credit for the original design and implementation goes to the upstream author.

---

## What is YTView?

YTView is a desktop app designed for watching YouTube while you work.

Instead of keeping a full browser window open, YTView provides a compact floating player that stays above other applications and keeps playback controls, queue management and browser integration close at hand.

It combines:

- a desktop application built with Electron
- a React-based player interface
- a Chrome extension
- a persistent video queue
- global keyboard shortcuts
- a local integration API

The result is a lightweight companion for people who regularly keep YouTube running alongside their work.

---

## Why YTView?

Browser Picture-in-Picture is useful, but intentionally minimal.

YTView explores what happens when the floating player becomes an actual desktop application.

It adds application-level capabilities around the video experience:

- persistent queue
- browser-to-desktop integration
- global shortcuts
- system tray / menu bar controls
- remembered playback state
- playlist ingestion
- queue reordering
- richer playback controls

The goal is simple:

> **Keep the video available without keeping YouTube in the way.**

---

# Features

### Always-on-top player

YTView runs in a compact floating window that stays above other applications.

Use it while:

- coding
- studying
- writing
- browsing
- working in fullscreen applications

The player keeps a consistent video-oriented aspect ratio and is designed to behave like a native floating utility on macOS, Windows and Linux.

---

### Video Queue

YTView includes a persistent queue for lining up content before or during playback.

You can:

- add videos individually
- paste multiple links
- reorder videos by dragging
- move a video to play next
- automatically advance through the queue
- remove queued items
- undo a cleared queue for a short period
- keep the queue between application sessions

---

### Chrome Extension

The companion Chrome extension connects YouTube in the browser directly to the desktop application.

From YouTube you can:

- open the current video in YTView
- add a video directly to the queue
- add videos from thumbnails
- send an entire playlist to YTView

Communication uses a local HTTP API (`localhost:8765`), so the extension works on **macOS, Windows and Linux** as long as the desktop app is running.

```text
YouTube in Chrome
       │
       │ Open / Queue
       ▼
Chrome Extension
       │
       │ localhost:8765
       ▼
     YTView
       │
       ▼
Floating Player
```

---

### Keyboard-first controls

#### Global shortcuts

These work even when YTView is not focused:

| Shortcut (macOS) | Shortcut (Windows / Linux) | Action |
|---|---|---|
| `⌘ ⇧ Y` | `Ctrl ⇧ Y` | Bring YTView back |
| `⌘ ⇧ Space` | `Ctrl ⇧ Space` | Play / pause |

#### Player shortcuts

| Shortcut | Action |
|---|---|
| `Space` / `K` | Play / pause |
| `←` / `→` | Seek 5 seconds |
| `Shift + ← / →` | Seek 30 seconds |
| `J` / `L` | Seek 10 seconds |
| `↑` / `↓` | Volume |
| `0–9` | Jump to percentage of video |
| `M` | Mute |
| `F` | Fullscreen |
| `N` | Next video |
| `P` | Previous video |
| `⌘ L` / `Ctrl L` | Open another video |
| `⌘ W` / close button | Hide YTView |
| `⌘ Q` / tray Quit | Quit |

---

### System tray / menu bar

YTView integrates with the OS tray:

- **macOS** — menu bar icon
- **Windows** — system tray (near the clock)
- **Linux** — notification area / system tray (when supported by the desktop environment)

The tray icon provides quick access to:

- show the player
- hide the player
- open the queue
- quit the application

Closing the player window hides YTView instead of destroying the current playback state.

---

# Install & use

## 1. Desktop app

### Download (recommended)

Download the latest build for your OS from the
[Releases](https://github.com/DouglasPrado/youtube-pip-view/releases) page
(or from this fork’s Releases once published).

| OS | Package |
|---|---|
| macOS | `.dmg` or `.zip` |
| Windows | `.exe` installer (NSIS) or portable `.exe` |
| Linux | `.AppImage` or `.deb` |

### macOS

1. Download the `.dmg`.
2. Open it and drag **YTView** into **Applications**.
3. Launch YTView from Applications or Spotlight.

> [!NOTE]
> YTView may be distributed without Apple notarization/signing.
> macOS may block the first launch.
>
> Open **System Settings → Privacy & Security** and choose **Open Anyway** if necessary.
>
> Or from Terminal:
> ```bash
> xattr -cr /Applications/YTView.app
> ```

### Windows

1. Download the NSIS installer (`.exe`) **or** the portable build.
2. **Installer:** run the `.exe`, choose an install folder, finish the wizard.
   Shortcuts are created on the Desktop and Start Menu.
3. **Portable:** extract/run the portable `.exe` — no install required.
4. Launch **YTView**. Look for the tray icon near the system clock if the window is hidden.
5. If Windows SmartScreen warns about an unsigned app, choose **More info → Run anyway** (when you trust the build source).

### Linux

**AppImage**

```bash
chmod +x YTView-*.AppImage
./YTView-*.AppImage
```

**Debian / Ubuntu (`.deb`)**

```bash
sudo dpkg -i YTView-*.deb
# if dependencies are missing:
sudo apt-get install -f
ytview   # or launch from the app menu
```

**Notes**

- On some desktop environments the tray icon needs AppIndicator support
  (e.g. `libayatana-appindicator` / similar packages).
- If the tray is unavailable, YTView stays visible in the taskbar so you can restore the window.

---

## 2. Chrome extension

The extension works on **Chrome, Edge, Brave and Chromium** on macOS, Windows and Linux.

### Build the extension

From the repository root:

```bash
pnpm install
pnpm turbo run build --filter=@ytview/chrome-extension
```

The loadable folder is:

```text
apps/chrome-extension/dist
```

> Do **not** load `apps/chrome-extension/` (source). Load `dist` only.

### Load in the browser

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** / **Carregar sem compactação**.
4. Select `apps/chrome-extension/dist`.
5. Start the **YTView desktop app** (the extension talks to `localhost:8765`).

### Use it

- On a YouTube (or supported) page, open the extension popup to **play** or **add to queue**.
- Or use the page buttons / context actions the extension injects.
- Keyboard (browser):
  - `Ctrl+Shift+1` / `⌘⇧1` — play in YTView
  - `Ctrl+Shift+2` / `⌘⇧2` — add to queue

### Optional: sync copy (macOS / Linux)

```bash
./scripts/update-extension.sh
```

On Windows, copy the `dist` folder wherever you prefer and click **Reload** on the extension card.

---

## 3. Typical workflow

```text
Discover video in Chrome
        │
        ▼
Open / Queue via extension
        │
        ▼
YTView floating player
        │
        ├── Watch while you work
        └── Manage queue from tray / queue window
```

---

# Requirements

For users:

```text
macOS, Windows 10+, or a modern Linux desktop
Chrome / Edge / Brave / Chromium (for the extension)
```

For development:

```text
Node.js >= 18
pnpm
```

---

# Development

Clone the repository:

```bash
git clone https://github.com/DouglasPrado/youtube-pip-view.git
cd youtube-pip-view
```

Install dependencies:

```bash
pnpm install
```

Build the workspace:

```bash
pnpm turbo run build
```

Run the desktop application in development:

```bash
cd apps/desktop
pnpm run electron:dev
```

Run the extension in watch mode:

```bash
pnpm dev:extension
```

---

# Tests

```bash
pnpm test
```

Coverage includes YouTube URL formats, video ID parsing, queue ordering, removing the active video, and queue auto-advance.

---

# Build packages

Build the workspace:

```bash
pnpm turbo run build
```

Build the desktop app for the **current OS**:

```bash
cd apps/desktop
pnpm run electron:build
```

Or target a specific platform (cross-compilation may require extra tooling):

```bash
pnpm run electron:build:mac
pnpm run electron:build:win
pnpm run electron:build:linux
```

Packages are written to:

```text
apps/desktop/release/
```

| Platform | Typical outputs |
|---|---|
| macOS | `.dmg`, `.zip` |
| Windows | NSIS `.exe`, portable `.exe` |
| Linux | `.AppImage`, `.deb` |

---

# Architecture

YTView is not implemented using the browser's native Picture-in-Picture API.

It uses a regular Electron window configured to behave like a floating player.

```text
┌───────────────────────────────────────────┐
│              Electron Window              │
│                                           │
│  frameless · always-on-top · floating     │
│                                           │
│    ┌─────────────────────────────────┐    │
│    │         React Renderer          │    │
│    │    Player UI · Queue · Controls │    │
│    │         YouTube iframe          │    │
│    └─────────────────────────────────┘    │
└───────────────────────────────────────────┘
```

The Chrome extension communicates with the desktop app through a local HTTP API on `localhost:8765`.

---

# Monorepo

```text
youtube-pip-view/
├── apps/
│   ├── desktop/              # Electron desktop application
│   └── chrome-extension/     # Chrome integration
├── packages/                 # Shared packages
├── assets/
├── build/
├── scripts/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

# Design decisions

- **Electron window instead of browser PiP** — full control over queue, shortcuts, tray and state.
- **Local API instead of cloud** — extension ↔ app stays on `localhost`.
- **Browser for discovery, desktop for playback** — YouTube stays the discovery surface.
- **Persistent queue** — playback workflow survives hide/restart.

---

# Contributing

1. Keep desktop-specific behavior inside the Electron boundary.
2. Keep browser-specific behavior inside the extension.
3. Prefer shared packages for reusable domain logic.
4. Add tests for URL parsing and queue behavior when changing those systems.
5. Verify packaging on the OS you change (macOS / Windows / Linux).

```bash
pnpm test
pnpm turbo run build
```

---

# Philosophy

> **YouTube when you want it. Your workspace when you don't.**

---

# Disclaimer

YTView is an independent open-source project and is not affiliated with, endorsed by or sponsored by YouTube or Google.

YouTube and the YouTube logo are trademarks of Google LLC.

---

# License

See the repository license for licensing information. Upstream project: [DouglasPrado/youtube-pip-view](https://github.com/DouglasPrado/youtube-pip-view).

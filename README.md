# TorrentBD Magnetter

A cross-browser extension that adds a "Magnet" button to torrent pages on TorrentBD.

## Features

- **One-Click Magnet Generation**: Converts the torrent file to a magnet link instantly within the browser.
- **Privacy Focused**: Conversion happens entirely client-side. No files are uploaded to any server.
- **Custom Trackers**: You can configure custom announce URLs in the Extension Options. If set, these will override the trackers found within the torrent file.
- **Cross-Browser**: Works on both Firefox and Chrome/Edge.

## Installation

### Firefox

1.  Download the latest `torrentbd-magnetter-firefox-*.zip` from [Releases](https://github.com/potasiyam/torrentbd-magnetter/releases)
2.  Go to `about:addons`
3.  Click the gear icon → **Install Add-on From File**
4.  Select the downloaded zip file

### Chrome / Edge

1.  Download the latest `torrentbd-magnetter-chrome-*.zip` from [Releases](https://github.com/potasiyam/torrentbd-magnetter/releases)
2.  Extract the zip file
3.  Go to `chrome://extensions` (or `edge://extensions`)
4.  Enable **Developer mode**
5.  Click **Load unpacked**
6.  Select the extracted folder

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build both Firefox and Chrome versions
npm run build

# Build specific browser
npm run build:firefox
npm run build:chrome

# Bump version (updates manifests and package.json)
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0
npm run version:major  # 1.0.0 -> 2.0.0
```

Built packages will be in the `dist/` directory.

### Testing Locally

**Firefox:**

1.  Go to `about:debugging`
2.  Click "This Firefox"
3.  Click "Load Temporary Add-on"
4.  Select `manifest.json` from the project directory

**Chrome:**

1.  Go to `chrome://extensions`
2.  Enable "Developer mode"
3.  Click "Load unpacked"
4.  Select the project directory

## Usage

1.  Navigate to any torrent details page on `torrentbd.com`
2.  Click the **Magnet** button next to the download button
3.  The magnet link will be generated and opened automatically

## License

MIT

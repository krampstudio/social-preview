# Social Preview

A browser extension that shows how the current page will look when you share its URL on **X, Facebook, LinkedIn, Slack and Discord**, right from the toolbar. Works in **Chrome, Firefox and Safari**.

![Chrome](https://img.shields.io/badge/Chrome-supported-4285F4?logo=googlechrome&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-supported-FF7139?logo=firefoxbrowser&logoColor=white)
![Safari](https://img.shields.io/badge/Safari-supported-006CFF?logo=safari&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## What it does

Click the extension icon on any page. The popup reads the page's Open Graph (`og:*`), Twitter (`twitter:*`) and standard meta tags, then renders a mockup of the link card each platform would show:

| Tab | What it renders |
| --- | --- |
| **X** | `summary_large_image` card (image with title overlay and "From domain") or the compact `summary` card |
| **Facebook** | 1.91:1 image with domain, title and description |
| **LinkedIn** | Image with title and domain |
| **Slack** | Unfurl with site name, favicon, title, description and image (thumbnail for `summary` cards) |
| **Discord** | Dark embed using `theme-color` for the border, large image or thumbnail depending on `twitter:card` |
| **Tags** | Checks for missing tags, text length, image size and ratio, plus every social tag found and where each value comes from |

Each platform uses its own fallback order (for example X reads `twitter:title`, then `og:title`, then `<title>`), so the previews show what each platform would actually display.

No account. No tracking. No network requests other than loading the page's own images. No build step.

---

## Install from source

Clone the repo first:

```sh
git clone git@github.com:krampstudio/social-preview.git
```

### Chrome (and Edge, Brave, Opera)

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the project directory

### Firefox (140+)

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…** and select `manifest.json`

### Safari (macOS, requires Xcode)

1. Run `./release.sh`, which generates an Xcode project in `build/safari/`
2. Open `build/safari/Social Preview/Social Preview.xcodeproj` and run the **Social Preview** scheme
3. In Safari, open **Settings → Advanced** and enable **Show features for web developers**, then in **Settings → Developer** enable **Allow unsigned extensions**
4. Enable **Social Preview** in **Settings → Extensions**

---

## Release

```sh
./release.sh
```

This creates, in `build/`:

- `social-preview-chrome-v{VERSION}.zip` for the Chrome Web Store (without the Firefox-only manifest key)
- `social-preview-firefox-v{VERSION}.zip` for addons.mozilla.org
- `safari/`, an Xcode project generated with `safari-web-extension-converter` (when Xcode is installed), to archive and submit to the App Store

Requires `jq` and `zip`.

---

## Development

```sh
node --test test/                                   # unit tests for metadata resolution
npx web-ext lint --source-dir build/firefox         # Firefox manifest/code lint (after ./release.sh)
```

To iterate on the card styles without reloading the extension, open `test/harness.html` in a browser. It loads the real popup files with a stubbed extension API and sample metadata:

```
test/harness.html?fixture=large|summary|bare&tab=x|facebook|linkedin|slack|discord|tags
```

---

## Project structure

```
social-preview/
├── manifest.json   # Manifest V3, shared by all browsers
├── popup.html      # Popup shell
├── popup.css       # Popup and platform card styles
├── popup.js        # Reads the active tab, renders tabs and the inspector
├── meta.js         # Page metadata extraction, per-platform fallbacks, checks
├── platforms.js    # One renderer per platform
├── icon*.png       # Icons generated from icon.svg
├── test/           # Unit tests and visual harness
└── release.sh      # Packages Chrome, Firefox and Safari builds
```

---

## License

MIT © [Bertrand Chevrier](https://github.com/krampstudio)

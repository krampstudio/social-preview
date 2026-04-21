# Social Preview

A minimal Chrome extension that shows you the social media thumbnail (`og:image`) of any webpage — instantly, right from the toolbar.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## What it does

When you click the extension icon, it reads the current page's `og:image` meta tag and displays the preview thumbnail in a clean popup — the same image that would appear when sharing the link on social platforms like Twitter, LinkedIn, or Slack.

No account. No tracking. No build step. Just a popup.

---

## Install

1. Clone this repo
   ```sh
   git clone git@github.com:krampstudio/social-preview.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project directory

The extension icon will appear in your Chrome toolbar.

---

## Usage

Navigate to any webpage and click the extension icon. The popup will show:

- The `og:image` thumbnail if one is set on the page
- A clickable link to the image URL
- A fallback message if no social thumbnail is found

---

## Release

To package the extension for distribution:

```sh
./release.sh
```

This creates a versioned ZIP in `build/social-preview-v{VERSION}.zip`, ready to upload to the Chrome Web Store.

---

## Project structure

```
social-preview/
├── manifest.json   # Extension manifest (Manifest V3)
├── popup.html      # Popup UI
├── popup.js        # Logic: extract og:image and render it
├── icon48.png
├── icon96.png
└── release.sh      # Build script
```

---

## License

MIT © [Bertrand Chevrier](https://github.com/krampstudio)

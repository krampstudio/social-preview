#!/bin/bash
# Packages the extension for each browser:
#   build/social-preview-chrome-v{VERSION}.zip   Chrome Web Store (and Edge, Opera, Brave)
#   build/social-preview-firefox-v{VERSION}.zip  addons.mozilla.org
#   build/safari/                                 Xcode project (macOS with Xcode only)
set -e

cd "$(dirname "$0")"

VERSION=$(jq -r .version manifest.json)
FILES=(manifest.json popup.html popup.css popup.js meta.js platforms.js icon16.png icon32.png icon48.png icon96.png icon128.png)

rm -rf build
mkdir -p build/chrome build/firefox

cp "${FILES[@]}" build/firefox/
cp "${FILES[@]}" build/chrome/
# Chrome warns about the Firefox-only key
jq 'del(.browser_specific_settings)' manifest.json > build/chrome/manifest.json

(cd build/chrome && zip -qr "../social-preview-chrome-v${VERSION}.zip" .)
(cd build/firefox && zip -qr "../social-preview-firefox-v${VERSION}.zip" .)
echo "Created build/social-preview-chrome-v${VERSION}.zip"
echo "Created build/social-preview-firefox-v${VERSION}.zip"

CONVERTER=$(xcrun --find safari-web-extension-converter 2>/dev/null \
    || DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun --find safari-web-extension-converter 2>/dev/null \
    || true)
if [ -n "$CONVERTER" ]; then
    "$CONVERTER" build/chrome \
        --project-location build/safari \
        --app-name "Social Preview" \
        --bundle-identifier com.krampstudio.Social-Preview \
        --swift --macos-only --copy-resources --no-open --no-prompt --force
    echo "Created build/safari (open the .xcodeproj in Xcode to run or archive)"
else
    echo "Skipped Safari: safari-web-extension-converter not found (requires Xcode)"
fi

#!/bin/bash
set -e

VERSION=$(sed -n 's/.*"version": "\(.*\)".*/\1/p' manifest.json)
OUTPUT="build/social-preview-v${VERSION}.zip"

mkdir -p build

zip -r "$OUTPUT" . \
    -x "*.git*" \
    -x "*.DS_Store" \
    -x "icon.svg" \
    -x "README.md" \
    -x "LICENSE" \
    -x "release.sh" \
    -x "build/*"

echo "Created $OUTPUT"

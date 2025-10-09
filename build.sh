#!/bin/zsh
# Build script for Clio satellite Chrome extension
# Reads version from manifest.json and creates a zip in build/

set -e

MANIFEST=manifest.json
BUILD_DIR=build
NAME="clio-satellite"

# Extract version from manifest.json
VERSION=$(grep '"version"' "$MANIFEST" | head -1 | sed -E 's/.*"([0-9.]+)".*/\1/')
ZIP_NAME="$BUILD_DIR/$NAME-$VERSION.zip"

mkdir -p "$BUILD_DIR"

# Remove old zip if exists
rm -f "$ZIP_NAME"


# Create zip, excluding unnecessary files but including required ones
zip -r "$ZIP_NAME" . \
  -x "*.md" \
  -x "*/.DS_Store" \
  -x "*.html" \
  -x "test-*" \
  -x "*.backup" \
  -x "docs/*" \
  -x "examples/*" \
  -x "markup-examples/*" \
  -x "$BUILD_DIR/*" \
  -x ".git/*" \
  -x ".github/*" \
  && zip -uj "$ZIP_NAME" \
<<<<<<< Updated upstream
  options.html
echo "Build complete: $ZIP_NAME"
=======
  options.htmlecho "Build complete: $ZIP_NAME"
>>>>>>> Stashed changes

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


# Remove old zip if exists and log
if [ -f "$ZIP_NAME" ]; then
  rm "$ZIP_NAME"
  echo "Old archive $ZIP_NAME removed."
fi



# Create zip, excluding unnecessary files but including required ones
zip -r "$ZIP_NAME" . \
  -x "*.md" \
  -x "*/.DS_Store" \
  -x ".DS_Store" \
  -x "*.html" \
  -x "test-*" \
  -x "*.backup" \
  -x "*.sh" \
  -x ".gitignore" \
  -x ".github/*" \
  -x "docs/*" \
  -x "examples/*" \
  -x "markup-examples/*" \
  -x "$BUILD_DIR/*" \
  -x ".git/*" \
  -x ".venv/*"

# Add required HTML file
zip -uj "$ZIP_NAME" options.html

echo "Build complete: $ZIP_NAME"
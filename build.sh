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

# Create zip, excluding docs, tests, html, backups, and build output
zip -r "$ZIP_NAME" . -x "*.md" "*.html" "test-*" "*.backup" "docs/*" "examples/*" "markup-examples/*" "$BUILD_DIR/*" 

echo "Build complete: $ZIP_NAME"

#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Usage: ./build.sh <version>"
  echo "Example: ./build.sh v1.0.0"
  exit 1
fi

VERSION=$1
BUILD_DIR=build
REQUIRED_FILES=("bookmarks.json" "icon.ico" "LICENSE" "README.md")
REQUIRED_DIRECTORIES=("public")

echo "Building version $VERSION..."

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "Building Linux executable..."
GOOS=linux GOARCH=amd64 go build -o "$BUILD_DIR/FriBrowse-$VERSION-linux-amd64"

echo "Building Windows executable..."
GOOS=windows GOARCH=amd64 go build -o "$BUILD_DIR/FriBrowse-$VERSION-windows-amd64.exe"

echo "Copying required directories to $BUILD_DIR..."
for directory in "${REQUIRED_DIRECTORIES[@]}"; do 
  if [ ! -d "$directory" ]; then
    echo "Error: Required directory '$directory' not found."
    exit 1
  fi

  echo "Copying $directory directory to $BUILD_DIR/$directory"
  cp -r "$directory" "$BUILD_DIR/"
done

echo "Copying required files to $BUILD_DIR..."
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Error: Required file '$file' not found."
    exit 1
  fi

  cp "$file" "$BUILD_DIR/"
  echo "  - Copied $file"
done

echo "All builds are done! Artifacts are in the $BUILD_DIR folder."


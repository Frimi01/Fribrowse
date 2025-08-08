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
STRIP=true
if [ "$2" == "nostrip" ]; then
    STRIP=false
fi

buildPlatform() {
  local GOOS="$1"
  local GOARCH="$2"
  local LABEL="FriBrowse-$VERSION-$GOOS-$GOARCH"
  local OUTPUT_DIR="$BUILD_DIR/$LABEL"
  local LDFLAGS=""
  if [ "$GOOS" == "windows" ]; then
	  LDFLAGS="-H=windowsgui"
	  LABEL="$LABEL.exe"
  fi
  if [ "$STRIP" == "true" ]; then
	  LDFLAGS="$LDFLAGS -s -w"
  fi
  

	echo "Building $LABEL executable..."
	mkdir -p "$OUTPUT_DIR"


	GOOS="$GOOS" GOARCH="$GOARCH" go build -ldflags="$LDFLAGS" -o "$OUTPUT_DIR/$LABEL"

	if [ $? -ne 0 ]; then
		echo "❌ Failed to build $LABEL."
	exit 1
	fi


	echo "Copying required directories to $BUILD_DIR..."
	for directory in "${REQUIRED_DIRECTORIES[@]}"; do 
	if [ ! -d "$directory" ]; then
		echo "Error: Required directory '$directory' not found."
		exit 1
	fi

	cp -r "$directory" "$OUTPUT_DIR/"
	echo "  - Copied $directory directory to $OUTPUT_DIR/$directory"
	done

	echo "Copying required files to $OUTPUT_DIR..."
	for file in "${REQUIRED_FILES[@]}"; do
	if [ ! -f "$file" ]; then
		echo "Error: Required file '$file' not found."
		exit 1
	fi

	cp "$file" "$OUTPUT_DIR/"
	echo "  - Copied $file file to $OUTPUT_DIR/$file"
	done  

	echo "Zipping directory $OUTPUT_DIR"
	zip -r "$OUTPUT_DIR.zip" "$OUTPUT_DIR"

	echo "Done building for $GOOS/$GOARCH. Artifacts in $OUTPUT_DIR"
}


echo "Preparing build directory..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"


echo "Building version $VERSION..."
buildPlatform "linux" "amd64" 
buildPlatform "windows" "amd64" 
# buildPlatform "darwin" "amd64"


echo "All builds are done! Artifacts are in the $BUILD_DIR folder."


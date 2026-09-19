#!/usr/bin/env bash
# Runs after "expo export --platform web".
# Moves the Expo SPA into dist/app/ and copies the marketing website to dist/ root.
# Result:
#   /          -> Ishta marketing website (index.html)
#   /app       -> Expo web app (SPA entry)
#   /app/*     -> Expo SPA (client-side routes, handled by render.yaml rewrite)

set -e

DIST="apps/mobile/dist"
APP_DIR="$DIST/app"
WEBSITE="apps/website"

echo "▶ Moving Expo SPA into $APP_DIR..."
mkdir -p "$APP_DIR"

mv "$DIST/index.html" "$APP_DIR/index.html"
[ -d "$DIST/_expo" ]  && mv "$DIST/_expo"  "$APP_DIR/_expo"
[ -d "$DIST/assets" ] && mv "$DIST/assets" "$APP_DIR/assets"

echo "▶ Copying marketing website to $DIST root..."
cp -r "$WEBSITE/." "$DIST/"

echo "✅ Done — website at /, Expo app at /app"
ls "$DIST"

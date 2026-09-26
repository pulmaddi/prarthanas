#!/usr/bin/env bash
# Runs after "expo export --platform web".
#
# Strategy: rename the Expo SPA entry to app.html so the marketing website
# can own index.html at the dist root. The Expo bundles (_expo/, assets/)
# stay at the dist root with their original paths — keeping their relative
# references valid and avoiding any conflict with Render's /app/* rewrite rule
# (which would otherwise intercept /_expo/static/js/... requests and return
# HTML instead of JS, causing a blank page).
#
# Final dist layout:
#   /              -> apps/website/index.html  (marketing landing page)
#   /app.html      -> Expo SPA entry point
#   /app, /app/*   -> rewritten to /app.html by render.yaml
#   /_expo/...     -> Expo JS bundles  (never caught by /app/* rewrite)
#   /assets/...    -> merged Expo + website static assets

set -e

DIST="apps/mobile/dist"
WEBSITE="apps/website"

echo "▶ Renaming Expo entry: dist/index.html -> dist/app.html"
mv "$DIST/index.html" "$DIST/app.html"

# Expo generates relative asset paths (e.g. _expo/static/js/...).
# When Render rewrites /app -> /app.html, the browser URL stays /app,
# so relative paths resolve to /app/_expo/... (404) instead of /_expo/...
# Injecting <base href="/"> makes the browser always resolve relative
# paths from the site root regardless of the rewrite URL.
echo "▶ Injecting <base href=\"/\"> into app.html..."
sed -i 's|<head>|<head><base href="/">|' "$DIST/app.html"

echo "▶ Copying marketing website to dist root..."
cp -r "$WEBSITE/." "$DIST/"

echo "✅ Done — website at /, Expo SPA entry at /app.html"
ls "$DIST"

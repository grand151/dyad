# Public Assets Directory

This directory contains static assets for the Dyad web platform.

## Required Files

### PWA Icons

You need to add the following icon files:

- `icon-192x192.png` - 192x192px app icon
- `icon-512x512.png` - 512x512px app icon
- `favicon.ico` - Standard favicon
- `apple-touch-icon.png` - Apple touch icon (180x180px recommended)

### Screenshots (Optional)

For better PWA installation experience:

- `screenshot-desktop.png` - Desktop screenshot (1280x720px)
- `screenshot-mobile.png` - Mobile screenshot (750x1334px)

## Creating Icons

You can use the existing Dyad logo from `assets/icon/logo.png` to generate these icons.

### Using ImageMagick

```bash
# Install ImageMagick
# Ubuntu/Debian: apt install imagemagick
# macOS: brew install imagemagick

# Generate icons from logo
convert assets/icon/logo.png -resize 192x192 public/icon-192x192.png
convert assets/icon/logo.png -resize 512x512 public/icon-512x512.png
convert assets/icon/logo.png -resize 180x180 public/apple-touch-icon.png
convert assets/icon/logo.png -resize 32x32 public/favicon.ico
```

### Using Online Tools

Alternative options:
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

## Notes

- Icons should have transparent backgrounds where appropriate
- Use PNG format for best quality
- Ensure icons are square (1:1 aspect ratio)
- Icons are referenced in `public/manifest.json`

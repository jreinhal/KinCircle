# KinCircle App Icons

You need to generate icons in the following sizes for full PWA support.

## Required Icon Sizes

| Size | Filename | Purpose |
|------|----------|---------|
| 16x16 | icon-16x16.png | Browser favicon |
| 32x32 | icon-32x32.png | Browser favicon |
| 72x72 | icon-72x72.png | Android/PWA |
| 96x96 | icon-96x96.png | Android/PWA |
| 128x128 | icon-128x128.png | Android/PWA |
| 144x144 | icon-144x144.png | Android/PWA |
| 152x152 | icon-152x152.png | iOS |
| 167x167 | icon-167x167.png | iPad Pro |
| 180x180 | icon-180x180.png | iPhone |
| 192x192 | icon-192x192.png | Android/PWA (primary) |
| 384x384 | icon-384x384.png | Android/PWA |
| 512x512 | icon-512x512.png | Android/PWA (splash) |

## How to Generate Icons

### Option 1: Online Generator (Easiest)
1. Create a 512x512 PNG of your logo
2. Go to https://realfavicongenerator.net/
3. Upload your image
4. Download the generated package
5. Extract icons to this folder

### Option 2: PWA Asset Generator
```bash
npm install -g pwa-asset-generator
pwa-asset-generator your-logo.png ./public/icons --background "#0d9488" --padding "10%"
```

### Option 3: Figma/Canva
1. Design your icon at 512x512
2. Export at each required size
3. Ensure icons are square with transparent or teal (#0d9488) background

## Icon Design Tips

- Use simple, recognizable shapes
- Works well at small sizes (16x16)
- Use your brand color (teal #0d9488) as accent
- Consider a "KC" monogram or family/circle symbol
- Test on both light and dark backgrounds

## Shortcut Icons (Optional)

For app shortcuts on Android:
- add-expense.png (96x96) - Plus sign or receipt icon
- reports.png (96x96) - Chart or document icon

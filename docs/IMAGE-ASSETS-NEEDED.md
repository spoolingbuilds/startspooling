# Required Image Assets for SEO & PWA

The following images need to be created and placed in `/public/` directory:

## 1. Open Graph Image
**File:** `/public/og-image.png`
**Size:** 1200x630px (required by Facebook/LinkedIn)
**Purpose:** Social media sharing preview
**Content Ideas:**
- Black background (#000000)
- Text: "Your build threads disappeared. We remember everything."
- Cyan accent (#00FFFF)
- Minimal, matches site aesthetic
- Can include logo or SpoolAnimation visual

**Design Brief:**
```
Background: Pure black (#000000)
Headline (large, bold, white): "photobucket deleted it."
Subline (medium, white): "we remember everything"
Optional: Cyan turbo icon or spool graphic
Footer (small, dim): "startspooling.com"
```

**Tools to Create:**
- Canva (free, has 1200x630 template)
- Figma (free)
- Photoshop/Illustrator
- Or hire designer on Fiverr ($10-30)

## 2. Apple Touch Icon
**File:** `/public/apple-touch-icon.png`
**Size:** 180x180px
**Purpose:** iOS home screen icon
**Content Ideas:**
- Black background
- Cyan "S" letter
- Or simple turbo icon in cyan
- Keep it minimal and recognizable

**Design Brief:**
```
Background: Black (#000000)
Icon: Cyan (#00FFFF) letter "S" or turbo symbol
Padding: 20px from edges
Format: PNG with transparency (but background should be black)

3. PWA Icons (already configured, but verify they exist)
Files:

/public/icon-192x192.png (192x192px)
/public/icon-512x512.png (512x512px)

Purpose: Progressive Web App icons for Android
Content: Same design as Apple Touch Icon, different sizes
4. Favicon (already configured, verify exists)
Files:

/public/favicon.ico (32x32px or multi-size .ico)
/public/icon-16x16.png (16x16px)
/public/icon-32x32.png (32x32px)

Purpose: Browser tab icon
Content: Simplified "S" or turbo icon that's recognizable at small sizes
5. Screenshots (for PWA manifest - optional but recommended)
Files:

/public/screenshot-mobile.png (1080x1920px)
/public/screenshot-desktop.png (1920x1080px)

Purpose: App store listings, PWA installation prompts
Content:

Mobile: Screenshot of landing page on mobile
Desktop: Screenshot of landing page on desktop
Can be generated after site is live

Temporary Placeholders (Until Real Assets Created)
For immediate deployment, create simple placeholder images:
OG Image Placeholder

Create 1200x630px black image
Add white text: "StartSpooling - Car Build Documentation"
Save as og-image.png

Icon Placeholder

Create 180x180px black image
Add cyan "S" in center
Save as apple-touch-icon.png
Resize to other needed sizes

Quick Creation with Code (ImageMagick):
bash# OG Image (requires ImageMagick installed)
convert -size 1200x630 xc:black \
  -font Arial -pointsize 72 -fill white \
  -gravity center -annotate +0-50 "StartSpooling" \
  -pointsize 48 -annotate +0+50 "Car Build Documentation" \
  og-image.png

# Apple Touch Icon
convert -size 180x180 xc:black \
  -font Arial-Bold -pointsize 120 -fill "#00FFFF" \
  -gravity center -annotate +0+0 "S" \
  apple-touch-icon.png
```

## Image Optimization Checklist

Before uploading images:
- [ ] Compress with TinyPNG or ImageOptim
- [ ] Verify correct dimensions
- [ ] Verify file names match exactly (case-sensitive)
- [ ] Test on multiple devices/browsers
- [ ] Validate with Facebook Sharing Debugger
- [ ] Check appearance in Twitter Card Validator

## Priority Order

**Do These First:**
1. og-image.png (most visible, impacts social sharing)
2. apple-touch-icon.png (iOS users)

**Do These Second:**
3. Verify existing favicon files
4. Create missing PWA icons if needed

**Do These Later:**
5. Screenshots (nice to have, not critical)

Save all images to `/public/` directory in your project.


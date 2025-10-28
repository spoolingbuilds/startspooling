# Alt Text Guidelines for StartSpooling

## Why Alt Text Matters

1. **SEO**: Search engines can't "see" images, they read alt text
2. **Accessibility**: Screen readers read alt text to visually impaired users
3. **Fallback**: Alt text displays if image fails to load
4. **Context**: Helps users understand image purpose

## General Rules

### ✅ DO:
- Be descriptive and specific
- Include relevant keywords naturally
- Describe the image content and function
- Keep it concise (125 characters or less ideal)
- Use proper grammar and punctuation

### ❌ DON'T:
- Start with "image of" or "picture of"
- Stuff keywords unnaturally
- Use generic descriptions like "photo" or "graphic"
- Leave alt text empty (except decorative images)
- Copy/paste the same alt text for different images

## Alt Text for StartSpooling Images

### Logo
```html
<!-- Good -->
<img src="/logo.png" alt="StartSpooling logo" />

<!-- Bad -->
<img src="/logo.png" alt="logo" />
<img src="/logo.png" alt="image of StartSpooling logo picture" />
```

### OG Image / Social Cards
```html
<!-- Good -->
<meta property="og:image:alt" content="StartSpooling car build documentation platform - never lose your build thread again" />

<!-- Bad -->
<meta property="og:image:alt" content="StartSpooling image" />
```

### Build Photos (future feature)
```html
<!-- Good - Descriptive -->
<img src="/builds/miata-turbo.jpg" alt="Turbocharged NA Miata engine bay showing Garrett GT2860RS turbo and custom intercooler piping" />

<!-- Good - Includes car and mod -->
<img src="/builds/e36-coilovers.jpg" alt="BMW E36 suspension with BC Racing coilovers installed" />

<!-- Bad - Too generic -->
<img src="/builds/car1.jpg" alt="car engine" />
```

### Icons / UI Elements

**Decorative icons** (no alt needed):
```html
<!-- Decorative - use empty alt or aria-hidden -->
<img src="/icon-check.svg" alt="" aria-hidden="true" />
```

**Functional icons** (describe function):
```html
<!-- Functional - describe what it does -->
<button>
  <img src="/icon-search.svg" alt="Search builds" />
</button>
```

### Screenshots / Product Images
```html
<!-- Good - Describes what's shown -->
<img src="/screenshot-dashboard.png" alt="StartSpooling dashboard showing build timeline, parts list, and photo gallery" />

<!-- Good - Specific feature -->
<img src="/feature-parts-tracking.png" alt="Parts tracking interface displaying part numbers, costs, and installation dates for turbo upgrade" />
```

### User-Generated Content

When users upload build photos:
```html
<!-- Prompt users for description -->
<label for="image-description">Describe this photo for accessibility:</label>
<input 
  id="image-description" 
  name="imageAlt"
  placeholder="E.g., Engine bay after K24 swap with custom headers"
/>

<!-- Default if user doesn't provide -->
<img src="/uploads/user123-build.jpg" alt="Build photo uploaded by [username]" />
```

## Platform-Specific Examples

### Forum-Style Build Thread Photos
```html
<!-- Initial state -->
<img src="/build/before-1.jpg" alt="Stock 1990 Miata before modifications" />

<!-- Progress -->
<img src="/build/progress-3.jpg" alt="Miata with suspension removed for coilover installation" />

<!-- Completed -->
<img src="/build/after-10.jpg" alt="Completed Miata build with turbo kit, coilovers, and RPF1 wheels" />
```

### Modification Categories
```html
<!-- Engine -->
<img src="/mods/turbo-kit.jpg" alt="Garrett GTX2867R turbo kit installation on Honda K20 engine" />

<!-- Suspension -->
<img src="/mods/coilovers.jpg" alt="KW V3 coilovers installed on BMW E46" />

<!-- Wheels -->
<img src="/mods/wheels.jpg" alt="18x9.5 Enkei RPF1 wheels in SBC finish on lowered 350Z" />

<!-- Interior -->
<img src="/mods/seats.jpg" alt="Bride Zeta III racing seats with 5-point harness" />
```

## SEO Keywords to Include (Naturally)

When describing images, naturally include:
- Car make/model (Miata, E36, 240SX, etc.)
- Specific parts (GT2860RS turbo, BC coilovers, etc.)
- Modification type (engine swap, suspension upgrade, etc.)
- Build stage (before, during, after)
- Technical details when relevant

**Example with keywords:**
```html
<!-- Keyword-rich but natural -->
<img 
  src="/240sx-sr20-swap.jpg" 
  alt="Nissan 240SX with completed SR20DET engine swap showing custom motor mounts and wiring harness" 
/>
```

## Testing Your Alt Text

**Good alt text should answer:**
1. What is in the image?
2. What is the purpose of the image?
3. Would someone understand the context without seeing it?

**Test by reading alt text aloud:**
- Does it make sense?
- Does it convey the image purpose?
- Would you understand it with eyes closed?

## Automation & Defaults

### When implementing image uploads:
```typescript
// Generate smart defaults
function generateDefaultAlt(image: UploadedImage): string {
  const { filename, uploadedBy, buildMake, buildModel } = image
  
  return `${buildMake} ${buildModel} build photo by ${uploadedBy.username}`
}

// Allow user override
interface ImageUpload {
  file: File
  altText?: string // Optional, but encouraged
}

// Fall back to smart default if not provided
const finalAlt = imageUpload.altText || generateDefaultAlt(image)
```

## For Next.js Image Component
```tsx
import Image from 'next/image'

// Always include alt attribute
<Image
  src="/build-photo.jpg"
  alt="Turbocharged Miata engine bay with Garrett turbo"
  width={1200}
  height={800}
  priority={false}
/>

// For decorative images
<Image
  src="/decorative-pattern.jpg"
  alt=""
  width={100}
  height={100}
  aria-hidden="true"
/>
```

## Future Feature: AI-Generated Alt Text

Consider adding AI-generated alt text suggestions:
- Use image recognition API (Google Cloud Vision, AWS Rekognition)
- Generate suggested alt text based on image analysis
- Let user edit before saving
- Combine AI detection with user input for best results

## Checklist Before Publishing Image

- [ ] Alt text is descriptive and specific
- [ ] Alt text includes relevant keywords naturally
- [ ] Alt text is under 125 characters (or 150 max)
- [ ] No "image of" or "picture of" phrases
- [ ] Proper grammar and punctuation
- [ ] Makes sense when read aloud
- [ ] Decorative images have empty alt (alt="") or aria-hidden

# Ishta — Design System / Brand Spec

Portable design tokens for the **Ishta** brand ("Light Your Inner Path").
Framework-agnostic — usable for web, React Native, Flutter, or native apps.
Palette theme: **Saffron · Turmeric · Sandalwood**, with maroon + ivory support tones.

---

## 1. Color Palette

| Token | Hex | Role |
|-------|-----|------|
| **Saffron** | `#E8620A` | Primary brand color — buttons, links, accents, active states |
| Saffron Light | `#FF8A2B` | Hover/gradient highlight |
| Saffron Deep | `#C0390A` | Gradient end / pressed state |
| **Turmeric** | `#F2A900` | Secondary — gradient start, numbers, small highlights |
| Turmeric Deep | `#D98E00` | Icon accents, ornament lines |
| **Sandal** | `#E7D3AC` | Warm neutral — borders, dividers, muted surfaces |
| Sandal Soft | `#F3E6CC` | Section background tint |
| Sandal Deep | `#C9A96A` | Border color, secondary text on dark |
| **Maroon** | `#7A1E12` | Headings, deep contrast, quote strips |
| Maroon Deep | `#571109` | Footer background |
| **Ivory** | `#FFF8EC` | App/page background |
| Cream | `#FCEFD8` | Card tint, chip background |
| Ink | `#3A2410` | Body text |
| Muted | `#8A6A47` | Secondary/caption text |

### Gradients
- **Warm (primary)** — used on hero, buttons, banners:
  `linear-gradient(135deg, #F2A900 0%, #E8620A 55%, #C0390A 100%)`
  (turmeric → saffron → deep saffron)
- **Soft (backgrounds)**:
  `linear-gradient(160deg, #FFF8EC 0%, #FCEFD8 100%)`

### Suggested semantic mapping (for a mobile theme object)
```
primary        = #E8620A   (saffron)
primaryDark    = #C0390A
secondary      = #F2A900   (turmeric)
background     = #FFF8EC   (ivory)
surface        = #FFFFFF
surfaceMuted   = #F3E6CC   (sandal soft)
border         = #C9A96A   (sandal deep)  /* or rgba(201,169,106,.3) at 30% for subtle */
textPrimary    = #3A2410   (ink)
textSecondary  = #8A6A47   (muted)
heading        = #7A1E12   (maroon)
onPrimary      = #FFFFFF
```

---

## 2. Typography

| Use | Font | Weight | Notes |
|-----|------|--------|-------|
| Headings / display | **Marcellus** | 400 (regular) | Elegant serif, temple/classical feel. Fallback: Cormorant Garamond, Georgia, serif |
| Body / UI | **Mukta** | 300–700 | Clean humanist sans. Fallback: Segoe UI, system-ui, sans-serif |

- Both are **Google Fonts** (free, open source).
  - Web: `https://fonts.googleapis.com/css2?family=Marcellus&family=Mukta:wght@300;400;500;600;700&display=swap`
  - React Native / Flutter: install the font files (e.g. `@expo-google-fonts/marcellus`, `@expo-google-fonts/mukta`, or bundle the `.ttf`s).
- **Base body:** 17px (≈ 17sp on mobile), line-height **1.7**
- **Headings:** weight 400, line-height 1.2, color = maroon `#7A1E12`
- Uppercase "eyebrow" labels: letter-spacing 3px, size ~12.5px, weight 600, color saffron.

### Type scale (web clamp → mobile equivalents)
| Level | Web | Mobile (sp) |
|-------|-----|-------------|
| H1 | clamp(2.4rem→4rem) | 30–34 |
| H2 | clamp(1.8rem→2.8rem) | 24–26 |
| H3 | clamp(1.2rem→1.5rem) | 19–20 |
| Body | 17px | 16–17 |
| Caption/eyebrow | 12.5px | 12 |

---

## 3. Shape, Spacing & Elevation

- **Corner radius:** cards/containers `16px`, small elements (inputs, chips) `10px`, pills/buttons `999px` (fully rounded).
- **Card style:** white surface, 1px border `rgba(201,169,106,0.3)` (sandal @ 30%), subtle shadow; a 4px warm-gradient accent bar on top edge (appears on hover/press on web).
- **Shadows:**
  - sm: `0 2px 8px rgba(122,30,18,0.08)`
  - md: `0 10px 30px rgba(122,30,18,0.12)`
  - lg: `0 20px 50px rgba(122,30,18,0.18)`
  - (shadow color is maroon-tinted, not neutral gray — keeps warmth)
- **Section padding:** generous — ~56–100px vertical on web (≈ 40–64px on mobile).
- **Content max width:** 1160px (web only).

---

## 4. Buttons

- **Primary:** warm gradient background, white text, fully rounded (pill), weight 600, soft saffron glow shadow `0 8px 22px rgba(232,98,10,.35)`. Lifts up 2px on press/hover.
- **Ghost (on colored bg):** transparent with white 1.5px border + white text.
- **Outline (on light bg):** transparent, maroon text, sandal-deep border, cream fill on press.

---

## 5. Iconography & Motifs

- Style: warm, devotional, inclusive, modern.
- Recurring motifs: **lotus** (logo mark), **diya** (oil lamp), **temple silhouette**, **ॐ (Om)** symbol, mandala ornaments.
- Emoji used as lightweight icons in the web build: 🪔 🕉️ 🛕 🪷 🧘 🙏 🌐 🎥 📅 💬 📿 🌍 — for the mobile app, prefer a matching line/duotone icon set in saffron `#E8620A` on cream `#FCEFD8` rounded tiles (radius 14px).

---

## 6. Tone & Voice
Warm, devotional, inclusive, and modern. Tagline: **"Light Your Inner Path."**
Footer signature: **"Connecting Souls, Elevating Spirits."**

---

### Quick prompt for the mobile-app project
> "Use the Ishta design system in DESIGN.md — saffron `#E8620A` primary, turmeric `#F2A900` secondary,
> ivory `#FFF8EC` background, maroon `#7A1E12` headings; Marcellus for headings and Mukta for body;
> pill buttons, 16px card radius, warm maroon-tinted shadows, lotus/diya/Om motifs."

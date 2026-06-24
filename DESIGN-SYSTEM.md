# Design System — ระบบเว็บโรงเรียน

เอกสารนี้สรุป CI (Corporate Identity) ของเว็บระบบประเมินครู
เพื่อใช้เป็น reference สร้างเว็บโรงเรียนในธีมเดียวกัน

---

## 1. Color Palette

### Primary — ม่วงเข้ม (Deep Purple)

| Token | Hex | ใช้สำหรับ |
|-------|-----|----------|
| `primary` / `primary-900` | `#2e006b` | Navbar bg, heading, button secondary, icon bg |
| `primary-800` | `#4500bf` | hover states เข้ม |
| `primary-700` | `#5500e8` | — |
| `primary-600` | `#6209ff` | — |
| `primary-500` | `#722bff` | — |
| `primary-400` | `#8a4fff` | accent borders/icons |
| `primary-300` | `#aa85ff` | — |
| `primary-200` | `#ccb6ff` | light tint |
| `primary-100` | `#e4d8ff` | soft background tint |
| `primary-50`  | `#f3eeff` | chip/badge bg |
| `primary-950` | `#1a003d` | darkest (rarely used) |

> **การใช้งานหลัก:** `bg-primary` (Navbar), `text-primary` (headings/links), `border-primary/30` (ghost borders)

### Accent — เหลืองทอง (Golden Yellow)

| Token | Hex | ใช้สำหรับ |
|-------|-----|----------|
| `accent` / `accent-300` | `#ffd445` | Primary action button bg, logo mark, avatar bg, progress bar |
| `accent-200` | `#ffe88a` | hover/tint |
| `accent-100` | `#fff3c4` | badge pending bg |
| `accent-50`  | `#fffbeb` | lightest tint |
| `accent-500` | `#f9a800` | darker accent |

> **การใช้งานหลัก:** `bg-accent` (CTA button, logo square), `text-accent` (role label ใน navbar), `border-accent`

### Base Colors

| Token | Hex | ใช้สำหรับ |
|-------|-----|----------|
| `base-white` | `#ffffff` | card bg, text บน primary bg |
| `base-black` | `#000000` | body text (ใช้ผ่าน opacity: `/60`, `/40`) |

### Background

| สี | ใช้สำหรับ |
|----|----------|
| `gray-50` (`#f9fafb`) | Page background |
| `gray-100` | Input bg, tab pill bg |
| `gray-200` | Divider, border |

---

## 2. Typography

### Font Stack

```css
font-family: "Inter", "Sarabun", sans-serif;
```

- **Inter** — ตัวเลข, Latin (โหลดจาก Google Fonts หรือ Next.js font)
- **Sarabun** — ภาษาไทย (Google Fonts: `Sarabun` weight 300–700)
- Fallback: `sans-serif`

### Type Scale (ตัวอย่างที่ใช้ในโปรเจกต์)

| ขนาด | Tailwind | ใช้สำหรับ |
|------|----------|----------|
| `text-2xl` + `font-black` | 24px / 900 | Page title (h1) |
| `text-xl` + `font-bold` | 20px / 700 | Section heading |
| `text-lg` + `font-bold` | 18px / 700 | Card heading, teacher name |
| `text-base` + `font-semibold` | 16px / 600 | Button lg, label |
| `text-sm` + `font-semibold` | 14px / 600 | Button default, nav link, table cell |
| `text-sm` | 14px / 400 | Body text, description |
| `text-xs` + `font-semibold` | 12px / 600 | Badge, chip, caption |
| `text-xs` | 12px / 400 | Sub-caption, hint |
| `text-[11px]` + `font-semibold` | 11px / 600 | Emoji label บน FaceRating |

### Rendering
```css
html { -webkit-font-smoothing: antialiased; }
```

---

## 3. Spacing & Layout

### Page Container
```css
max-width: 1280px (7xl)
padding: 0 1rem (sm: 1.5rem, lg: 2rem)
padding-top/bottom: 2rem (py-8)
```

### Card
```css
background: white
border-radius: 1rem (rounded-2xl)
padding: 1.5rem (p-6)
border: 1px solid #f3f4f6 (gray-100)
box-shadow: 0 4px 24px 0 rgba(46,0,107,0.08)
```

```html
<!-- class ที่ใช้ -->
<div class="card">...</div>
<!-- = bg-white rounded-2xl shadow-card p-6 border border-gray-100 -->
```

### Navbar Height
```css
height: 4rem (h-16)
position: sticky top-0 z-50
```

---

## 4. Border Radius

| Token | Value | ใช้สำหรับ |
|-------|-------|----------|
| `rounded-lg` | 8px | Input, small button |
| `rounded-xl` | 12px | Button sm/md, card inner, chip |
| `rounded-2xl` | 16px | Card, Button lg, avatar bg, modal |
| `rounded-3xl` | 24px | FaceRating button |
| `rounded-full` | 50% | Pill badge, avatar circle, year filter tab |

---

## 5. Shadow System

| Token | Value | ใช้สำหรับ |
|-------|-------|----------|
| `shadow-card` | `0 4px 24px 0 rgba(46,0,107,0.08)` | Card default |
| `shadow-card-hover` | `0 8px 32px 0 rgba(46,0,107,0.14)` | Card on hover |
| `shadow-glow` | `0 0 0 3px rgba(255,212,69,0.4)` | Focus ring สำหรับ accent element |
| `shadow-lg` | Tailwind default | Navbar, Modal |
| `shadow-md` | Tailwind default | CTA Button primary |
| `shadow-sm` | Tailwind default | Logo mark, Avatar |

---

## 6. Component Patterns

### Button

| Variant | พื้นหลัง | ตัวอักษร | ใช้สำหรับ |
|---------|---------|---------|----------|
| `primary` | `accent` (#ffd445) | `primary` (ม่วง) + **bold** | CTA หลัก (ยืนยัน, ส่ง) |
| `secondary` | `primary` (ม่วง) | `white` + semibold | Action รอง |
| `ghost` | transparent | `primary` + border | Outline/ยกเลิก |
| `danger` | `red-600` | `white` | ลบ, อันตราย |

```css
/* ทุก button ใช้ร่วม */
transition: all 150ms
border-radius: rounded-xl (sm/md) หรือ rounded-2xl (lg)
disabled: opacity-50, cursor-not-allowed
```

### Badge / Chip

```html
<!-- Pending -->
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-amber-700">
  รอดำเนินการ
</span>

<!-- Done -->
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
  เสร็จสิ้น
</span>
```

### Input / Textarea

```css
border: 1px solid #e5e7eb (gray-200)
border-radius: rounded-xl
padding: px-4 py-2.5
font-size: text-sm
focus: ring-2 ring-primary/30, border-transparent
disabled: bg-gray-50
```

### Modal / Dialog

```css
overlay: fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
panel: bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4
```

### Table

```css
thead th: text-xs font-semibold text-black/40 uppercase tracking-wide px-4 py-3
tbody tr: border-b border-gray-100 hover:bg-gray-50
td: px-4 py-3 text-sm
```

### Progress Bar

```css
track: bg-gray-100 rounded-full h-1.5
fill: bg-primary (or bg-accent for header) rounded-full
```

---

## 7. Iconography

ใช้ **Heroicons** (Outline style, strokeWidth 2–2.5)

```html
<!-- ตัวอย่าง: ไอคอนโรงเรียน (ใน Logo) -->
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
  <path strokeLinecap="round" strokeLinejoin="round"
    d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904..." />
</svg>
```

ขนาดที่ใช้: `w-4 h-4` (inline), `w-5 h-5` (default), `w-6 h-6` (prominent)

---

## 8. Animation

| Token | Definition | ใช้สำหรับ |
|-------|-----------|----------|
| `animate-fade-in` | `opacity: 0→1, 0.3s ease-out` | Page/card appear |
| `animate-slide-up` | `opacity+translateY(16px)→0, 0.4s ease-out` | Card stagger (question list) |
| `animate-spin` | Tailwind default | Loading spinner |
| Stagger delay | `style="animation-delay: Xms"` | รายการที่เรียงลำดับ |

```css
/* transition มาตรฐาน */
transition: all 150ms   /* button, icon */
transition: all 200ms   /* card shadow */
transition: all 300ms   /* progress bar width */
```

---

## 9. Logo Mark

```
┌──────────────────┐
│  [สี่เหลี่ยม accent (#ffd445)]  ← w-8 h-8 rounded-xl
│    [ไอคอน academic cap สี primary]
└──────────────────┘
ข้อความ: "ระบบประเมินครู"  font-bold text-lg text-white
```

- Logo อยู่ใน Navbar (bg-primary)
- Hover: ข้อความเปลี่ยนเป็น `text-accent`

---

## 10. Rating Scale (Emoji Face)

สเกล 1–5 แทนด้วย emoji + label ภาษาไทย:

| ค่า | Emoji | Label | สี (inactive) | สี (active) |
|-----|-------|-------|--------------|------------|
| 1 | 😞 | ปรับปรุง | red-100 / red-300 / red-600 | red-500 / white |
| 2 | 😕 | พอใช้ | orange-100 / orange-300 / orange-600 | orange-500 / white |
| 3 | 🙂 | ดี | yellow-100 / yellow-300 / yellow-700 | yellow-400 / white |
| 4 | 😊 | ดีมาก | lime-100 / lime-300 / lime-700 | lime-500 / white |
| 5 | 😄 | ดีเยี่ยม | green-100 / green-300 / green-700 | green-500 / white |

```css
/* ปุ่มแต่ละตัว */
border-radius: rounded-2xl
border: 2px
padding: px-3 py-2.5
min-width: 60px
selected scale: scale-105 + shadow-md
emoji: text-2xl
label: text-[11px] font-semibold
```

---

## 11. Color Usage Rules

```
Navbar / Header bar     → bg-primary (#2e006b)
Page background         → bg-gray-50
Card / Content area     → bg-white
Primary CTA button      → bg-accent text-primary  ← สลับกัน (เหลืองบนม่วง)
Heading text            → text-primary
Body text               → text-black/70 หรือ text-black/60
Caption / Hint text     → text-black/40
Icon on primary bg      → text-white หรือ text-accent
Border (card)           → border-gray-100
Border (input)          → border-gray-200
```

---

## 12. Quick-Start Tailwind Config

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "#2e006b",
        50: "#f3eeff", 100: "#e4d8ff", 200: "#ccb6ff",
        300: "#aa85ff", 400: "#8a4fff", 500: "#722bff",
        600: "#6209ff", 700: "#5500e8", 800: "#4500bf",
        900: "#2e006b", 950: "#1a003d",
      },
      accent: {
        DEFAULT: "#ffd445",
        50: "#fffbeb", 100: "#fff3c4", 200: "#ffe88a",
        300: "#ffd445", 400: "#ffc41a", 500: "#f9a800",
        600: "#dd7e00", 700: "#b75700", 800: "#943f00", 900: "#7a3400",
      },
      "base-white": "#ffffff",
      "base-black": "#000000",
    },
    fontFamily: {
      sans: ["Inter", "Sarabun", "sans-serif"],
    },
    borderRadius: {
      "2xl": "1rem",
      "3xl": "1.5rem",
    },
    boxShadow: {
      card: "0 4px 24px 0 rgba(46,0,107,0.08)",
      "card-hover": "0 8px 32px 0 rgba(46,0,107,0.14)",
      glow: "0 0 0 3px rgba(255,212,69,0.4)",
    },
    animation: {
      "fade-in": "fadeIn 0.3s ease-out",
      "slide-up": "slideUp 0.4s ease-out",
    },
    keyframes: {
      fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      slideUp: {
        "0%": { opacity: "0", transform: "translateY(16px)" },
        "100%": { opacity: "1", transform: "translateY(0)" },
      },
    },
  },
}
```

---

## 13. Global CSS (globals.css)

```css
@layer base {
  :root { --font-inter: "Inter", "Sarabun", sans-serif; }
  html { @apply antialiased; }
  body { @apply bg-gray-50 text-base-black font-sans; }
}

@layer components {
  .page-container {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
  }
  .card {
    @apply bg-base-white rounded-2xl shadow-card p-6 border border-gray-100;
  }
  .card-hover {
    @apply card transition-shadow duration-200 hover:shadow-card-hover;
  }
  .badge-pending {
    @apply inline-flex items-center gap-1.5 px-3 py-1 rounded-full
           text-xs font-semibold bg-accent/20 text-amber-700;
  }
  .badge-done {
    @apply inline-flex items-center gap-1.5 px-3 py-1 rounded-full
           text-xs font-semibold bg-green-100 text-green-700;
  }
}
```

---

## 14. Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

*สร้างจาก codebase: /evaluate — อัปเดต 2026-06-24*

---
name: Anki Chinese Learning Design System
description: Modern, vibrant, Duolingo-inspired high-contrast design system supporting Light Mode, Dark Mode, and Auto System Theme.
colors:
  # Light Palette
  bg-light: "#F7F9FA"
  card-bg-light: "#FFFFFF"
  card-border-light: "#E5E9ED"
  card-shadow-light: "#D8E0E8"
  text-primary-light: "#1F2937"
  text-muted-light: "#6B7280"
  
  # Dark Palette
  bg-dark: "#131F24"
  card-bg-dark: "#1F2C34"
  card-border-dark: "#2B3D4F"
  card-shadow-dark: "#18242B"
  text-primary-dark: "#F0F3F6"
  text-muted-dark: "#9CA3AF"

  # Brand & Status Accents
  green: "#58CC02"
  green-dark: "#58A700"
  blue: "#1CB0F6"
  blue-dark: "#1899D6"
  yellow: "#FFC800"
  yellow-dark: "#E6B400"
  red: "#FF4B4B"
  red-dark: "#EA2B2B"
  purple: "#CE82FF"
  purple-dark: "#A568CC"

typography:
  chinese-hero: { fontFamily: System, fontSize: 64px, fontWeight: 800, lineHeight: 1.1 }
  chinese-card: { fontFamily: System, fontSize: 44px, fontWeight: 800, lineHeight: 1.1 }
  title-xl: { fontFamily: System, fontSize: 28px, fontWeight: 800, lineHeight: 1.2 }
  title-lg: { fontFamily: System, fontSize: 22px, fontWeight: 800, lineHeight: 1.25 }
  title-md: { fontFamily: System, fontSize: 18px, fontWeight: 700, lineHeight: 1.3 }
  body-md: { fontFamily: System, fontSize: 16px, fontWeight: 600, lineHeight: 1.4 }
  caption: { fontFamily: System, fontSize: 13px, fontWeight: 600, lineHeight: 1.4 }

rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px

components:
  duolingo-button-primary:
    backgroundColor: "{colors.green}"
    bottomBorderColor: "{colors.green-dark}"
    rounded: "{rounded.lg}"
    padding: 16px
  duolingo-button-secondary:
    backgroundColor: "{colors.blue}"
    bottomBorderColor: "{colors.blue-dark}"
    rounded: "{rounded.lg}"
    padding: 16px
  card-container:
    rounded: "{rounded.xl}"
    padding: 16px
---

# Anki Chinese Learning — Design System Spec

## Overview
Anki Chinese is a high-energy, touch-first mobile vocabulary learning application inspired by modern gamified platforms (Duolingo, Linear). The design system emphasizes high contrast, crisp typography, physical 3D button depths (tactile feedback), and tactile haptics.

This design system supports **3 Theme Modes**:
1. **Light Mode**: Clean, bright slate-white canvas (`#F7F9FA`) with high contrast dark slate text (`#1F2937`).
2. **Dark Mode**: Deep OLED charcoal canvas (`#131F24`) with soft card surfaces (`#1F2C34`) and crisp light text (`#F0F3F6`).
3. **Auto / System Mode**: Automatically syncs with the device's native iOS/Android system appearance preference.

---

## Colors

### Theme Palettes

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg` | `#F7F9FA` | `#131F24` | Main screen background canvas |
| `cardBg` | `#FFFFFF` | `#1F2C34` | Cards, modals, lists, navigation bars |
| `cardBorder` | `#E5E9ED` | `#2B3D4F` | Card and divider outline stroke |
| `cardShadow` | `#D8E0E8` | `#18242B` | 3D physical bottom border depth |
| `textPrimary` | `#1F2937` | `#F0F3F6` | Primary headers, word characters, titles |
| `textMuted` | `#6B7280` | `#9CA3AF` | Secondary labels, pinyin, translations |

### Brand & Status Accents (Consistent Across Themes)

- **Primary Green (`#58CC02` / `#58A700`):** Start learning, confirm, correct answer, positive progress.
- **Action Blue (`#1CB0F6` / `#1899D6`):** Secondary action, active selection, AI generation, practice mode.
- **Reward Yellow (`#FFC800` / `#E6B400`):** XP streak, badges, star ratings, arcade scores.
- **Error Red (`#FF4B4B` / `#EA2B2B`):** Destructive actions, wrong answers, deletion confirmation.
- **Special Purple (`#CE82FF` / `#A568CC`):** Grammar tips, radical breakdowns, special badges.

---

## Typography

- **Chinese Hero (`64px`, `800` weight):** Main flashcard study view.
- **Chinese Card (`44px`, `800` weight):** Deck list, practice cards.
- **Title XL (`28px`, `800` weight):** Screen header titles.
- **Title LG (`22px`, `800` weight):** Modal titles, section headers.
- **Title MD (`18px`, `700` weight):** Card item titles, button texts.
- **Body MD (`16px`, `600` weight):** Explanations, translations, example sentences.
- **Caption (`13px`, `600` weight):** Pinyin labels, timestamps, meta badges.

---

## Layout & Spacing

- **Base Grid:** 4pt grid system (`xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 24px`, `xxl: 32px`).
- **Touch Target Minimum:** All interactive buttons and cards have a minimum touch area of `48pt x 48pt` with at least `8px` gap between adjacent targets (Fitts' Law).
- **Safe Area:** Respects iOS notch/dynamic island and Android status/navigation bars.

---

## Elevation & Depth

- **Tactile 3D Buttons:** Buttons feature a `3px` to `4px` solid bottom shadow (`borderBottomWidth: 4`, `borderColor: shadowColor`) that compresses on press (`translateY: 2px`).
- **Surface Layering:** Card surfaces use explicit border strokes (`cardBorder`) and subtle background contrast instead of heavy blurry drop shadows, ensuring 60fps scrolling on low-end mobile devices.

---

## Shapes

- **Small (`8px`):** Tags, chips, input fields.
- **Medium (`12px`):** Sub-cards, option items, popup alerts.
- **Large (`16px`):** Main buttons, flashcard items, deck items.
- **Extra Large (`24px`):** Main study cards, bottom sheets, modals.
- **Full (`999px`):** Circular progress rings, avatar badges, pill toggles.

---

## Components

### Theme Switcher Segmented Control
- Displays 3 choices: **Tự động (OS)** | **Sáng (Light)** | **Tối (Dark)**.
- Active option uses high-contrast pill highlight with tactile haptic feedback on tap.

### Duolingo Button (`DuolingoButton`)
- `primary` (Green), `secondary` (Blue), `danger` (Red), `outline` (Surfaced).
- Features 3D push-down animation (`useNativeDriver: true`) + haptic feedback.

### Flashcard View (`Flashcard`)
- High contrast Chinese character display.
- Smooth flip transition (`useNativeDriver: true`).

---

## Do's and Don'ts

- **DO** use semantic theme hooks (`useTheme()`) in all UI components instead of hardcoded hex values.
- **DO** maintain at least 4.5:1 WCAG AA contrast ratio in both Light and Dark modes.
- **DON'T** hardcode `#131F24` or `#FFFFFF` in component styles. Always use `theme.bg`, `theme.cardBg`, `theme.textPrimary`, `theme.textMuted`.
- **DO** test thumb-zone reachability on mobile screens. Primary CTAs must remain near the bottom of the viewport.

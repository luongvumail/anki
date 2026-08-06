---
name: Duolingo 3D Tactile Spaced Repetition (Dark Mode)
version: 1.1.0
colors:
  primary: "#58CC02"
  primary-dark: "#58A700"
  secondary: "#1CB0F6"
  secondary-dark: "#1899D6"
  warning: "#FFC800"
  warning-dark: "#E6B400"
  danger: "#FF4B4B"
  danger-dark: "#EA2B2B"
  purple: "#CE82FF"
  purple-dark: "#A568CC"
  neutral-bg: "#131F24"
  neutral-soft: "#1F2C34"
  card-bg: "#1F2C34"
  card-border: "#2B3D4F"
  text-primary: "#F0F3F6"
  text-muted: "#777777"
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
  duolingo-button-3d:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 14px
---

# Duolingo 3D Tactile Anki

## Overview

A playful, tactile 3D interface inspired by Duolingo for spaced repetition Chinese learning.
Features 3D pressable buttons with bottom shadow depths, clear color-coded FSRS action feedback, high contrast typography on sleek dark background (`#131F24`), and responsive haptic micro-animations.

## Colors

- **Primary Green (#58CC02 / #58A700):** Used for Good rating button, XP gains, mastery indicators, and completion triggers.
- **Secondary Blue (#1CB0F6 / #1899D6):** Used for Easy rating button, navigation pills, primary actions, and active deck status.
- **Warning Yellow (#FFC800 / #E6B400):** Used for Hard rating button, streak counters, and repair stage badges.
- **Danger Red (#FF4B4B / #EA2B2B):** Used for Again rating button, reset actions, and errors.
- **Purple Accent (#CE82FF / #A568CC):** Used for level badge highlights and special achievements.
- **Dark Canvas (#131F24 & #1F2C34):** Soft dark mode background and tactile cards (`#2B3D4F` border) preventing eye strain.

## Elevation & Depth

- **3D Pressable Effect:** Buttons feature a 3-4px bottom border in a darker tint of the face color. On press, the button translates down 3px with zero elevation jump.

## Do's and Don'ts

- **Do** show human-readable FSRS time intervals (`Again 10m`, `Hard 1.2d`, `Good 3.5d`, `Easy 8d`) on the 3D buttons.
- **Do** trigger light haptic feedback on button press using `expo-haptics`.
- **Don't** use light background colors for main screens.
- **Don't** use flat monochrome buttons for review actions.

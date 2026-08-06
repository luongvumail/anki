---
name: Duolingo 3D Tactile Spaced Repetition
version: 1.0.0
colors:
  primary: "#58CC02"
  primary-dark: "#46A302"
  secondary: "#1CB0F6"
  secondary-dark: "#1899D6"
  warning: "#FFC800"
  warning-dark: "#E5B200"
  danger: "#FF4B4B"
  danger-dark: "#EA2B2B"
  neutral: "#F7F9FA"
  card-bg: "#FFFFFF"
  text-primary: "#4B5563"
  text-heading: "#1F2937"
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  duolingo-button-3d:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 14px
---

# Duolingo 3D Tactile Anki

## Overview
A playful, tactile 3D interface inspired by Duolingo for spaced repetition Chinese learning.
Features 3D pressable buttons with bottom shadow depths, clear color-coded FSRS action feedback, high contrast typography, and responsive micro-animations.

## Colors
- **Primary Green (#58CC02 / #46A302):** Used for Good rating button, XP gains, and completion triggers.
- **Secondary Blue (#1CB0F6 / #1899D6):** Used for Easy rating button, navigation pills, and active deck status.
- **Warning Yellow (#FFC800 / #E5B200):** Used for Hard rating button, streak counters, and warnings.
- **Danger Red (#FF4B4B / #EA2B2B):** Used for Again rating button, reset actions, and errors.
- **Neutral Light (#F7F9FA):** Soft background preventing eye strain.

## Elevation & Depth
- **3D Pressable Effect:** Buttons feature a 4px bottom border in a darker tint of the face color. On press, the button translates down 3px with zero elevation jump.

## Do's and Don'ts
- **Do** show human-readable FSRS time intervals (`Again 10m`, `Hard 1.2d`, `Good 3.5d`, `Easy 8d`) on the 3D buttons.
- **Do** trigger light haptic feedback on button press using `expo-haptics`.
- **Don't** use flat monochrome buttons for review actions.

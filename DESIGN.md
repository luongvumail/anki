---
name: Anki Chinese Learning Design System
description: Ultra-clean, borderless, unified design system with subtle background surface contrast, 2 button tiers (Primary & Secondary), and zero visual clutter for Light, Dark, and System Theme.
colors:
  # Light Palette
  bg-light: "#F8FAFC"
  bg-soft-light: "#F1F5F9"
  card-bg-light: "#FFFFFF"
  card-border-light: "transparent"
  text-primary-light: "#0F172A"
  text-muted-light: "#64748B"
  
  # Dark Palette
  bg-dark: "#0F172A"
  bg-soft-dark: "#1E293B"
  card-bg-dark: "#1E293B"
  card-border-dark: "transparent"
  text-primary-dark: "#F8FAFC"
  text-muted-dark: "#94A3B8"

  # Core Accents (Unified)
  blue: "#0EA5E9"
  green: "#10B981"
  red: "#EF4444"
  amber: "#F59E0B"

typography:
  hanzi-hero: { fontFamily: System, fontSize: 64px, fontWeight: 800, lineHeight: 72px }
  hanzi-card: { fontFamily: System, fontSize: 44px, fontWeight: 800, lineHeight: 52px }
  title-xl: { fontFamily: System, fontSize: 24px, fontWeight: 800, lineHeight: 30px }
  title-lg: { fontFamily: System, fontSize: 20px, fontWeight: 800, lineHeight: 26px }
  title-md: { fontFamily: System, fontSize: 16px, fontWeight: 700, lineHeight: 22px }
  body-md: { fontFamily: System, fontSize: 15px, fontWeight: 500, lineHeight: 22px }
  caption: { fontFamily: System, fontSize: 12px, fontWeight: 600, lineHeight: 16px }
  caption2: { fontFamily: System, fontSize: 11px, fontWeight: 700, lineHeight: 14px }

rounded:
  sm: 8px
  md: 12px
  lg: 16px
  full: 999px

spacing:
  xs: 4px
  sm: 8px
  cellPadding: 12px
  md: 12px
  lg: 16px
  xl: 24px
  pageMargin: 16px

borderWidths:
  none: 0px

components:
  card-surface:
    rounded: "{rounded.lg}"
    padding: 16px
    borderWidth: 0px
    backgroundColor: "{colors.card-bg-light}"
  button-primary:
    backgroundColor: "{colors.blue}"
    rounded: "{rounded.lg}"
    padding: 14px
  button-secondary:
    backgroundColor: "{colors.bg-soft-light}"
    rounded: "{rounded.lg}"
    padding: 14px
---

# Anki Chinese Learning — Minimal & Unified Design Spec

## Overview
Anki Chinese adopts a minimal, highly unified design aesthetic. It eliminates explicit colored borders, 3D bottom effects, and visual clutter. Cards rely on subtle surface background contrast (`cardBg` vs `bg`), while buttons are consolidated into 2 primary tiers (Primary Accent & Secondary Soft).

---

## Design Principles

1. **Zero Border Colors**: Cards and containers use pure surface fills without explicit border outlines or 3D bottom strokes.
2. **Unified 2-Tier Buttons**:
   - **Primary**: Solid accent fill (`theme.blue` / `theme.green`) with crisp white text.
   - **Secondary**: Soft surface fill (`theme.bgSoft`) with primary text color (`theme.textPrimary`).
3. **Subtle Surface Contrast**: Surfaces use smooth ambient elevation shadows or soft background fills instead of stark lines.

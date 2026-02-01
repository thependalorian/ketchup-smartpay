/**
 * Complete Design System Specification for Buffr App
 *
 * Location: constants/DesignSystem.ts
 * Purpose: Centralized design tokens extracted from wireframes and aligned with Apple Human Interface Guidelines (HIG).
 * This file serves as the single source of truth for all UI/UX design specifications.
 *
 * Based on comprehensive wireframe analysis of 259+ SVG files and 22 Card Design SVG files.
 *
 * Date: January 26, 2026
 * Version: 1.0
 */

import { Platform } from 'react-native';

// --- 🎨 Color System ---
export const Colors = {
  // Primary Colors (from wireframes, 50-900 scale)
  PRIMARY: {
    50: '#ECE3FE',   // Very light (backgrounds)
    100: '#D6E3FE',  // Light (subtle backgrounds)
    200: '#B5E3FE',  // Lighter (hover states)
    300: '#96E3FC',  // Light (disabled states)
    400: '#5BE3F8',  // Medium-light
    500: '#3B82F6',  // Base (buttons, links)
    600: '#2563EB',  // Medium (active states)
    700: '#1D4ED8',  // Dark (pressed states)
    800: '#0029D6',  // Primary (main brand)
    900: '#001A8A',  // Darkest (text on light)
  },

  // Semantic Colors (from wireframes)
  SEMANTIC: {
    success: '#10B981',
    error: '#E11D48',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  // Text Colors (from wireframes)
  TEXT: {
    primary: '#020617',       // Very dark blue/black
    secondary: '#64748B',     // Slate gray
    tertiary: '#94A3B8',      // Light slate
    dark: '#1E293B',          // Dark slate (for emphasis)
    medium: '#475569',        // Medium gray (for labels)
    disabled: '#94A3B8CC',    // Tertiary with 80% opacity
    link: '#0029D6',          // Primary blue
    linkPressed: '#1D4ED8',   // Primary dark
    white: '#FFFFFF',         // White text
  },

  // Background Colors (from wireframes)
  BACKGROUND: {
    primary: '#F8FAFC',       // Off-white
    secondary: '#F1F5F9',     // Light gray
    card: '#FFFFFF',          // White
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  },

  // Border Colors (from wireframes)
  BORDER: {
    default: '#E2E8F0',       // Light border
    light: '#F1F5F9',         // Very light border
    dark: '#334155',          // Dark mode border
  },

  // System Colors (Apple HIG - for adaptive light/dark mode)
  SYSTEM: {
    label: Platform.select({ ios: 'label', android: '#000000' }),
    secondaryLabel: Platform.select({ ios: 'secondaryLabel', android: '#64748B' }),
    tertiaryLabel: Platform.select({ ios: 'tertiaryLabel', android: '#94A3B8' }),
    systemBackground: Platform.select({ ios: 'systemBackground', android: '#FFFFFF' }),
    secondarySystemBackground: Platform.select({ ios: 'secondarySystemBackground', android: '#F1F5F9' }),
    systemBlue: Platform.select({ ios: 'systemBlue', android: '#007AFF' }),
    systemGreen: Platform.select({ ios: 'systemGreen', android: '#34C759' }),
    systemRed: Platform.select({ ios: 'systemRed', android: '#FF3B30' }),
    systemOrange: Platform.select({ ios: 'systemOrange', android: '#FF9500' }),
  },
};

// --- 🔤 Typography System ---
// Font Family & Weights (Apple HIG Standard)
export const Typography = {
  FONT_FAMILY: Platform.select({
    ios: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
    default: 'System', // Fallback for Android
  }),
  MONOSPACE_FONT_FAMILY: Platform.select({
    ios: '"SF Mono", "Menlo", "Monaco", "Courier New", monospace',
    default: 'monospace',
  }),
  FONT_WEIGHTS: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  // Type Scale (Apple HIG)
  FONT_SIZES: {
    display: 34, // Large Title
    h1: 28,      // Title 1
    h2: 22,      // Title 2
    h3: 20,      // Title 3
    h4: 17,      // Headline / Body
    h5: 15,      // Subheadline / Callout
    h6: 13,      // Footnote / Caption 1
    caption2: 11, // Caption 2
  },
  LINE_HEIGHTS: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
  LETTER_SPACING: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// --- 📐 Spacing & Layout System (8pt Grid - Apple HIG) ---
export const Spacing = {
  xs: 4,      // 0.5×8pt
  sm: 8,      // 1×8pt
  md: 16,     // 2×8pt
  lg: 20,     // 2.5×8pt (found in wireframes)
  xl: 24,     // 3×8pt
  '2xl': 32,  // 4×8pt (SECTION_SPACING)
  '3xl': 40,  // 5×8pt (LARGE_SECTION_SPACING)
  '4xl': 48,  // 6×8pt
  '5xl': 64,  // 8×8pt
};

export const Layout = {
  SCREEN_WIDTH: 393,         // iPhone standard
  SCREEN_HEIGHT: 1120,       // iPhone standard (includes safe areas)
  HORIZONTAL_PADDING: 16.5,  // From wireframes (x="16.5")
  CARD_GAP: 17,              // Calculated gap between 3-column cards
  COMPACT_GAP: 8,            // For 5-column utility grid
  SECTION_SPACING: 32,       // Matches Spacing['2xl']
  LARGE_SECTION_SPACING: 40, // Matches Spacing['3xl']
  TOUCH_TARGET_MIN: 44,      // Apple HIG minimum touch target
};

// --- 🎯 Component Specifications ---
export const Components = {
  CARDS: {
    wallet: {
      width: 108.667,
      height: 95,
      borderRadius: 11.5,
      padding: 16,
      backgroundColor: Colors.BACKGROUND.primary,
      borderColor: Colors.BORDER.light,
      borderWidth: 1,
    },
    balance: {
      width: 279,
      height: 63,
      borderRadius: 11.5,
      padding: 16,
      backgroundColor: Colors.BACKGROUND.card,
      borderColor: Colors.BORDER.default,
    },
    borderRadius: 11.5, // General card border radius
    padding: 16,
  },
  BUTTONS: {
    height: {
      small: 36,
      medium: 44, // Apple HIG minimum
      large: 52,
    },
    borderRadius: {
      standard: 12,
      pill: 20,
    },
    padding: {
      horizontal: 20,
      vertical: 12,
    },
    fontSize: 17,
    fontWeight: Typography.FONT_WEIGHTS.semibold,
    strokeWidth: 1.5,
  },
  INPUTS: {
    height: {
      small: 40,
      medium: 48,
      large: 56,
    },
    borderRadius: 12,
    borderWidth: 1,
    borderWidthThick: 1.5,
    borderColor: Colors.BORDER.default,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  ICONS: {
    library: 'SF Symbols', // Apple HIG preferred
    fallback: 'FontAwesome', // Current implementation
    size: {
      small: 16,
      medium: 20,
      large: 24,
      xlarge: 28,
      xxlarge: 32,
    },
    color: {
      default: Colors.TEXT.primary,
      secondary: Colors.TEXT.secondary,
      primary: Colors.PRIMARY[800],
      active: Colors.PRIMARY[600],
    },
    strokeWidth: 1.5,
    touchTarget: Layout.TOUCH_TARGET_MIN,
  },
};

// --- 🎭 Visual Effects ---
export const VisualEffects = {
  SHADOWS: {
    sm: { offset: { width: 0, height: 1 }, opacity: 0.05, radius: 2 },
    md: { offset: { width: 0, height: 2 }, opacity: 0.1, radius: 8 },
    lg: { offset: { width: 0, height: 4 }, opacity: 0.1, radius: 12 },
    xl: { offset: { width: 0, height: 8 }, opacity: 0.15, radius: 16 },
  },
  GLASS: {
    blurIntensity: 80,
    tint: 'light',
    opacity: 0.8,
    borderRadius: 16,
    mixBlendMode: 'soft-light',
  },
  ANIMATIONS: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    easing: 'cubic-bezier(0, 0, 0.58, 1)', // Apple HIG ease-out
  },
};

// --- 📱 Screen Specifications ---
export const Screens = {
  HOME: {
    width: Layout.SCREEN_WIDTH,
    height: Layout.SCREEN_HEIGHT,
    headerHeight: 140,
    horizontalPadding: Layout.HORIZONTAL_PADDING,
  },
  WALLET_GRID: {
    cardWidth: Components.CARDS.wallet.width,
    cardHeight: Components.CARDS.wallet.height,
    cardGap: Layout.CARD_GAP,
    columns: 3,
    borderRadius: Components.CARDS.borderRadius,
  },
};

// --- 📋 Additional Critical Specifications ---
export const AdditionalSpecs = {
  ACCESSIBILITY: {
    touchTargetMin: Layout.TOUCH_TARGET_MIN,
    colorContrastMin: 4.5, // WCAG AA for normal text
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  Layout,
  Components,
  VisualEffects,
  Screens,
  AdditionalSpecs,
};
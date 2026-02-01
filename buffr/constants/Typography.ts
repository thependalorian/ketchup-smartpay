/**
 * Buffr Typography System
 * UX Psychology-Driven Design System for React Native Expo
 *
 * @description
 * Formal typography system with 1.25 modular scale (base 14px),
 * platform-specific font families, and psychology annotations.
 *
 * @psychology
 * - Serial Position Effect: Headings draw attention to section starts
 * - Cognitive Load: Consistent hierarchy reduces mental effort
 * - Von Restorff Effect: Display sizes create memorable emphasis
 * - Aesthetic-Usability: Harmonious scale improves perceived usability
 *
 * @see SKILL.md for full psychology documentation
 */
import { Platform, StyleSheet, TextStyle } from 'react-native';

// =============================================================================
// FONT FAMILY
// =============================================================================

/**
 * Platform-specific font families
 * Uses system fonts for optimal performance and familiarity (Jakob's Law)
 */
export const FontFamily = {
  /** System font - Platform default */
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }) as string,

  /** Monospace - For amounts and codes (Miller's Law: improves number chunking) */
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,
};

// =============================================================================
// FONT WEIGHT
// =============================================================================

/**
 * Font weight constants
 * Limited to 4 weights to reduce cognitive load (Hick's Law)
 */
export const FontWeight = {
  /** Regular - Body text, descriptions */
  regular: '400' as TextStyle['fontWeight'],

  /** Medium - Subtle emphasis, labels */
  medium: '500' as TextStyle['fontWeight'],

  /** SemiBold - Strong emphasis, subheadings */
  semibold: '600' as TextStyle['fontWeight'],

  /** Bold - Maximum emphasis, headings, amounts */
  bold: '700' as TextStyle['fontWeight'],
};

// =============================================================================
// FONT SIZE (1.25 Modular Scale)
// =============================================================================

/**
 * Font sizes using 1.25 modular scale
 * Base: 14px | Ratio: 1.25 (Major Third)
 *
 * @psychology
 * - Mathematical harmony creates aesthetic appeal (Aesthetic-Usability)
 * - Predictable scale reduces decision fatigue (Hick's Law)
 *
 * Calculation:
 * - xs: 14 ÷ 1.25² ≈ 9 → 10 (rounded up for readability)
 * - sm: 14 ÷ 1.25 ≈ 11 → 12 (rounded)
 * - base: 14 (base)
 * - md: 14 × 1.25 ≈ 17.5 → 18 (rounded)
 * - lg: 14 × 1.25² ≈ 21.9 → 22 (rounded)
 * - xl: 14 × 1.25³ ≈ 27.3 → 28 (rounded)
 * - 2xl: 14 × 1.25⁴ ≈ 34.2 → 35 (rounded)
 * - 3xl: 14 × 1.25⁵ ≈ 42.7 → 44 (rounded)
 * - 4xl: 14 × 1.25⁶ ≈ 53.4 → 55 (rounded)
 */
export const FontSize = {
  /** 10px - Micro labels, timestamps, badges */
  xs: 10,

  /** 12px - Captions, helper text, metadata */
  sm: 12,

  /** 14px - Body text, descriptions (base) */
  base: 14,

  /** 18px - Emphasized text, list titles */
  md: 18,

  /** 22px - Section headings, card titles */
  lg: 22,

  /** 28px - Screen titles, major headings */
  xl: 28,

  /** 35px - Large headings, hero sections */
  '2xl': 35,

  /** 44px - Hero text, primary amounts */
  '3xl': 44,

  /** 55px - Display text, maximum emphasis */
  '4xl': 55,
} as const;

// =============================================================================
// LINE HEIGHT
// =============================================================================

/**
 * Line height ratios
 * Applied as multipliers of font size
 */
export const LineHeight = {
  /** 1.0 - Display text, single line headings */
  none: 1.0,

  /** 1.2 - Tight spacing for large text */
  tight: 1.2,

  /** 1.35 - Comfortable for headings */
  snug: 1.35,

  /** 1.5 - Optimal for body text (research-backed) */
  normal: 1.5,

  /** 1.625 - Generous spacing for readability */
  relaxed: 1.625,

  /** 1.75 - Maximum spacing for accessibility */
  loose: 1.75,
} as const;

// =============================================================================
// LETTER SPACING
// =============================================================================

/**
 * Letter spacing values (tracking)
 * Measured in pixels
 */
export const LetterSpacing = {
  /** Tight tracking for large display text */
  tighter: -1.0,

  /** Slightly tight for headings */
  tight: -0.5,

  /** Normal tracking for body text */
  normal: 0,

  /** Wide tracking for small caps/labels */
  wide: 0.5,

  /** Extra wide for uppercase labels */
  wider: 1.0,
} as const;

// =============================================================================
// TYPOGRAPHY PRESETS
// =============================================================================

/**
 * Typography StyleSheet presets
 * Each preset includes psychology annotations for developer reference
 */
export const Typography = StyleSheet.create({
  // ---------------------------------------------------------------------------
  // DISPLAY STYLES (Von Restorff Effect - Distinctive, memorable)
  // ---------------------------------------------------------------------------

  /**
   * @psychology Von Restorff Effect
   * @usage Hero sections, splash screens, primary focus
   */
  displayLarge: {
    fontFamily: FontFamily.system,
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tighter,
  },

  /**
   * @psychology Von Restorff Effect
   * @usage Major section headers, feature highlights
   */
  displayMedium: {
    fontFamily: FontFamily.system,
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
  },

  /**
   * @psychology Von Restorff Effect
   * @usage Secondary hero text, promotional content
   */
  displaySmall: {
    fontFamily: FontFamily.system,
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize['2xl'] * LineHeight.snug,
    letterSpacing: LetterSpacing.tight,
  },

  // ---------------------------------------------------------------------------
  // HEADING STYLES (Serial Position Effect - Structure & hierarchy)
  // ---------------------------------------------------------------------------

  /**
   * @psychology Serial Position Effect
   * @usage Screen titles, primary navigation
   */
  headingLarge: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.xl * LineHeight.snug,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Serial Position Effect
   * @usage Card titles, section headers
   */
  headingMedium: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.lg * LineHeight.snug,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Serial Position Effect
   * @usage Subsection titles, list headers
   */
  headingSmall: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.md * LineHeight.snug,
    letterSpacing: LetterSpacing.normal,
  },

  // ---------------------------------------------------------------------------
  // BODY STYLES (Cognitive Load - Optimized readability)
  // ---------------------------------------------------------------------------

  /**
   * @psychology Cognitive Load Reduction
   * @usage Long-form content, descriptions, paragraphs
   */
  bodyLarge: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.md * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Cognitive Load Reduction
   * @usage Primary body text, list items, form values
   */
  bodyMedium: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Cognitive Load Reduction
   * @usage Secondary content, metadata, compact lists
   */
  bodySmall: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  },

  // ---------------------------------------------------------------------------
  // LABEL STYLES (Gestalt Proximity - Groups related content)
  // ---------------------------------------------------------------------------

  /**
   * @psychology Gestalt Proximity
   * @usage Form labels, section labels, navigation items
   */
  labelLarge: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.snug,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Gestalt Proximity
   * @usage Input labels, list category headers
   */
  labelMedium: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.snug,
    letterSpacing: LetterSpacing.wide,
  },

  /**
   * @psychology Gestalt Proximity
   * @usage Small labels, tags, chips
   */
  labelSmall: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.snug,
    letterSpacing: LetterSpacing.wide,
  },

  // ---------------------------------------------------------------------------
  // CAPTION STYLES (Aesthetic-Usability - Polished details)
  // ---------------------------------------------------------------------------

  /**
   * @psychology Aesthetic-Usability Effect
   * @usage Helper text, descriptions, metadata
   */
  captionLarge: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Aesthetic-Usability Effect
   * @usage Timestamps, micro-copy, footnotes
   */
  captionSmall: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
  },

  // ---------------------------------------------------------------------------
  // AMOUNT STYLES (Miller's Law - Fintech-specific, optimized for numbers)
  // ---------------------------------------------------------------------------

  /**
   * @psychology Miller's Law (Chunking)
   * @usage Primary balance, payment confirmation
   */
  amountHero: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.none,
    letterSpacing: LetterSpacing.tight,
  },

  /**
   * @psychology Miller's Law (Chunking)
   * @usage Card balances, wallet totals
   */
  amountLarge: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.xl * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Miller's Law (Chunking)
   * @usage Transaction amounts, list values
   */
  amountMedium: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.md * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Miller's Law (Chunking)
   * @usage Small amounts, secondary values
   */
  amountSmall: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
  },

  // ---------------------------------------------------------------------------
  // BUTTON STYLES (Fitts's Law - Clear, actionable text)
  // ---------------------------------------------------------------------------

  /**
   * @psychology Fitts's Law
   * @usage Primary CTA buttons, large actions
   */
  buttonLarge: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.md * LineHeight.none,
    letterSpacing: LetterSpacing.wide,
  },

  /**
   * @psychology Fitts's Law
   * @usage Standard buttons, form actions
   */
  buttonMedium: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.base * LineHeight.none,
    letterSpacing: LetterSpacing.normal,
  },

  /**
   * @psychology Fitts's Law
   * @usage Small buttons, inline actions, chips
   */
  buttonSmall: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.none,
    letterSpacing: LetterSpacing.normal,
  },

  // ---------------------------------------------------------------------------
  // SPECIAL STYLES
  // ---------------------------------------------------------------------------

  /**
   * @psychology Miller's Law + Aesthetic-Usability
   * @usage OTP inputs, verification codes, PINs
   */
  code: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.xl * LineHeight.none,
    letterSpacing: LetterSpacing.wider,
  },

  /**
   * @psychology Gestalt Similarity
   * @usage Links, interactive text
   */
  link: {
    fontFamily: FontFamily.system,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    textDecorationLine: 'underline' as const,
  },
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a custom text style with base preset modifications
 *
 * @param preset - Base typography preset key
 * @param overrides - Style overrides to apply
 * @returns Combined text style
 *
 * @example
 * const customStyle = createTextStyle('bodyMedium', { color: Colors.primary });
 */
export function createTextStyle(
  preset: keyof typeof Typography,
  overrides: Partial<TextStyle> = {}
): TextStyle {
  return {
    ...Typography[preset],
    ...overrides,
  };
}

/**
 * Calculate line height from font size
 *
 * @param fontSize - Font size in pixels
 * @param ratio - Line height ratio (default: normal)
 * @returns Calculated line height
 */
export function calculateLineHeight(
  fontSize: number,
  ratio: keyof typeof LineHeight = 'normal'
): number {
  return Math.round(fontSize * LineHeight[ratio]);
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type FontSizeKey = keyof typeof FontSize;
export type FontWeightKey = keyof typeof FontWeight;
export type LineHeightKey = keyof typeof LineHeight;
export type LetterSpacingKey = keyof typeof LetterSpacing;
export type TypographyPreset = keyof typeof Typography;

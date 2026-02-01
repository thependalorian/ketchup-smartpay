/**
 * Buffr Shadow System
 * UX Psychology-Driven Design System for React Native Expo
 *
 * @description
 * Platform-specific shadow system with iOS shadow properties and Android elevation,
 * semantic aliases for consistent UI patterns, and psychology annotations.
 *
 * @psychology
 * - Gestalt Figure-Ground: Shadows create visual hierarchy and depth
 * - Aesthetic-Usability Effect: Polished shadows improve perceived quality
 * - Affordance: Elevated elements signal interactivity
 *
 * @platform
 * - iOS: Uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * - Android: Uses elevation (and shadowColor on API 28+)
 *
 * @see SKILL.md for full psychology documentation
 */
import { Platform, ViewStyle } from 'react-native';

// =============================================================================
// SHADOW LEVELS
// =============================================================================

/**
 * Shadow level constants (design tokens)
 * Values represent elevation depth in design points
 */
export const ShadowLevel = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  xxl: 24,
} as const;

// =============================================================================
// SHADOW COLORS
// =============================================================================

/**
 * Shadow color constants
 * Using a neutral dark color for natural-looking shadows
 */
export const ShadowColor = {
  /** Default shadow color - subtle and natural */
  default: '#0F172A',

  /** Primary brand shadow - for branded elements */
  primary: '#2563EB',

  /** Success shadow - for success states */
  success: '#10B981',

  /** Error shadow - for error states */
  error: '#E11D48',

  /** Dark shadow - for high contrast */
  dark: '#000000',
} as const;

// =============================================================================
// PLATFORM SHADOW FACTORIES
// =============================================================================

/**
 * iOS shadow style type
 */
interface IOSShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
}

/**
 * Android shadow style type
 */
interface AndroidShadowStyle {
  elevation: number;
  shadowColor?: string;
}

/**
 * Cross-platform shadow style type
 */
export type ShadowStyle = Partial<IOSShadowStyle & AndroidShadowStyle>;

/**
 * Create iOS-specific shadow
 *
 * @param elevation - Shadow depth level
 * @param color - Shadow color (default: ShadowColor.default)
 * @returns iOS shadow style object
 */
function createIOSShadow(elevation: number, color: string = ShadowColor.default): IOSShadowStyle {
  // iOS shadow formula based on Material Design elevation
  // Opacity increases with elevation for more pronounced shadows
  const opacity = Math.min(0.08 + elevation * 0.015, 0.35);
  const radius = elevation * 0.8;
  const offsetY = elevation * 0.5;

  return {
    shadowColor: color,
    shadowOffset: {
      width: 0,
      height: Math.max(1, Math.round(offsetY)),
    },
    shadowOpacity: opacity,
    shadowRadius: Math.max(1, Math.round(radius)),
  };
}

/**
 * Create Android-specific shadow
 *
 * @param elevation - Shadow depth level
 * @param color - Shadow color (API 28+ support)
 * @returns Android shadow style object
 */
function createAndroidShadow(elevation: number, color: string = ShadowColor.default): AndroidShadowStyle {
  // Android uses elevation directly
  // shadowColor supported on API 28+ (Android 9+)
  return {
    elevation: Math.round(elevation),
    ...(Platform.Version && typeof Platform.Version === 'number' && Platform.Version >= 28
      ? { shadowColor: color }
      : {}),
  };
}

/**
 * Create cross-platform shadow
 *
 * @param elevation - Shadow depth level (0-24)
 * @param color - Optional shadow color
 * @returns Platform-specific shadow style
 *
 * @example
 * const cardShadow = createShadow(4);
 * const brandedShadow = createShadow(8, '#2563EB');
 */
export function createShadow(elevation: number, color?: string): ShadowStyle {
  if (elevation === 0) {
    return {};
  }

  if (Platform.OS === 'ios') {
    return createIOSShadow(elevation, color);
  }
  if (Platform.OS === 'android') {
    return createAndroidShadow(elevation, color);
  }
  return createIOSShadow(elevation, color);
}

/**
 * Create colored shadow for branded elements
 * Uses semi-transparent brand color for subtle glow effect
 *
 * @param color - Brand color for shadow
 * @param elevation - Shadow depth level
 * @returns Platform-specific colored shadow
 *
 * @psychology Aesthetic-Usability Effect - Colored shadows add polish
 */
export function createColoredShadow(color: string, elevation: number = ShadowLevel.md): ShadowStyle {
  return createShadow(elevation, color);
}

// =============================================================================
// SHADOW PRESETS
// =============================================================================

/**
 * Standard shadow presets
 *
 * @psychology
 * - Figure-Ground: Progressive elevation creates depth hierarchy
 * - Affordance: Higher elevation = more interactive/important
 */
export const Shadows = {
  /**
   * No shadow - flat elements
   * @usage Disabled states, embedded elements
   */
  none: createShadow(ShadowLevel.none),

  /**
   * Extra small shadow (1dp)
   * @usage Subtle dividers, minimal elevation
   */
  xs: createShadow(ShadowLevel.xs),

  /**
   * Small shadow (2dp)
   * @usage Cards at rest, inputs, chips
   */
  sm: createShadow(ShadowLevel.sm),

  /**
   * Medium shadow (4dp)
   * @usage Elevated cards, interactive elements
   */
  md: createShadow(ShadowLevel.md),

  /**
   * Large shadow (8dp)
   * @usage Floating elements, dropdowns
   */
  lg: createShadow(ShadowLevel.lg),

  /**
   * Extra large shadow (12dp)
   * @usage Modals, dialogs, bottom sheets
   */
  xl: createShadow(ShadowLevel.xl),

  /**
   * Maximum shadow (24dp)
   * @usage Top-level overlays, navigation drawers
   */
  xxl: createShadow(ShadowLevel.xxl),
} as const;

// =============================================================================
// SEMANTIC SHADOW ALIASES
// =============================================================================

/**
 * Semantic shadow aliases for common UI patterns
 * Maps UI concepts to appropriate shadow levels
 *
 * @psychology
 * - Consistency: Same shadow = same semantic meaning
 * - Gestalt Similarity: Related elements share visual properties
 */
export const SemanticShadows = {
  // ---------------------------------------------------------------------------
  // CARDS
  // ---------------------------------------------------------------------------

  /**
   * Card at rest state
   * @psychology Figure-Ground: Card floats above background
   */
  card: createShadow(ShadowLevel.sm),

  /**
   * Card on hover/focus
   * @psychology Affordance: Elevated = interactive
   */
  cardHover: createShadow(ShadowLevel.md),

  /**
   * Card while pressed
   * @psychology Doherty Threshold: Visual feedback
   */
  cardPressed: createShadow(ShadowLevel.xs),

  // ---------------------------------------------------------------------------
  // BUTTONS
  // ---------------------------------------------------------------------------

  /**
   * Button at rest
   * @psychology Fitts's Law: Clear target affordance
   */
  button: createShadow(ShadowLevel.sm),

  /**
   * Button while pressed
   * @psychology Doherty Threshold: Immediate feedback
   */
  buttonPressed: createShadow(ShadowLevel.xs),

  /**
   * Floating action button
   * @psychology Von Restorff: Distinctive primary action
   */
  fab: createShadow(ShadowLevel.lg),

  // ---------------------------------------------------------------------------
  // INPUTS
  // ---------------------------------------------------------------------------

  /**
   * Input field at rest
   * @usage Text inputs, selects, pickers
   */
  input: createShadow(ShadowLevel.xs),

  /**
   * Input field when focused
   * @psychology Gestalt Figure-Ground: Active state
   */
  inputFocused: createShadow(ShadowLevel.sm),

  // ---------------------------------------------------------------------------
  // OVERLAYS
  // ---------------------------------------------------------------------------

  /**
   * Dropdown menus
   * @usage Pickers, select options, autocomplete
   */
  dropdown: createShadow(ShadowLevel.md),

  /**
   * Modal dialogs
   * @psychology Figure-Ground: Modal above content
   */
  modal: createShadow(ShadowLevel.xl),

  /**
   * Toast notifications
   * @psychology Serial Position: Prominent but non-blocking
   */
  toast: createShadow(ShadowLevel.lg),

  /**
   * Bottom sheet
   * @usage Action sheets, sliding panels
   */
  bottomSheet: createShadow(ShadowLevel.xxl),

  // ---------------------------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------------------------

  /**
   * Header/app bar
   * @psychology Jakob's Law: Familiar navigation pattern
   */
  header: createShadow(ShadowLevel.sm),

  /**
   * Tab bar
   * @usage Bottom navigation
   */
  tabBar: createShadow(ShadowLevel.md),

  /**
   * Navigation drawer
   * @usage Side menu
   */
  drawer: createShadow(ShadowLevel.xxl),

  // ---------------------------------------------------------------------------
  // SPECIAL
  // ---------------------------------------------------------------------------

  /**
   * Wallet/credit card display
   * @psychology Von Restorff: Distinctive financial element
   */
  walletCard: createShadow(ShadowLevel.lg),

  /**
   * Selected/active item
   * @usage Selected list item, active tab
   */
  selected: createShadow(ShadowLevel.md),

  /**
   * Sticky elements
   * @usage Sticky headers, floating buttons
   */
  sticky: createShadow(ShadowLevel.md),
} as const;

// =============================================================================
// BRANDED SHADOWS
// =============================================================================

/**
 * Brand-colored shadow presets
 *
 * @psychology Aesthetic-Usability Effect
 * Colored shadows add premium feel to important elements
 */
export const BrandedShadows = {
  /**
   * Primary brand shadow
   * @usage Primary CTAs, important actions
   */
  primary: createColoredShadow(ShadowColor.primary, ShadowLevel.md),

  /**
   * Large primary shadow
   * @usage Featured elements, hero buttons
   */
  primaryLarge: createColoredShadow(ShadowColor.primary, ShadowLevel.lg),

  /**
   * Success state shadow
   * @usage Successful transactions, confirmations
   */
  success: createColoredShadow(ShadowColor.success, ShadowLevel.sm),

  /**
   * Error state shadow
   * @usage Error states, warnings
   */
  error: createColoredShadow(ShadowColor.error, ShadowLevel.sm),
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Combine shadow with other styles safely
 *
 * @param shadow - Shadow preset or custom shadow
 * @param styles - Additional ViewStyle properties
 * @returns Combined style object
 *
 * @example
 * const cardStyle = withShadow(Shadows.card, { borderRadius: 12 });
 */
export function withShadow(shadow: ShadowStyle, styles: ViewStyle = {}): ViewStyle {
  return {
    ...shadow,
    ...styles,
  };
}

/**
 * Create responsive shadow that changes based on state
 *
 * @param isPressed - Whether element is pressed
 * @param isHovered - Whether element is hovered (web/desktop)
 * @param defaultShadow - Default shadow level
 * @returns Appropriate shadow for current state
 *
 * @psychology Doherty Threshold - Visual feedback for interactions
 */
export function getInteractiveShadow(
  isPressed: boolean,
  isHovered: boolean = false,
  defaultShadow: keyof typeof Shadows = 'sm'
): ShadowStyle {
  if (isPressed) {
    return Shadows.xs;
  }
  if (isHovered) {
    return Shadows.md;
  }
  return Shadows[defaultShadow];
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ShadowLevelKey = keyof typeof ShadowLevel;
export type ShadowPreset = keyof typeof Shadows;
export type SemanticShadowKey = keyof typeof SemanticShadows;
export type BrandedShadowKey = keyof typeof BrandedShadows;

/**
 * Buffr Design System Constants
 *
 * Barrel file exporting all design system constants.
 * Import from '@/constants' for cleaner imports.
 *
 * @example
 * import { Colors, Typography, Shadows, Layout } from '@/constants';
 *
 * @see SKILL.md for UX Psychology documentation
 */

// =============================================================================
// CORE DESIGN TOKENS
// =============================================================================

/**
 * Brand color palette with semantic aliases
 * @see Colors.ts
 */
export { default as Colors } from './Colors';

/**
 * Typography system with 1.25 modular scale
 * @psychology Serial Position, Cognitive Load, Von Restorff
 * @see Typography.ts
 */
export {
  Typography,
  FontFamily,
  FontWeight,
  FontSize,
  LineHeight,
  LetterSpacing,
  createTextStyle,
  calculateLineHeight,
} from './Typography';
export type {
  FontSizeKey,
  FontWeightKey,
  LineHeightKey,
  LetterSpacingKey,
  TypographyPreset,
} from './Typography';

/**
 * Platform-specific shadow system
 * @psychology Gestalt Figure-Ground, Aesthetic-Usability
 * @see Shadows.ts
 */
export {
  Shadows,
  SemanticShadows,
  BrandedShadows,
  ShadowLevel,
  ShadowColor,
  createShadow,
  createColoredShadow,
  withShadow,
  getInteractiveShadow,
} from './Shadows';
export type {
  ShadowStyle,
  ShadowLevelKey,
  ShadowPreset,
  SemanticShadowKey,
  BrandedShadowKey,
} from './Shadows';

/**
 * Layout constants and spacing system
 * @psychology Miller's Law (chunking), Gestalt Proximity
 * @see Layout.ts
 */
export { default as Layout } from './Layout';
export {
  HORIZONTAL_PADDING,
  SECTION_SPACING,
  LARGE_SECTION_SPACING,
  CARD_GAP,
} from './Layout';

// =============================================================================
// UTILITY STYLES
// =============================================================================

/**
 * Common style utilities and presets
 * @see StyleUtils.ts
 */
export { default as StyleUtils } from './StyleUtils';

/**
 * Global style presets (legacy, prefer Typography/Shadows)
 * @see Styles.ts
 */
export { default as defaultStyles } from './Styles';

// =============================================================================
// DOMAIN-SPECIFIC CONSTANTS
// =============================================================================

/**
 * Card design system for wallet/debit cards
 * @see CardDesign.ts
 */
export * from './CardDesign';

/**
 * Bank information and logos
 * @see Banks.ts
 */
export * from './Banks';


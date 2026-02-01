/**
 * Layout Constants
 *
 * Location: constants/Layout.ts
 * Purpose: Shared layout spacing and dimension constants
 *
 * Note: These constants are kept separate to avoid circular dependencies
 * between components/common and components/layouts
 *
 * VALUES EXTRACTED FROM BuffrCrew/Buffr App Design SVG FILES
 */

import { Dimensions, Platform, StatusBar } from 'react-native';

// Screen Dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Screen = {
  WIDTH: SCREEN_WIDTH,
  HEIGHT: SCREEN_HEIGHT,
  // iPhone X+ safe area defaults
  SAFE_AREA_TOP: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
  SAFE_AREA_BOTTOM: Platform.OS === 'ios' ? 34 : 0,
} as const;

/**
 * Screen Real Estate Zones (based on 812pt iPhone height)
 *
 * Home Screen Layout:
 * 0-60pt:    Status bar + safe area
 * 60-140pt:  GlassHeader (search, notifications, avatar)
 * 140-260pt: BalanceDisplay Card (120pt)
 * 260-340pt: Wallet Carousel (80pt, 3-column)
 * 340-460pt: Utility Grid (3×2, 120pt per row)
 * 460-780pt: Recent Transactions (5 items × 60pt)
 * 780-812pt: Tab bar + safe area
 */
const ScreenZones = {
  // Header zone
  STATUS_BAR_HEIGHT: 44,
  HEADER_HEIGHT: 80,
  HEADER_TOTAL: 140, // STATUS_BAR + HEADER

  // Content zones
  BALANCE_CARD_HEIGHT: 120,
  WALLET_CAROUSEL_HEIGHT: 80,
  UTILITY_ROW_HEIGHT: 60,
  UTILITY_GRID_HEIGHT: 120, // 2 rows × 60pt
  TRANSACTION_ITEM_HEIGHT: 60,
  TRANSACTION_LIST_HEIGHT: 300, // 5 items visible

  // Navigation
  TAB_BAR_HEIGHT: 49,
  TAB_BAR_TOTAL: 83, // TAB_BAR + safe area

  // Calculated content area
  get CONTENT_HEIGHT() {
    return Screen.HEIGHT - this.HEADER_TOTAL - this.TAB_BAR_TOTAL;
  },
} as const;

// Real Estate Constants - Matching Buffr App Design (Home screen.svg)
// ✅ EXACT VALUES FROM WIREFRAMES
export const HORIZONTAL_PADDING = 16.5; // ✅ Exact from wireframes (x="16.5") - Updated to match design specs
export const SECTION_SPACING = 32;      // ✅ Matches 8pt grid (4×8pt)
export const LARGE_SECTION_SPACING = 40; // ✅ Matches 8pt grid (5×8pt)

// Card Grid Spacing (for 3-column layouts)
export const CARD_GAP = 17; // Gap between cards - Design: 17px

// Common spacing values - ✅ 8pt Grid System (Apple HIG)
const SPACING = {
  xs: 4,      // 0.5×8pt
  sm: 8,      // 1×8pt
  md: 16,     // 2×8pt
  lg: 20,     // 2.5×8pt (found in wireframes)
  xl: 24,     // 3×8pt
  '2xl': 32,  // 4×8pt ✅ matches SECTION_SPACING
  '3xl': 40,  // 5×8pt ✅ matches LARGE_SECTION_SPACING
  '4xl': 48,  // 6×8pt
  '5xl': 64,  // 8×8pt
} as const;

// Border radius values - ✅ FROM WIREFRAMES
const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,      // ✅ Apple HIG standard (NOT 40pt for pills)
  lg: 16,      // ✅ From wireframes
  xl: 20,      // ✅ For large pill buttons
  xxl: 24,
  card: 11.5,  // ✅ From wireframes (rx="11.5")
  full: 9999,
} as const;

// Card dimensions - ✅ EXACT VALUES FROM WIREFRAMES
const CARD = {
  padding: 16,
  borderRadius: 11.5,  // ✅ From wireframes (rx="11.5")
  shadowOffset: { width: 0, height: 2 }, // ✅ From wireframes
  shadowOpacity: 0.1,  // ✅ From wireframes
  shadowRadius: 8,     // ✅ From wireframes
  elevation: 2,        // Android elevation for cards
  // Wallet card specific dimensions
  wallet: {
    width: 108.667,    // ✅ From wireframes
    height: 95,        // ✅ From wireframes
    borderRadius: 11.5, // ✅ From wireframes
  },
  balance: {
    width: 279,        // ✅ From wireframes
    height: 63,        // ✅ From wireframes
    borderRadius: 11.5, // ✅ From wireframes
  },
} as const;

// Smaller gap for compact grids (5-column)
const COMPACT_GAP = 8;

/**
 * Grid Layout Constants
 * For wallet cards, utility buttons, and other grid layouts
 */
const Grid = {
  // 5-column grid (compact utilities - 5x2 layout)
  COLUMNS_5: 5,
  COLUMN_5_GAP: COMPACT_GAP,
  COLUMN_5_WIDTH: (Screen.WIDTH - (HORIZONTAL_PADDING * 2) - (COMPACT_GAP * 4)) / 5,

  // 3-column grid (wallets, utilities)
  COLUMNS_3: 3,
  COLUMN_3_WIDTH: (Screen.WIDTH - (HORIZONTAL_PADDING * 2) - (CARD_GAP * 2)) / 3,

  // 2-column grid (transactions, settings)
  COLUMNS_2: 2,
  COLUMN_2_WIDTH: (Screen.WIDTH - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2,

  // Full width content
  CONTENT_WIDTH: Screen.WIDTH - (HORIZONTAL_PADDING * 2),
} as const;

/**
 * Component Heights (standardized)
 */
const ComponentHeight = {
  // Buttons
  BUTTON_SM: 36,
  BUTTON_MD: 44,
  BUTTON_LG: 52,

  // Inputs
  INPUT_SM: 40,
  INPUT_MD: 48,
  INPUT_LG: 56,

  // List items
  LIST_ITEM_SM: 48,
  LIST_ITEM_MD: 60,
  LIST_ITEM_LG: 72,

  // Cards
  CARD_SM: 80,
  CARD_MD: 120,
  CARD_LG: 180,

  // Wallet card specific - ✅ FROM WIREFRAMES
  WALLET_CARD: 95,      // ✅ From wireframes (height="95")
  BALANCE_CARD: 63,     // ✅ From wireframes (height="63")
} as const;

/**
 * Animation Durations (ms)
 * Standardized timing for consistent feel
 */
const AnimationDuration = {
  INSTANT: 100,
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  CARD_FLIP: 600,
  PAGE_TRANSITION: 350,
} as const;

/**
 * Z-Index Layers
 * Ensures consistent stacking order
 */
const ZIndex = {
  BASE: 0,
  CONTENT: 1,
  STICKY: 10,
  HEADER: 100,
  MODAL_BACKDROP: 500,
  MODAL: 1000,
  TOAST: 2000,
  TOOLTIP: 3000,
} as const;

/**
 * Hit Slop (touch target expansion)
 * Ensures 44pt minimum touch targets per Apple HIG
 */
const HitSlop = {
  DEFAULT: { top: 10, bottom: 10, left: 10, right: 10 },
  SMALL: { top: 5, bottom: 5, left: 5, right: 5 },
  LARGE: { top: 15, bottom: 15, left: 15, right: 15 },
} as const;

export default {
  Screen,
  ScreenZones,
  HORIZONTAL_PADDING,
  SECTION_SPACING,
  LARGE_SECTION_SPACING,
  CARD_GAP,
  SPACING,
  BORDER_RADIUS,
  CARD,
  COMPACT_GAP,
  Grid,
  ComponentHeight,
  AnimationDuration,
  ZIndex,
  HitSlop,
};
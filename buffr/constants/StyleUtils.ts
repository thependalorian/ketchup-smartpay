/**
 * Shared Style Utilities
 *
 * Location: constants/StyleUtils.ts
 * Purpose: Reusable style utilities for consistent styling across all screens
 *
 * Usage:
 * import StyleUtils from '@/constants/StyleUtils';
 *
 * <View style={StyleUtils.sharedStyles.section}>
 */

import { StyleSheet } from 'react-native';
import Colors from './Colors';
import Layout from './Layout'; // Updated import

// Standard Dimensions
const BUTTON_HEIGHT = 50;
const INPUT_HEIGHT = 50;
const CARD_BORDER_RADIUS = 16;
const BUTTON_BORDER_RADIUS = 25;
const INPUT_BORDER_RADIUS = 25;
const SMALL_BORDER_RADIUS = 12;
const CARD_PADDING = 16;

// Standard Spacing
const ITEM_SPACING = 12;
const SMALL_SPACING = 8;
const MEDIUM_SPACING = 16;

const sharedStyles = StyleSheet.create({
  // Section Spacing
  section: {
    marginBottom: Layout.SECTION_SPACING,
  },
  sectionLarge: {
    marginBottom: Layout.LARGE_SECTION_SPACING,
  },
  sectionSmall: {
    marginBottom: ITEM_SPACING,
  },

  // Button Containers
  buttonContainer: {
    marginTop: Layout.SECTION_SPACING,
    marginBottom: Layout.SECTION_SPACING,
  },
  buttonContainerLarge: {
    marginTop: Layout.LARGE_SECTION_SPACING,
    marginBottom: Layout.LARGE_SECTION_SPACING,
  },

  // Card Styles
  summaryCard: {
    marginBottom: Layout.SECTION_SPACING,
    borderRadius: CARD_BORDER_RADIUS,
    padding: CARD_PADDING,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: CARD_BORDER_RADIUS,
    padding: CARD_PADDING,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '10',
  },

  // Input Containers
  inputContainer: {
    height: INPUT_HEIGHT,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },

  // List Styles
  listContainer: {
    gap: ITEM_SPACING,
  },
  listItem: {
    marginBottom: ITEM_SPACING,
  },
  listItemLast: {
    marginBottom: 0,
  },

  // Grid Styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ITEM_SPACING,
  },
  gridItem: {
    marginBottom: ITEM_SPACING,
  },

  // Summary Row Styles
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ITEM_SPACING,
  },
  summaryRowLast: {
    marginBottom: 0,
  },
  summaryRowTotal: {
    marginTop: SMALL_SPACING,
    paddingTop: ITEM_SPACING,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: MEDIUM_SPACING,
  },

  // Icon Container Styles
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Field Group Styles
  fieldGroup: {
    gap: SMALL_SPACING,
    marginBottom: ITEM_SPACING,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  fieldError: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },

  // Scroll Content
  scrollContent: {
    paddingBottom: 40,
  },
  scrollContentLarge: {
    paddingBottom: 100,
  },

  // Info Card Spacing
  infoCard: {
    marginTop: Layout.SECTION_SPACING,
  },
});

// Named exports for destructured imports
export { sharedStyles };
export {
  BUTTON_HEIGHT,
  INPUT_HEIGHT,
  CARD_BORDER_RADIUS,
  BUTTON_BORDER_RADIUS,
  INPUT_BORDER_RADIUS,
  SMALL_BORDER_RADIUS,
  CARD_PADDING,
  ITEM_SPACING,
  SMALL_SPACING,
  MEDIUM_SPACING,
};

// Default export for backward compatibility
export default {
  BUTTON_HEIGHT,
  INPUT_HEIGHT,
  CARD_BORDER_RADIUS,
  BUTTON_BORDER_RADIUS,
  INPUT_BORDER_RADIUS,
  SMALL_BORDER_RADIUS,
  CARD_PADDING,
  ITEM_SPACING,
  SMALL_SPACING,
  MEDIUM_SPACING,
  sharedStyles,
};
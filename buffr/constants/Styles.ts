/**
 * Reusable Stylesheet for Buffr App
 * 
 * Location: constants/Styles.ts
 * Purpose: Centralized styling system for consistent UI throughout the app
 * Usage: Import defaultStyles and use in components
 * 
 * Based on design patterns from Buffr App Design assets
 */
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

export const defaultStyles = StyleSheet.create({
  // Container Styles - ✅ MATCHING buffr-mobile
  container: {
    flex: 1,
    backgroundColor: Colors.background, // ✅ #F5F5F5 from buffr-mobile
    padding: 16,  // ✅ buffr-mobile padding
  },
  containerFull: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  containerWithPadding: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Text Styles
  header: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text,
  },
  headerLarge: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  headerMedium: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSmall: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  bodyText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  bodyTextSecondary: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  descriptionText: {
    fontSize: 18,
    marginTop: 20,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  textLink: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '500',
  },
  textLinkSmall: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 20,
    marginBottom: 10,
    color: Colors.text,
  },
  caption: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  // Button Styles - ✅ MATCHING buffr-mobile design system
  pillButton: {
    padding: 10,
    height: 60,
    borderRadius: 40,  // ✅ buffr-mobile style (pill shape)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  pillButtonSecondary: {
    padding: 10,
    height: 60,
    borderRadius: 40,  // ✅ buffr-mobile style
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  pillButtonSmall: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,  // ✅ buffr-mobile style (half of height)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  pillButtonLarge: {
    padding: 12,
    height: 52,
    borderRadius: 20,  // ✅ For large pill buttons
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '500',
  },
  buttonTextSecondary: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '500',
  },
  buttonTextSmall: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonOutline: {
    padding: 10,
    height: 60,
    borderRadius: 40,  // ✅ buffr-mobile style (pill shape)
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  buttonOutlineText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '500',
  },

  // Card & Block Styles - ✅ MATCHING buffr-mobile
  block: {
    marginHorizontal: 20,  // ✅ buffr-mobile spacing
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 16,      // ✅ buffr-mobile style
    gap: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 11.5,      // ✅ From wireframes (rx="11.5")
    padding: 16,
    marginVertical: 8,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,             // ✅ From wireframes
    },
    shadowOpacity: 0.1,      // ✅ From wireframes
    shadowRadius: 8,         // ✅ From wireframes
    elevation: 2,            // Android elevation
  },
  walletCard: {
    backgroundColor: Colors.background, // ✅ #F8FAFC from wireframes
    borderRadius: 11.5,      // ✅ From wireframes
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight, // ✅ #F1F5F9 from wireframes
    width: 108.667,          // ✅ From wireframes
    height: 95,              // ✅ From wireframes
  },
  cardFlat: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },

  // Input Styles - ✅ MATCHING buffr-mobile
  input: {
    height: 56,
    borderWidth: 0,  // ✅ buffr-mobile uses no border
    borderRadius: 16,  // ✅ buffr-mobile style
    paddingHorizontal: 20,  // ✅ buffr-mobile padding
    fontSize: 20,  // ✅ buffr-mobile fontSize
    color: Colors.dark,  // ✅ buffr-mobile text color
    backgroundColor: Colors.lightGray,  // ✅ buffr-mobile lightGray background
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error,
  },

  // Divider Styles
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  dividerThick: {
    height: 2,
    backgroundColor: Colors.lightGray,
    marginVertical: 20,
  },

  // Badge & Tag Styles
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  badgeSuccess: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.success + '20',
    alignSelf: 'flex-start',
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.success,
  },
  badgeError: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.error + '20',
    alignSelf: 'flex-start',
  },
  badgeErrorText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.error,
  },

  // Spacing Utilities
  marginTopSmall: {
    marginTop: 8,
  },
  marginTopMedium: {
    marginTop: 16,
  },
  marginTopLarge: {
    marginTop: 24,
  },
  marginBottomSmall: {
    marginBottom: 8,
  },
  marginBottomMedium: {
    marginBottom: 16,
  },
  marginBottomLarge: {
    marginBottom: 24,
  },
  paddingSmall: {
    padding: 8,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },

  // Layout Utilities
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default defaultStyles;

/**
 * Buffr Brand Color Palette
 * Based on design assets from BuffrCrew/Buffr App Design
 *
 * Location: constants/Colors.ts
 * Usage: Import and use throughout the app for consistent branding
 *
 * HIG Compliance:
 * - Supports light and dark mode variants
 * - WCAG AA contrast ratios maintained
 * - Semantic color naming for accessibility
 */

// Light Mode Colors
// ✅ COMPLETE PRIMARY COLOR SCALE FROM WIREFRAMES
const light = {
  // Primary Brand Colors - Complete Scale (50-900)
  primary50: '#ECE3FE',      // ✅ Very light (backgrounds)
  primary100: '#D6E3FE',     // ✅ Light (subtle backgrounds)
  primary200: '#B5E3FE',     // ✅ Lighter (hover states)
  primary300: '#96E3FC',     // ✅ Light (disabled states)
  primary400: '#5BE3F8',     // ✅ Medium-light
  primary500: '#3B82F6',     // ✅ Base (buttons, links)
  primary600: '#2563EB',     // ✅ Medium (active states)
  primary700: '#1D4ED8',     // ✅ Dark (pressed states)
  primary800: '#0029D6',     // ✅ Primary (main brand)
  primary900: '#001A8A',     // ✅ Darkest (text on light)
  
  // Legacy aliases - ✅ UPDATED TO MATCH buffr-mobile
  primary: '#3D38ED',        // ✅ buffr-mobile primary color
  primaryLight: '#2563EB',   // Keep for compatibility
  primaryDark: '#1D4ED8',    // Keep for compatibility
  primaryMuted: '#C9C8FA',   // ✅ buffr-mobile primaryMuted

  // Background Colors - ✅ MATCHING buffr-mobile
  background: '#F5F5F5',     // ✅ buffr-mobile background
  backgroundGray: '#F1F5F9', // Keep for compatibility
  white: '#FFFFFF',          // Pure white
  card: '#FFFFFF',           // Card background

  // Text Colors
  text: '#020617',           // Primary text - Very dark blue/black
  textSecondary: '#64748B',  // Secondary text - Slate gray
  textTertiary: '#94A3B8',   // Tertiary text - Light slate
  dark: '#141518',           // ✅ buffr-mobile dark

  // UI Colors - ✅ MATCHING buffr-mobile
  border: '#E2E8F0',         // Border color - Light borders
  borderLight: '#F1F5F9',    // Very light border
  lightGray: '#D8DCE2',      // ✅ buffr-mobile lightGray
  gray: '#626D77',           // ✅ buffr-mobile gray

  // Status Colors
  success: '#10B981',        // Success green - Success states
  error: '#E11D48',          // Error red - Error states
  warning: '#F59E0B',        // Warning orange - Warning states
  info: '#3B82F6',           // Info blue - Informational states

  // Gamification Colors
  achievementCard: '#FFFFFF',
  achievementCardBorder: '#E2E8F0',
  questCard: '#FFFFFF',
  progressBar: '#E2E8F0',
  progressFill: '#0029D6',
  leaderboardPodium: '#F8FAFC',
  pointsGradientStart: '#0029D6',
  pointsGradientEnd: '#7C3AED',
};

// Dark Mode Colors
const dark = {
  // Primary Brand Colors
  primary: '#3B82F6',        // Brighter blue for dark mode
  primaryLight: '#60A5FA',   // Light blue
  primaryDark: '#2563EB',    // Darker blue
  primaryMuted: '#1E3A5F',   // Muted dark blue

  // Background Colors
  background: '#0F172A',     // Dark background - Main app background
  backgroundGray: '#1E293B', // Dark gray background - Secondary backgrounds
  white: '#1E293B',          // Dark mode "white" equivalent
  card: '#1E293B',           // Card background

  // Text Colors
  text: '#F8FAFC',           // Primary text - Light
  textSecondary: '#94A3B8',  // Secondary text - Muted
  textTertiary: '#64748B',   // Tertiary text - Darker muted
  dark: '#F1F5F9',           // Light color for dark mode

  // UI Colors
  border: '#334155',         // Border color - Dark borders
  lightGray: '#475569',      // Dark mode light gray
  gray: '#94A3B8',           // Medium gray - Neutral elements

  // Status Colors
  success: '#34D399',        // Brighter green for dark mode
  error: '#F87171',          // Brighter red for dark mode
  warning: '#FBBF24',        // Brighter orange for dark mode
  info: '#60A5FA',           // Brighter blue for dark mode

  // Gamification Colors
  achievementCard: '#1E293B',
  achievementCardBorder: '#334155',
  questCard: '#1E293B',
  progressBar: '#334155',
  progressFill: '#3B82F6',
  leaderboardPodium: '#1E1E2E',
  pointsGradientStart: '#1E40AF',
  pointsGradientEnd: '#5B21B6',
};

// Achievement Rarity Colors (same for both modes)
export const rarityColors = {
  common: '#94A3B8',       // Gray
  uncommon: '#10B981',     // Green
  rare: '#3B82F6',         // Blue
  epic: '#8B5CF6',         // Purple
  legendary: '#F59E0B',    // Gold
};

// Level Colors
export const levelColors = [
  '#94A3B8', // Level 1 - Gray
  '#10B981', // Level 2 - Green
  '#34D399', // Level 3 - Light Green
  '#3B82F6', // Level 4 - Blue
  '#60A5FA', // Level 5 - Light Blue
  '#8B5CF6', // Level 6 - Purple
  '#A78BFA', // Level 7 - Light Purple
  '#F59E0B', // Level 8 - Orange
  '#FBBF24', // Level 9 - Yellow
  '#EF4444', // Level 10 - Red (Legendary)
];

// Default export - Matching buffr-mobile design system
export default {
  // Primary Brand Colors - ✅ MATCHING buffr-mobile
  primary: '#3D38ED',        // ✅ buffr-mobile primary
  primaryLight: '#2563EB',   // Keep for compatibility
  primaryDark: '#1E40AF',    // Keep for compatibility
  primaryMuted: '#C9C8FA',   // ✅ buffr-mobile primaryMuted

  // Background Colors - ✅ MATCHING buffr-mobile
  background: '#F5F5F5',     // ✅ buffr-mobile background
  backgroundGray: '#F1F5F9', // Keep for compatibility
  white: '#FFFFFF',

  // Text Colors
  text: '#020617',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  dark: '#141518',           // ✅ buffr-mobile dark

  // UI Colors - ✅ MATCHING buffr-mobile
  border: '#E2E8F0',
  lightGray: '#D8DCE2',      // ✅ buffr-mobile lightGray
  gray: '#626D77',            // ✅ buffr-mobile gray

  // Status Colors
  success: '#10B981',
  error: '#E11D48',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Theme variants (keep for dark mode support)
  light,
  dark,
};
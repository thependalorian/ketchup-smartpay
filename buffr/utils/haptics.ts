/**
 * Haptic Feedback Manager
 *
 * Location: utils/haptics.ts
 *
 * Purpose: Provides a centralized interface for triggering haptic feedback
 * using the expo-haptics library. This ensures consistent feedback for
 * user interactions throughout the app.
 *
 * HIG Principles Applied:
 * - Haptic feedback provides tactile confirmation of user actions
 * - Different feedback types for different action severities
 * - Respects user's accessibility settings
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Safely trigger haptic feedback with error handling
 */
const safeHaptic = async (hapticFn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  try {
    await hapticFn();
  } catch (error) {
    // Silently fail if haptics not available
  }
};

/**
 * Triggers a light impact haptic feedback.
 * Good for minor actions or selections.
 */
export const lightImpact = () => {
  safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};

/**
 * Triggers a medium impact haptic feedback.
 * Good for primary actions or confirmations.
 */
export const mediumImpact = () => {
  safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
};

/**
 * Triggers a heavy impact haptic feedback.
 * Use sparingly for significant actions or moments.
 */
export const heavyImpact = () => {
  safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
};

/**
 * Triggers a success notification haptic feedback.
 * Use when an operation completes successfully.
 */
export const successNotification = () => {
  safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
};

/**
 * Triggers a warning notification haptic feedback.
 * Use to indicate a potential issue or caution.
 */
export const warningNotification = () => {
  safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
};

/**
 * Triggers an error notification haptic feedback.
 * Use when an operation fails.
 */
export const errorNotification = () => {
  safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
};

/**
 * Triggers selection haptic feedback.
 * Use for list item selection, picker changes, scroll snapping.
 */
export const selectionFeedback = () => {
  safeHaptic(() => Haptics.selectionAsync());
};

// =============================================================================
// GAMIFICATION-SPECIFIC HAPTIC PATTERNS
// =============================================================================

/**
 * Achievement unlock celebration
 * Double success pulse for memorable feedback
 */
export const achievementUnlock = async () => {
  await safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  setTimeout(() => mediumImpact(), 150);
};

/**
 * Level up celebration
 * Triple pulse pattern for significant milestone
 */
export const levelUp = async () => {
  await safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  setTimeout(() => successNotification(), 200);
  setTimeout(() => mediumImpact(), 400);
};

/**
 * Quest completion
 * Success with follow-up confirmation
 */
export const questComplete = async () => {
  await safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  setTimeout(() => lightImpact(), 100);
};

/**
 * Points earned
 * Light celebratory feedback
 */
export const pointsEarned = () => {
  lightImpact();
};

/**
 * Streak milestone
 * Progressive intensity based on streak length
 */
export const streakMilestone = async (streakDays: number) => {
  if (streakDays >= 30) {
    await safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    setTimeout(() => successNotification(), 150);
  } else if (streakDays >= 7) {
    successNotification();
  } else {
    mediumImpact();
  }
};

/**
 * Reward claimed
 * Satisfying confirmation feedback
 */
export const rewardClaimed = async () => {
  await safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  setTimeout(() => lightImpact(), 100);
};

/**
 * Leaderboard position change
 */
export const leaderboardChange = (improved: boolean) => {
  if (improved) {
    successNotification();
  } else {
    lightImpact();
  }
};

/**
 * Tab switch feedback
 */
export const tabSwitch = () => {
  selectionFeedback();
};

/**
 * Button press feedback
 */
export const buttonPress = () => {
  lightImpact();
};

/**
 * Card flip feedback
 */
export const cardFlip = () => {
  mediumImpact();
};

/**
 * Payment confirmation feedback
 */
export const paymentConfirm = () => {
  heavyImpact();
};

const HapticFeedbackManager = {
  // Basic haptics
  lightImpact,
  mediumImpact,
  heavyImpact,
  successNotification,
  warningNotification,
  errorNotification,
  selectionFeedback,
  // Gamification haptics
  achievementUnlock,
  levelUp,
  questComplete,
  pointsEarned,
  streakMilestone,
  rewardClaimed,
  leaderboardChange,
  // UI interaction haptics
  tabSwitch,
  buttonPress,
  cardFlip,
  paymentConfirm,
};

export default HapticFeedbackManager;

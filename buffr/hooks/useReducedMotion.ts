/**
 * useReducedMotion Hook
 *
 * Location: hooks/useReducedMotion.ts
 * Purpose: Detect user's reduced motion accessibility preference
 *
 * HIG Accessibility Compliance:
 * - Respects system-wide "Reduce Motion" setting
 * - Allows animations to be disabled for users with vestibular disorders
 * - Provides graceful fallback for motion-sensitive users
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Hook to detect if the user has enabled "Reduce Motion" in system settings
 *
 * @returns boolean - true if reduced motion is enabled
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const reduceMotion = useReducedMotion();
 *
 *   return reduceMotion ? (
 *     <View style={styles.static} />
 *   ) : (
 *     <Animated.View style={animatedStyle} />
 *   );
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Web doesn't support this API
    if (Platform.OS === 'web') {
      // Check CSS prefers-reduced-motion media query on web
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduceMotion(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
          setReduceMotion(event.matches);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
      return;
    }

    // Native platforms
    let isMounted = true;

    // Initial check
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        // Silently fail, default to false (allow animations)
      });

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) {
          setReduceMotion(enabled);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Hook that returns animation duration based on reduced motion preference
 *
 * @param normalDuration - Duration in ms when animations are enabled
 * @param reducedDuration - Duration in ms when reduced motion is enabled (default: 0)
 * @returns number - The appropriate animation duration
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const duration = useAnimationDuration(300, 0);
 *
 *   const animatedStyle = useAnimatedStyle(() => ({
 *     opacity: withTiming(1, { duration }),
 *   }));
 * }
 * ```
 */
export function useAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? reducedDuration : normalDuration;
}

/**
 * Hook that returns whether animations should be enabled
 * Inverse of useReducedMotion for clearer semantics in some contexts
 *
 * @returns boolean - true if animations should be shown
 */
export function useAnimationsEnabled(): boolean {
  const reduceMotion = useReducedMotion();
  return !reduceMotion;
}

export default useReducedMotion;

/**
 * Animation Utilities
 * 
 * Location: utils/animations.ts
 * Purpose: Reusable animation configurations and helpers
 * 
 * Provides common animation presets and utilities for Reanimated
 */

import { Easing } from 'react-native-reanimated';

/**
 * Common animation presets
 */
export const AnimationPresets = {
  // Spring animations
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  
  springBouncy: {
    damping: 10,
    stiffness: 300,
    mass: 0.8,
  },
  
  springSmooth: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },

  // Timing animations
  fast: {
    duration: 200,
    easing: Easing.out(Easing.ease),
  },
  
  normal: {
    duration: 300,
    easing: Easing.out(Easing.ease),
  },
  
  slow: {
    duration: 500,
    easing: Easing.out(Easing.ease),
  },

  // Easing functions
  easeInOut: Easing.inOut(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeIn: Easing.in(Easing.ease),
  linear: Easing.linear,
  
  // Custom easing
  bounce: Easing.bounce,
  elastic: Easing.elastic(2),
};

/**
 * Animation durations (in milliseconds)
 */
export const AnimationDurations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

/**
 * Common animation sequences
 */
export const AnimationSequences = {
  // Fade in then scale up
  fadeInScale: {
    opacity: { from: 0, to: 1, duration: 300 },
    scale: { from: 0.8, to: 1, duration: 300 },
  },
  
  // Slide in from right
  slideInRight: {
    translateX: { from: 50, to: 0, duration: 300 },
    opacity: { from: 0, to: 1, duration: 300 },
  },
  
  // Slide in from left
  slideInLeft: {
    translateX: { from: -50, to: 0, duration: 300 },
    opacity: { from: 0, to: 1, duration: 300 },
  },
  
  // Bounce effect
  bounce: {
    scale: { from: 1, to: 1.1, duration: 150, then: { to: 1, duration: 150 } },
  },
};

/**
 * Helper function to create staggered animations
 */
export function createStaggeredAnimation(
  count: number,
  delay: number = 50
): number[] {
  return Array.from({ length: count }, (_, i) => i * delay);
}

/**
 * Helper function for card flip animation
 */
export const cardFlipConfig = {
  duration: 600,
  easing: Easing.inOut(Easing.ease),
  rotationAxis: { x: 0, y: 1, z: 0 },
};

/**
 * Helper function for balance reveal animation
 */
export const balanceRevealConfig = {
  duration: 500,
  easing: Easing.out(Easing.ease),
  blurAmount: { hidden: 10, visible: 0 },
};

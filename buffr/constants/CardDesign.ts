/**
 * Buffr Card Design Constants
 * 
 * Location: constants/CardDesign.ts
 * 
 * Purpose: Centralized constants for all card-related components and animations,
 * based on the official Buffr Card Design System.
 */

export const CardDimensions = {
  WIDTH: 340,
  HEIGHT: 214,
  ASPECT_RATIO: 340 / 214, // Approximately 1.588
  BORDER_RADIUS: 12,
};

export const CardAnimation = {
  FLIP_DURATION: 600, // 0.6s 3D rotation
  SELECTION_DURATION: 300,
  SHIMMER_DURATION: 2000, // 2s gradient loop
  CAROUSEL_SNAP_DURATION: 400,
  PAYMENT_CONFIRMATION_DURATION: 4000, // 4s sequence
};

export const CardTypography = {
  NUMBER_FONT_SIZE: 24,
  NUMBER_LETTER_SPACING: 3,
  HOLDER_NAME_FONT_SIZE: 14,
  HOLDER_LABEL_FONT_SIZE: 10,
  EXPIRY_DATE_FONT_SIZE: 14,
  EXPIRY_LABEL_FONT_SIZE: 10,
};

export const CardBack = {
  CVV_BOX_WIDTH: 60,
  CVV_BOX_HEIGHT: 30,
  MAGNETIC_STRIPE_HEIGHT: 40,
};

/**
 * Card Design Utilities
 * 
 * Location: utils/cardDesigns.ts
 * Purpose: Card design mapping and utilities for Buffr Card Design frames
 * 
 * Maps frame numbers to design assets from BuffrCrew/Buffr Card Design folder
 */

/**
 * Available card frame designs from Buffr Card Design folder
 * Frame numbers correspond to SVG files: "Frame {number}.svg"
 */
export const AVAILABLE_CARD_FRAMES = [
  2, 3, 6, 7, 8, 9, 12, 15, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
] as const;

export type CardFrameNumber = typeof AVAILABLE_CARD_FRAMES[number];

/**
 * Card design metadata
 */
export interface CardDesignMetadata {
  frameNumber: number;
  displayName: string;
  fileName: string;
  description?: string;
}

/**
 * Get card design file name for a frame number
 */
export function getCardDesignFileName(frameNumber: number): string {
  if (frameNumber === 1) return 'Master Card.svg';
  if (frameNumber === 0) return 'Visa.svg';
  return `Frame ${frameNumber}.svg`;
}

/**
 * Get card design display name
 */
export function getCardDesignDisplayName(frameNumber: number): string {
  if (frameNumber === 1) return 'Master Card';
  if (frameNumber === 0) return 'Visa';
  return `Frame ${frameNumber}`;
}

/**
 * Check if a frame number is available
 */
export function isFrameAvailable(frameNumber: number): boolean {
  return AVAILABLE_CARD_FRAMES.includes(frameNumber as CardFrameNumber);
}

/**
 * Get all available card designs metadata
 */
export function getAllCardDesigns(): CardDesignMetadata[] {
  return AVAILABLE_CARD_FRAMES.map((frameNumber) => ({
    frameNumber,
    displayName: getCardDesignDisplayName(frameNumber),
    fileName: getCardDesignFileName(frameNumber),
  }));
}

/**
 * Card design color schemes (for fallback when SVG not loaded)
 * Based on BuffrPay backend wallet_service.py card design catalog
 */
export const CARD_DESIGN_COLORS: { [key: number]: { start: string; end: string; text: string } } = {
  2: { start: '#1E40AF', end: '#1E40AF', text: '#FFFFFF' }, // Blue
  3: { start: '#10B981', end: '#059669', text: '#FFFFFF' }, // Green
  6: { start: '#8B5CF6', end: '#7C3AED', text: '#FFFFFF' }, // Purple
  7: { start: '#EF4444', end: '#DC2626', text: '#FFFFFF' }, // Red
  8: { start: '#F59E0B', end: '#D97706', text: '#FFFFFF' }, // Orange
  9: { start: '#06B6D4', end: '#0891B2', text: '#FFFFFF' }, // Cyan
  12: { start: '#EC4899', end: '#DB2777', text: '#FFFFFF' }, // Pink
  15: { start: '#6366F1', end: '#4F46E5', text: '#FFFFFF' }, // Indigo
  21: { start: '#14B8A6', end: '#0D9488', text: '#FFFFFF' }, // Teal
  22: { start: '#F97316', end: '#EA580C', text: '#FFFFFF' }, // Orange Red
  23: { start: '#A855F7', end: '#9333EA', text: '#FFFFFF' }, // Purple
  24: { start: '#3B82F6', end: '#2563EB', text: '#FFFFFF' }, // Blue
  25: { start: '#10B981', end: '#059669', text: '#FFFFFF' }, // Green
  26: { start: '#F59E0B', end: '#D97706', text: '#FFFFFF' }, // Amber
  27: { start: '#EF4444', end: '#DC2626', text: '#FFFFFF' }, // Red
  28: { start: '#8B5CF6', end: '#7C3AED', text: '#FFFFFF' }, // Purple
  29: { start: '#06B6D4', end: '#0891B2', text: '#FFFFFF' }, // Cyan
  30: { start: '#EC4899', end: '#DB2777', text: '#FFFFFF' }, // Pink
  31: { start: '#6366F1', end: '#4F46E5', text: '#FFFFFF' }, // Indigo
  32: { start: '#14B8A6', end: '#0D9488', text: '#FFFFFF' }, // Teal
};

/**
 * Get color scheme for a frame number
 */
export function getCardDesignColors(frameNumber: number): { start: string; end: string; text: string } {
  return CARD_DESIGN_COLORS[frameNumber] || CARD_DESIGN_COLORS[2];
}

/**
 * Card design source path (for reference)
 * Original location: /Users/georgenekwaya/Downloads/BuffrCrew/Buffr Card Design /
 * 
 * To use in production:
 * 1. Copy SVG files to assets/card-designs/ folder in the project
 * 2. Import using require() or use expo-asset for dynamic loading
 * 3. Use react-native-svg to render SVG components
 */
export const CARD_DESIGNS_SOURCE_PATH = '/Users/georgenekwaya/Downloads/BuffrCrew/Buffr Card Design /';

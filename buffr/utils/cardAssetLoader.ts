/**
 * Card Asset Loader
 * 
 * Location: utils/cardAssetLoader.ts
 * 
 * Purpose: Loads the raw XML content of card design SVG files from the assets directory.
 * It includes a caching mechanism to prevent re-reading files from disk.
 */

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import logger, { log } from '@/utils/logger';

// A simple in-memory cache for SVG content
const svgCache: { [key: string]: string } = {};

// Since Metro bundler requires static paths for assets, we must statically
// require all possible card designs. This map links a dynamic designId to a
// static asset reference.
const cardAssetMap: { [key: number]: number } = {
  2: require('@/assets/images/card-designs/frame-2.svg'),
  3: require('@/assets/images/card-designs/frame-3.svg'),
  4: require('@/assets/images/card-designs/frame-4.svg'),
  5: require('@/assets/images/card-designs/frame-5.svg'),
  6: require('@/assets/images/card-designs/frame-6.svg'),
  7: require('@/assets/images/card-designs/frame-7.svg'),
  8: require('@/assets/images/card-designs/frame-8.svg'),
  9: require('@/assets/images/card-designs/frame-9.svg'),
  10: require('@/assets/images/card-designs/frame-10.svg'),
  11: require('@/assets/images/card-designs/frame-11.svg'),
  12: require('@/assets/images/card-designs/frame-12.svg'),
  13: require('@/assets/images/card-designs/frame-13.svg'),
  14: require('@/assets/images/card-designs/frame-14.svg'),
  15: require('@/assets/images/card-designs/frame-15.svg'),
  16: require('@/assets/images/card-designs/frame-16.svg'),
  17: require('@/assets/images/card-designs/frame-17.svg'),
  18: require('@/assets/images/card-designs/frame-18.svg'),
  19: require('@/assets/images/card-designs/frame-19.svg'),
  20: require('@/assets/images/card-designs/frame-20.svg'),
  21: require('@/assets/images/card-designs/frame-21.svg'),
  22: require('@/assets/images/card-designs/frame-22.svg'),
  23: require('@/assets/images/card-designs/frame-23.svg'),
  24: require('@/assets/images/card-designs/frame-24.svg'),
  25: require('@/assets/images/card-designs/frame-25.svg'),
  26: require('@/assets/images/card-designs/frame-26.svg'),
  27: require('@/assets/images/card-designs/frame-27.svg'),
  28: require('@/assets/images/card-designs/frame-28.svg'),
  29: require('@/assets/images/card-designs/frame-29.svg'),
  30: require('@/assets/images/card-designs/frame-30.svg'),
  31: require('@/assets/images/card-designs/frame-31.svg'),
  32: require('@/assets/images/card-designs/frame-32.svg'),
};

/**
 * Loads the SVG XML content for a given card design ID.
 * It uses a cache to avoid redundant file reads.
 * 
 * @param designId The ID of the card design to load (e.g., 2).
 * @returns A promise that resolves to the SVG XML string, or null if not found.
 */
export const loadCardAsset = async (designId: number): Promise<string | null> => {
  const cacheKey = `card-design-${designId}`;
  if (svgCache[cacheKey]) {
    return svgCache[cacheKey];
  }

  const assetModule = cardAssetMap[designId];
  if (!assetModule) {
    logger.warn(`Card design with ID ${designId} not found in asset map.`);
    return null;
  }

  try {
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();

    if (asset.localUri) {
      const svgXml = await FileSystem.readAsStringAsync(asset.localUri);
      svgCache[cacheKey] = svgXml; // Cache the result
      return svgXml;
    }
    return null;
  } catch (error) {
    log.error(`Failed to load card asset for design ID ${designId}:`, error);
    return null;
  }
};

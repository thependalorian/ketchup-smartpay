/**
 * Platform-Safe Location Utility
 * 
 * Location: utils/location.ts
 * Purpose: Provides a unified location API that works across all platforms
 * 
 * - Uses expo-location on native (iOS/Android)
 * - Falls back to browser Geolocation API on web
 * - Returns default location (Windhoek, Namibia) if unavailable
 * 
 * Features:
 * - Consistent API across platforms
 * - Graceful degradation when location unavailable
 * - Default location for Namibia context
 */

import { Platform } from 'react-native';
import logger from '@/utils/logger';

// Default location: Windhoek, Namibia
export const DEFAULT_LOCATION = {
  lat: -22.5609,
  lon: 17.0658,
  city: 'Windhoek',
  country: 'Namibia',
};

export interface LocationCoords {
  lat: number;
  lon: number;
}

export interface LocationResult {
  coords: LocationCoords;
  isDefault: boolean;
  error?: string;
}

// Check if we're on a native platform
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Lazy-load expo-location only on native platforms
let ExpoLocation: typeof import('expo-location') | null = null;

const loadExpoLocation = async () => {
  if (isNative && !ExpoLocation) {
    try {
      ExpoLocation = await import('expo-location');
    } catch (error) {
      logger.warn('expo-location not available');
      ExpoLocation = null;
    }
  }
  return ExpoLocation;
};

/**
 * Request location permissions
 * @returns true if permission granted, false otherwise
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (isNative) {
      const Location = await loadExpoLocation();
      if (Location) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
      }
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // Web - permissions are requested when calling getCurrentPosition
      return true; // Will be checked when actually getting location
    }
    return false;
  } catch (error) {
    logger.warn('Location permission request failed:', { error });
    return false;
  }
};

/**
 * Get current location
 * @returns Location coordinates or default location
 */
export const getCurrentLocation = async (): Promise<LocationResult> => {
  try {
    // Native platform
    if (isNative) {
      const Location = await loadExpoLocation();
      if (Location) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return {
            coords: DEFAULT_LOCATION,
            isDefault: true,
            error: 'Location permission denied',
          };
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        return {
          coords: {
            lat: location.coords.latitude,
            lon: location.coords.longitude,
          },
          isDefault: false,
        };
      }
    }

    // Web platform - use browser Geolocation API
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              coords: {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              },
              isDefault: false,
            });
          },
          (error) => {
            logger.warn('Web geolocation error:', { message: error.message });
            resolve({
              coords: DEFAULT_LOCATION,
              isDefault: true,
              error: error.message,
            });
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000, // Allow cached position up to 1 minute
          }
        );
      });
    }

    // No location available
    return {
      coords: DEFAULT_LOCATION,
      isDefault: true,
      error: 'Location services not available',
    };
  } catch (error: any) {
    logger.warn('Location error:', { error });
    return {
      coords: DEFAULT_LOCATION,
      isDefault: true,
      error: error.message || 'Unknown location error',
    };
  }
};

/**
 * Check if location services are available
 */
export const isLocationAvailable = async (): Promise<boolean> => {
  if (isNative) {
    const Location = await loadExpoLocation();
    if (Location) {
      return await Location.hasServicesEnabledAsync();
    }
  } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return true;
  }
  return false;
};

export default {
  DEFAULT_LOCATION,
  requestLocationPermission,
  getCurrentLocation,
  isLocationAvailable,
};

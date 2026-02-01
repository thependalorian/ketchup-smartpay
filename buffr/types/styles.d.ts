/**
 * Type definitions for React Native styles
 * 
 * Location: types/styles.d.ts
 * Purpose: Fix TypeScript strict type checking issues with React Native styles
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// More permissive style type that accepts any style type
export type PermissiveStyle = ViewStyle | TextStyle | ImageStyle;
export type PermissiveStyleProp<T> = T | PermissiveStyle | Array<T | PermissiveStyle>;

// Helper type for StyleSheet.create that returns more permissive types
export type PermissiveStyles<T> = {
  [K in keyof T]: PermissiveStyle;
};

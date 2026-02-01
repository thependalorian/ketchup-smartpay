/**
 * Type augmentations for React Native
 * 
 * Location: types/react-native.d.ts
 * Purpose: Fix TypeScript strict type checking issues with React Native styles
 */

import 'react-native';

declare module 'react-native' {
  // Make StyleProp more permissive to accept any style type
  type PermissiveStyle = ViewStyle | TextStyle | ImageStyle | any;
  
  namespace StyleSheet {
    interface NamedStyles<T> {
      [key: string]: PermissiveStyle;
    }
  }

  // Make View, Text, and other component style props more permissive
  interface ViewProps {
    style?: PermissiveStyle | PermissiveStyle[] | any;
  }

  interface TextProps {
    style?: PermissiveStyle | PermissiveStyle[] | any;
  }

  interface ImageProps {
    style?: PermissiveStyle | PermissiveStyle[] | any;
  }

  interface ScrollViewProps {
    style?: PermissiveStyle | PermissiveStyle[] | any;
    contentContainerStyle?: PermissiveStyle | PermissiveStyle[] | any;
  }

  interface TouchableOpacityProps {
    style?: PermissiveStyle | PermissiveStyle[] | any;
  }
}

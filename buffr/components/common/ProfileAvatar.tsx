/**
 * Profile Avatar Component
 *
 * Location: components/common/ProfileAvatar.tsx
 * Purpose: Display user avatar with fallback to initials
 *
 * Features:
 * - Image avatar with loading state
 * - Fallback to user initials
 * - Customizable size and colors
 * - Online status indicator
 * - Accessibility support
 */

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

interface ProfileAvatarProps {
  /** User's avatar image URL */
  imageUrl?: string | null;
  /** User's first name (for initials fallback) */
  firstName?: string;
  /** User's last name (for initials fallback) */
  lastName?: string;
  /** Avatar size in pixels */
  size?: number;
  /** Show online status indicator */
  showOnlineStatus?: boolean;
  /** Is user currently online */
  isOnline?: boolean;
  /** Custom background color for initials */
  backgroundColor?: string;
  /** Custom text color for initials */
  textColor?: string;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

export default function ProfileAvatar({
  imageUrl,
  firstName = '',
  lastName = '',
  size = 48,
  showOnlineStatus = false,
  isOnline = false,
  backgroundColor,
  textColor,
  style,
}: ProfileAvatarProps) {
  const { colors, isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Generate initials from name
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

  // Calculate font size based on avatar size
  const fontSize = size * 0.4;

  // Default colors based on theme
  const bgColor = backgroundColor || (isDark ? Colors.primaryDark : Colors.primaryLight);
  const txtColor = textColor || Colors.white;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bgColor,
    },
    style,
  ];

  const showImage = imageUrl && !imageError;

  return (
    <View
      style={containerStyle}
      accessibilityLabel={`${firstName} ${lastName} avatar`}
      accessibilityRole="image"
    >
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize,
              color: txtColor,
            },
          ]}
        >
          {initials}
        </Text>
      )}

      {showOnlineStatus && (
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: isOnline ? Colors.success : Colors.textTertiary,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.125,
              right: 0,
              bottom: 0,
            },
          ]}
          accessibilityLabel={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});

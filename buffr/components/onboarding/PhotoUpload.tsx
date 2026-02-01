/**
 * PhotoUpload Component
 * 
 * Location: components/onboarding/PhotoUpload.tsx
 * Purpose: Profile photo picker for onboarding
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "Upload from gallery.svg", "Photo selected.svg"
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface PhotoUploadProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
  name?: string;
}

export default function PhotoUpload({ 
  imageUri, 
  onImageSelected, 
  onImageRemoved,
  name = 'User',
}: PhotoUploadProps) {
  
  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      camera: cameraPermission.granted,
      media: mediaPermission.granted,
    };
  };

  const pickFromGallery = async () => {
    const permissions = await requestPermissions();
    
    if (!permissions.media) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos to upload a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissions = await requestPermissions();
    
    if (!permissions.camera) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your camera to take a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', ...(imageUri ? ['Remove Photo'] : [])],
          cancelButtonIndex: 0,
          destructiveButtonIndex: imageUri ? 3 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          else if (buttonIndex === 2) pickFromGallery();
          else if (buttonIndex === 3 && imageUri) onImageRemoved();
        }
      );
    } else {
      Alert.alert(
        'Profile Photo',
        'Choose how to add your photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickFromGallery },
          ...(imageUri ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: onImageRemoved }] : []),
        ]
      );
    }
  };

  // Get initials for placeholder
  const getInitials = () => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.avatarContainer} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.initials}>{getInitials()}</Text>
          </View>
        )}
        
        {/* Camera badge */}
        <View style={styles.cameraBadge}>
          <FontAwesome name="camera" size={14} color={Colors.white} />
        </View>
      </TouchableOpacity>

      {/* Label */}
      <Text style={styles.label}>
        {imageUri ? 'Tap to change photo' : 'Add a profile photo'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Colors.white,
    backgroundColor: Colors.slate100,
  },
  placeholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  initials: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.white,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.slate800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

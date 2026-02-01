/**
 * Profile Edit Screen
 * 
 * Location: app/profile/edit.tsx
 * Purpose: Edit user profile information including profile picture
 * 
 * Features:
 * - Update profile picture from gallery or camera
 * - Edit name, email, phone number
 * - Save profile changes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useUser } from '@/contexts/UserContext';
import { ScreenHeader, PillButton, FormInputGroup } from '@/components/common';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';
import { log } from '@/utils/logger';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar || null);

  const handleBack = () => {
    router.back();
  };

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photo library to update your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleSelectImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => handleTakePhoto() },
        { text: 'Photo Library', onPress: () => handlePickImage() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your camera to take a photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setProfileImage(null),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }

    setLoading(true);
    try {
      await updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
        avatar: profileImage || undefined,
      });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      log.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Edit Profile" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleSelectImage}
            activeOpacity={0.7}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome name="user" size={60} color={Colors.primary} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <FontAwesome name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removePhotoButton}
            onPress={handleRemoveImage}
            disabled={!profileImage}
          >
            <Text style={[styles.removePhotoText, !profileImage && styles.removePhotoTextDisabled]}>
              Remove Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <FormInputGroup
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            autoCapitalize="words"
          />

          <FormInputGroup
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            autoCapitalize="words"
          />

          <FormInputGroup
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormInputGroup
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Save Button */}
        <PillButton
          label={loading ? 'Saving...' : 'Save Changes'}
          variant="primary"
          onPress={handleSave}
          disabled={loading}
          loading={loading}
          style={styles.saveButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  removePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.error,
  },
  removePhotoTextDisabled: {
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  formSection: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    gap: 20,
    marginBottom: 32,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 8,
  },
});

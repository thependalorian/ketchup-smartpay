/**
 * QRCodeScanner Component
 * 
 * Location: components/qr/QRCodeScanner.tsx
 * Purpose: Scan QR codes for payments and other actions
 * 
 * Uses camera to scan QR codes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QRCodeScannerProps {
  onQRCodeScanned?: (data: string) => void;
  onClose?: () => void;
  title?: string;
}

export default function QRCodeScanner({ onQRCodeScanned, onClose, title = 'Scan QR Code' }: QRCodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in Settings to scan QR codes.',
        [
          { text: 'Cancel', onPress: onClose, style: 'cancel' },
          { text: 'OK', onPress: onClose },
        ]
      );
    } else if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission, onClose]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onQRCodeScanned?.(data);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking camera permissions...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="times" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.centerContent}>
            <FontAwesome name="camera" size={80} color={Colors.textSecondary} />
            <Text style={styles.permissionText}>Camera permission is required to scan QR codes</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="times" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Top bar with title */}
          <View style={styles.topBar}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Scanning frame */}
          <View style={styles.scanningFrame}>
            <View style={[styles.frameCorner, styles.cornerTopLeft]} />
            <View style={[styles.frameCorner, styles.cornerTopRight]} />
            <View style={[styles.frameCorner, styles.cornerBottomLeft]} />
            <View style={[styles.frameCorner, styles.cornerBottomRight]} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              {scanned ? 'Processing...' : 'Position the QR code within the frame to scan'}
            </Text>
          </View>

          {/* Scan again button */}
          {scanned && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainButtonText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 16,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  scanningFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginTop: '30%',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructionsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
    marginTop: 'auto',
  },
  instructionsText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  scanAgainButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  scanAgainButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

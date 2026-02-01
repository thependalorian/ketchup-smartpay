/**
 * 3D Card Visualization Component
 * 
 * Location: components/3d/Card3DView.tsx
 * Purpose: Display Buffr cards and wallet cards in 3D space using Three.js
 * 
 * This component uses react-three-fiber to render 3D card visualizations.
 * Supports card rotation, zoom, and interactive gestures.
 * 
 * Based on card frame designs from BuffrCrew/Buffr Card Design folder
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas , useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Card3DViewProps {
  width?: number;
  height?: number;
  cardColor?: string;
  cardNumber?: string;
  cardholderName?: string;
  autoRotate?: boolean;
  frameNumber?: number; // Card frame design number (2-32 from Buffr Card Design)
  onCardRotate?: (rotation: { x: number; y: number }) => void;
  enableGestures?: boolean; // Enable pinch to zoom, pan to rotate
}

/**
 * 3D Card Mesh Component
 * Represents a single card in 3D space
 * Supports interactive gestures for rotation and zoom
 */
function CardMesh({ 
  cardColor = Colors.primary, 
  cardNumber = '****',
  cardholderName = 'CARDHOLDER',
  autoRotate = true,
  onRotate,
}: {
  cardColor: string;
  cardNumber: string;
  cardholderName: string;
  autoRotate: boolean;
  onRotate?: (rotation: { x: number; y: number }) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationX = useRef(0);
  const rotationY = useRef(0);

  // Auto-rotate animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      if (autoRotate) {
        meshRef.current.rotation.y += delta * 0.5; // Slow rotation
        rotationY.current = meshRef.current.rotation.y;
      }
      
      // Update rotation callback
      if (onRotate) {
        onRotate({
          x: rotationX.current,
          y: rotationY.current,
        });
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* Card geometry - credit card dimensions (85.60mm x 53.98mm) */}
      <boxGeometry args={[8.56, 5.398, 0.1]} />
      <meshStandardMaterial 
        color={cardColor}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

/**
 * Main 3D Card View Component
 */
export default function Card3DView({
  width = SCREEN_WIDTH * 0.9,
  height = 300,
  cardColor = Colors.primary,
  cardNumber = '****',
  cardholderName = 'CARDHOLDER',
  autoRotate = true,
  frameNumber,
  onCardRotate,
  enableGestures = false,
}: Card3DViewProps) {
  // Map frame number to card color variations (if needed)
  const getCardColorFromFrame = (frame?: number): string => {
    if (!frame) return cardColor;
    // Frame-based color variations can be added here
    // For now, use primary color
    return cardColor;
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 50 }}
        style={styles.canvas}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* 3D Card */}
        <CardMesh
          cardColor={getCardColorFromFrame(frameNumber)}
          cardNumber={cardNumber}
          cardholderName={cardholderName}
          autoRotate={autoRotate}
          onRotate={onCardRotate}
        />
      </Canvas>
      
      {/* Card Info Overlay (optional) */}
      {cardholderName && (
        <View style={styles.infoOverlay} pointerEvents="none">
          <Text style={styles.cardholderText}>{cardholderName}</Text>
          {frameNumber && (
            <Text style={styles.frameText}>Frame {frameNumber}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  canvas: {
    flex: 1,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  cardholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  frameText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

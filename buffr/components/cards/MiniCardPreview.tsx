/**
 * MiniCardPreview Component
 *
 * Location: components/cards/MiniCardPreview.tsx
 * Purpose: Small card preview showing just the card design background
 *
 * Used in places where a compact card preview is needed (home screen, lists, etc.)
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { loadCardAsset } from '@/utils/cardAssetLoader';
import { isFrameAvailable } from '@/utils/cardDesigns';

interface MiniCardPreviewProps {
  frameNumber?: number;
  width?: number;
  height?: number;
}

export default function MiniCardPreview({
  frameNumber = 2,
  width = 56,
  height = 36,
}: MiniCardPreviewProps) {
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const validFrameNumber = isFrameAvailable(frameNumber) ? frameNumber : 2;

  useEffect(() => {
    const loadAsset = async () => {
      setIsLoading(true);
      const asset = await loadCardAsset(validFrameNumber);
      setSvgXml(asset);
      setIsLoading(false);
    };
    loadAsset();
  }, [validFrameNumber]);

  return (
    <View style={[styles.container, { width, height }]}>
      {isLoading || !svgXml ? (
        <View style={[styles.placeholder, { width, height }]} />
      ) : (
        <SvgXml
          xml={svgXml}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
});

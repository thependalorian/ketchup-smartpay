/**
 * SVGCardDisplay Component
 * 
 * Location: components/cards/SVGCardDisplay.tsx
 * 
 * Purpose: Renders raw SVG XML content within the standard card dimensions.
 * This component allows dynamic display of different card designs.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CardDimensions } from '@/constants/CardDesign';

interface SVGCardDisplayProps {
  svgXml: string | null;
}

export default function SVGCardDisplay({ svgXml }: SVGCardDisplayProps) {
  if (!svgXml) {
    // Render a placeholder or fallback if no SVG is provided
    return <View style={[styles.container, styles.fallback]} />;
  }

  return (
    <View style={styles.container}>
      <SvgXml
        xml={svgXml}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CardDimensions.WIDTH,
    height: CardDimensions.HEIGHT,
    borderRadius: CardDimensions.BORDER_RADIUS,
    overflow: 'hidden', // Ensures the SVG respects the border radius
  },
  fallback: {
    backgroundColor: '#ccc', // A simple gray fallback
  },
});

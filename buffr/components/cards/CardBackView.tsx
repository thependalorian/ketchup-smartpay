/**
 * CardBackView Component
 * 
 * Location: components/cards/CardBackView.tsx
 * 
 * Purpose: Renders the back of a Buffr card, including the magnetic
 * stripe, CVV, and other required elements.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { CardDimensions, CardBack } from '@/constants/CardDesign';

interface CardBackViewProps {
  cvv?: string;
}

export default function CardBackView({ cvv = '123' }: CardBackViewProps) {
  return (
    <View style={styles.container}>
      {/* Magnetic Stripe */}
      <View style={styles.magStripe} />

      {/* CVV and Signature Area */}
      <View style={styles.cvvSignatureArea}>
        <Text style={styles.signatureLabel}>AUTHORIZED SIGNATURE</Text>
        <View style={styles.cvvContainer}>
          <Text style={styles.cvvText}>{cvv}</Text>
        </View>
      </View>

      {/* Footer Text */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This card is issued by Buffr Financial Services CC. Use of this card constitutes
          acceptance of the terms and conditions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CardDimensions.WIDTH,
    height: CardDimensions.HEIGHT,
    borderRadius: CardDimensions.BORDER_RADIUS,
    backgroundColor: Colors.primaryDark,
    padding: 20,
  },
  magStripe: {
    height: CardBack.MAGNETIC_STRIPE_HEIGHT,
    backgroundColor: Colors.dark,
    marginHorizontal: -20,
    marginTop: 20,
  },
  cvvSignatureArea: {
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 4,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signatureLabel: {
    flex: 1,
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  cvvContainer: {
    width: CardBack.CVV_BOX_WIDTH,
    height: CardBack.CVV_BOX_HEIGHT,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  cvvText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textDark,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
  },
  footerText: {
    fontSize: 8,
    color: Colors.white,
    opacity: 0.6,
    textAlign: 'center',
  },
});

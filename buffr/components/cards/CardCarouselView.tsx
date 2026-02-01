/**
 * CardCarouselView Component
 * 
 * Location: components/cards/CardCarouselView.tsx
 * 
 * Purpose: Renders a horizontal, scrollable, and snappable carousel of interactive cards.
 * Features parallax effect for a polished look and feel.
 */

import React from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { CardDimensions } from '@/constants/CardDesign';
import CardFlipView from './CardFlipView';
import CardFrame from './CardFrame';
import CardBackView from './CardBackView';

// Define a standard interface for card data used by the carousel
interface CardData {
  id: string;
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
  network?: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other' | 'buffr';
  frameNumber?: number;
}

interface CardCarouselViewProps {
  cards: CardData[];
}

// Type for carousel items (including spacers)
type CarouselDataItem = CardData | { id: string };

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<CarouselDataItem>);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = CardDimensions.WIDTH + 20; // Card width + horizontal margin
const SPACER_WIDTH = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

// --- Carousel Item Sub-component ---
interface CarouselItemProps {
  item: CardData;
  index: number;
  scrollX: SharedValue<number>;
}

const CarouselItem = ({ item, index, scrollX }: CarouselItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * ITEM_WIDTH, index * ITEM_WIDTH, (index + 1) * ITEM_WIDTH],
      [0.9, 1, 0.9],
      'clamp'
    );
    return {
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[styles.itemContainer, animatedStyle]}>
      <CardFlipView
        front={
          <CardFrame
            cardNumber={item.cardNumber}
            cardholderName={item.cardholderName}
            expiryDate={item.expiryDate}
            network={item.network}
            frameNumber={item.frameNumber}
          />
        }
        back={<CardBackView cvv={item.cvv} />}
      />
    </Animated.View>
  );
};

// --- Main Carousel Component ---
export default function CardCarouselView({ cards }: CardCarouselViewProps) {
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Add spacers to the start and end of the data to center the first and last items
  const carouselData: CarouselDataItem[] = [{ id: 'left-spacer' }, ...cards, { id: 'right-spacer' }];

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        data={carouselData}
        renderItem={({ item, index }: { item: CarouselDataItem; index: number }) => {
          if (item.id === 'left-spacer' || item.id === 'right-spacer') {
            return <View style={{ width: SPACER_WIDTH }} />;
          }
          return <CarouselItem item={item as CardData} index={index - 1} scrollX={scrollX} />;
        }}
        keyExtractor={(item: CarouselDataItem) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onScroll={onScroll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CardDimensions.HEIGHT + 40, // Add some vertical padding
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

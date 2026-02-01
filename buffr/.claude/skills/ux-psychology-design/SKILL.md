---
name: ux-psychology-design
description: UX Psychology-Driven Design System for Buffr React Native Expo
triggers:
  - pattern: "create (component|screen|button|card|form|list)"
  - pattern: "design (ui|interface|layout)"
  - pattern: "style (component|element)"
  - pattern: "(add|implement) (button|card|input|modal)"
  - pattern: "(build|make) (screen|page|view)"
---

# UX Psychology-Driven Design Skill for Buffr

This skill enforces UX psychology principles, Buffr brand guidelines, and React Native/Expo patterns for all UI development tasks.

---

## Psychology Laws (Always Apply)

### Fitts's Law - Touch Targets
**Principle:** Time to reach a target depends on distance and size.

**Implementation:**
- Minimum touch target: 44×44pt
- Primary buttons: 48-52pt height
- Use HitSlop for small icons: `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`
- Increase touch area without visual expansion

**Code Pattern:**
```tsx
<TouchableOpacity
  style={{ minHeight: 48, minWidth: 48, padding: 12 }}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
>
  <Icon size={24} />
</TouchableOpacity>
```

---

### Hick's Law - Choice Reduction
**Principle:** Decision time increases with number/complexity of choices.

**Implementation:**
- Maximum 5-7 navigation items
- Progressive disclosure for advanced options
- Smart defaults to reduce decisions
- Limit visible options, use "Show more" patterns

**Code Pattern:**
```tsx
// Good: Limited choices with smart default
<PaymentMethodSelector
  methods={methods.slice(0, 5)}
  defaultMethod={lastUsedMethod}
  showMore={methods.length > 5}
/>
```

---

### Miller's Law - Chunking
**Principle:** Short-term memory holds 7±2 items.

**Implementation:**
- Group content into 7±2 items
- Chunk phone numbers: `+264 81 234 5678`
- Chunk amounts: `N$ 1,234.56`
- Use visual grouping for related content

**Code Pattern:**
```tsx
// Phone number chunking
const formatPhone = (phone: string) =>
  phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');

// Amount formatting with Namibian Dollar
const formatAmount = (amount: number) =>
  `N$ ${amount.toLocaleString('en-NA', { minimumFractionDigits: 2 })}`;
```

---

### Jakob's Law - Platform Familiarity
**Principle:** Users expect your app to work like others they know.

**Implementation:**
- Bottom tab navigation (banking app pattern)
- Pull-to-refresh for lists
- Swipe gestures for actions
- Platform-specific patterns (iOS vs Android)

**Code Pattern:**
```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  header: {
    ...Platform.select({
      ios: { paddingTop: 44 },
      android: { paddingTop: StatusBar.currentHeight },
    }),
  },
});
```

---

### Gestalt Principles

#### Proximity
**Principle:** Elements close together are perceived as related.

```tsx
// Related items grouped with consistent spacing
<View style={{ gap: 8 }}>
  <Text style={Typography.label}>Account Details</Text>
  <Text style={Typography.body}>{accountNumber}</Text>
  <Text style={Typography.caption}>{accountType}</Text>
</View>
<View style={{ gap: 8, marginTop: 24 }}>
  <Text style={Typography.label}>Balance</Text>
  <Text style={Typography.amountHero}>{balance}</Text>
</View>
```

#### Similarity
**Principle:** Similar elements are perceived as belonging together.

```tsx
// Same function = same styling
const actionButtons = actions.map(action => (
  <PillButton
    key={action.id}
    variant="secondary"
    icon={action.icon}
    label={action.label}
  />
));
```

#### Figure-Ground
**Principle:** Elements are perceived as foreground or background.

```tsx
// Shadows create visual hierarchy
import { Shadows } from '@/constants/Shadows';

<View style={[styles.card, Shadows.card]}>
  <Text>Elevated content</Text>
</View>
```

---

### Doherty Threshold - Response Time
**Principle:** Productivity increases when response time < 400ms.

**Implementation:**
- Target <400ms for all interactions
- Show loading states immediately (within 100ms)
- Use skeleton screens for content loading
- Optimistic UI updates

**Code Pattern:**
```tsx
// Immediate feedback with optimistic update
const handlePayment = async () => {
  setIsLoading(true);
  setOptimisticBalance(balance - amount); // Immediate feedback

  try {
    await processPayment(amount);
  } catch (error) {
    setOptimisticBalance(balance); // Revert on error
  } finally {
    setIsLoading(false);
  }
};
```

---

### Goal-Gradient Effect
**Principle:** People accelerate behavior as they approach a goal.

**Implementation:**
- Show progress indicators
- Use step indicators for multi-step flows
- Display completion percentage
- Celebrate milestones

**Code Pattern:**
```tsx
<ProgressBar
  progress={currentStep / totalSteps}
  showPercentage
  celebrateAt={[0.25, 0.5, 0.75, 1.0]}
/>
```

---

### Von Restorff Effect (Isolation Effect)
**Principle:** Distinctive items are more memorable.

**Implementation:**
- Primary CTA stands out from secondary actions
- Use accent color sparingly
- Isolate important information

**Code Pattern:**
```tsx
// Primary button stands out
<View style={{ gap: 12 }}>
  <PillButton variant="primary" label="Pay Now" /> {/* Stands out */}
  <PillButton variant="ghost" label="Cancel" />
</View>
```

---

## Buffr Brand System

### Color Palette

```typescript
// Primary Brand Colors
const Colors = {
  // Core
  primary: '#2563EB',        // Buffr Blue
  primaryDark: '#0029D6',    // Logo Blue
  primaryLight: '#3B82F6',   // Lighter variant

  // Text
  text: '#020617',           // slate-950
  textSecondary: '#475569',  // slate-600
  textTertiary: '#94A3B8',   // slate-400

  // Backgrounds (Light Mode)
  background: '#F8FAFC',     // slate-50
  surface: '#FFFFFF',        // white
  surfaceAlt: '#F1F5F9',     // slate-100

  // Borders
  border: '#E2E8F0',         // slate-200
  borderLight: '#F1F5F9',    // slate-100

  // Semantic
  success: '#10B981',        // emerald-500
  warning: '#F59E0B',        // amber-500
  error: '#E11D48',          // rose-600
  info: '#0EA5E9',           // sky-500

  // Card Accents
  purple: '#6A38F8',         // Premium Purple
  gold: '#D4AF37',           // Premium Gold
};
```

### Typography Scale (1.25 Modular Scale)

```typescript
// Base: 14px, Ratio: 1.25
const FontSize = {
  xs: 10,    // 14 ÷ 1.25² - Micro labels
  sm: 12,    // 14 ÷ 1.25  - Captions
  base: 14,  // Base       - Body text
  md: 18,    // 14 × 1.25  - Emphasized
  lg: 22,    // 14 × 1.25² - Section titles
  xl: 28,    // 14 × 1.25³ - Screen titles
  '2xl': 35, // 14 × 1.25⁴ - Large headings
  '3xl': 44, // 14 × 1.25⁵ - Hero text
  '4xl': 55, // 14 × 1.25⁶ - Display
};
```

### Spacing System (8pt Base)

```typescript
const Spacing = {
  xs: 4,   // Tight spacing
  sm: 8,   // Small gap
  md: 16,  // Standard gap
  lg: 24,  // Section spacing
  xl: 32,  // Large section spacing
  '2xl': 48, // Page section spacing
};
```

### Border Radius

```typescript
const BorderRadius = {
  sm: 8,    // Inputs, small cards
  md: 12,   // Cards, buttons
  lg: 16,   // Large cards
  xl: 20,   // Modals
  full: 9999, // Pills, avatars
};
```

---

## Component Templates

### PillButton (Primary Interactive Element)

```tsx
/**
 * @psychology
 * - Fitts's Law: 48pt minimum height, generous touch target
 * - Von Restorff: Primary variant uses brand blue for isolation
 * - Doherty: Immediate feedback via opacity/scale animation
 */
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Shadows } from '@/constants/Shadows';

interface PillButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onPress: () => void;
  disabled?: boolean;
}

export function PillButton({
  label,
  variant = 'primary',
  onPress,
  disabled
}: PillButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        variant === 'primary' && Shadows.button,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[Typography.buttonMedium, styles[`${variant}Text`]]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: Colors.text,
  },
  ghostText: {
    color: Colors.primary,
  },
});
```

### GlassCard (Container Component)

```tsx
/**
 * @psychology
 * - Gestalt Figure-Ground: Elevated surface with shadow
 * - Aesthetic-Usability: Polished glass morphism effect
 * - Proximity: Groups related content
 */
import { View, StyleSheet } from 'react-native';
import { Shadows } from '@/constants/Shadows';
import { Colors } from '@/constants/Colors';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat';
}

export function GlassCard({ children, variant = 'elevated' }: GlassCardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'elevated' && Shadows.card,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
```

### AmountInput (Fintech-Specific)

```tsx
/**
 * @psychology
 * - Miller's Law: Amount chunked with thousands separators
 * - Fitts's Law: Large touch target for keypad
 * - Doherty: Real-time formatting feedback
 */
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Typography } from '@/constants/Typography';
import { Colors } from '@/constants/Colors';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
}

export function AmountInput({
  value,
  onChange,
  currency = 'N$'
}: AmountInputProps) {
  const formattedValue = value
    ? Number(value).toLocaleString('en-NA', { minimumFractionDigits: 2 })
    : '0.00';

  return (
    <View style={styles.container}>
      <Text style={styles.currency}>{currency}</Text>
      <Text style={[Typography.amountHero, styles.amount]}>
        {formattedValue}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  currency: {
    fontSize: 24,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  amount: {
    color: Colors.text,
  },
});
```

---

## React Native/Expo Patterns

### Safe Area Handling

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {children}
    </SafeAreaView>
  );
}
```

### Platform-Specific Shadows

```tsx
import { Platform, StyleSheet } from 'react-native';

const createShadow = (elevation: number) => ({
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.1 + (elevation * 0.01),
      shadowRadius: elevation,
    },
    android: {
      elevation,
    },
  }),
});
```

### Haptic Feedback

```tsx
import * as Haptics from 'expo-haptics';

// Use for button presses (Doherty Threshold compliance)
const handlePress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  onPress();
};
```

---

## Validation Checklist

Before submitting any UI component or screen, verify:

### Touch Targets (Fitts's Law)
- [ ] All interactive elements >= 44pt touch area
- [ ] Primary buttons 48-52pt height
- [ ] Small icons use HitSlop

### Choice Architecture (Hick's Law)
- [ ] Maximum 5-7 visible options
- [ ] Smart defaults provided
- [ ] Progressive disclosure for advanced options

### Information Chunking (Miller's Law)
- [ ] Phone numbers formatted: +264 XX XXX XXXX
- [ ] Amounts formatted: N$ X,XXX.XX
- [ ] Lists grouped into 7±2 items

### Response Time (Doherty Threshold)
- [ ] Loading state shows within 100ms
- [ ] Interaction feedback within 400ms
- [ ] Optimistic UI updates where applicable

### Visual Hierarchy (Gestalt)
- [ ] Related items grouped (Proximity)
- [ ] Similar functions styled consistently (Similarity)
- [ ] Shadows establish depth (Figure-Ground)

### Platform Conventions (Jakob's Law)
- [ ] Uses standard navigation patterns
- [ ] Platform-specific UI elements
- [ ] Familiar gestures (swipe, pull-to-refresh)

### Design System Compliance
- [ ] Uses Typography.ts presets
- [ ] Uses Shadows.ts presets
- [ ] Uses Colors from constants
- [ ] Follows spacing system (8pt base)

---

## Example Prompts and Expected Behavior

### Prompt: "Create a payment confirmation screen"

**Expected Implementation:**
1. Safe area layout with background color
2. Amount displayed using `Typography.amountHero` with chunking
3. Recipient info grouped (Gestalt Proximity)
4. Primary "Confirm" button (48pt height, brand blue)
5. Secondary "Cancel" (ghost variant)
6. Loading state with haptic feedback
7. Success animation with celebration

### Prompt: "Add a card selection component"

**Expected Implementation:**
1. Maximum 5 cards visible (Hick's Law)
2. Horizontal scroll for more cards
3. Selected card elevated with shadow (Von Restorff)
4. Card tap area >= 44pt
5. Visual feedback on selection (Doherty)

### Prompt: "Design a transaction list"

**Expected Implementation:**
1. Group by date (Gestalt Proximity)
2. Consistent row styling (Gestalt Similarity)
3. Amount right-aligned with chunking (Miller's Law)
4. Pull-to-refresh (Jakob's Law)
5. Skeleton loading (Doherty Threshold)
6. Most recent at top (Serial Position Effect)

---

## Design Assets Reference

### Source Files
- **Light Mode:** `/Users/georgenekwaya/Downloads/BuffrCrew/Buffr App Design/` (258 SVG screens)
- **Card Designs:** `/Users/georgenekwaya/Downloads/BuffrCrew/Buffr Card Design/` (24 SVG files)
- **Dark Mode:** `/Users/georgenekwaya/Downloads/BuffrCrew/Buffr Dark Mode Design.zip`

### Key Screens
- `Home screen.svg` - Dashboard layout
- `Wallet View.svg` - Wallet details
- `Card View.svg` - Card display patterns
- `Loan Details.svg` - Financial info layouts
- `Transactions (Balance).svg` - Transaction list patterns
- `Settings.svg` - Settings patterns

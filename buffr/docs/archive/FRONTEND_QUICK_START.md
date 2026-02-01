# 🚀 Buffr Frontend Quick Start Guide
## Developer Implementation Guide

**Version:** 1.0  
**Date:** January 26, 2026

---

## 📋 Quick Reference

### Creating a New Screen

1. **Create file in appropriate location:**
   ```typescript
   // app/feature-name/screen-name.tsx
   ```

2. **Use standard screen template:**
   ```typescript
   /**
    * Screen Name
    * 
    * Location: app/feature-name/screen-name.tsx
    * Purpose: Brief description
    */
   
   import React from 'react';
   import { View, Text, StyleSheet } from 'react-native';
   import { useRouter } from 'expo-router';
   import { Colors, Typography, Spacing, Layout } from '@/constants/DesignSystem';
   import { defaultStyles } from '@/constants/Styles';
   
   export default function ScreenName() {
     const router = useRouter();
     
     return (
       <View style={defaultStyles.containerFull}>
         {/* Screen content */}
       </View>
     );
   }
   
   const styles = StyleSheet.create({
     // Use Design System tokens
   });
   ```

3. **Add to navigation** (`app/_layout.tsx` if needed):
   ```typescript
   <Stack.Screen 
     name="feature-name/screen-name" 
     options={{ headerShown: false }} 
   />
   ```

### Creating a New Component

1. **Create file in `/components`:**
   ```typescript
   // components/feature/ComponentName.tsx
   ```

2. **Use component template:**
   ```typescript
   /**
    * ComponentName Component
    * 
    * Location: components/feature/ComponentName.tsx
    * Purpose: Brief description
    */
   
   import React from 'react';
   import { View, Text, StyleSheet } from 'react-native';
   import { Colors, Typography, Spacing } from '@/constants/DesignSystem';
   
   interface ComponentNameProps {
     // Props definition
   }
   
   export const ComponentName: React.FC<ComponentNameProps> = ({ 
     // Props
   }) => {
     return (
       <View style={styles.container}>
         {/* Component content */}
       </View>
     );
   };
   
   const styles = StyleSheet.create({
     container: {
       // Use Design System tokens
     },
   });
   ```

3. **Export from `/components/index.ts`:**
   ```typescript
   export { ComponentName } from './feature/ComponentName';
   ```

---

## 🎨 Design System Usage

### Colors
```typescript
import { Colors } from '@/constants/DesignSystem';

// Primary colors
Colors.PRIMARY[800]  // Main brand color
Colors.PRIMARY[500]  // Buttons, links
Colors.PRIMARY[50]  // Light backgrounds

// Semantic colors
Colors.SEMANTIC.success
Colors.SEMANTIC.error
Colors.SEMANTIC.warning

// Text colors
Colors.TEXT.primary
Colors.TEXT.secondary
Colors.TEXT.tertiary

// Background colors
Colors.BACKGROUND.primary
Colors.BACKGROUND.card
```

### Typography
```typescript
import { Typography } from '@/constants/DesignSystem';

// Font sizes
Typography.FONT_SIZES.h1    // 28
Typography.FONT_SIZES.h2    // 22
Typography.FONT_SIZES.h3    // 20
Typography.FONT_SIZES.h4    // 17 (body)
Typography.FONT_SIZES.h5    // 15
Typography.FONT_SIZES.h6    // 13

// Font weights
Typography.FONT_WEIGHTS.regular   // 400
Typography.FONT_WEIGHTS.medium    // 500
Typography.FONT_WEIGHTS.semibold  // 600
Typography.FONT_WEIGHTS.bold      // 700
```

### Spacing
```typescript
import { Spacing } from '@/constants/DesignSystem';

Spacing.xs    // 4
Spacing.sm    // 8
Spacing.md    // 16
Spacing.lg    // 20
Spacing.xl    // 24
Spacing['2xl'] // 32
Spacing['3xl'] // 40
```

### Layout
```typescript
import { Layout } from '@/constants/DesignSystem';

Layout.HORIZONTAL_PADDING      // 16.5
Layout.SECTION_SPACING         // 32
Layout.LARGE_SECTION_SPACING   // 40
Layout.TOUCH_TARGET_MIN         // 44
```

---

## 🔌 API Integration

### Using API Client

```typescript
import { apiClient } from '@/utils/apiClient';

// GET request
const data = await apiClient.get('/api/v1/endpoint');

// POST request
const result = await apiClient.post('/api/v1/endpoint', {
  // Request body
});

// Error handling
try {
  const data = await apiClient.get('/api/v1/endpoint');
} catch (error) {
  logger.error('API error:', error);
  // Handle error
}
```

### Using React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/utils/apiClient';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => apiClient.get(`/api/v1/resource/${id}`),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/api/v1/endpoint', data),
  onSuccess: () => {
    // Handle success
  },
});
```

---

## 🗂️ Context Usage

### User Context
```typescript
import { useUser } from '@/contexts/UserContext';

const { user, preferences, fetchUser, toggleBalanceVisibility } = useUser();
```

### Wallets Context
```typescript
import { useWallets } from '@/contexts/WalletsContext';

const { wallets, fetchWallets, createWallet } = useWallets();
```

### Transactions Context
```typescript
import { useTransactions } from '@/contexts/TransactionsContext';

const { transactions, fetchTransactions } = useTransactions();
```

---

## 🧭 Navigation

### Using Expo Router

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to screen
router.push('/screen-name');

// Navigate with params
router.push({
  pathname: '/screen/[id]',
  params: { id: '123' },
});

// Go back
router.back();

// Replace (no back button)
router.replace('/screen-name');
```

### Navigation Types

- **Stack Navigation:** Standard forward navigation
- **Modal:** Bottom sheet presentation (`presentation: 'modal'`)
- **Card:** Card-style presentation (`presentation: 'card'`)

---

## 📱 Common Patterns

### Loading State
```typescript
const [loading, setLoading] = useState(false);

if (loading) {
  return <LoadingSkeleton />;
}
```

### Error State
```typescript
const [error, setError] = useState<string | null>(null);

if (error) {
  return <ErrorState message={error} onRetry={handleRetry} />;
}
```

### Empty State
```typescript
if (items.length === 0) {
  return <EmptyState message="No items found" />;
}
```

### Form Validation
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!email) newErrors.email = 'Email is required';
  if (!isValidEmail(email)) newErrors.email = 'Invalid email';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## ✅ Checklist for New Screens

- [ ] Screen file created in correct location
- [ ] Uses Design System tokens (Colors, Typography, Spacing)
- [ ] Follows 8pt grid spacing
- [ ] Implements loading state
- [ ] Implements error state
- [ ] Implements empty state
- [ ] Uses TypeScript types
- [ ] Handles navigation correctly
- [ ] Integrates with API/Context
- [ ] Follows accessibility guidelines
- [ ] Tested on iOS and Android
- [ ] Added to navigation structure
- [ ] Documented in code comments

---

## 🐛 Common Issues & Solutions

### Issue: Navigation not working
**Solution:** Check `app/_layout.tsx` has screen registered

### Issue: Styles not applying
**Solution:** Ensure using StyleSheet.create() and Design System tokens

### Issue: API calls failing
**Solution:** Check API endpoint, error handling, and network connectivity

### Issue: Context not updating
**Solution:** Ensure context provider wraps component tree

### Issue: TypeScript errors
**Solution:** Check type definitions, import paths, and null checks

---

## 📚 Resources

- **Design System:** `constants/DesignSystem.ts`
- **Styles:** `constants/Styles.ts`
- **Colors:** `constants/Colors.ts`
- **Layout:** `constants/Layout.ts`
- **API Client:** `utils/apiClient.ts`
- **Logger:** `utils/logger.ts`
- **Components:** `components/`

---

**Last Updated:** January 26, 2026

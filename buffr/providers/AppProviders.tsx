/**
 * Composed App Providers
 *
 * Location: providers/AppProviders.tsx
 * Purpose: Single composed provider following KISS principle
 *
 * Benefits:
 * - Eliminates deeply nested provider structure (was 7 levels deep)
 * - Easier to maintain and modify provider order
 * - Cleaner _layout.tsx file
 * - Provider dependencies are clear and documented
 *
 * Provider Order (dependency-aware):
 * 1. QueryProvider - Foundation for data caching (no dependencies)
 * 2. ThemeProvider - Theme/UI state (no dependencies)
 * 3. UserProvider - Authentication state (depends on Query)
 * 4. CardsProvider - User's cards (depends on User)
 * 5. BanksProvider - Linked banks (depends on User)
 * 6. WalletsProvider - User's wallets (depends on User)
 * 7. TransactionsProvider - Transaction history (depends on User, Wallets)
 * 8. VouchersProvider - Vouchers state (depends on User)
 * 9. NotificationsProvider - Notifications state (depends on User)
 * 10. ContactsProvider - Contacts state (depends on User)
 */

import React, { ReactNode } from 'react';

// React Query for data caching
import { QueryProvider } from '@/utils/queryClient';

// Context providers
import { UserProvider } from '@/contexts/UserContext';
import { CardsProvider } from '@/contexts/CardsContext';
import { BanksProvider } from '@/contexts/BanksContext';
import { TransactionsProvider } from '@/contexts/TransactionsContext';
import { WalletsProvider } from '@/contexts/WalletsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ContactsProvider } from '@/contexts/ContactsContext';
import { VouchersProvider } from '@/contexts/VouchersContext';
import { UserInactivityProvider } from '@/contexts/UserInactivity';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Compose multiple providers into a single component
 *
 * This utility function allows for cleaner provider composition
 * without deep nesting. Each provider is applied in order.
 *
 * @param providers - Array of provider components
 * @param children - Child components to wrap
 */
function composeProviders(
  providers: Array<React.ComponentType<{ children: ReactNode }>>,
  children: ReactNode
): ReactNode {
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );
}

/**
 * All app providers in dependency order
 *
 * Note: Order matters! Providers that depend on others must come after.
 * - QueryProvider first (caching foundation)
 * - UserProvider early (most things depend on user state)
 * - Data providers last (depend on user context)
 */
const providers: Array<React.ComponentType<{ children: ReactNode }>> = [
  QueryProvider,
  ThemeProvider,
  UserProvider,
  CardsProvider,
  BanksProvider,
  WalletsProvider,
  TransactionsProvider,
  VouchersProvider,
  NotificationsProvider,
  ContactsProvider,
  UserInactivityProvider, // ✅ Monitor user inactivity and lock app
];

/**
 * AppProviders - Single composed provider for the entire app
 *
 * Usage in _layout.tsx:
 * ```tsx
 * import { AppProviders } from '@/providers/AppProviders';
 *
 * function RootLayoutNav() {
 *   return (
 *     <AppProviders>
 *       <Stack>
 *         {/* screens *\/}
 *       </Stack>
 *     </AppProviders>
 *   );
 * }
 * ```
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <>{composeProviders(providers, children)}</>;
}

/**
 * Lightweight provider for testing
 *
 * Includes only QueryProvider for unit tests that don't need full app state
 */
export function TestProviders({ children }: AppProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
}

/**
 * Add a provider dynamically (for feature flags, A/B testing, etc.)
 *
 * Usage:
 * ```tsx
 * const ExtendedProviders = withProvider(AppProviders, NewFeatureProvider);
 * ```
 */
export function withProvider<P extends { children: ReactNode }>(
  BaseProviders: React.ComponentType<P>,
  NewProvider: React.ComponentType<{ children: ReactNode }>
): React.ComponentType<P> {
  return function ExtendedProviders(props: P) {
    return (
      <BaseProviders {...props}>
        <NewProvider>{props.children}</NewProvider>
      </BaseProviders>
    );
  };
}

export default AppProviders;

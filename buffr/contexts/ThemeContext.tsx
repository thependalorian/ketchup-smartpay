/**
 * Theme Context
 *
 * Location: contexts/ThemeContext.tsx
 * Purpose: Dark mode support with system preference detection and persistence
 *
 * @psychology
 * - Jakob's Law: Follows OS-level theme preferences (user expectation)
 * - Aesthetic-Usability: Dark mode reduces eye strain in low-light conditions
 * - Accessibility: High contrast themes for visual accessibility
 *
 * @see SKILL.md for full design system documentation
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { getItemAsync, setItemAsync } from '@/utils/storage';
import logger from '@/utils/logger';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Theme mode options
 * - light: Always use light theme
 * - dark: Always use dark theme
 * - auto: Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Active theme (resolved from ThemeMode)
 */
export type ActiveTheme = 'light' | 'dark';

/**
 * Color palette for a theme
 */
export interface ThemeColors {
  // Core
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;

  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceAlt: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Borders
  border: string;
  borderLight: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // Special
  overlay: string;
  shadow: string;
}

/**
 * Theme context value
 */
interface ThemeContextType {
  /** Current theme mode setting */
  mode: ThemeMode;

  /** Resolved active theme (light or dark) */
  theme: ActiveTheme;

  /** Color palette for current theme */
  colors: ThemeColors;

  /** Whether dark mode is active */
  isDark: boolean;

  /** Set theme mode preference */
  setMode: (mode: ThemeMode) => Promise<void>;

  /** Toggle between light and dark (ignores auto) */
  toggle: () => Promise<void>;

  /** Loading state during initialization */
  isLoading: boolean;
}

// =============================================================================
// COLOR PALETTES
// =============================================================================

/**
 * Light theme color palette
 * Extracted from Buffr App Design Figma assets
 */
const LightColors: ThemeColors = {
  // Core
  primary: '#2563EB', // Buffr Blue
  primaryLight: '#3B82F6', // blue-500
  primaryDark: '#1D4ED8', // blue-700
  primaryMuted: '#EFF6FF', // blue-50

  // Backgrounds
  background: '#F8FAFC', // slate-50
  backgroundSecondary: '#F1F5F9', // slate-100
  surface: '#FFFFFF', // white
  surfaceAlt: '#F8FAFC', // slate-50

  // Text
  text: '#020617', // slate-950
  textSecondary: '#475569', // slate-600
  textTertiary: '#94A3B8', // slate-400
  textInverse: '#FFFFFF', // white

  // Borders
  border: '#E2E8F0', // slate-200
  borderLight: '#F1F5F9', // slate-100

  // Semantic
  success: '#10B981', // emerald-500
  warning: '#F59E0B', // amber-500
  error: '#E11D48', // rose-600
  info: '#0EA5E9', // sky-500

  // Special
  overlay: 'rgba(15, 23, 42, 0.5)', // slate-900 @ 50%
  shadow: '#0F172A', // slate-900
};

/**
 * Dark theme color palette
 * Based on Buffr Dark Mode Design with WCAG 2.1 AA contrast compliance
 */
const DarkColors: ThemeColors = {
  // Core
  primary: '#3B82F6', // blue-500 (slightly lighter for dark bg)
  primaryLight: '#60A5FA', // blue-400
  primaryDark: '#2563EB', // blue-600
  primaryMuted: '#1E3A5F', // dark blue tint

  // Backgrounds
  background: '#0F172A', // slate-900
  backgroundSecondary: '#1E293B', // slate-800
  surface: '#1E293B', // slate-800
  surfaceAlt: '#334155', // slate-700

  // Text
  text: '#F1F5F9', // slate-100
  textSecondary: '#94A3B8', // slate-400
  textTertiary: '#64748B', // slate-500
  textInverse: '#020617', // slate-950

  // Borders
  border: '#334155', // slate-700
  borderLight: '#475569', // slate-600

  // Semantic (slightly adjusted for dark backgrounds)
  success: '#34D399', // emerald-400
  warning: '#FBBF24', // amber-400
  error: '#FB7185', // rose-400
  info: '#38BDF8', // sky-400

  // Special
  overlay: 'rgba(0, 0, 0, 0.7)', // black @ 70%
  shadow: '#000000', // pure black
};

// =============================================================================
// STORAGE KEY
// =============================================================================

const THEME_STORAGE_KEY = 'buffr_theme_mode';

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  /** Override initial theme (useful for testing) */
  initialMode?: ThemeMode;
}

/**
 * Theme Provider Component
 *
 * Wraps the app to provide theme context throughout the component tree.
 * Handles system preference detection, persistence, and theme switching.
 *
 * @example
 * // In _layout.tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  // Get system color scheme
  const systemColorScheme = useColorScheme();

  // Theme mode state (what user selected)
  const [mode, setModeState] = useState<ThemeMode>(initialMode || 'auto');

  // Loading state for initial hydration
  const [isLoading, setIsLoading] = useState(!initialMode);

  // Resolve active theme from mode and system preference
  const theme: ActiveTheme = useMemo(() => {
    if (mode === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemColorScheme]);

  // Get colors for current theme
  const colors = useMemo(() => {
    return theme === 'dark' ? DarkColors : LightColors;
  }, [theme]);

  // Is dark mode active?
  const isDark = theme === 'dark';

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await getItemAsync(THEME_STORAGE_KEY);
        if (saved && ['light', 'dark', 'auto'].includes(saved)) {
          setModeState(saved as ThemeMode);
        }
      } catch (error) {
        logger.warn('Failed to load theme preference:', { error });
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialMode) {
      loadThemePreference();
    }
  }, [initialMode]);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only update if in auto mode
      // The useMemo will handle the recalculation
    });

    return () => subscription.remove();
  }, []);

  // Set theme mode with persistence
  const setMode = useCallback(async (newMode: ThemeMode) => {
    try {
      setModeState(newMode);
      await setItemAsync(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      logger.warn('Failed to save theme preference:', { error });
    }
  }, []);

  // Toggle between light and dark
  const toggle = useCallback(async () => {
    const newMode: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    await setMode(newMode);
  }, [theme, setMode]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      theme,
      colors,
      isDark,
      setMode,
      toggle,
      isLoading,
    }),
    [mode, theme, colors, isDark, setMode, toggle, isLoading]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access theme context
 *
 * @returns Theme context value with colors, mode, and actions
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * function MyComponent() {
 *   const { colors, isDark, toggle } = useTheme();
 *
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.text }}>Hello</Text>
 *       <Button onPress={toggle} title={isDark ? 'Light Mode' : 'Dark Mode'} />
 *     </View>
 *   );
 * }
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get just the color palette
 * Useful when you only need colors without other theme context
 *
 * @example
 * const colors = useThemeColors();
 * <View style={{ backgroundColor: colors.surface }} />
 */
export function useThemeColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}

/**
 * Hook to check if dark mode is active
 *
 * @example
 * const isDark = useIsDarkMode();
 * const icon = isDark ? 'moon' : 'sun';
 */
export function useIsDarkMode(): boolean {
  const { isDark } = useTheme();
  return isDark;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { LightColors, DarkColors };
export type { ThemeContextType };

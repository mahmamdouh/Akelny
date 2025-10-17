import { Animated, Easing, Vibration, Platform } from 'react-native';

// Haptic feedback utilities
export const hapticFeedback = {
  light: () => {
    if (Platform.OS === 'ios') {
      // Use iOS haptic feedback
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger('impactLight');
    } else {
      // Android vibration
      Vibration.vibrate(10);
    }
  },
  
  medium: () => {
    if (Platform.OS === 'ios') {
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger('impactMedium');
    } else {
      Vibration.vibrate(20);
    }
  },
  
  heavy: () => {
    if (Platform.OS === 'ios') {
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger('impactHeavy');
    } else {
      Vibration.vibrate(50);
    }
  },
  
  success: () => {
    if (Platform.OS === 'ios') {
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger('notificationSuccess');
    } else {
      Vibration.vibrate([0, 100, 50, 100]);
    }
  },
  
  error: () => {
    if (Platform.OS === 'ios') {
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger('notificationError');
    } else {
      Vibration.vibrate([0, 200, 100, 200]);
    }
  },
};

// Animation easing presets
export const easingPresets = {
  // Material Design easings
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  
  // iOS-style easings
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
  easeOut: Easing.bezier(0, 0, 0.58, 1),
  easeIn: Easing.bezier(0.42, 0, 1, 1),
  
  // Custom easings
  bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  elastic: Easing.bezier(0.175, 0.885, 0.32, 1.275),
  smooth: Easing.bezier(0.25, 0.46, 0.45, 0.94),
};

// Duration presets based on Material Design
export const durationPresets = {
  // Micro-interactions
  instant: 100,
  quick: 150,
  
  // Standard transitions
  short: 200,
  medium: 300,
  long: 400,
  
  // Complex transitions
  extended: 500,
  elaborate: 700,
};

// Create smooth transitions with proper easing
export const createSmoothTransition = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = durationPresets.medium,
  easing: any = easingPresets.standard,
  delay: number = 0
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    delay,
    useNativeDriver: true,
  });
};

// Create spring animations with natural feel
export const createSpringTransition = (
  animatedValue: Animated.Value,
  toValue: number,
  tension: number = 100,
  friction: number = 8,
  delay: number = 0
) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    delay,
    useNativeDriver: true,
  });
};

// Stagger animations for lists
export const createStaggeredAnimations = (
  animations: Animated.CompositeAnimation[],
  staggerDelay: number = 50
) => {
  return Animated.stagger(staggerDelay, animations);
};

// Sequence animations
export const createSequenceAnimations = (animations: Animated.CompositeAnimation[]) => {
  return Animated.sequence(animations);
};

// Parallel animations
export const createParallelAnimations = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};

// Loading state utilities
export const loadingStates = {
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  error: 'error',
} as const;

export type LoadingState = typeof loadingStates[keyof typeof loadingStates];

// Color utilities for different states
export const stateColors = {
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  neutral: '#8E8E93',
  
  // Semantic colors
  mandatory: '#34C759',
  recommended: '#FF9500',
  optional: '#8E8E93',
  
  // Background colors
  background: '#F2F2F7',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Spacing utilities
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography utilities
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Shadow utilities
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
};

// Border radius utilities
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Utility functions for responsive design
export const responsive = {
  // Check if device is tablet
  isTablet: () => {
    const { width, height } = require('react-native').Dimensions.get('window');
    return Math.min(width, height) >= 768;
  },
  
  // Get responsive value based on screen size
  getValue: <T>(phoneValue: T, tabletValue: T): T => {
    return responsive.isTablet() ? tabletValue : phoneValue;
  },
  
  // Get responsive spacing
  getSpacing: (multiplier: number = 1): number => {
    const baseSpacing = responsive.isTablet() ? spacing.lg : spacing.md;
    return baseSpacing * multiplier;
  },
  
  // Get responsive font size
  getFontSize: (size: keyof typeof typography.sizes): number => {
    const baseSize = typography.sizes[size];
    return responsive.isTablet() ? baseSize * 1.1 : baseSize;
  },
};

// Performance utilities
export const performance = {
  // Debounce function calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  // Throttle function calls
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
  
  // Measure execution time
  measureTime: async <T>(
    operation: () => Promise<T>,
    label?: string
  ): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    
    if (label && __DEV__) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return { result, duration };
  },
};

// Accessibility utilities
export const accessibility = {
  // Create accessible label
  createLabel: (text: string, hint?: string): string => {
    return hint ? `${text}, ${hint}` : text;
  },
  
  // Create accessible hint
  createHint: (action: string, result?: string): string => {
    return result ? `${action}. ${result}` : action;
  },
  
  // Check if screen reader is enabled (simplified)
  isScreenReaderEnabled: (): boolean => {
    // In a real implementation, you'd use a library like @react-native-async-storage/async-storage
    // to check accessibility settings
    return false;
  },
};

// Network utilities
export const network = {
  // Retry with exponential backoff
  retryWithBackoff: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  },
  
  // Check if error is network-related
  isNetworkError: (error: Error): boolean => {
    const networkErrorMessages = [
      'network request failed',
      'network error',
      'connection failed',
      'timeout',
      'no internet',
    ];
    
    return networkErrorMessages.some(message =>
      error.message.toLowerCase().includes(message)
    );
  },
};
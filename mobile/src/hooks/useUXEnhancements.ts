import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, AppState, AppStateStatus } from 'react-native';

// Hook for managing loading states with better UX
export const useLoadingState = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startLoading = (message?: string) => {
    setIsLoading(true);
    setLoadingMessage(message || '');
    setProgress(0);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const updateProgress = (newProgress: number, message?: string) => {
    setProgress(newProgress);
    if (message) setLoadingMessage(message);
  };

  const stopLoading = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsLoading(false);
      setLoadingMessage('');
      setProgress(0);
    });
  };

  return {
    isLoading,
    loadingMessage,
    progress,
    fadeAnim,
    startLoading,
    updateProgress,
    stopLoading,
  };
};

// Hook for keyboard-aware animations
export const useKeyboardAnimation = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      const height = event.endCoordinates.height;
      setKeyboardHeight(height);
      
      Animated.timing(keyboardAnim, {
        toValue: height,
        duration: event.duration || 250,
        useNativeDriver: false,
      }).start();
    };

    const keyboardWillHide = (event: any) => {
      setKeyboardHeight(0);
      
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: event.duration || 250,
        useNativeDriver: false,
      }).start();
    };

    const showSubscription = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
    const hideSubscription = Keyboard.addListener('keyboardWillHide', keyboardWillHide);

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [keyboardAnim]);

  return {
    keyboardHeight,
    keyboardAnim,
    isKeyboardVisible: keyboardHeight > 0,
  };
};

// Hook for app state transitions
export const useAppStateTransition = () => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(true);
  const appStateAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        setIsAppActive(true);
        Animated.timing(appStateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        setIsAppActive(false);
        Animated.timing(appStateAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }

      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, [appState, appStateAnim]);

  return {
    appState,
    isAppActive,
    appStateAnim,
  };
};

// Hook for retry logic with exponential backoff
export const useRetryLogic = (maxRetries = 3, baseDelay = 1000) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [canRetry, setCanRetry] = useState(true);

  const retry = async (operation: () => Promise<any>) => {
    if (retryCount >= maxRetries) {
      setCanRetry(false);
      throw new Error('Maximum retry attempts reached');
    }

    setIsRetrying(true);
    
    try {
      const result = await operation();
      // Success - reset retry count
      setRetryCount(0);
      setCanRetry(true);
      return result;
    } catch (error) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (newRetryCount < maxRetries) {
        // Wait with exponential backoff
        const delay = baseDelay * Math.pow(2, newRetryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the operation
        return retry(operation);
      } else {
        setCanRetry(false);
        throw error;
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const reset = () => {
    setRetryCount(0);
    setIsRetrying(false);
    setCanRetry(true);
  };

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry,
    maxRetries,
  };
};

// Hook for optimistic updates
export const useOptimisticUpdate = <T>(initialData: T) => {
  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const previousData = useRef<T>(initialData);

  const optimisticUpdate = (newData: T) => {
    previousData.current = data;
    setData(newData);
    setIsOptimistic(true);
  };

  const confirmUpdate = (confirmedData?: T) => {
    if (confirmedData) {
      setData(confirmedData);
    }
    setIsOptimistic(false);
  };

  const revertUpdate = () => {
    setData(previousData.current);
    setIsOptimistic(false);
  };

  return {
    data,
    isOptimistic,
    optimisticUpdate,
    confirmUpdate,
    revertUpdate,
  };
};

// Hook for debounced operations
export const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for intersection observer (for lazy loading)
export const useIntersectionObserver = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<any>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Simple visibility detection based on scroll position
    // In a real implementation, you'd use a proper intersection observer
    const checkVisibility = () => {
      if (element.measure) {
        element.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          const windowHeight = require('react-native').Dimensions.get('window').height;
          const isCurrentlyVisible = pageY < windowHeight && pageY + height > 0;
          
          setIsVisible(isCurrentlyVisible);
          if (isCurrentlyVisible && !hasBeenVisible) {
            setHasBeenVisible(true);
          }
        });
      }
    };

    // Check visibility periodically (simplified approach)
    const interval = setInterval(checkVisibility, 100);

    return () => clearInterval(interval);
  }, [hasBeenVisible]);

  return {
    elementRef,
    isVisible,
    hasBeenVisible,
  };
};
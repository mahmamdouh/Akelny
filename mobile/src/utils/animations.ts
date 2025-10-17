import { Animated, Easing } from 'react-native';

export const createFadeInAnimation = (
  animatedValue: Animated.Value,
  duration: number = 300,
  delay: number = 0
) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

export const createFadeOutAnimation = (
  animatedValue: Animated.Value,
  duration: number = 300,
  delay: number = 0
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  });
};

export const createSlideInAnimation = (
  animatedValue: Animated.Value,
  fromValue: number,
  toValue: number = 0,
  duration: number = 300,
  delay: number = 0
) => {
  animatedValue.setValue(fromValue);
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    delay,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true,
  });
};

export const createScaleAnimation = (
  animatedValue: Animated.Value,
  fromValue: number = 0.8,
  toValue: number = 1,
  duration: number = 300,
  delay: number = 0
) => {
  animatedValue.setValue(fromValue);
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    delay,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true,
  });
};

export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  tension: number = 100,
  friction: number = 8
) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  });
};

export const createStaggeredAnimation = (
  animations: Animated.CompositeAnimation[],
  staggerDelay: number = 100
) => {
  return Animated.stagger(staggerDelay, animations);
};

export const createSequenceAnimation = (animations: Animated.CompositeAnimation[]) => {
  return Animated.sequence(animations);
};

export const createParallelAnimation = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};

// Predefined animation presets
export const animationPresets = {
  fadeIn: (animatedValue: Animated.Value, delay: number = 0) =>
    createFadeInAnimation(animatedValue, 300, delay),
  
  fadeOut: (animatedValue: Animated.Value, delay: number = 0) =>
    createFadeOutAnimation(animatedValue, 300, delay),
  
  slideInFromBottom: (animatedValue: Animated.Value, delay: number = 0) =>
    createSlideInAnimation(animatedValue, 50, 0, 400, delay),
  
  slideInFromTop: (animatedValue: Animated.Value, delay: number = 0) =>
    createSlideInAnimation(animatedValue, -50, 0, 400, delay),
  
  slideInFromLeft: (animatedValue: Animated.Value, delay: number = 0) =>
    createSlideInAnimation(animatedValue, -50, 0, 400, delay),
  
  slideInFromRight: (animatedValue: Animated.Value, delay: number = 0) =>
    createSlideInAnimation(animatedValue, 50, 0, 400, delay),
  
  scaleIn: (animatedValue: Animated.Value, delay: number = 0) =>
    createScaleAnimation(animatedValue, 0.8, 1, 300, delay),
  
  bounceIn: (animatedValue: Animated.Value, delay: number = 0) =>
    createSpringAnimation(animatedValue, 1),
  
  quickFade: (animatedValue: Animated.Value, delay: number = 0) =>
    createFadeInAnimation(animatedValue, 150, delay),
};

// Hook for managing multiple animated values
export const useAnimatedValues = (count: number, initialValue: number = 0) => {
  const values = Array.from({ length: count }, () => new Animated.Value(initialValue));
  return values;
};

// Utility for creating entrance animations for lists
export const createListEntranceAnimation = (
  items: any[],
  animationType: 'fade' | 'slide' | 'scale' = 'fade',
  staggerDelay: number = 100
) => {
  const animatedValues = items.map(() => new Animated.Value(0));
  
  const animations = animatedValues.map((value, index) => {
    switch (animationType) {
      case 'slide':
        return animationPresets.slideInFromBottom(value, index * staggerDelay);
      case 'scale':
        return animationPresets.scaleIn(value, index * staggerDelay);
      default:
        return animationPresets.fadeIn(value, index * staggerDelay);
    }
  });

  return {
    animatedValues,
    startAnimation: () => createStaggeredAnimation(animations, 0).start(),
  };
};

// Micro-interaction animations
export const createPressAnimation = (animatedValue: Animated.Value) => {
  const pressIn = () => {
    Animated.timing(animatedValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return { pressIn, pressOut };
};

export const createHoverAnimation = (animatedValue: Animated.Value) => {
  const hoverIn = () => {
    Animated.timing(animatedValue, {
      toValue: 1.05,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const hoverOut = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return { hoverIn, hoverOut };
};
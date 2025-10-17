import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';

// Ripple effect component
interface RippleEffectProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  rippleColor?: string;
  rippleOpacity?: number;
  rippleDuration?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  onPress,
  rippleColor = '#000000',
  rippleOpacity = 0.1,
  rippleDuration = 600,
  style,
  disabled = false,
}) => {
  const rippleAnimations = useRef<Animated.Value[]>([]).current;
  const ripplePositions = useRef<{ x: number; y: number }[]>([]).current;

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;

    const { locationX, locationY } = event.nativeEvent;
    
    // Create new ripple animation
    const rippleValue = new Animated.Value(0);
    const opacityValue = new Animated.Value(rippleOpacity);
    
    rippleAnimations.push(rippleValue);
    ripplePositions.push({ x: locationX, y: locationY });

    // Start ripple animation
    Animated.parallel([
      Animated.timing(rippleValue, {
        toValue: 1,
        duration: rippleDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: rippleDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Clean up completed animations
      const index = rippleAnimations.indexOf(rippleValue);
      if (index > -1) {
        rippleAnimations.splice(index, 1);
        ripplePositions.splice(index, 1);
      }
    });

    onPress?.(event);
  };

  return (
    <TouchableOpacity
      style={[styles.rippleContainer, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1}
    >
      {children}
      {rippleAnimations.map((animation, index) => {
        const position = ripplePositions[index];
        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 4],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.ripple,
              {
                backgroundColor: rippleColor,
                left: position.x - 25,
                top: position.y - 25,
                transform: [{ scale }],
                opacity: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [rippleOpacity, 0],
                }),
              },
            ]}
          />
        );
      })}
    </TouchableOpacity>
  );
};

// Bounce animation component
interface BounceAnimationProps {
  children: React.ReactNode;
  onPress?: () => void;
  bounceScale?: number;
  bounceDuration?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

export const BounceAnimation: React.FC<BounceAnimationProps> = ({
  children,
  onPress,
  bounceScale = 0.95,
  bounceDuration = 100,
  style,
  disabled = false,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.timing(scaleValue, {
      toValue: bounceScale,
      duration: bounceDuration,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
        }}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Shake animation component
interface ShakeAnimationProps {
  children: React.ReactNode;
  trigger: boolean;
  intensity?: number;
  duration?: number;
  onComplete?: () => void;
}

export const ShakeAnimation: React.FC<ShakeAnimationProps> = ({
  children,
  trigger,
  intensity = 10,
  duration = 500,
  onComplete,
}) => {
  const shakeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      const shakeAnimation = Animated.sequence([
        Animated.timing(shakeValue, {
          toValue: intensity,
          duration: duration / 8,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: -intensity,
          duration: duration / 8,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: intensity,
          duration: duration / 8,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: -intensity,
          duration: duration / 8,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: intensity / 2,
          duration: duration / 8,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: -intensity / 2,
          duration: duration / 8,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: 0,
          duration: duration / 4,
          useNativeDriver: true,
        }),
      ]);

      shakeAnimation.start(() => {
        onComplete?.();
      });
    }
  }, [trigger, intensity, duration, onComplete]);

  return (
    <Animated.View
      style={{
        transform: [{ translateX: shakeValue }],
      }}
    >
      {children}
    </Animated.View>
  );
};

// Pulse animation component
interface PulseAnimationProps {
  children: React.ReactNode;
  isActive: boolean;
  pulseScale?: number;
  pulseDuration?: number;
  style?: ViewStyle;
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  children,
  isActive,
  pulseScale = 1.05,
  pulseDuration = 1000,
  style,
}) => {
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: pulseScale,
            duration: pulseDuration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: pulseDuration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        pulseValue.setValue(1);
      };
    } else {
      pulseValue.setValue(1);
    }
  }, [isActive, pulseScale, pulseDuration]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: pulseValue }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Floating action button with micro-interactions
interface FloatingActionButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  backgroundColor?: string;
  size?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  backgroundColor = '#007AFF',
  size = 56,
  style,
  disabled = false,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const shadowValue = useRef(new Animated.Value(4)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowValue, {
        toValue: 8,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(shadowValue, {
        toValue: 4,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={[styles.fabContainer, style]}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: disabled ? '#E5E5EA' : backgroundColor,
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: scaleValue }],
            shadowOpacity: shadowValue.interpolate({
              inputRange: [4, 8],
              outputRange: [0.3, 0.5],
            }),
            elevation: shadowValue,
          },
        ]}
      >
        {icon}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rippleContainer: {
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
  },
});
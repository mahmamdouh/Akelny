import React, { useEffect, useRef, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';

interface PageTransitionProps {
  children: ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'flip' | 'zoom';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  style?: any;
  onAnimationComplete?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'fade',
  direction = 'right',
  duration = 300,
  delay = 0,
  style,
  onAnimationComplete,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // Main transition animation
    const mainAnimation = Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animations.push(mainAnimation);

    // Scale animation for scale and zoom types
    if (type === 'scale' || type === 'zoom') {
      const scaleAnimation = Animated.timing(scaleValue, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      });
      animations.push(scaleAnimation);
    }

    // Rotation animation for flip type
    if (type === 'flip') {
      const rotateAnimation = Animated.timing(rotateValue, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animations.push(rotateAnimation);
    }

    // Start animations
    Animated.parallel(animations).start(() => {
      onAnimationComplete?.();
    });
  }, [type, duration, delay, onAnimationComplete]);

  const getTransformStyle = () => {
    const transforms: any[] = [];

    switch (type) {
      case 'slide':
        const slideDistance = direction === 'left' || direction === 'right' 
          ? screenWidth 
          : screenHeight;
        
        const slideMultiplier = direction === 'left' || direction === 'up' ? -1 : 1;
        
        if (direction === 'left' || direction === 'right') {
          transforms.push({
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [slideDistance * slideMultiplier, 0],
            }),
          });
        } else {
          transforms.push({
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [slideDistance * slideMultiplier, 0],
            }),
          });
        }
        break;

      case 'scale':
        transforms.push({ scale: scaleValue });
        break;

      case 'flip':
        transforms.push({
          rotateY: rotateValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['90deg', '0deg'],
          }),
        });
        break;

      case 'zoom':
        transforms.push(
          { scale: scaleValue },
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }
        );
        break;
    }

    return transforms;
  };

  const opacity = type === 'fade' || type === 'zoom' 
    ? animatedValue 
    : 1;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: getTransformStyle(),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Staggered list animation component
interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale';
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: any;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  animationType = 'fade',
  direction = 'up',
  style,
}) => {
  return (
    <View style={style}>
      {children.map((child, index) => (
        <PageTransition
          key={index}
          type={animationType}
          direction={direction}
          delay={index * staggerDelay}
          duration={300}
        >
          {child}
        </PageTransition>
      ))}
    </View>
  );
};

// Screen transition wrapper
interface ScreenTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  type?: 'fade' | 'slide' | 'scale' | 'flip' | 'zoom';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  style?: any;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  isVisible,
  type = 'fade',
  direction = 'right',
  duration = 300,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isVisible ? 1 : 0,
      duration,
      easing: isVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isVisible, duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.screenContainer,
        {
          opacity: animatedValue,
          transform: [
            {
              scale: type === 'scale' 
                ? animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                : 1,
            },
            {
              translateY: type === 'slide' && (direction === 'up' || direction === 'down')
                ? animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [direction === 'up' ? 50 : -50, 0],
                  })
                : 0,
            },
            {
              translateX: type === 'slide' && (direction === 'left' || direction === 'right')
                ? animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [direction === 'left' ? 50 : -50, 0],
                  })
                : 0,
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
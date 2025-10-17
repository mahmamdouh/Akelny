import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingStateProps {
  message?: string;
  type?: 'spinner' | 'dots' | 'pulse' | 'wave' | 'bounce';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: any;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  type = 'spinner',
  size = 'medium',
  color = '#007AFF',
  style,
  showProgress = false,
  progress = 0,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const waveValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const bounceValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animations: Animated.CompositeAnimation[] = [];

    if (type === 'dots') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animations.push(animation);
    }

    if (type === 'pulse') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animations.push(animation);
    }

    if (type === 'wave') {
      const waveAnimations = waveValues.map((value, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(value, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        )
      );
      animations.push(...waveAnimations);
    }

    if (type === 'bounce') {
      const bounceAnimations = bounceValues.map((value, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 150),
            Animated.timing(value, {
              toValue: -10,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        )
      );
      animations.push(...bounceAnimations);
    }

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, [type, animatedValue, pulseValue, waveValues, bounceValues]);

  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressValue, {
        toValue: progress,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress]);

  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  const renderLoader = () => {
    const sizeValue = getSizeValue();

    switch (type) {
      case 'dots':
        return (
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => {
              const opacity = animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: index === 0 ? [0.3, 1, 0.3] : index === 1 ? [0.3, 0.3, 1] : [1, 0.3, 0.3],
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: color,
                      opacity,
                      width: sizeValue / 3,
                      height: sizeValue / 3,
                    },
                  ]}
                />
              );
            })}
          </View>
        );

      case 'pulse':
        return (
          <Animated.View
            style={[
              styles.pulseContainer,
              {
                transform: [{ scale: pulseValue }],
              },
            ]}
          >
            <Ionicons name="heart" size={sizeValue} color={color} />
          </Animated.View>
        );

      case 'wave':
        return (
          <View style={styles.waveContainer}>
            {waveValues.map((value, index) => {
              const translateY = value.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -sizeValue / 2],
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: color,
                      width: sizeValue / 6,
                      height: sizeValue,
                      transform: [{ translateY }],
                    },
                  ]}
                />
              );
            })}
          </View>
        );

      case 'bounce':
        return (
          <View style={styles.bounceContainer}>
            {bounceValues.map((value, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.bounceDot,
                  {
                    backgroundColor: color,
                    width: sizeValue / 3,
                    height: sizeValue / 3,
                    transform: [{ translateY: value }],
                  },
                ]}
              />
            ))}
          </View>
        );

      default:
        return <ActivityIndicator size={size === 'small' ? 'small' : 'large'} color={color} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderLoader()}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: color,
                  width: progressValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
      {message && (
        <Text style={[styles.message, { color }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

interface FullScreenLoadingProps {
  message?: string;
  type?: 'spinner' | 'dots' | 'pulse';
  backgroundColor?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message,
  type = 'spinner',
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
}) => {
  return (
    <View style={[styles.fullScreenContainer, { backgroundColor }]}>
      <View style={styles.fullScreenContent}>
        <LoadingState message={message} type={type} size="large" color="#FFFFFF" />
      </View>
    </View>
  );
};

interface InlineLoadingProps {
  message?: string;
  style?: any;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ message, style }) => {
  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator size="small" color="#007AFF" />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 40,
  },
  waveBar: {
    marginHorizontal: 2,
    borderRadius: 2,
  },
  bounceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bounceDot: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
  progressContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullScreenContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
});
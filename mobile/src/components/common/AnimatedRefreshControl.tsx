import React, { useRef, useEffect } from 'react';
import {
  RefreshControl,
  Animated,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  colors?: string[];
  tintColor?: string;
  title?: string;
  titleColor?: string;
}

export const AnimatedRefreshControl: React.FC<AnimatedRefreshControlProps> = ({
  refreshing,
  onRefresh,
  colors = ['#007AFF'],
  tintColor = '#007AFF',
  title,
  titleColor = '#8E8E93',
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (refreshing) {
      // Start rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );

      // Start scale animation
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );

      rotateAnimation.start();
      scaleAnimation.start();

      return () => {
        rotateAnimation.stop();
        scaleAnimation.stop();
      };
    } else {
      // Reset animations
      rotateValue.setValue(0);
      scaleValue.setValue(1);
    }
  }, [refreshing]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={colors}
      tintColor={tintColor}
      title={title}
      titleColor={titleColor}
      progressViewOffset={20}
    />
  );
};

// Custom pull-to-refresh indicator
interface CustomRefreshIndicatorProps {
  refreshing: boolean;
  pullDistance: number;
  maxPullDistance: number;
  onRefresh: () => void;
}

export const CustomRefreshIndicator: React.FC<CustomRefreshIndicatorProps> = ({
  refreshing,
  pullDistance,
  maxPullDistance,
  onRefresh,
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      // Start rotation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => rotateAnimation.stop();
    } else {
      rotateValue.setValue(0);
    }
  }, [refreshing]);

  useEffect(() => {
    // Update opacity based on pull distance
    const opacity = Math.min(pullDistance / maxPullDistance, 1);
    Animated.timing(opacityValue, {
      toValue: opacity,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [pullDistance, maxPullDistance]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = pullDistance / maxPullDistance;

  return (
    <Animated.View
      style={[
        styles.customIndicator,
        {
          opacity: opacityValue,
          transform: [
            { rotate: refreshing ? rotate : '0deg' },
            { scale: Math.min(scale, 1) },
          ],
        },
      ]}
    >
      <View style={styles.indicatorContainer}>
        <Ionicons
          name={refreshing ? 'refresh' : 'arrow-down'}
          size={24}
          color="#007AFF"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  customIndicator: {
    position: 'absolute',
    top: -60,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  indicatorContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
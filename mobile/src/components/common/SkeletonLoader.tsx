import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E1E9EE', '#F2F8FC'],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

interface MealCardSkeletonProps {
  style?: any;
}

export const MealCardSkeleton: React.FC<MealCardSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.mealCardSkeleton, style]}>
      <SkeletonLoader width="100%" height={200} borderRadius={12} style={styles.imageSkeleton} />
      <View style={styles.mealCardContent}>
        <SkeletonLoader width="80%" height={24} style={styles.titleSkeleton} />
        <SkeletonLoader width="60%" height={16} style={styles.subtitleSkeleton} />
        <View style={styles.metadataRow}>
          <SkeletonLoader width={60} height={16} />
          <SkeletonLoader width={80} height={16} />
        </View>
        <View style={styles.tagsRow}>
          <SkeletonLoader width={60} height={24} borderRadius={12} />
          <SkeletonLoader width={80} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

interface IngredientCardSkeletonProps {
  style?: any;
}

export const IngredientCardSkeleton: React.FC<IngredientCardSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.ingredientCardSkeleton, style]}>
      <View style={styles.ingredientInfo}>
        <SkeletonLoader width={20} height={20} borderRadius={10} style={styles.statusIndicator} />
        <View style={styles.ingredientText}>
          <SkeletonLoader width="70%" height={18} />
          <SkeletonLoader width="50%" height={14} style={styles.ingredientSubtext} />
        </View>
      </View>
      <SkeletonLoader width={60} height={16} />
    </View>
  );
};

interface ListSkeletonProps {
  itemCount?: number;
  renderItem: () => React.ReactElement;
  style?: any;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  itemCount = 5,
  renderItem,
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: itemCount }, (_, index) => (
        <View key={index} style={styles.listItem}>
          {renderItem()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  mealCardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageSkeleton: {
    marginBottom: 0,
  },
  mealCardContent: {
    padding: 16,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  subtitleSkeleton: {
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ingredientCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
  },
  ingredientSubtext: {
    marginTop: 4,
  },
  listItem: {
    marginBottom: 8,
  },
});
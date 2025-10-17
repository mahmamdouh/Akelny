import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { createPressAnimation } from '../../utils/animations';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  animationType?: 'scale' | 'opacity' | 'none';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  animationType = 'scale',
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const { pressIn: scalePressIn, pressOut: scalePressOut } = createPressAnimation(scaleValue);

  const handlePressIn = () => {
    if (disabled || loading) return;

    if (animationType === 'scale') {
      scalePressIn();
    } else if (animationType === 'opacity') {
      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    if (animationType === 'scale') {
      scalePressOut();
    } else if (animationType === 'opacity') {
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[`${size}Button` as keyof typeof styles] as ViewStyle;
    const variantStyle = styles[`${variant}Button` as keyof typeof styles] as ViewStyle;
    
    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...(disabled && styles.disabledButton),
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text;
    const sizeStyle = styles[`${size}Text` as keyof typeof styles] as TextStyle;
    const variantStyle = styles[`${variant}Text` as keyof typeof styles] as TextStyle;
    
    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...(disabled && styles.disabledText),
    };
  };

  const animatedStyle = {
    transform: animationType === 'scale' ? [{ scale: scaleValue }] : [],
    opacity: animationType === 'opacity' ? opacityValue : 1,
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={animationType === 'none' ? 0.7 : 1}
      >
        {loading ? (
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={variant === 'primary' ? '#FFFFFF' : '#007AFF'}
          />
        ) : (
          <>
            {leftIcon && <Animated.View style={styles.leftIcon}>{leftIcon}</Animated.View>}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            {rightIcon && <Animated.View style={styles.rightIcon}>{rightIcon}</Animated.View>}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  // Size variants
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  largeButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },

  // Color variants
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#8E8E93',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: '#007AFF',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },

  disabledButton: {
    backgroundColor: '#E5E5EA',
    borderColor: '#E5E5EA',
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#007AFF',
  },
  ghostText: {
    color: '#007AFF',
  },

  disabledText: {
    color: '#8E8E93',
  },

  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
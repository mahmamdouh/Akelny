import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getTextStyle, 
  transformStyleForRTL, 
  isRTL, 
  getKeyboardType 
} from '../../utils/localization';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  ...textInputProps
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // RTL support
  const rtlTextStyle = getTextStyle('regular');
  const isRTLLayout = isRTL();
  
  // Transform styles for RTL
  const transformedContainerStyle = containerStyle ? transformStyleForRTL(containerStyle) : containerStyle;
  const transformedInputStyle = inputStyle ? transformStyleForRTL(inputStyle) : inputStyle;

  const inputContainerStyle = [
    styles.inputContainer,
    isRTLLayout && styles.inputContainerRTL,
    isFocused ? styles.focused : null,
    error ? styles.error : null,
  ].filter(Boolean);

  // In RTL, swap left and right icons
  const effectiveLeftIcon = isRTLLayout ? rightIcon : leftIcon;
  const effectiveRightIcon = isRTLLayout ? leftIcon : rightIcon;
  const effectiveOnLeftIconPress = isRTLLayout ? onRightIconPress : undefined;
  const effectiveOnRightIconPress = isRTLLayout ? undefined : onRightIconPress;

  const showPasswordToggle = secureTextEntry && !rightIcon && !leftIcon;
  const passwordToggleIcon = isSecure ? 'eye-off' : 'eye';
  
  // Handle password toggle positioning for RTL
  const finalRightIcon = showPasswordToggle ? passwordToggleIcon : effectiveRightIcon;
  const finalOnRightIconPress = showPasswordToggle ? toggleSecureEntry : effectiveOnRightIconPress;

  return (
    <View style={[styles.container, transformedContainerStyle]}>
      {label && (
        <Text style={[styles.label, rtlTextStyle, labelStyle]}>{label}</Text>
      )}
      <View style={inputContainerStyle}>
        {effectiveLeftIcon && (
          <TouchableOpacity
            onPress={effectiveOnLeftIconPress}
            style={[styles.leftIcon, isRTLLayout && styles.leftIconRTL]}
          >
            <Ionicons
              name={effectiveLeftIcon}
              size={20}
              color={isFocused ? '#007AFF' : '#8E8E93'}
            />
          </TouchableOpacity>
        )}
        <TextInput
          style={[
            styles.input,
            rtlTextStyle,
            effectiveLeftIcon && styles.inputWithLeftIcon,
            finalRightIcon && styles.inputWithRightIcon,
            isRTLLayout && styles.inputRTL,
            transformedInputStyle,
          ]}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#8E8E93"
          keyboardType={textInputProps.keyboardType || getKeyboardType()}
          {...textInputProps}
        />
        {finalRightIcon && (
          <TouchableOpacity
            onPress={finalOnRightIconPress}
            style={[styles.rightIcon, isRTLLayout && styles.rightIconRTL]}
          >
            <Ionicons
              name={finalRightIcon}
              size={20}
              color={isFocused ? '#007AFF' : '#8E8E93'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, rtlTextStyle, errorStyle]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  focused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  error: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    marginLeft: 16,
  },
  rightIcon: {
    padding: 8,
    marginRight: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  // RTL-specific styles
  inputContainerRTL: {
    flexDirection: 'row-reverse',
  },
  inputRTL: {
    textAlign: 'right',
  },
  leftIconRTL: {
    marginLeft: 8,
    marginRight: 16,
  },
  rightIconRTL: {
    marginLeft: 8,
    marginRight: 8,
  },
});

export default Input;
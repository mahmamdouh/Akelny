import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide: () => void;
  position?: 'top' | 'bottom';
  actionText?: string;
  onActionPress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  position = 'top',
  actionText,
  onActionPress,
}) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastStyle = () => {
    const baseStyle = styles.toast;
    const typeStyle = styles[`${type}Toast` as keyof typeof styles];
    const positionStyle = position === 'top' 
      ? { top: insets.top + 10 } 
      : { bottom: insets.bottom + 10 };

    return [baseStyle, typeStyle, positionStyle];
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        getToastStyle(),
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons
          name={getIconName()}
          size={24}
          color={getIconColor()}
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {actionText && onActionPress && (
          <TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Toast context and hook for global toast management
import { createContext, useContext, useState, ReactNode } from 'react';

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type'], options?: Partial<ToastProps>) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type: ToastProps['type'];
    options: Partial<ToastProps>;
  }>({
    visible: false,
    message: '',
    type: 'info',
    options: {},
  });

  const showToast = (
    message: string,
    type: ToastProps['type'] = 'info',
    options: Partial<ToastProps> = {}
  ) => {
    setToastConfig({
      visible: true,
      message,
      type,
      options,
    });
  };

  const hideToast = () => {
    setToastConfig(prev => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={hideToast}
        {...toastConfig.options}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1000,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  
  // Type-specific styles
  successToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  errorToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  warningToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
});
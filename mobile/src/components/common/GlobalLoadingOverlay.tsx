import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // Optional dependency
import { LoadingState } from './LoadingState';
import { useUX } from '../../contexts/UXContext';

interface GlobalLoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  type?: 'spinner' | 'dots' | 'wave' | 'bounce';
  allowCancel?: boolean;
  onCancel?: () => void;
}

const { width, height } = Dimensions.get('window');

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  progress = 0,
  showProgress = false,
  type = 'wave',
  allowCancel = false,
  onCancel,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { animationsEnabled } = useUX();

  useEffect(() => {
    if (visible) {
      if (animationsEnabled) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
      }
    } else {
      if (animationsEnabled) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
      }
    }
  }, [visible, animationsEnabled]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.blurView}>
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.content}>
              <LoadingState
                type={type}
                size="large"
                message={message}
                showProgress={showProgress}
                progress={progress}
                color="#007AFF"
              />
              
              {allowCancel && onCancel && (
                <View style={styles.cancelContainer}>
                  <Text style={styles.cancelText} onPress={onCancel}>
                    Cancel
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Hook for managing global loading state
export const useGlobalLoading = () => {
  const { globalLoading, setGlobalLoading } = useUX();

  const showLoading = (message?: string) => {
    setGlobalLoading(true);
  };

  const hideLoading = () => {
    setGlobalLoading(false);
  };

  return {
    isLoading: globalLoading,
    showLoading,
    hideLoading,
  };
};

// Component that automatically shows global loading for async operations
interface AsyncOperationWrapperProps {
  children: React.ReactNode;
  operation: () => Promise<any>;
  loadingMessage?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export const AsyncOperationWrapper: React.FC<AsyncOperationWrapperProps> = ({
  children,
  operation,
  loadingMessage = 'Processing...',
  onSuccess,
  onError,
}) => {
  const { showLoading, hideLoading } = useGlobalLoading();
  const { logError } = useUX();

  const handleOperation = async () => {
    try {
      showLoading();
      const result = await operation();
      onSuccess?.(result);
    } catch (error) {
      const err = error as Error;
      logError(err, 'AsyncOperationWrapper');
      onError?.(err);
    } finally {
      hideLoading();
    }
  };

  return (
    <View onTouchStart={handleOperation}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 32,
    minWidth: 200,
    maxWidth: width * 0.8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  cancelContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
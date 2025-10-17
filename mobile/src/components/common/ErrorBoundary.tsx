import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  enableReporting?: boolean;
  showDetails?: boolean;
  retryAttempts?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  retryCount: number;
  isReporting: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private fadeAnim = new Animated.Value(0);
  private scaleAnim = new Animated.Value(0.8);

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      isReporting: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Animate error display
    Animated.parallel([
      Animated.timing(this.fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(this.scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }

  handleRetry = () => {
    const { retryAttempts = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < retryAttempts) {
      // Animate out
      Animated.parallel([
        Animated.timing(this.fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(this.scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        this.setState({ 
          hasError: false, 
          error: undefined, 
          errorInfo: undefined,
          retryCount: retryCount + 1,
        });
        
        // Reset animations
        this.fadeAnim.setValue(0);
        this.scaleAnim.setValue(0.8);
      });
    }
  };

  handleReport = async () => {
    const { enableReporting = true } = this.props;
    const { error, errorInfo } = this.state;

    if (!enableReporting || !error) return;

    this.setState({ isReporting: true });

    try {
      // Here you would integrate with your error reporting service
      // For now, we'll just simulate the reporting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Error reported:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  render() {
    const { retryAttempts = 3, enableReporting = true, showDetails = __DEV__ } = this.props;
    const { hasError, error, retryCount, isReporting } = this.state;

    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = retryCount < retryAttempts;

      return (
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: this.fadeAnim,
              transform: [{ scale: this.scaleAnim }],
            },
          ]}
        >
          <View style={styles.content}>
            <Animated.View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={64} color="#FF6B6B" />
            </Animated.View>
            
            <Text style={styles.title}>Something went wrong</Text>
            
            <Text style={styles.message}>
              {canRetry 
                ? "We encountered an unexpected error. Please try again."
                : "We're having trouble loading this content. Please restart the app."
              }
            </Text>

            {retryCount > 0 && (
              <Text style={styles.retryInfo}>
                Retry attempt: {retryCount}/{retryAttempts}
              </Text>
            )}

            {showDetails && error && (
              <View style={styles.errorDetailsContainer}>
                <TouchableOpacity 
                  style={styles.detailsToggle}
                  onPress={() => this.setState({ showDetails: !this.state.showDetails })}
                >
                  <Text style={styles.detailsToggleText}>
                    {this.state.showDetails ? 'Hide' : 'Show'} Details
                  </Text>
                </TouchableOpacity>
                
                {this.state.showDetails && (
                  <Text style={styles.errorDetails}>
                    {error.toString()}
                    {error.stack && `\n\nStack trace:\n${error.stack}`}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              {canRetry && (
                <TouchableOpacity 
                  style={[styles.button, styles.retryButton]} 
                  onPress={this.handleRetry}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}

              {enableReporting && (
                <TouchableOpacity 
                  style={[styles.button, styles.reportButton]} 
                  onPress={this.handleReport}
                  disabled={isReporting}
                >
                  {isReporting ? (
                    <Animated.View style={styles.reportingIndicator}>
                      <Ionicons name="hourglass" size={16} color="#8E8E93" />
                      <Text style={styles.reportButtonText}>Reporting...</Text>
                    </Animated.View>
                  ) : (
                    <>
                      <Ionicons name="bug" size={16} color="#8E8E93" />
                      <Text style={styles.reportButtonText}>Report Issue</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use with hooks
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  enableReporting?: boolean;
  showDetails?: boolean;
  retryAttempts?: number;
}

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({
  children,
  fallback,
  onError,
  enableReporting,
  showDetails,
  retryAttempts,
}) => {
  return (
    <ErrorBoundary 
      fallback={fallback} 
      onError={onError}
      enableReporting={enableReporting}
      showDetails={showDetails}
      retryAttempts={retryAttempts}
    >
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  iconContainer: {
    marginBottom: 16,
  },
  retryInfo: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorDetailsContainer: {
    marginVertical: 16,
    width: '100%',
  },
  detailsToggle: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 12,
  },
  detailsToggleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  reportButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  reportingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
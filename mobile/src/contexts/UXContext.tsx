import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '../components/common/Toast';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'render' | 'api' | 'navigation' | 'user_action';
}

interface ErrorLog {
  id: string;
  error: Error;
  context?: string;
  timestamp: number;
  resolved: boolean;
}

interface UXContextType {
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  performanceMetrics: PerformanceMetric[];
  addPerformanceMetric: (metric: PerformanceMetric) => void;
  errors: ErrorLog[];
  logError: (error: Error, context?: string) => void;
  clearErrors: () => void;
  showSuccessMessage: (message: string) => void;
  showErrorMessage: (message: string) => void;
  showInfoMessage: (message: string) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  highContrastMode: boolean;
  setHighContrastMode: (enabled: boolean) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

const UXContext = createContext<UXContextType | undefined>(undefined);

interface UXProviderProps {
  children: ReactNode;
}

export const UXProvider: React.FC<UXProviderProps> = ({ children }) => {
  const { showToast } = useToast();
  
  const [globalLoading, setGlobalLoading] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const addPerformanceMetric = (metric: PerformanceMetric) => {
    setPerformanceMetrics(prev => [...prev, metric].slice(-50));
    if (__DEV__ && metric.duration > 1000) {
      console.warn(`[Performance] Slow ${metric.type}: ${metric.name} took ${metric.duration}ms`);
    }
  };

  const logError = (error: Error, context?: string) => {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      error,
      context,
      timestamp: Date.now(),
      resolved: false,
    };

    setErrors(prev => [errorLog, ...prev].slice(0, 50));

    if (__DEV__) {
      console.error(`[Error] ${context || 'Unknown context'}:`, error);
    }

    showErrorMessage(error.message || 'An unexpected error occurred');
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const showSuccessMessage = (message: string) => {
    showToast(message, 'success');
  };

  const showErrorMessage = (message: string) => {
    showToast(message, 'error');
  };

  const showInfoMessage = (message: string) => {
    showToast(message, 'info');
  };

  const contextValue: UXContextType = {
    globalLoading,
    setGlobalLoading,
    performanceMetrics,
    addPerformanceMetric,
    errors,
    logError,
    clearErrors,
    showSuccessMessage,
    showErrorMessage,
    showInfoMessage,
    animationsEnabled,
    setAnimationsEnabled,
    highContrastMode,
    setHighContrastMode,
    isOnline,
    setIsOnline,
  };

  return (
    <UXContext.Provider value={contextValue}>
      {children}
    </UXContext.Provider>
  );
};

export const useUX = () => {
  const context = useContext(UXContext);
  if (!context) {
    throw new Error('useUX must be used within a UXProvider');
  }
  return context;
};

export const useErrorHandler = () => {
  const { logError } = useUX();

  const handleError = (error: Error, context?: string) => {
    logError(error, context);
  };

  return {
    handleError,
  };
};

export const useNetworkAware = () => {
  const { isOnline, showErrorMessage } = useUX();

  const executeIfOnline = (operation: () => any, fallback?: () => any) => {
    if (isOnline) {
      return operation();
    } else {
      showErrorMessage('This action requires an internet connection');
      return fallback?.();
    }
  };

  return {
    isOnline,
    executeIfOnline,
  };
};
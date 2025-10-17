import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { ToastProvider } from './src/components/common/Toast';
import { UXProvider } from './src/contexts/UXContext';
import { ErrorBoundaryWrapper } from './src/components/common/ErrorBoundary';
import { GlobalLoadingOverlay } from './src/components/common/GlobalLoadingOverlay';
import { PerformanceMonitor, FPSMonitor, MemoryMonitor } from './src/components/common/PerformanceMonitor';
import './src/localization/i18n';

export default function App() {
  return (
    <ErrorBoundaryWrapper
      enableReporting={true}
      showDetails={__DEV__}
      retryAttempts={3}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <ToastProvider>
            <UXProvider>
              <PerformanceMonitor enabled={__DEV__}>
                <RootNavigator />
                <GlobalLoadingOverlay visible={false} />
                
                {/* Development-only performance monitors */}
                {__DEV__ && (
                  <>
                    <FPSMonitor enabled={true} />
                    <MemoryMonitor enabled={true} />
                  </>
                )}
                
                <StatusBar style="auto" />
              </PerformanceMonitor>
            </UXProvider>
          </ToastProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundaryWrapper>
  );
}
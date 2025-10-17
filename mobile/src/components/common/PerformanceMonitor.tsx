import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage?: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  children: ReactNode;
  enabled?: boolean;
  onMetrics?: (metrics: PerformanceMetrics) => void;
  showOverlay?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  children,
  enabled = __DEV__,
  onMetrics,
  showOverlay = false,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const renderStartTime = useRef<number>(0);
  const componentCount = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = performance.now();
    
    // Count components (simplified)
    componentCount.current = React.Children.count(children);

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      const newMetrics: PerformanceMetrics = {
        renderTime,
        componentCount: componentCount.current,
        timestamp: Date.now(),
      };

      setMetrics(newMetrics);
      onMetrics?.(newMetrics);
    };
  }, [children, enabled, onMetrics]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {children}
      {showOverlay && metrics && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            Render: {metrics.renderTime.toFixed(2)}ms
          </Text>
          <Text style={styles.overlayText}>
            Components: {metrics.componentCount}
          </Text>
        </View>
      )}
    </View>
  );
};

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    
    if (__DEV__) {
      console.log(`[Performance] ${componentName} rendered ${renderCount.current} times`);
      
      if (lastRenderTime.current > 0) {
        const timeSinceLastRender = now - lastRenderTime.current;
        if (timeSinceLastRender < 16) { // Less than 60fps
          console.warn(`[Performance] ${componentName} rendered too frequently: ${timeSinceLastRender.toFixed(2)}ms`);
        }
      }
    }
    
    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
  };
};

// Component for measuring specific operations
interface PerformanceMeasureProps {
  name: string;
  children: ReactNode;
  onMeasure?: (name: string, duration: number) => void;
}

export const PerformanceMeasure: React.FC<PerformanceMeasureProps> = ({
  name,
  children,
  onMeasure,
}) => {
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      const duration = performance.now() - startTime.current;
      
      if (__DEV__) {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      }
      
      onMeasure?.(name, duration);
    };
  }, [name, onMeasure]);

  return <>{children}</>;
};

// FPS Monitor component
export const FPSMonitor: React.FC<{ enabled?: boolean }> = ({ enabled = __DEV__ }) => {
  const [fps, setFps] = useState<number>(0);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(performance.now());

  useEffect(() => {
    if (!enabled) return;

    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <View style={styles.fpsMonitor}>
      <Text style={[styles.fpsText, fps < 30 && styles.fpsWarning]}>
        {fps} FPS
      </Text>
    </View>
  );
};

// Memory usage monitor (simplified)
export const MemoryMonitor: React.FC<{ enabled?: boolean }> = ({ enabled = __DEV__ }) => {
  const [memoryInfo, setMemoryInfo] = useState<string>('');

  useEffect(() => {
    if (!enabled) return;

    const updateMemoryInfo = () => {
      // This is a simplified version - in a real app you'd use native modules
      // to get actual memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = Math.round(memory.usedJSHeapSize / 1048576);
        const total = Math.round(memory.totalJSHeapSize / 1048576);
        setMemoryInfo(`${used}/${total} MB`);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 2000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || !memoryInfo) return null;

  return (
    <View style={styles.memoryMonitor}>
      <Text style={styles.memoryText}>Memory: {memoryInfo}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  fpsMonitor: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  fpsText: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  fpsWarning: {
    color: '#FF0000',
  },
  memoryMonitor: {
    position: 'absolute',
    top: 140,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  memoryText: {
    color: '#FFFF00',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
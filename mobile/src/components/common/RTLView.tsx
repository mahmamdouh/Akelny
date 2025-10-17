import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { transformStyleForRTL } from '../../utils/localization';

interface RTLViewProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
}

/**
 * RTL-aware View component that automatically transforms styles for RTL languages
 */
const RTLView: React.FC<RTLViewProps> = ({ style, ...props }) => {
  // Transform style for RTL if needed
  const transformedStyle = React.useMemo(() => {
    if (!style) return style;
    
    if (Array.isArray(style)) {
      return style.map(transformStyleForRTL);
    }
    
    return transformStyleForRTL(style);
  }, [style]);

  return <View style={transformedStyle} {...props} />;
};

export default RTLView;
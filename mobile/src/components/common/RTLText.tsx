import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { getTextStyle, transformStyleForRTL } from '../../utils/localization';

interface RTLTextProps extends TextProps {
  style?: TextStyle | TextStyle[];
  weight?: 'regular' | 'bold';
}

/**
 * RTL-aware Text component with automatic font and alignment handling
 */
const RTLText: React.FC<RTLTextProps> = ({ 
  style, 
  weight = 'regular', 
  ...props 
}) => {
  // Get base text style with font and alignment
  const baseStyle = getTextStyle(weight);
  
  // Transform custom styles for RTL if needed
  const transformedStyle = React.useMemo(() => {
    if (!style) return baseStyle;
    
    let customStyle = style;
    if (Array.isArray(style)) {
      customStyle = style.map(transformStyleForRTL);
    } else {
      customStyle = transformStyleForRTL(style);
    }
    
    return [baseStyle, customStyle];
  }, [style, baseStyle]);

  return <Text style={transformedStyle} {...props} />;
};

export default RTLText;
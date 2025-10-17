import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalization } from '../../hooks/useLocalization';
import { getTextStyle } from '../../utils/localization';

interface IngredientStatusIndicatorProps {
  status: 'mandatory' | 'recommended' | 'optional';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onPress?: () => void;
  style?: any;
}

const IngredientStatusIndicator: React.FC<IngredientStatusIndicatorProps> = ({
  status,
  size = 'medium',
  showLabel = false,
  onPress,
  style,
}) => {
  const { t } = useLocalization();
  const textStyle = getTextStyle('regular');

  const getStatusConfig = () => {
    switch (status) {
      case 'mandatory':
        return {
          color: '#22c55e',
          label: t('pantry.status.mandatory'),
          description: t('pantry.status.mandatoryDescription'),
        };
      case 'recommended':
        return {
          color: '#f97316',
          label: t('pantry.status.recommended'),
          description: t('pantry.status.recommendedDescription'),
        };
      case 'optional':
        return {
          color: '#6b7280',
          label: t('pantry.status.optional'),
          description: t('pantry.status.optionalDescription'),
        };
      default:
        return {
          color: '#6b7280',
          label: t('pantry.status.optional'),
          description: t('pantry.status.optionalDescription'),
        };
    }
  };

  const statusConfig = getStatusConfig();
  
  const circleSize = {
    small: 12,
    medium: 16,
    large: 20,
  }[size];

  const labelSize = {
    small: 12,
    medium: 14,
    large: 16,
  }[size];

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.circle,
          {
            width: circleSize,
            height: circleSize,
            backgroundColor: statusConfig.color,
          },
        ]}
      />
      {showLabel && (
        <Text
          style={[
            styles.label,
            textStyle,
            { fontSize: labelSize },
          ]}
        >
          {statusConfig.label}
        </Text>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    borderRadius: 50,
  },
  label: {
    marginLeft: 8,
    marginRight: 8,
    color: '#1C1C1E',
    fontWeight: '500',
  },
});

export default IngredientStatusIndicator;
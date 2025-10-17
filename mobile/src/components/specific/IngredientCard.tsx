import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient, PantryIngredient } from '../../types/ingredient';
import { useLocalization } from '../../hooks/useLocalization';
import { getTextStyle, transformStyleForRTL, isRTL } from '../../utils/localization';
import ingredientService from '../../services/ingredientService';

interface IngredientCardProps {
  ingredient: Ingredient | PantryIngredient;
  isInPantry: boolean;
  onTogglePantry: (ingredientId: string, isAdding: boolean) => void;
  onPress?: () => void;
  showNutrition?: boolean;
  loading?: boolean;
  style?: any;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  isInPantry,
  onTogglePantry,
  onPress,
  showNutrition = false,
  loading = false,
  style,
}) => {
  const { t, language } = useLocalization();
  const textStyle = getTextStyle('regular');
  const isRTLLayout = isRTL();

  const ingredientName = ingredientService.getLocalizedName(ingredient, language as 'en' | 'ar');
  const categoryName = ingredientService.getCategoryDisplayName(ingredient.category, language as 'en' | 'ar');

  const handleTogglePantry = () => {
    if (loading) return;

    if (isInPantry) {
      Alert.alert(
        t('pantry.removeConfirmTitle'),
        t('pantry.removeConfirmMessage').replace('{name}', ingredientName),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => onTogglePantry(ingredient.id, false),
          },
        ]
      );
    } else {
      onTogglePantry(ingredient.id, true);
    }
  };

  const renderNutritionInfo = () => {
    if (!showNutrition) return null;

    return (
      <View style={styles.nutritionContainer}>
        <View style={styles.nutritionRow}>
          <Text style={[styles.nutritionLabel, textStyle]}>
            {t('pantry.calories')}:
          </Text>
          <Text style={[styles.nutritionValue, textStyle]}>
            {ingredientService.formatNutritionValue(ingredient.calories_per_100g, 'kcal')}
          </Text>
        </View>
        <View style={styles.nutritionRow}>
          <Text style={[styles.nutritionLabel, textStyle]}>
            {t('pantry.protein')}:
          </Text>
          <Text style={[styles.nutritionValue, textStyle]}>
            {ingredientService.formatNutritionValue(ingredient.protein_per_100g)}
          </Text>
        </View>
      </View>
    );
  };

  const cardStyle = transformStyleForRTL([styles.card, style]);
  const contentStyle = transformStyleForRTL(styles.content);
  const headerStyle = transformStyleForRTL(styles.header);

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading}
    >
      <View style={contentStyle}>
        <View style={headerStyle}>
          <View style={styles.ingredientInfo}>
            <Text style={[styles.name, textStyle]} numberOfLines={1}>
              {ingredientName}
            </Text>
            <Text style={[styles.category, textStyle]} numberOfLines={1}>
              {categoryName}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.pantryButton,
              isInPantry && styles.pantryButtonActive,
              loading && styles.pantryButtonLoading,
            ]}
            onPress={handleTogglePantry}
            disabled={loading}
          >
            <Ionicons
              name={isInPantry ? 'checkmark-circle' : 'add-circle-outline'}
              size={24}
              color={isInPantry ? '#FFFFFF' : '#007AFF'}
            />
          </TouchableOpacity>
        </View>

        {renderNutritionInfo()}

        {ingredient.default_unit && (
          <Text style={[styles.unit, textStyle]}>
            {t('pantry.defaultUnit')}: {ingredient.default_unit}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  pantryButton: {
    padding: 4,
    borderRadius: 8,
  },
  pantryButtonActive: {
    backgroundColor: '#007AFF',
  },
  pantryButtonLoading: {
    opacity: 0.5,
  },
  nutritionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  nutritionValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  unit: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
});

export default IngredientCard;
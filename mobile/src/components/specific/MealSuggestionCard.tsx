import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MealSuggestion } from '../../types/suggestion';
import { suggestionService } from '../../services/suggestionService';
import { useAppSelector } from '../../hooks/redux';

interface MealSuggestionCardProps {
  meal: MealSuggestion;
  onPress: (meal: MealSuggestion) => void;
  onToggleFavorite?: (mealId: string) => void;
  language?: 'en' | 'ar';
}

const { width } = Dimensions.get('window');
const cardWidth = width - 32; // Account for horizontal padding

const MealSuggestionCard: React.FC<MealSuggestionCardProps> = ({
  meal,
  onPress,
  onToggleFavorite,
  language = 'en',
}) => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const currentLanguage = language || user?.language || 'en';

  const title = suggestionService.getLocalizedTitle(meal, currentLanguage);
  const kitchenName = suggestionService.getLocalizedKitchenName(meal, currentLanguage);
  const matchQuality = suggestionService.getMatchQuality(meal.availability_score, meal.missing_mandatory_count);
  const availabilityColor = suggestionService.getAvailabilityScoreColor(meal.availability_score);
  const mealTypeIcon = suggestionService.getMealTypeIcon(meal.meal_type);
  const cookingTime = suggestionService.formatCookingTime(meal.prep_time_min, meal.cook_time_min);

  const getMatchQualityLabel = () => {
    switch (matchQuality) {
      case 'perfect':
        return t('home.suggestions.perfectMatch');
      case 'good':
        return t('home.suggestions.goodMatch');
      case 'partial':
        return t('home.suggestions.partialMatch');
      default:
        return '';
    }
  };

  const getAvailabilityText = () => {
    if (meal.missing_mandatory_count === 0) {
      return t('home.suggestions.allIngredientsAvailable');
    }
    return t('home.suggestions.missingIngredients', { count: meal.missing_mandatory_count });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(meal)}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {meal.image_url ? (
          <Image source={{ uri: meal.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>{mealTypeIcon}</Text>
          </View>
        )}
        
        {/* Favorite button */}
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(meal.id)}
          >
            <Text style={styles.favoriteIcon}>
              {meal.is_favorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Match quality badge */}
        <View style={[styles.matchBadge, { backgroundColor: availabilityColor }]}>
          <Text style={styles.matchBadgeText}>{getMatchQualityLabel()}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and kitchen */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.kitchen}>{kitchenName}</Text>
        </View>

        {/* Meal info */}
        <View style={styles.infoRow}>
          <Text style={styles.mealType}>
            {mealTypeIcon} {t(`home.mealTypes.${meal.meal_type}`)}
          </Text>
          {cookingTime && (
            <Text style={styles.cookingTime}>{cookingTime}</Text>
          )}
        </View>

        {/* Availability info */}
        <View style={styles.availabilityRow}>
          <View style={[styles.availabilityDot, { backgroundColor: availabilityColor }]} />
          <Text style={styles.availabilityText}>{getAvailabilityText()}</Text>
          <Text style={styles.availabilityScore}>
            {t('home.suggestions.availabilityScore', { score: meal.availability_score })}
          </Text>
        </View>

        {/* Additional info */}
        <View style={styles.footer}>
          {meal.suggestion_reason && (
            <Text style={styles.suggestionReason}>{meal.suggestion_reason}</Text>
          )}
          <Text style={styles.servings}>
            {t('home.suggestions.servings', { count: meal.servings })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteIcon: {
    fontSize: 18,
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  kitchen: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealType: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  cookingTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  availabilityText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
  },
  availabilityScore: {
    fontSize: 12,
    color: '#8E8E93',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionReason: {
    flex: 1,
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  servings: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default MealSuggestionCard;
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  fetchMealById, 
  selectCurrentMeal, 
  selectMealLoading, 
  selectMealError,
  clearCurrentMeal 
} from '../../store/mealSlice';
import { createCalendarEntry } from '../../store/calendarSlice';
import { toggleFavorite, checkFavorite } from '../../store/favoritesSlice';
import { RootState, AppDispatch } from '../../store';
import { useLocalization } from '../../hooks/useLocalization';
import { Meal, MealIngredient } from '../../../../shared/src/types/meal';
import Button from '../../components/common/Button';
import { HelpButton } from '../../components/common/HelpButton';

const { width } = Dimensions.get('window');

type MealDetailRouteProp = RouteProp<{ MealDetail: { mealId: string } }, 'MealDetail'>;

interface IngredientStatusModalProps {
  visible: boolean;
  onClose: () => void;
  ingredient: MealIngredient | null;
}

const IngredientStatusModal: React.FC<IngredientStatusModalProps> = ({ 
  visible, 
  onClose, 
  ingredient 
}) => {
  const { t, isRTL } = useLocalization();

  if (!ingredient) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'mandatory':
        return {
          color: '#22c55e',
          title: t('ingredient.status.mandatory'),
          description: t('ingredient.status.mandatoryDescription')
        };
      case 'recommended':
        return {
          color: '#f97316',
          title: t('ingredient.status.recommended'),
          description: t('ingredient.status.recommendedDescription')
        };
      case 'optional':
        return {
          color: '#6b7280',
          title: t('ingredient.status.optional'),
          description: t('ingredient.status.optionalDescription')
        };
      default:
        return {
          color: '#6b7280',
          title: t('ingredient.status.optional'),
          description: t('ingredient.status.optionalDescription')
        };
    }
  };

  const statusInfo = getStatusInfo(ingredient.status);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>
              {ingredient.ingredient?.name_en || ''}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.statusIndicator}>
            <View style={[styles.statusCircle, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusTitle, isRTL && styles.textRTL]}>
              {statusInfo.title}
            </Text>
          </View>

          <Text style={[styles.statusDescription, isRTL && styles.textRTL]}>
            {statusInfo.description}
          </Text>

          <View style={styles.ingredientDetails}>
            <Text style={[styles.detailLabel, isRTL && styles.textRTL]}>
              {t('meal.quantity')}:
            </Text>
            <Text style={[styles.detailValue, isRTL && styles.textRTL]}>
              {ingredient.quantity} {ingredient.unit}
            </Text>
          </View>

          {ingredient.nutrition_contribution && (
            <View style={styles.nutritionSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t('meal.nutritionContribution')}
              </Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionLabel, isRTL && styles.textRTL]}>
                    {t('nutrition.calories')}
                  </Text>
                  <Text style={[styles.nutritionValue, isRTL && styles.textRTL]}>
                    {Math.round(ingredient.nutrition_contribution.calories)}
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionLabel, isRTL && styles.textRTL]}>
                    {t('nutrition.protein')}
                  </Text>
                  <Text style={[styles.nutritionValue, isRTL && styles.textRTL]}>
                    {Math.round(ingredient.nutrition_contribution.protein)}g
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionLabel, isRTL && styles.textRTL]}>
                    {t('nutrition.carbs')}
                  </Text>
                  <Text style={[styles.nutritionValue, isRTL && styles.textRTL]}>
                    {Math.round(ingredient.nutrition_contribution.carbs)}g
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionLabel, isRTL && styles.textRTL]}>
                    {t('nutrition.fat')}
                  </Text>
                  <Text style={[styles.nutritionValue, isRTL && styles.textRTL]}>
                    {Math.round(ingredient.nutrition_contribution.fat)}g
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const MealDetailScreen: React.FC = () => {
  const route = useRoute<MealDetailRouteProp>();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { t, isRTL } = useLocalization();
  
  const meal = useSelector(selectCurrentMeal);
  const loading = useSelector(selectMealLoading);
  const error = useSelector(selectMealError);
  const { favoriteMealIds } = useSelector((state: RootState) => state.favorites);
  
  const [selectedIngredient, setSelectedIngredient] = useState<MealIngredient | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarNotes, setCalendarNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const { mealId } = route.params;

  useEffect(() => {
    if (mealId) {
      dispatch(fetchMealById(mealId) as any);
      // Check if meal is favorited
      setIsFavorite(favoriteMealIds.has(mealId));
    }

    return () => {
      dispatch(clearCurrentMeal());
    };
  }, [dispatch, mealId, favoriteMealIds]);

  // Update favorite status when favoriteMealIds changes
  useEffect(() => {
    setIsFavorite(favoriteMealIds.has(mealId));
  }, [favoriteMealIds, mealId]);

  const handleIngredientPress = (ingredient: MealIngredient) => {
    setSelectedIngredient(ingredient);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedIngredient(null);
  };

  const handleToggleFavorite = async () => {
    try {
      await dispatch(toggleFavorite(mealId)).unwrap();
    } catch (error) {
      Alert.alert(t('error'), t('favorites.toggleError'));
    }
  };

  const handleSaveToCalendar = () => {
    setCalendarModalVisible(true);
  };

  const handleCalendarSave = async () => {
    try {
      await dispatch(createCalendarEntry({
        meal_id: mealId,
        scheduled_date: selectedDate,
        notes: calendarNotes.trim() || undefined
      })).unwrap();
      
      setCalendarModalVisible(false);
      setCalendarNotes('');
      Alert.alert(t('success'), t('calendar.mealSaved'));
    } catch (error) {
      Alert.alert(t('error'), t('calendar.saveError'));
    }
  };

  const handleShareRecipe = () => {
    if (meal) {
      navigation.navigate('ShareRecipe', { meal });
    }
  };

  const closeCalendarModal = () => {
    setCalendarModalVisible(false);
    setCalendarNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mandatory':
        return '#22c55e';
      case 'recommended':
        return '#f97316';
      case 'optional':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return t('common.notSpecified');
    if (minutes < 60) return `${minutes} ${t('time.minutes')}`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} ${t('time.hours')}`;
    return `${hours}${t('time.hoursSeparator')}${remainingMinutes.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, isRTL && styles.textRTL]}>
          {error}
        </Text>
        <Button
          title={t('common.retry')}
          onPress={() => dispatch(fetchMealById(mealId) as any)}
          style={styles.retryButton}
        />
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, isRTL && styles.textRTL]}>
          {t('meal.notFound')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image */}
      {meal.image_url && (
        <Image source={{ uri: meal.image_url }} style={styles.headerImage} />
      )}

      <View style={styles.content}>
        {/* Title and Basic Info */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, isRTL && styles.textRTL]}>
            {isRTL && meal.title_ar ? meal.title_ar : meal.title_en}
          </Text>
          
          {meal.kitchen && (
            <Text style={[styles.kitchenTag, isRTL && styles.textRTL]}>
              {isRTL && meal.kitchen.name_ar ? meal.kitchen.name_ar : meal.kitchen.name_en}
            </Text>
          )}

          {meal.description_en && (
            <Text style={[styles.description, isRTL && styles.textRTL]}>
              {isRTL && meal.description_ar ? meal.description_ar : meal.description_en}
            </Text>
          )}
        </View>

        {/* Meal Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="restaurant" size={20} color="#666" />
              <Text style={[styles.infoLabel, isRTL && styles.textRTL]}>
                {t('meal.servings')}
              </Text>
              <Text style={[styles.infoValue, isRTL && styles.textRTL]}>
                {meal.servings}
              </Text>
            </View>

            {meal.prep_time_min && (
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={[styles.infoLabel, isRTL && styles.textRTL]}>
                  {t('meal.prepTime')}
                </Text>
                <Text style={[styles.infoValue, isRTL && styles.textRTL]}>
                  {formatTime(meal.prep_time_min)}
                </Text>
              </View>
            )}

            {meal.cook_time_min && (
              <View style={styles.infoItem}>
                <Ionicons name="flame" size={20} color="#666" />
                <Text style={[styles.infoLabel, isRTL && styles.textRTL]}>
                  {t('meal.cookTime')}
                </Text>
                <Text style={[styles.infoValue, isRTL && styles.textRTL]}>
                  {formatTime(meal.cook_time_min)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ingredients Section */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t('meal.ingredients')}
              </Text>
              <HelpButton helpType="ingredient-status" size={20} />
            </View>
            
            <View style={styles.ingredientsList}>
              {meal.ingredients.map((ingredient) => (
                <TouchableOpacity
                  key={ingredient.id}
                  style={styles.ingredientItem}
                  onPress={() => handleIngredientPress(ingredient)}
                >
                  <View style={styles.ingredientInfo}>
                    <View style={[
                      styles.statusCircle,
                      { backgroundColor: getStatusColor(ingredient.status) }
                    ]} />
                    <Text style={[styles.ingredientName, isRTL && styles.textRTL]}>
                      {isRTL && ingredient.ingredient?.name_ar 
                        ? ingredient.ingredient.name_ar 
                        : ingredient.ingredient?.name_en || ''}
                    </Text>
                  </View>
                  <View style={styles.ingredientQuantity}>
                    <Text style={[styles.quantityText, isRTL && styles.textRTL]}>
                      {ingredient.quantity} {ingredient.unit}
                    </Text>
                    <Ionicons name="information-circle-outline" size={16} color="#666" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Legend */}
            <View style={styles.statusLegend}>
              <Text style={[styles.legendTitle, isRTL && styles.textRTL]}>
                {t('ingredient.statusLegend')}
              </Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View style={[styles.statusCircle, { backgroundColor: '#22c55e' }]} />
                  <Text style={[styles.legendText, isRTL && styles.textRTL]}>
                    {t('ingredient.status.mandatory')}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.statusCircle, { backgroundColor: '#f97316' }]} />
                  <Text style={[styles.legendText, isRTL && styles.textRTL]}>
                    {t('ingredient.status.recommended')}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.statusCircle, { backgroundColor: '#6b7280' }]} />
                  <Text style={[styles.legendText, isRTL && styles.textRTL]}>
                    {t('ingredient.status.optional')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Nutrition Section */}
        {meal.nutrition_totals && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('meal.nutrition')}
            </Text>
            
            <View style={styles.nutritionTable}>
              <View style={styles.nutritionRow}>
                <Text style={[styles.nutritionLabel, isRTL && styles.textRTL]}>
                  {t('nutrition.calories')}
                </Text>
                <Text style={[styles.nutritionValue, isRTL && styles.textRTL]}>
                  {Math.round(meal.nutrition_totals.calories)}
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={[styles.nutritionLabel, isRTL && styles.textRTL]}>
                  {t('nutrition.protein')}
                </Text>
                <Text style={[styles.nutritionValue, isRTL && styles.textRTL]}>
                  {Math.round(meal.nutrition_totals.protein)}g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={[styles.nutritionLabel, isRTL && styles.textRTL]}>
                  {t('nutrition.carbs')}
                </Text>
                <Text style={[styles.nutritionValue, isRTL && styles.textRTL]}>
                  {Math.round(meal.nutrition_totals.carbs)}g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={[styles.nutritionLabel, isRTL && styles.textRTL]}>
                  {t('nutrition.fat')}
                </Text>
                <Text style={[styles.nutritionValue, isRTL && styles.textRTL]}>
                  {Math.round(meal.nutrition_totals.fat)}g
                </Text>
              </View>
            </View>

            <Text style={[styles.nutritionNote, isRTL && styles.textRTL]}>
              {t('meal.nutritionPerServing').replace('{servings}', meal.servings.toString())}
            </Text>
          </View>
        )}

        {/* Instructions Section */}
        {((meal.steps_en && meal.steps_en.length > 0) || 
          (meal.steps_ar && meal.steps_ar.length > 0)) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('meal.instructions')}
            </Text>
            
            {(isRTL && meal.steps_ar ? meal.steps_ar : meal.steps_en || []).map((step, index) => (
              <View key={index} style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, isRTL && styles.textRTL]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.favoriteButton]}
            onPress={handleToggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF6B6B" : "#007AFF"} 
            />
            <Text style={[styles.actionButtonText, isFavorite && styles.favoriteButtonText]}>
              {isFavorite ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.calendarButton]}
            onPress={handleSaveToCalendar}
          >
            <Ionicons name="calendar" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>
              {t('calendar.saveToCalendar')}
            </Text>
          </TouchableOpacity>

          {/* Show share button only for user's own recipes */}
          {meal?.created_by_user_id && (
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShareRecipe}
            >
              <Ionicons name="share-outline" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>
                {t('meal.share')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Ingredient Status Modal */}
      <IngredientStatusModal
        visible={modalVisible}
        onClose={closeModal}
        ingredient={selectedIngredient}
      />

      {/* Calendar Save Modal */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeCalendarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>
                {t('calendar.saveToCalendar')}
              </Text>
              <TouchableOpacity onPress={closeCalendarModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarForm}>
              <Text style={[styles.formLabel, isRTL && styles.textRTL]}>
                {t('calendar.selectDate')}
              </Text>
              <TextInput
                style={[styles.dateInput, isRTL && styles.textInputRTL]}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8E8E93"
              />

              <Text style={[styles.formLabel, isRTL && styles.textRTL]}>
                {t('calendar.notes')} ({t('common.optional')})
              </Text>
              <TextInput
                style={[styles.notesInput, isRTL && styles.textInputRTL]}
                value={calendarNotes}
                onChangeText={setCalendarNotes}
                placeholder={t('calendar.notesPlaceholder')}
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <Button
                  title={t('common.cancel')}
                  onPress={closeCalendarModal}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title={t('common.save')}
                  onPress={handleCalendarSave}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  headerImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover'
  },
  content: {
    padding: 20
  },
  headerSection: {
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8
  },
  kitchenTag: {
    fontSize: 16,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24
  },
  infoSection: {
    marginBottom: 24
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16
  },
  infoItem: {
    alignItems: 'center',
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center'
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
    textAlign: 'center'
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  ingredientsList: {
    marginBottom: 16
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8
  },
  ingredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  ingredientName: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1
  },
  ingredientQuantity: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quantityText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8
  },
  statusLegend: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6
  },
  nutritionTable: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#374151'
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937'
  },
  nutritionNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    flex: 1
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280'
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16
  },
  retryButton: {
    marginTop: 16
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: width - 40,
    maxHeight: '80%'
  },
  modalContentRTL: {
    alignItems: 'flex-end'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1
  },
  closeButton: {
    padding: 4
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8
  },
  statusDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16
  },
  ingredientDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937'
  },
  nutritionSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  nutritionItem: {
    width: '50%',
    paddingVertical: 8,
    alignItems: 'center'
  },
  actionButtons: {
    marginTop: 24,
    gap: 12
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF'
  },
  favoriteButton: {
    backgroundColor: '#FFFFFF'
  },
  calendarButton: {
    backgroundColor: '#007AFF'
  },
  shareButton: {
    backgroundColor: '#28a745'
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8
  },
  favoriteButtonText: {
    color: '#FF6B6B'
  },
  calendarForm: {
    width: '100%'
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9'
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    minHeight: 80
  },
  textInputRTL: {
    textAlign: 'right'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12
  },
  modalButton: {
    flex: 1
  }
});

export default MealDetailScreen;
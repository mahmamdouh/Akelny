import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
import { 
  createMeal, 
  selectMealLoading, 
  selectMealError,
  uploadMealImage 
} from '../../store/mealSlice';
import { 
  fetchIngredients, 
  selectIngredients, 
  selectIngredientsLoading 
} from '../../store/ingredientSlice';
import { selectUser } from '../../store/authSlice';
import { useLocalization } from '../../hooks/useLocalization';
import { 
  CreateMealRequest, 
  CreateMealIngredientRequest 
} from '../../../../shared/src/types/meal';
import { Ingredient } from '../../../../shared/src/types/meal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Picker from '../../components/common/Picker';

interface SelectedIngredient extends CreateMealIngredientRequest {
  ingredient?: Ingredient;
}

interface IngredientSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (ingredient: Ingredient) => void;
  selectedIngredients: string[];
}

const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedIngredients
}) => {
  const { t, isRTL } = useLocalization();
  const dispatch = useDispatch();
  const ingredients = useSelector(selectIngredients);
  const loading = useSelector(selectIngredientsLoading);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible && ingredients.length === 0) {
      dispatch(fetchIngredients({}) as any);
    }
  }, [visible, dispatch, ingredients.length]);

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = searchQuery === '' || 
      ingredient.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ingredient.name_ar && ingredient.name_ar.includes(searchQuery));
    const notSelected = !selectedIngredients.includes(ingredient.id);
    return matchesSearch && notSelected;
  });

  const renderIngredient = ({ item }: { item: Ingredient }) => (
    <TouchableOpacity
      style={styles.ingredientSelectorItem}
      onPress={() => onSelect(item)}
    >
      <Text style={[styles.ingredientSelectorName, isRTL && styles.textRTL]}>
        {isRTL && item.name_ar ? item.name_ar : item.name_en}
      </Text>
      {item.category && (
        <Text style={[styles.ingredientSelectorCategory, isRTL && styles.textRTL]}>
          {item.category}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>
            {t('recipe.selectIngredients')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, isRTL && styles.textRTL]}
            placeholder={t('pantry.searchIngredients')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        </View>

        <FlatList
          data={filteredIngredients}
          renderItem={renderIngredient}
          keyExtractor={(item) => item.id}
          style={styles.ingredientsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
                {loading ? t('common.loading') : t('pantry.noSearchResults')}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};

const CreateRecipeScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t, isRTL } = useLocalization();
  
  const user = useSelector(selectUser);
  const loading = useSelector(selectMealLoading);
  const error = useSelector(selectMealError);

  // Form state
  const [title_en, setTitleEn] = useState('');
  const [title_ar, setTitleAr] = useState('');
  const [description_en, setDescriptionEn] = useState('');
  const [description_ar, setDescriptionAr] = useState('');
  const [kitchen_id, setKitchenId] = useState('');
  const [meal_type, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [servings, setServings] = useState('4');
  const [prep_time_min, setPrepTimeMin] = useState('');
  const [cook_time_min, setCookTimeMin] = useState('');
  const [steps_en, setStepsEn] = useState<string[]>(['']);
  const [steps_ar, setStepsAr] = useState<string[]>(['']);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [is_public, setIsPublic] = useState(false);

  // Modal state
  const [ingredientSelectorVisible, setIngredientSelectorVisible] = useState(false);

  // Kitchen options (this should come from a kitchen selector in a real app)
  const kitchenOptions = [
    { label: t('kitchens.egyptian'), value: 'egyptian-kitchen-id' },
    { label: t('kitchens.gulf'), value: 'gulf-kitchen-id' },
    { label: t('kitchens.asian'), value: 'asian-kitchen-id' },
    { label: t('kitchens.indian'), value: 'indian-kitchen-id' },
    { label: t('kitchens.european'), value: 'european-kitchen-id' },
    { label: t('kitchens.mexican'), value: 'mexican-kitchen-id' }
  ];

  const mealTypeOptions = [
    { label: t('meal.mealTypes.breakfast'), value: 'breakfast' },
    { label: t('meal.mealTypes.lunch'), value: 'lunch' },
    { label: t('meal.mealTypes.dinner'), value: 'dinner' }
  ];

  const statusOptions = [
    { label: t('ingredient.status.mandatory'), value: 'mandatory' },
    { label: t('ingredient.status.recommended'), value: 'recommended' },
    { label: t('ingredient.status.optional'), value: 'optional' }
  ];

  const handleAddIngredient = (ingredient: Ingredient) => {
    const newIngredient: SelectedIngredient = {
      ingredient_id: ingredient.id,
      quantity: 1,
      unit: ingredient.default_unit || 'piece',
      status: 'mandatory',
      ingredient
    };
    setSelectedIngredients([...selectedIngredients, newIngredient]);
    setIngredientSelectorVisible(false);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(updated);
  };

  const handleUpdateIngredient = (index: number, field: keyof SelectedIngredient, value: any) => {
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedIngredients(updated);
  };

  const handleAddStep = (language: 'en' | 'ar') => {
    if (language === 'en') {
      setStepsEn([...steps_en, '']);
    } else {
      setStepsAr([...steps_ar, '']);
    }
  };

  const handleUpdateStep = (index: number, value: string, language: 'en' | 'ar') => {
    if (language === 'en') {
      const updated = [...steps_en];
      updated[index] = value;
      setStepsEn(updated);
    } else {
      const updated = [...steps_ar];
      updated[index] = value;
      setStepsAr(updated);
    }
  };

  const handleRemoveStep = (index: number, language: 'en' | 'ar') => {
    if (language === 'en') {
      const updated = steps_en.filter((_, i) => i !== index);
      setStepsEn(updated.length > 0 ? updated : ['']);
    } else {
      const updated = steps_ar.filter((_, i) => i !== index);
      setStepsAr(updated.length > 0 ? updated : ['']);
    }
  };

  const handlePickImage = async () => {
    // TODO: Implement image picker when expo-image-picker is installed
    Alert.alert(t('common.error'), 'Image picker not implemented yet');
  };

  const validateForm = (): boolean => {
    if (!title_en.trim()) {
      Alert.alert(t('common.error'), t('recipe.titleRequired'));
      return false;
    }

    if (!kitchen_id) {
      Alert.alert(t('common.error'), t('recipe.kitchenRequired'));
      return false;
    }

    if (selectedIngredients.length === 0) {
      Alert.alert(t('common.error'), t('recipe.ingredientsRequired'));
      return false;
    }

    if (steps_en.filter(step => step.trim()).length === 0) {
      Alert.alert(t('common.error'), t('recipe.stepsRequired'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const mealData: CreateMealRequest = {
        title_en: title_en.trim(),
        title_ar: title_ar.trim() || undefined,
        description_en: description_en.trim() || undefined,
        description_ar: description_ar.trim() || undefined,
        kitchen_id,
        meal_type,
        servings: parseInt(servings) || 1,
        prep_time_min: prep_time_min ? parseInt(prep_time_min) : undefined,
        cook_time_min: cook_time_min ? parseInt(cook_time_min) : undefined,
        steps_en: steps_en.filter(step => step.trim()),
        steps_ar: steps_ar.filter(step => step.trim()).length > 0 
          ? steps_ar.filter(step => step.trim()) 
          : undefined,
        is_public,
        ingredients: selectedIngredients.map(({ ingredient, ...rest }) => rest)
      };

      const result = await dispatch(createMeal(mealData) as any);
      
      if (createMeal.fulfilled.match(result)) {
        const createdMeal = result.payload;
        
        // Upload image if selected
        if (imageUri && createdMeal.id) {
          await dispatch(uploadMealImage({ 
            mealId: createdMeal.id, 
            imageUri 
          }) as any);
        }

        Alert.alert(
          t('common.success'),
          t('recipe.createSuccess'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      Alert.alert(t('common.error'), t('recipe.createError'));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && styles.textRTL]}>
            {t('recipe.createTitle')}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
            {t('recipe.createSubtitle')}
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t('recipe.basicInfo')}
          </Text>

          <Input
            label={t('recipe.titleEn')}
            value={title_en}
            onChangeText={setTitleEn}
            placeholder={t('recipe.titleEnPlaceholder')}
          />

          <Input
            label={t('recipe.titleAr')}
            value={title_ar}
            onChangeText={setTitleAr}
            placeholder={t('recipe.titleArPlaceholder')}
            style={isRTL ? styles.rtlInput : undefined}
          />

          <Input
            label={t('recipe.descriptionEn')}
            value={description_en}
            onChangeText={setDescriptionEn}
            placeholder={t('recipe.descriptionEnPlaceholder')}
            multiline
            numberOfLines={3}
          />

          <Input
            label={t('recipe.descriptionAr')}
            value={description_ar}
            onChangeText={setDescriptionAr}
            placeholder={t('recipe.descriptionArPlaceholder')}
            multiline
            numberOfLines={3}
            style={isRTL ? styles.rtlInput : undefined}
          />

          <Picker
            label={t('recipe.kitchen')}
            value={kitchen_id}
            onValueChange={setKitchenId}
            options={kitchenOptions}
            placeholder={t('recipe.selectKitchen')}
          />

          <Picker
            label={t('recipe.mealType')}
            value={meal_type}
            onValueChange={(value) => setMealType(value as 'breakfast' | 'lunch' | 'dinner')}
            options={mealTypeOptions}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label={t('recipe.servings')}
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                placeholder="4"
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label={t('recipe.prepTime')}
                value={prep_time_min}
                onChangeText={setPrepTimeMin}
                keyboardType="numeric"
                placeholder={t('recipe.minutes')}
              />
            </View>
          </View>

          <Input
            label={t('recipe.cookTime')}
            value={cook_time_min}
            onChangeText={setCookTimeMin}
            keyboardType="numeric"
            placeholder={t('recipe.minutes')}
          />
        </View>

        {/* Image */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t('recipe.image')}
          </Text>

          <TouchableOpacity style={styles.imageContainer} onPress={handlePickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color="#ccc" />
                <Text style={[styles.imagePlaceholderText, isRTL && styles.textRTL]}>
                  {t('recipe.addImage')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('recipe.ingredients')}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIngredientSelectorVisible(true)}
            >
              <Ionicons name="add" size={20} color="#3b82f6" />
              <Text style={[styles.addButtonText, isRTL && styles.textRTL]}>
                {t('recipe.addIngredient')}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedIngredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <View style={styles.ingredientHeader}>
                <Text style={[styles.ingredientName, isRTL && styles.textRTL]}>
                  {isRTL && ingredient.ingredient?.name_ar 
                    ? ingredient.ingredient.name_ar 
                    : ingredient.ingredient?.name_en || ''}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveIngredient(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={styles.quarterWidth}>
                  <Input
                    label={t('recipe.quantity')}
                    value={ingredient.quantity.toString()}
                    onChangeText={(value) => handleUpdateIngredient(index, 'quantity', parseFloat(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.quarterWidth}>
                  <Input
                    label={t('recipe.unit')}
                    value={ingredient.unit}
                    onChangeText={(value) => handleUpdateIngredient(index, 'unit', value)}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Picker
                    label={t('recipe.status')}
                    value={ingredient.status}
                    onValueChange={(value) => handleUpdateIngredient(index, 'status', value)}
                    options={statusOptions}
                  />
                </View>
              </View>
            </View>
          ))}

          {selectedIngredients.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
                {t('recipe.noIngredients')}
              </Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('recipe.instructionsEn')}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddStep('en')}
            >
              <Ionicons name="add" size={20} color="#3b82f6" />
              <Text style={[styles.addButtonText, isRTL && styles.textRTL]}>
                {t('recipe.addStep')}
              </Text>
            </TouchableOpacity>
          </View>

          {steps_en.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepHeader}>
                <Text style={[styles.stepNumber, isRTL && styles.textRTL]}>
                  {t('recipe.step')} {index + 1}
                </Text>
                {steps_en.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveStep(index, 'en')}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash" size={16} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.stepInput, isRTL && styles.textRTL]}
                value={step}
                onChangeText={(value) => handleUpdateStep(index, value, 'en')}
                placeholder={t('recipe.stepPlaceholder')}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>
          ))}

          {/* Arabic Instructions */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t('recipe.instructionsAr')}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddStep('ar')}
            >
              <Ionicons name="add" size={20} color="#3b82f6" />
              <Text style={[styles.addButtonText, isRTL && styles.textRTL]}>
                {t('recipe.addStep')}
              </Text>
            </TouchableOpacity>
          </View>

          {steps_ar.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepHeader}>
                <Text style={[styles.stepNumber, isRTL && styles.textRTL]}>
                  {t('recipe.step')} {index + 1}
                </Text>
                {steps_ar.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveStep(index, 'ar')}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash" size={16} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.stepInput, styles.rtlInput, isRTL && styles.textRTL]}
                value={step}
                onChangeText={(value) => handleUpdateStep(index, value, 'ar')}
                placeholder={t('recipe.stepPlaceholder')}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>
          ))}
        </View>

        {/* Publishing Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t('recipe.publishing')}
          </Text>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsPublic(!is_public)}
          >
            <View style={[styles.checkbox, is_public && styles.checkboxChecked]}>
              {is_public && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={[styles.checkboxLabel, isRTL && styles.textRTL]}>
              {t('recipe.makePublic')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.checkboxDescription, isRTL && styles.textRTL]}>
            {t('recipe.makePublicDescription')}
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={t('recipe.createRecipe')}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {/* Ingredient Selector Modal */}
      <IngredientSelector
        visible={ingredientSelectorVisible}
        onClose={() => setIngredientSelectorVisible(false)}
        onSelect={handleAddIngredient}
        selectedIngredients={selectedIngredients.map(ing => ing.ingredient_id)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  scrollContainer: {
    flex: 1
  },
  header: {
    padding: 20,
    paddingBottom: 10
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280'
  },
  section: {
    padding: 20,
    paddingTop: 10
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6
  },
  addButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  halfWidth: {
    flex: 1
  },
  quarterWidth: {
    flex: 0.25
  },
  imageContainer: {
    marginBottom: 16
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover'
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  imagePlaceholderText: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 8
  },
  ingredientItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1
  },
  removeButton: {
    padding: 4
  },
  stepItem: {
    marginBottom: 16
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  stepInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'top'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1
  },
  checkboxDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 32,
    lineHeight: 20
  },
  submitContainer: {
    padding: 20,
    paddingTop: 10
  },
  submitButton: {
    marginBottom: 20
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center'
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl'
  },
  rtlInput: {
    textAlign: 'right'
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1
  },
  closeButton: {
    padding: 4
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937'
  },
  searchIcon: {
    marginLeft: 8
  },
  ingredientsList: {
    flex: 1,
    paddingHorizontal: 20
  },
  ingredientSelectorItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  ingredientSelectorName: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4
  },
  ingredientSelectorCategory: {
    fontSize: 14,
    color: '#6b7280'
  }
});

export default CreateRecipeScreen;
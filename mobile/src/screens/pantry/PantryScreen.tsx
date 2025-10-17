import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  fetchPantry,
  fetchCategories,
  addToPantry,
  removeFromPantry,
  clearError,
} from '../../store/ingredientSlice';
import { useLocalization } from '../../hooks/useLocalization';
import { getTextStyle, transformStyleForRTL, isRTL } from '../../utils/localization';
import { PantryIngredient, IngredientCategory } from '../../types/ingredient';
import IngredientCard from '../../components/specific/IngredientCard';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { HelpButton } from '../../components/common/HelpButton';
import { ListSkeleton, IngredientCardSkeleton } from '../../components/common/SkeletonLoader';
import { ErrorBoundaryWrapper } from '../../components/common/ErrorBoundary';
import ingredientService from '../../services/ingredientService';

interface PantryScreenProps {
  navigation: any;
}

const PantryScreen: React.FC<PantryScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { t, language } = useLocalization();
  const textStyle = getTextStyle('regular');
  const isRTLLayout = isRTL();

  const {
    pantry,
    categories,
    loading,
    error,
  } = useSelector((state: RootState) => state.ingredients);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filteredPantry, setFilteredPantry] = useState<PantryIngredient[]>([]);

  // Load data on mount
  useEffect(() => {
    dispatch(fetchPantry(language as 'en' | 'ar'));
    dispatch(fetchCategories());
  }, [dispatch, language]);

  // Filter pantry items based on search and category
  useEffect(() => {
    let filtered = [...pantry];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(ingredient => {
        const name = ingredientService.getLocalizedName(ingredient, language as 'en' | 'ar').toLowerCase();
        const category = ingredientService.getCategoryDisplayName(ingredient.category, language as 'en' | 'ar').toLowerCase();
        return name.includes(query) || category.includes(query);
      });
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(ingredient => ingredient.category === selectedCategory);
    }

    // Sort by name
    filtered = ingredientService.sortByName(filtered, language as 'en' | 'ar') as PantryIngredient[];

    setFilteredPantry(filtered);
  }, [pantry, searchQuery, selectedCategory, language]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchPantry(language as 'en' | 'ar'));
    dispatch(fetchCategories());
  }, [dispatch, language]);

  // Handle toggle pantry item
  const handleTogglePantry = useCallback(async (ingredientId: string, isAdding: boolean) => {
    try {
      if (isAdding) {
        await dispatch(addToPantry(ingredientId)).unwrap();
      } else {
        await dispatch(removeFromPantry(ingredientId)).unwrap();
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('pantry.updateError')
      );
    }
  }, [dispatch, t]);

  // Handle ingredient press (navigate to detail)
  const handleIngredientPress = useCallback((ingredient: PantryIngredient) => {
    // Navigate to ingredient detail screen (to be implemented)
    console.log('Navigate to ingredient detail:', ingredient.id);
  }, []);

  // Handle add ingredients
  const handleAddIngredients = useCallback(() => {
    navigation.navigate('IngredientSearch');
  }, [navigation]);

  // Handle category filter
  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  }, [selectedCategory]);

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error.pantry) {
      const timer = setTimeout(() => {
        dispatch(clearError('pantry'));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error.pantry, dispatch]);

  // Render category filter
  const renderCategoryFilter = () => {
    if (categories.length === 0) return null;

    return (
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.category}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.category && styles.categoryChipActive,
              ]}
              onPress={() => handleCategoryPress(item.category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  textStyle,
                  selectedCategory === item.category && styles.categoryChipTextActive,
                ]}
              >
                {ingredientService.getCategoryDisplayName(item.category, language as 'en' | 'ar')} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>
    );
  };

  // Render loading state
  const renderLoadingState = () => {
    if (!loading.pantry) return null;
    
    return (
      <ListSkeleton
        itemCount={6}
        renderItem={() => <IngredientCardSkeleton />}
        style={styles.skeletonContainer}
      />
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading.pantry) return null;

    const isFiltered = searchQuery.trim() || selectedCategory;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isFiltered ? 'search-outline' : 'basket-outline'}
          size={64}
          color="#8E8E93"
        />
        <Text style={[styles.emptyTitle, textStyle]}>
          {isFiltered ? t('pantry.noResultsTitle') : t('pantry.emptyTitle')}
        </Text>
        <Text style={[styles.emptySubtitle, textStyle]}>
          {isFiltered ? t('pantry.noResultsSubtitle') : t('pantry.emptySubtitle')}
        </Text>
        {!isFiltered && (
          <Button
            title={t('pantry.addIngredients')}
            onPress={handleAddIngredients}
            style={styles.addButton}
          />
        )}
      </View>
    );
  };

  // Render pantry item
  const renderPantryItem = ({ item }: { item: PantryIngredient }) => (
    <IngredientCard
      ingredient={item}
      isInPantry={true}
      onTogglePantry={handleTogglePantry}
      onPress={() => handleIngredientPress(item)}
      showNutrition={true}
      loading={loading.removeFromPantry}
    />
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={[styles.title, textStyle]}>
          {t('pantry.title')}
        </Text>
        <View style={styles.headerActions}>
          <HelpButton helpType="pantry-management" />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddIngredients}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {pantry.length > 0 && (
        <Text style={[styles.subtitle, textStyle]}>
          {t('pantry.itemCount').replace('{count}', pantry.length.toString())}
        </Text>
      )}
    </View>
  );

  const containerStyle = transformStyleForRTL(styles.container);

  return (
    <ErrorBoundaryWrapper>
      <SafeAreaView style={containerStyle}>
        {renderHeader()}
      
      {pantry.length > 0 && (
        <View style={styles.searchContainer}>
          <Input
            placeholder={t('pantry.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon="search"
            containerStyle={styles.searchInput}
          />
        </View>
      )}

      {renderCategoryFilter()}

      {error.pantry && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, textStyle]}>
            {error.pantry}
          </Text>
        </View>
      )}

      {loading.pantry ? (
        renderLoadingState()
      ) : (
        <FlatList
          data={filteredPantry}
          renderItem={renderPantryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            filteredPantry.length === 0 && styles.listContainerEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={loading.pantry}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {loading.addToPantry && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      </SafeAreaView>
    </ErrorBoundaryWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    marginBottom: 0,
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
  listContainerEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});

export default PantryScreen;
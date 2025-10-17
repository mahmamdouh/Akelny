import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  fetchIngredients,
  searchIngredients,
  fetchCategories,
  addToPantry,
  removeFromPantry,
  clearSearchResults,
  updateFilters,
  clearError,
} from '../../store/ingredientSlice';
import { useLocalization } from '../../hooks/useLocalization';
import { getTextStyle, transformStyleForRTL, isRTL } from '../../utils/localization';
import { Ingredient, IngredientCategory } from '../../types/ingredient';
import IngredientCard from '../../components/specific/IngredientCard';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ingredientService from '../../services/ingredientService';

interface IngredientSearchScreenProps {
  navigation: any;
}

const IngredientSearchScreen: React.FC<IngredientSearchScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { t, language } = useLocalization();
  const textStyle = getTextStyle('regular');
  const isRTLLayout = isRTL();

  const {
    ingredients,
    searchResults,
    categories,
    pantry,
    loading,
    error,
    pagination,
    searchQuery,
  } = useSelector((state: RootState) => state.ingredients);

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    dispatch(fetchIngredients({ language: language as 'en' | 'ar', limit: 50 }));
    dispatch(fetchCategories());
  }, [dispatch, language]);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (localSearchQuery.trim()) {
      const timeout = setTimeout(() => {
        dispatch(searchIngredients({ 
          query: localSearchQuery.trim(), 
          language: language as 'en' | 'ar', 
          limit: 50 
        }));
      }, 500);
      setSearchTimeout(timeout);
    } else {
      dispatch(clearSearchResults());
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [localSearchQuery, language, dispatch]);

  // Get current ingredient list (search results or filtered ingredients)
  const currentIngredients = useMemo(() => {
    let ingredientList = searchQuery ? searchResults : ingredients;

    // Filter by category if selected
    if (selectedCategory) {
      ingredientList = ingredientList.filter(
        ingredient => ingredient.category === selectedCategory
      );
    }

    return ingredientService.sortByName(ingredientList, language as 'en' | 'ar');
  }, [searchQuery, searchResults, ingredients, selectedCategory, language]);

  // Create pantry lookup for performance
  const pantryLookup = useMemo(() => {
    return new Set(pantry.map(item => item.id));
  }, [pantry]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (searchQuery) {
      dispatch(searchIngredients({ 
        query: searchQuery, 
        language: language as 'en' | 'ar', 
        limit: 50 
      }));
    } else {
      dispatch(fetchIngredients({ language: language as 'en' | 'ar', limit: 50 }));
    }
    dispatch(fetchCategories());
  }, [dispatch, language, searchQuery]);

  // Handle toggle pantry item
  const handleTogglePantry = useCallback(async (ingredientId: string, isAdding: boolean) => {
    try {
      if (isAdding) {
        await dispatch(addToPantry(ingredientId)).unwrap();
        Alert.alert(
          t('common.success'),
          t('pantry.addedSuccess')
        );
      } else {
        await dispatch(removeFromPantry(ingredientId)).unwrap();
        Alert.alert(
          t('common.success'),
          t('pantry.removedSuccess')
        );
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('pantry.updateError')
      );
    }
  }, [dispatch, t]);

  // Handle ingredient press (navigate to detail)
  const handleIngredientPress = useCallback((ingredient: Ingredient) => {
    // Navigate to ingredient detail screen (to be implemented)
    console.log('Navigate to ingredient detail:', ingredient.id);
  }, []);

  // Handle category filter
  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  }, [selectedCategory]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore && !loading.ingredients && !searchQuery) {
      dispatch(fetchIngredients({
        language: language as 'en' | 'ar',
        limit: 50,
        offset: pagination.offset + pagination.limit,
      }));
    }
  }, [dispatch, language, pagination, loading.ingredients, searchQuery]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    dispatch(clearSearchResults());
  }, [dispatch]);

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error.ingredients || error.search) {
      const timer = setTimeout(() => {
        dispatch(clearError('ingredients'));
        dispatch(clearError('search'));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error.ingredients, error.search, dispatch]);

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

  // Render empty state
  const renderEmptyState = () => {
    if (loading.ingredients || loading.search) return null;

    const isSearching = localSearchQuery.trim() || searchQuery;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isSearching ? 'search-outline' : 'leaf-outline'}
          size={64}
          color="#8E8E93"
        />
        <Text style={[styles.emptyTitle, textStyle]}>
          {isSearching ? t('pantry.noSearchResults') : t('pantry.noIngredientsTitle')}
        </Text>
        <Text style={[styles.emptySubtitle, textStyle]}>
          {isSearching 
            ? t('pantry.noSearchResultsSubtitle') 
            : t('pantry.noIngredientsSubtitle')
          }
        </Text>
        {isSearching && (
          <Button
            title={t('pantry.clearSearch')}
            onPress={handleClearSearch}
            variant="outline"
            style={styles.clearButton}
          />
        )}
      </View>
    );
  };

  // Render ingredient item
  const renderIngredientItem = ({ item }: { item: Ingredient }) => (
    <IngredientCard
      ingredient={item}
      isInPantry={pantryLookup.has(item.id)}
      onTogglePantry={handleTogglePantry}
      onPress={() => handleIngredientPress(item)}
      showNutrition={true}
      loading={loading.addToPantry || loading.removeFromPantry}
    />
  );

  // Render load more footer
  const renderFooter = () => {
    if (!pagination.hasMore || searchQuery) return null;

    return (
      <View style={styles.footerContainer}>
        {loading.ingredients ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Button
            title={t('common.loadMore')}
            onPress={handleLoadMore}
            variant="outline"
            size="small"
          />
        )}
      </View>
    );
  };

  const containerStyle = transformStyleForRTL(styles.container);

  return (
    <SafeAreaView style={containerStyle}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name={isRTLLayout ? 'chevron-forward' : 'chevron-back'} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
        <Text style={[styles.title, textStyle]}>
          {t('pantry.addIngredients')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder={t('pantry.searchIngredients')}
          value={localSearchQuery}
          onChangeText={setLocalSearchQuery}
          leftIcon="search"
          rightIcon={localSearchQuery ? 'close' : undefined}
          onRightIconPress={localSearchQuery ? handleClearSearch : undefined}
          containerStyle={styles.searchInput}
        />
      </View>

      {renderCategoryFilter()}

      {(error.ingredients || error.search) && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, textStyle]}>
            {error.ingredients || error.search}
          </Text>
        </View>
      )}

      <FlatList
        data={currentIngredients}
        renderItem={renderIngredientItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          currentIngredients.length === 0 && styles.listContainerEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={loading.ingredients || loading.search}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
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
  clearButton: {
    marginTop: 16,
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default IngredientSearchScreen;
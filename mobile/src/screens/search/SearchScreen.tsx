import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { useLocalization } from '../../hooks/useLocalization';
import {
  searchIngredients,
  searchMeals,
  loadMoreIngredients,
  loadMoreMeals,
  clearIngredientResults,
  clearMealResults,
  setCurrentQuery,
  addToRecentSearches,
  clearAllSearchResults
} from '../../store/searchSlice';
import IngredientCard from '../../components/specific/IngredientCard';
import MealSuggestionCard from '../../components/specific/MealSuggestionCard';

type SearchTab = 'ingredients' | 'meals';

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { t, language, isRTL } = useLocalization();
  
  const {
    ingredientResults,
    ingredientPagination,
    ingredientLoading,
    ingredientError,
    mealResults,
    mealPagination,
    mealLoading,
    mealError,
    currentQuery,
    recentSearches
  } = useSelector((state: RootState) => state.search);

  const [activeTab, setActiveTab] = useState<SearchTab>('ingredients');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecentSearches, setShowRecentSearches] = useState(true);

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    dispatch(setCurrentQuery(trimmedQuery));
    dispatch(addToRecentSearches(trimmedQuery));
    setShowRecentSearches(false);

    if (activeTab === 'ingredients') {
      dispatch(clearIngredientResults());
      dispatch(searchIngredients({
        query: trimmedQuery,
        language: language as 'en' | 'ar',
        limit: 20,
        offset: 0
      }));
    } else {
      dispatch(clearMealResults());
      dispatch(searchMeals({
        query: trimmedQuery,
        language: language as 'en' | 'ar',
        is_public: true,
        limit: 20,
        offset: 0
      }));
    }
  }, [dispatch, language, activeTab]);

  const handleLoadMore = useCallback(() => {
    if (activeTab === 'ingredients' && ingredientPagination?.hasMore && !ingredientLoading) {
      dispatch(loadMoreIngredients({
        query: currentQuery,
        language: language as 'en' | 'ar',
        limit: 20,
        offset: ingredientPagination.offset + ingredientPagination.limit
      }));
    } else if (activeTab === 'meals' && mealPagination?.hasMore && !mealLoading) {
      dispatch(loadMoreMeals({
        query: currentQuery,
        language: language as 'en' | 'ar',
        is_public: true,
        limit: 20,
        offset: mealPagination.offset + mealPagination.limit
      }));
    }
  }, [dispatch, activeTab, currentQuery, language, ingredientPagination, mealPagination, ingredientLoading, mealLoading]);

  const handleTabChange = useCallback((tab: SearchTab) => {
    setActiveTab(tab);
    if (currentQuery) {
      handleSearch(currentQuery);
    }
  }, [currentQuery, handleSearch]);

  const handleRecentSearchPress = useCallback((query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  }, [handleSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    dispatch(setCurrentQuery(''));
    dispatch(clearAllSearchResults());
    setShowRecentSearches(true);
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    if (currentQuery) {
      handleSearch(currentQuery);
    }
  }, [currentQuery, handleSearch]);

  const renderIngredientItem = ({ item }: { item: any }) => (
    <IngredientCard
      ingredient={item}
      isInPantry={false} // We don't track pantry status in search results
      onTogglePantry={(ingredientId: string, isAdding: boolean) => {
        // Add to pantry logic here
        console.log('Toggle pantry:', ingredientId, isAdding);
      }}
      onPress={() => {
        // Navigate to ingredient detail
        console.log('View ingredient details:', item.id);
      }}
    />
  );

  const renderMealItem = ({ item }: { item: any }) => (
    <MealSuggestionCard
      meal={item}
      onPress={() => {
        (navigation as any).navigate('MealDetail', { mealId: item.id });
      }}
    />
  );

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.recentSearchItem, isRTL && styles.recentSearchItemRTL]}
      onPress={() => handleRecentSearchPress(item)}
    >
      <Ionicons name="time-outline" size={16} color="#666" />
      <Text style={[styles.recentSearchText, isRTL && styles.recentSearchTextRTL]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (showRecentSearches && recentSearches.length > 0) {
      return (
        <View style={styles.recentSearchesContainer}>
          <Text style={[styles.recentSearchesTitle, isRTL && styles.textRTL]}>
            {t('search.recentSearches')}
          </Text>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearchItem}
            keyExtractor={(item, index) => `recent-${index}`}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    }

    if (!currentQuery) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>
            {t('search.enterQuery')}
          </Text>
        </View>
      );
    }

    if (activeTab === 'ingredients' && ingredientResults.length === 0 && !ingredientLoading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={64} color="#ccc" />
          <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>
            {t('search.noIngredientsFound')}
          </Text>
        </View>
      );
    }

    if (activeTab === 'meals' && mealResults.length === 0 && !mealLoading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color="#ccc" />
          <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>
            {t('search.noMealsFound')}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderLoadingFooter = () => {
    if ((activeTab === 'ingredients' && ingredientLoading) || (activeTab === 'meals' && mealLoading)) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      );
    }
    return null;
  };

  const currentResults = activeTab === 'ingredients' ? ingredientResults : mealResults;
  const currentPagination = activeTab === 'ingredients' ? ingredientPagination : mealPagination;
  const currentLoading = activeTab === 'ingredients' ? ingredientLoading : mealLoading;
  const currentError = activeTab === 'ingredients' ? ingredientError : mealError;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name={isRTL ? "chevron-forward" : "chevron-back"} 
            size={24} 
            color="#333" 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
          {t('search.title')}
        </Text>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, isRTL && styles.searchContainerRTL]}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isRTL && styles.searchInputRTL]}
          placeholder={t('search.placeholder')}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearSearch}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, isRTL && styles.tabContainerRTL]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'ingredients' && styles.activeTab,
            isRTL && styles.tabRTL
          ]}
          onPress={() => handleTabChange('ingredients')}
        >
          <Ionicons 
            name="leaf" 
            size={20} 
            color={activeTab === 'ingredients' ? '#4CAF50' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'ingredients' && styles.activeTabText,
            isRTL && styles.textRTL
          ]}>
            {t('search.ingredients')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'meals' && styles.activeTab,
            isRTL && styles.tabRTL
          ]}
          onPress={() => handleTabChange('meals')}
        >
          <Ionicons 
            name="restaurant" 
            size={20} 
            color={activeTab === 'meals' ? '#4CAF50' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'meals' && styles.activeTabText,
            isRTL && styles.textRTL
          ]}>
            {t('search.meals')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {currentError && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isRTL && styles.textRTL]}>
            {currentError}
          </Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={currentResults}
        renderItem={activeTab === 'ingredients' ? renderIngredientItem : renderMealItem}
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
        refreshControl={
          <RefreshControl
            refreshing={currentLoading && currentResults.length === 0}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerRTL: {
    flexDirection: 'row-reverse'
  },
  backButton: {
    padding: 8,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  searchContainerRTL: {
    flexDirection: 'row-reverse'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4
  },
  searchInputRTL: {
    textAlign: 'right',
    marginRight: 8,
    marginLeft: 0
  },
  clearButton: {
    padding: 4
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4
  },
  tabContainerRTL: {
    flexDirection: 'row-reverse'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  tabRTL: {
    flexDirection: 'row-reverse'
  },
  activeTab: {
    backgroundColor: '#e8f5e8'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6
  },
  activeTabText: {
    color: '#4CAF50'
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center'
  },
  recentSearchesContainer: {
    paddingVertical: 20
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginVertical: 2,
    borderRadius: 8
  },
  recentSearchItemRTL: {
    flexDirection: 'row-reverse'
  },
  recentSearchText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1
  },
  recentSearchTextRTL: {
    marginLeft: 0,
    marginRight: 12,
    textAlign: 'right'
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336'
  },
  errorText: {
    color: '#c62828',
    fontSize: 14
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  textRTL: {
    textAlign: 'right'
  }
});
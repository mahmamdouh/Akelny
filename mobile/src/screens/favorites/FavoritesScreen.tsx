import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store';
import { 
  fetchFavorites, 
  removeFavorite, 
  clearError,
  setFilters,
  setCurrentPage
} from '../../store/favoritesSlice';
import { UserFavorite, FavoritesFilters } from '../../../../shared/src/types/favorites';
import { useLocalization } from '../../hooks/useLocalization';
import Button from '../../components/common/Button';
import Picker from '../../components/common/Picker';

const FavoritesScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { t, isRTL } = useLocalization();
  
  const { 
    favorites, 
    loading, 
    error, 
    totalCount, 
    currentPage, 
    pageSize, 
    filters 
  } = useSelector((state: RootState) => state.favorites);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, [filters, currentPage]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('error'), error);
      dispatch(clearError());
    }
  }, [error]);

  const loadFavorites = () => {
    const offset = (currentPage - 1) * pageSize;
    dispatch(fetchFavorites({
      ...filters,
      limit: pageSize,
      offset
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    dispatch(setCurrentPage(1));
    await loadFavorites();
    setRefreshing(false);
  };

  const handleSearch = () => {
    dispatch(setFilters({
      ...filters,
      search: searchText.trim() || undefined
    }));
    dispatch(setCurrentPage(1));
  };

  const handleRemoveFavorite = (favorite: UserFavorite) => {
    Alert.alert(
      t('favorites.confirmRemove'),
      t('favorites.confirmRemoveMessage').replace('{meal}', favorite.meal?.title_en || 'Unknown meal'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => dispatch(removeFavorite(favorite.meal_id))
        }
      ]
    );
  };

  const navigateToMealDetail = (mealId: string) => {
    (navigation as any).navigate('MealDetail', { mealId });
  };

  const handleFilterChange = (key: keyof FavoritesFilters, value: any) => {
    dispatch(setFilters({
      ...filters,
      [key]: value
    }));
    dispatch(setCurrentPage(1));
  };

  const clearFilters = () => {
    dispatch(setFilters({}));
    dispatch(setCurrentPage(1));
    setSearchText('');
  };

  const loadMore = () => {
    if (favorites.length < totalCount && !loading) {
      dispatch(setCurrentPage(currentPage + 1));
    }
  };

  const renderFavoriteItem = ({ item: favorite }: { item: UserFavorite }) => (
    <View style={[styles.favoriteCard, isRTL && styles.favoriteCardRTL]}>
      <TouchableOpacity
        style={styles.favoriteContent}
        onPress={() => navigateToMealDetail(favorite.meal_id)}
      >
        <View style={styles.favoriteHeader}>
          <Text style={[styles.mealTitle, isRTL && styles.textRTL]}>
            {isRTL ? favorite.meal?.title_ar || favorite.meal?.title_en : favorite.meal?.title_en}
          </Text>
          <View style={styles.mealTypeTag}>
            <Text style={styles.mealTypeText}>
              {t(`mealTypes.${favorite.meal?.meal_type}`)}
            </Text>
          </View>
        </View>
        
        {favorite.meal?.description_en && (
          <Text style={[styles.mealDescription, isRTL && styles.textRTL]} numberOfLines={2}>
            {isRTL ? favorite.meal?.description_ar || favorite.meal?.description_en : favorite.meal?.description_en}
          </Text>
        )}
        
        <View style={styles.favoriteFooter}>
          <Text style={styles.addedDate}>
            {t('favorites.addedOn')}: {new Date(favorite.added_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
          </Text>
          
          {favorite.meal?.prep_time_min && (
            <Text style={styles.prepTime}>
              {t('meal.prepTime')}: {favorite.meal.prep_time_min} {t('common.minutes')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(favorite)}
      >
        <Ionicons name="heart" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, isRTL && styles.searchContainerRTL]}>
        <TextInput
          style={[styles.searchInput, isRTL && styles.searchInputRTL]}
          placeholder={t('favorites.searchPlaceholder')}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="filter" size={20} color="#007AFF" />
        <Text style={styles.filterToggleText}>{t('common.filters')}</Text>
      </TouchableOpacity>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Picker
            label={t('meal.mealType')}
            value={filters.meal_type || ''}
            onValueChange={(value) => handleFilterChange('meal_type', value || undefined)}
            options={[
              { label: t('common.all'), value: '' },
              { label: t('mealTypes.breakfast'), value: 'breakfast' },
              { label: t('mealTypes.lunch'), value: 'lunch' },
              { label: t('mealTypes.dinner'), value: 'dinner' }
            ]}
          />
          
          <Button
            title={t('common.clearFilters')}
            onPress={clearFilters}
            variant="outline"
            style={styles.clearFiltersButton}
          />
        </View>
      )}

      {/* Results Count */}
      <Text style={[styles.resultsCount, isRTL && styles.textRTL]}>
        {t('favorites.resultsCount').replace('{count}', totalCount.toString())}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || favorites.length === 0) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => `${item.user_id}-${item.meal_id}`}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#C7C7CC" />
            <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
              {t('favorites.noFavorites')}
            </Text>
            <Text style={[styles.emptySubtext, isRTL && styles.textRTL]}>
              {t('favorites.noFavoritesSubtext')}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16
  },
  searchContainerRTL: {
    flexDirection: 'row-reverse'
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000000'
  },
  searchInputRTL: {
    textAlign: 'right'
  },
  searchButton: {
    padding: 8
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  filterToggleText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8
  },
  filtersContainer: {
    marginBottom: 16
  },
  clearFiltersButton: {
    marginTop: 12
  },
  resultsCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500'
  },
  listContainer: {
    paddingBottom: 16
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  favoriteCardRTL: {
    flexDirection: 'row-reverse'
  },
  favoriteContent: {
    flex: 1,
    padding: 16
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 12
  },
  mealTypeTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF'
  },
  mealDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 20
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  addedDate: {
    fontSize: 12,
    color: '#8E8E93'
  },
  prepTime: {
    fontSize: 12,
    color: '#8E8E93'
  },
  removeButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 20
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl'
  }
});

export default FavoritesScreen;
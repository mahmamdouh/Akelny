import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { useLocalization } from '../../hooks/useLocalization';
import {
  browseMealsByKitchen,
  loadMoreKitchenMeals,
  clearKitchenMeals
} from '../../store/searchSlice';
import MealSuggestionCard from '../../components/specific/MealSuggestionCard';

type MealTypeFilter = 'all' | 'breakfast' | 'lunch' | 'dinner';

interface RouteParams {
  kitchenId: string;
  kitchenName: string;
}

export const KitchenMealsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const { t, language, isRTL } = useLocalization();
  
  const { kitchenId, kitchenName } = route.params as RouteParams;
  
  const {
    kitchenMeals,
    kitchenMealsPagination,
    kitchenMealsLoading,
    kitchenMealsError,
    selectedKitchen
  } = useSelector((state: RootState) => state.search);

  const [mealTypeFilter, setMealTypeFilter] = useState<MealTypeFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMeals();
    return () => {
      dispatch(clearKitchenMeals());
    };
  }, [kitchenId, mealTypeFilter]);

  const loadMeals = useCallback(() => {
    dispatch(browseMealsByKitchen({
      kitchen_id: kitchenId,
      meal_type: mealTypeFilter === 'all' ? undefined : mealTypeFilter as 'breakfast' | 'lunch' | 'dinner',
      limit: 20,
      offset: 0
    }));
  }, [dispatch, kitchenId, mealTypeFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(browseMealsByKitchen({
      kitchen_id: kitchenId,
      meal_type: mealTypeFilter === 'all' ? undefined : mealTypeFilter as 'breakfast' | 'lunch' | 'dinner',
      limit: 20,
      offset: 0
    }));
    setRefreshing(false);
  }, [dispatch, kitchenId, mealTypeFilter]);

  const handleLoadMore = useCallback(() => {
    if (kitchenMealsPagination?.hasMore && !kitchenMealsLoading) {
      dispatch(loadMoreKitchenMeals({
        kitchen_id: kitchenId,
        meal_type: mealTypeFilter === 'all' ? undefined : mealTypeFilter as 'breakfast' | 'lunch' | 'dinner',
        limit: 20,
        offset: kitchenMealsPagination.offset + kitchenMealsPagination.limit
      }));
    }
  }, [dispatch, kitchenId, mealTypeFilter, kitchenMealsPagination, kitchenMealsLoading]);

  const handleMealTypeFilterChange = useCallback((filter: MealTypeFilter) => {
    if (filter !== mealTypeFilter) {
      setMealTypeFilter(filter);
      dispatch(clearKitchenMeals());
    }
  }, [dispatch, mealTypeFilter]);

  const renderMealItem = ({ item }: { item: any }) => (
    <MealSuggestionCard
      meal={item}
      onPress={() => {
        (navigation as any).navigate('MealDetail', { mealId: item.id });
      }}
    />
  );

  const renderFilterButton = (filter: MealTypeFilter, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        mealTypeFilter === filter && styles.activeFilterButton,
        isRTL && styles.filterButtonRTL
      ]}
      onPress={() => handleMealTypeFilterChange(filter)}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={mealTypeFilter === filter ? '#4CAF50' : '#666'} 
      />
      <Text style={[
        styles.filterButtonText,
        mealTypeFilter === filter && styles.activeFilterButtonText,
        isRTL && styles.textRTL
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color="#ccc" />
      <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>
        {mealTypeFilter === 'all' 
          ? t('kitchen.noMealsInKitchen')
          : `No ${mealTypeFilter} meals found`
        }
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#f44336" />
      <Text style={[styles.errorText, isRTL && styles.textRTL]}>
        {kitchenMealsError || t('common.errorOccurred')}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={loadMeals}
      >
        <Text style={styles.retryButtonText}>
          {t('common.retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingFooter = () => {
    if (kitchenMealsLoading && kitchenMeals.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      );
    }
    return null;
  };

  const displayKitchenName = selectedKitchen 
    ? (language === 'ar' && selectedKitchen.name_ar ? selectedKitchen.name_ar : selectedKitchen.name_en)
    : kitchenName;

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
        <View style={[styles.headerTitleContainer, isRTL && styles.headerTitleContainerRTL]}>
          <Text style={[styles.headerTitle, isRTL && styles.textRTL]} numberOfLines={1}>
            {displayKitchenName}
          </Text>
          {kitchenMealsPagination && (
            <Text style={[styles.headerSubtitle, isRTL && styles.textRTL]}>
              {`${kitchenMealsPagination.total} meals`}
            </Text>
          )}
        </View>
      </View>

      {/* Meal Type Filters */}
      <View style={[styles.filtersContainer, isRTL && styles.filtersContainerRTL]}>
        {renderFilterButton('all', t('mealType.all'), 'restaurant')}
        {renderFilterButton('breakfast', t('mealType.breakfast'), 'sunny')}
        {renderFilterButton('lunch', t('mealType.lunch'), 'partly-sunny')}
        {renderFilterButton('dinner', t('mealType.dinner'), 'moon')}
      </View>

      {/* Content */}
      {kitchenMealsError ? (
        renderError()
      ) : (
        <FlatList
          data={kitchenMeals}
          renderItem={renderMealItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={kitchenMealsLoading && kitchenMeals.length === 0 ? null : renderEmptyState}
          ListFooterComponent={renderLoadingFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
        />
      )}

      {/* Loading State */}
      {kitchenMealsLoading && kitchenMeals.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
            {t('kitchen.loadingMeals')}
          </Text>
        </View>
      )}
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
  headerTitleContainer: {
    flex: 1
  },
  headerTitleContainerRTL: {
    alignItems: 'flex-end'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  filtersContainerRTL: {
    flexDirection: 'row-reverse'
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0'
  },
  filterButtonRTL: {
    flexDirection: 'row-reverse',
    marginRight: 0,
    marginLeft: 8
  },
  activeFilterButton: {
    backgroundColor: '#e8f5e8'
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4
  },
  activeFilterButtonText: {
    color: '#4CAF50'
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)'
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  textRTL: {
    textAlign: 'right'
  }
});
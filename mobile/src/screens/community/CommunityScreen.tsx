import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store';
import { 
  fetchCommunityMeals, 
  setFilters, 
  clearError,
  resetCommunityState,
  reportMeal
} from '../../store/communitySlice';
import { useLocalization } from '../../hooks/useLocalization';
import { MealSuggestionCard } from '../../components/specific/MealSuggestionCard';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Picker } from '../../components/common/Picker';
import { Meal } from '../../../../shared/src/types/meal';

export const CommunityScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { t, isRTL } = useLocalization();
  
  const {
    meals,
    loading,
    error,
    filters,
    hasMore,
    reportingMealId
  } = useSelector((state: RootState) => state.community);

  const [searchText, setSearchText] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchCommunityMeals({ filters, refresh: true }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('error'), error);
      dispatch(clearError());
    }
  }, [error, t, dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(resetCommunityState());
    dispatch(fetchCommunityMeals({ filters, refresh: true }));
  }, [dispatch, filters]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchCommunityMeals({ filters }));
    }
  }, [dispatch, loading, hasMore, filters]);

  const handleSearch = useCallback(() => {
    dispatch(setFilters({ search: searchText, offset: 0 }));
    dispatch(resetCommunityState());
    dispatch(fetchCommunityMeals({ 
      filters: { ...filters, search: searchText, offset: 0 }, 
      refresh: true 
    }));
  }, [dispatch, searchText, filters]);

  const handleMealTypeFilter = useCallback((mealType: 'breakfast' | 'lunch' | 'dinner' | undefined) => {
    dispatch(setFilters({ meal_type: mealType, offset: 0 }));
    dispatch(resetCommunityState());
    dispatch(fetchCommunityMeals({ 
      filters: { ...filters, meal_type: mealType, offset: 0 }, 
      refresh: true 
    }));
  }, [dispatch, filters]);

  const handleMealPress = useCallback((meal: Meal) => {
    navigation.navigate('MealDetail', { mealId: meal.id });
  }, [navigation]);

  const handleReportMeal = useCallback((meal: Meal) => {
    Alert.alert(
      t('community.reportMeal'),
      t('community.reportMealConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('community.reportInappropriate'),
          onPress: () => dispatch(reportMeal({
            meal_id: meal.id,
            reason: 'inappropriate_content',
            description: 'Reported from community screen'
          }))
        },
        {
          text: t('community.reportSpam'),
          onPress: () => dispatch(reportMeal({
            meal_id: meal.id,
            reason: 'spam',
            description: 'Reported from community screen'
          }))
        }
      ]
    );
  }, [dispatch, t]);

  const renderMealItem = ({ item }: { item: Meal & { report_count?: number; is_reported_by_user?: boolean } }) => (
    <View style={styles.mealItemContainer}>
      <MealSuggestionCard
        meal={item}
        onPress={() => handleMealPress(item)}
        showCreator={true}
      />
      <View style={styles.mealActions}>
        {item.creator && (
          <Text style={styles.creatorText}>
            {t('community.by')} {item.creator.name}
          </Text>
        )}
        <View style={styles.actionButtons}>
          {!item.is_reported_by_user && (
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => handleReportMeal(item)}
              disabled={reportingMealId === item.id}
            >
              {reportingMealId === item.id ? (
                <ActivityIndicator size="small" color="#ff6b6b" />
              ) : (
                <>
                  <Ionicons name="flag-outline" size={16} color="#ff6b6b" />
                  <Text style={styles.reportButtonText}>{t('community.report')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {item.is_reported_by_user && (
            <View style={styles.reportedIndicator}>
              <Ionicons name="flag" size={16} color="#666" />
              <Text style={styles.reportedText}>{t('community.reported')}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{t('community.title')}</Text>
      <Text style={styles.subtitle}>{t('community.subtitle')}</Text>
      
      <View style={styles.searchContainer}>
        <Input
          value={searchText}
          onChangeText={setSearchText}
          placeholder={t('community.searchPlaceholder')}
          style={styles.searchInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Button
          title={t('common.search')}
          onPress={handleSearch}
          style={styles.searchButton}
          size="small"
        />
      </View>

      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="filter-outline" size={20} color="#007AFF" />
        <Text style={styles.filterToggleText}>{t('common.filters')}</Text>
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Picker
            selectedValue={filters.meal_type || ''}
            onValueChange={(value) => handleMealTypeFilter(value || undefined)}
            items={[
              { label: t('common.all'), value: '' },
              { label: t('meals.breakfast'), value: 'breakfast' },
              { label: t('meals.lunch'), value: 'lunch' },
              { label: t('meals.dinner'), value: 'dinner' }
            ]}
            placeholder={t('meals.selectMealType')}
            style={styles.picker}
          />
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>{t('community.noMeals')}</Text>
        <Text style={styles.emptySubtitle}>{t('community.noMealsSubtitle')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={meals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={loading && meals.length === 0}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  listContent: {
    flexGrow: 1
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    marginRight: 8
  },
  searchButton: {
    paddingHorizontal: 16
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start'
  },
  filterToggleText: {
    marginLeft: 4,
    color: '#007AFF',
    fontSize: 16
  },
  filtersContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  picker: {
    marginBottom: 8
  },
  mealItemContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  mealActions: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef'
  },
  creatorText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ff6b6b'
  },
  reportButtonText: {
    marginLeft: 4,
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500'
  },
  reportedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  reportedText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14
  },
  footer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center'
  }
});

export default CommunityScreen;
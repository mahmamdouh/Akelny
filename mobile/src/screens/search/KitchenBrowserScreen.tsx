import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { useLocalization } from '../../hooks/useLocalization';
import {
  fetchKitchensForBrowsing,
  browseMealsByKitchen,
  clearKitchenMeals
} from '../../store/searchSlice';
// import { KitchenBrowseResult } from '../../../shared/src/types/search';

interface KitchenBrowseResult {
  id: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon_url?: string;
  meal_count: number;
}

export const KitchenBrowserScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { t, language, isRTL } = useLocalization();
  
  const {
    kitchens,
    kitchensLoading,
    kitchensError
  } = useSelector((state: RootState) => state.search);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchKitchensForBrowsing());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchKitchensForBrowsing());
    setRefreshing(false);
  }, [dispatch]);

  const handleKitchenPress = useCallback((kitchen: KitchenBrowseResult) => {
    dispatch(clearKitchenMeals());
    (navigation as any).navigate('KitchenMeals', { 
      kitchenId: kitchen.id,
      kitchenName: language === 'ar' && kitchen.name_ar ? kitchen.name_ar : kitchen.name_en
    });
  }, [dispatch, navigation, language]);

  const renderKitchenItem = ({ item }: { item: KitchenBrowseResult }) => {
    const kitchenName = language === 'ar' && item.name_ar ? item.name_ar : item.name_en;
    const kitchenDescription = language === 'ar' && item.description_ar ? item.description_ar : item.description_en;

    return (
      <TouchableOpacity
        style={[styles.kitchenCard, isRTL && styles.kitchenCardRTL]}
        onPress={() => handleKitchenPress(item)}
        activeOpacity={0.7}
      >
        {item.icon_url ? (
          <Image source={{ uri: item.icon_url }} style={styles.kitchenIcon} />
        ) : (
          <View style={[styles.kitchenIcon, styles.kitchenIconPlaceholder]}>
            <Ionicons name="restaurant" size={24} color="#666" />
          </View>
        )}
        
        <View style={[styles.kitchenInfo, isRTL && styles.kitchenInfoRTL]}>
          <Text style={[styles.kitchenName, isRTL && styles.textRTL]}>
            {kitchenName}
          </Text>
          {kitchenDescription && (
            <Text style={[styles.kitchenDescription, isRTL && styles.textRTL]} numberOfLines={2}>
              {kitchenDescription}
            </Text>
          )}
          <View style={[styles.mealCountContainer, isRTL && styles.mealCountContainerRTL]}>
            <Ionicons name="restaurant-outline" size={14} color="#666" />
            <Text style={[styles.mealCount, isRTL && styles.mealCountRTL]}>
              {`${item.meal_count} meals`}
            </Text>
          </View>
        </View>

        <Ionicons 
          name={isRTL ? "chevron-back" : "chevron-forward"} 
          size={20} 
          color="#666" 
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color="#ccc" />
      <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>
        {t('kitchen.noKitchensAvailable')}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#f44336" />
      <Text style={[styles.errorText, isRTL && styles.textRTL]}>
        {kitchensError || t('common.errorOccurred')}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => dispatch(fetchKitchensForBrowsing())}
      >
        <Text style={styles.retryButtonText}>
          {t('common.retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (kitchensLoading && kitchens.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
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
            {t('kitchen.browseKitchens')}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
            {t('kitchen.loadingKitchens')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {t('kitchen.browseKitchens')}
        </Text>
      </View>

      {/* Content */}
      {kitchensError ? (
        renderError()
      ) : (
        <FlatList
          data={kitchens}
          renderItem={renderKitchenItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
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
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  kitchenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  kitchenCardRTL: {
    flexDirection: 'row-reverse'
  },
  kitchenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16
  },
  kitchenIconPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kitchenInfo: {
    flex: 1
  },
  kitchenInfoRTL: {
    alignItems: 'flex-end'
  },
  kitchenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  kitchenDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20
  },
  mealCountContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  mealCountContainerRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end'
  },
  mealCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  mealCountRTL: {
    marginLeft: 0,
    marginRight: 4
  },
  chevron: {
    marginLeft: 8
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
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
  textRTL: {
    textAlign: 'right'
  }
});
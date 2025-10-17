import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logoutUser } from '../../store/authSlice';
import { 
  fetchSuggestions, 
  fetchRandomSuggestions, 
  clearError,
  toggleMealFavorite 
} from '../../store/suggestionSlice';
import Button from '../../components/common/Button';
import { AnimatedButton } from '../../components/common/AnimatedButton';
import MealSuggestionCard from '../../components/specific/MealSuggestionCard';
import { HelpButton } from '../../components/common/HelpButton';
import { LoadingState } from '../../components/common/LoadingState';
import { MealCardSkeleton } from '../../components/common/SkeletonLoader';
import { ErrorBoundaryWrapper } from '../../components/common/ErrorBoundary';
import { PageTransition, StaggeredList } from '../../components/common/PageTransition';
import { BounceAnimation, ShakeAnimation } from '../../components/common/MicroInteractions';
import { AnimatedRefreshControl } from '../../components/common/AnimatedRefreshControl';
import { MealSuggestion } from '../../types/suggestion';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const { 
    suggestions, 
    randomMeals, 
    isLoading, 
    isLoadingRandom, 
    error, 
    currentFilters,
    metadata 
  } = useAppSelector((state) => state.suggestions);

  const [activeTab, setActiveTab] = useState<'suggestions' | 'random'>('suggestions');
  const [refreshing, setRefreshing] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Load initial suggestions when component mounts
    if (user) {
      handleGetSuggestions();
    }
  }, [user]);

  const handleGetSuggestions = async () => {
    if (!user) return;
    
    try {
      await dispatch(fetchSuggestions({
        ...currentFilters,
        limit: 10,
      })).unwrap();
      setShowError(false);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setShowError(true);
    }
  };

  const handleGetRandomSuggestions = async () => {
    if (!user) return;
    
    try {
      await dispatch(fetchRandomSuggestions({
        ...currentFilters,
        count: 3,
      })).unwrap();
      setShowError(false);
    } catch (error) {
      console.error('Failed to fetch random suggestions:', error);
      setShowError(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'suggestions') {
      await handleGetSuggestions();
    } else {
      await handleGetRandomSuggestions();
    }
    setRefreshing(false);
  };

  const handleMealPress = (meal: MealSuggestion) => {
    // Navigate to meal detail screen (to be implemented)
    Alert.alert(
      t('home.suggestions.viewDetails'),
      `${meal.title_en}\n${t('home.suggestions.availabilityScore', { score: meal.availability_score })}`
    );
  };

  const handleToggleFavorite = (mealId: string) => {
    dispatch(toggleMealFavorite(mealId));
    // TODO: Call API to update favorite status
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const renderMealCard = ({ item, index }: { item: MealSuggestion; index: number }) => (
    <PageTransition
      type="slide"
      direction="up"
      delay={index * 100}
      duration={300}
    >
      <BounceAnimation onPress={() => handleMealPress(item)}>
        <MealSuggestionCard
          meal={item}
          onPress={handleMealPress}
          onToggleFavorite={handleToggleFavorite}
          language={user?.language as 'en' | 'ar'}
        />
      </BounceAnimation>
    </PageTransition>
  );

  const renderEmptyState = () => (
    <PageTransition type="fade" duration={400}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          {t('home.suggestions.noSuggestions')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {t('home.suggestions.noSuggestionsSubtitle')}
        </Text>
        <BounceAnimation>
          <Button
            title={t('home.suggestions.tryAgain')}
            onPress={activeTab === 'suggestions' ? handleGetSuggestions : handleGetRandomSuggestions}
            style={styles.retryButton}
          />
        </BounceAnimation>
      </View>
    </PageTransition>
  );

  const renderErrorState = () => (
    <ShakeAnimation trigger={showError} onComplete={() => setShowError(false)}>
      <PageTransition type="fade" duration={400}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('common.error')}</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <BounceAnimation>
            <Button
              title={t('common.retry')}
              onPress={() => {
                dispatch(clearError());
                setShowError(false);
                activeTab === 'suggestions' ? handleGetSuggestions() : handleGetRandomSuggestions();
              }}
              style={styles.retryButton}
            />
          </BounceAnimation>
        </View>
      </PageTransition>
    </ShakeAnimation>
  );

  return (
    <ErrorBoundaryWrapper>
      <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <AnimatedRefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            title={t('common.pullToRefresh')}
          />
        }
      >
        {/* Header */}
        <PageTransition type="slide" direction="down" duration={400}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{t('home.title')}</Text>
              <HelpButton helpType="meal-suggestions" />
            </View>
            <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
            
            {user && (
              <PageTransition type="scale" delay={200}>
                <View style={styles.userInfo}>
                  <Text style={styles.welcomeText}>
                    {t('common.welcome')}, {user.name}!
                  </Text>
                </View>
              </PageTransition>
            )}
          </View>
        </PageTransition>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <AnimatedButton
            title={t('home.suggestions.getSuggestions')}
            onPress={() => {
              setActiveTab('suggestions');
              if (suggestions.length === 0) {
                handleGetSuggestions();
              }
            }}
            variant={activeTab === 'suggestions' ? 'primary' : 'outline'}
            style={styles.tabButton}
            animationType="scale"
          />
          <AnimatedButton
            title={t('home.suggestions.randomPicker')}
            onPress={() => {
              setActiveTab('random');
              handleGetRandomSuggestions();
            }}
            variant={activeTab === 'random' ? 'primary' : 'outline'}
            style={styles.tabButton}
            animationType="scale"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {error ? (
            renderErrorState()
          ) : (
            <>
              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && (
                <View style={styles.tabContent}>
                  {isLoading ? (
                    <PageTransition type="fade">
                      <View style={styles.loadingContainer}>
                        <LoadingState 
                          message={t('home.suggestions.loading')} 
                          type="wave" 
                        />
                        <View style={styles.skeletonContainer}>
                          {[...Array(3)].map((_, index) => (
                            <PageTransition key={index} type="fade" delay={index * 100}>
                              <MealCardSkeleton style={styles.skeletonCard} />
                            </PageTransition>
                          ))}
                        </View>
                      </View>
                    </PageTransition>
                  ) : suggestions.length > 0 ? (
                    <>
                      {/* Metadata */}
                      <PageTransition type="slide" direction="down">
                        <View style={styles.metadata}>
                          <Text style={styles.metadataText}>
                            {t('home.suggestions.title')}: {suggestions.length} / {metadata.eligibleMealsCount}
                          </Text>
                        </View>
                      </PageTransition>
                      
                      <FlatList
                        data={suggestions}
                        renderItem={renderMealCard}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                      />
                    </>
                  ) : (
                    renderEmptyState()
                  )}
                </View>
              )}

              {/* Random Picker Tab */}
              {activeTab === 'random' && (
                <View style={styles.tabContent}>
                  {isLoadingRandom ? (
                    <PageTransition type="fade">
                      <View style={styles.loadingContainer}>
                        <LoadingState 
                          message={t('home.suggestions.randomLoading')} 
                          type="bounce" 
                        />
                      </View>
                    </PageTransition>
                  ) : randomMeals.length > 0 ? (
                    <>
                      <PageTransition type="slide" direction="down">
                        <View style={styles.randomHeader}>
                          <Text style={styles.randomTitle}>
                            {t('home.suggestions.randomPicker.title')}
                          </Text>
                          <BounceAnimation>
                            <Button
                              title={t('home.suggestions.randomPicker.pickAnother')}
                              onPress={handleGetRandomSuggestions}
                              variant="outline"
                              style={styles.pickAnotherButton}
                            />
                          </BounceAnimation>
                        </View>
                      </PageTransition>
                      
                      <FlatList
                        data={randomMeals}
                        renderItem={renderMealCard}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                      />
                    </>
                  ) : (
                    <PageTransition type="fade" duration={400}>
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>
                          {t('home.suggestions.randomPicker.noEligibleMeals')}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                          {t('home.suggestions.randomPicker.noEligibleMealsSubtitle')}
                        </Text>
                      </View>
                    </PageTransition>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.footer}>
          <Button
            title={t('auth.logout')}
            onPress={handleLogout}
            loading={authLoading}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundaryWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginRight: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },

  content: {
    flex: 1,
    paddingBottom: 20,
  },
  tabContent: {
    flex: 1,
  },
  metadata: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  metadataText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  skeletonContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  skeletonCard: {
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 120,
  },
  randomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  randomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  pickAnotherButton: {
    minWidth: 100,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  logoutButton: {
    width: '100%',
  },
});

export default HomeScreen;
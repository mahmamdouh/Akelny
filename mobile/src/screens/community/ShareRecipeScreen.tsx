import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store';
import { publishRecipe } from '../../store/communitySlice';
import { useLocalization } from '../../hooks/useLocalization';
import { Button } from '../../components/common/Button';
import { MealSuggestionCard } from '../../components/specific/MealSuggestionCard';
import { Meal } from '../../../../shared/src/types/meal';

interface ShareRecipeScreenProps {
  route: {
    params: {
      meal: Meal;
    };
  };
}

export const ShareRecipeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLocalization();
  
  const { meal } = (route.params as any) || {};
  const { publishingMealId } = useSelector((state: RootState) => state.community);
  
  const [isPublic, setIsPublic] = useState(meal?.is_public || false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (meal && isPublic !== meal.is_public) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [isPublic, meal]);

  const handlePublish = async () => {
    if (!meal) return;

    try {
      await dispatch(publishRecipe({
        meal_id: meal.id,
        is_public: isPublic
      })).unwrap();

      Alert.alert(
        t('common.success'),
        isPublic 
          ? t('community.recipePublishedSuccess')
          : t('community.recipeMadePrivateSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        t('error'),
        error instanceof Error ? error.message : t('community.publishError')
      );
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        t('common.unsavedChanges'),
        t('common.unsavedChangesMessage'),
        [
          { text: t('common.stay'), style: 'cancel' },
          { text: t('common.discard'), onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!meal) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorTitle}>{t('error')}</Text>
        <Text style={styles.errorMessage}>{t('community.mealNotFound')}</Text>
        <Button
          title={t('common.goBack')}
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const isLoading = publishingMealId === meal.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('community.shareRecipe')}</Text>
        <Text style={styles.subtitle}>{t('community.shareRecipeSubtitle')}</Text>
      </View>

      <View style={styles.mealPreview}>
        <Text style={styles.sectionTitle}>{t('community.recipePreview')}</Text>
        <MealSuggestionCard
          meal={meal}
          onPress={() => {}}
          showCreator={false}
        />
      </View>

      <View style={styles.visibilitySection}>
        <Text style={styles.sectionTitle}>{t('community.visibility')}</Text>
        
        <View style={styles.visibilityOption}>
          <View style={styles.visibilityInfo}>
            <Ionicons 
              name={isPublic ? "globe-outline" : "lock-closed-outline"} 
              size={24} 
              color={isPublic ? "#28a745" : "#6c757d"} 
            />
            <View style={styles.visibilityText}>
              <Text style={styles.visibilityTitle}>
                {isPublic ? t('community.public') : t('community.private')}
              </Text>
              <Text style={styles.visibilityDescription}>
                {isPublic 
                  ? t('community.publicDescription')
                  : t('community.privateDescription')
                }
              </Text>
            </View>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: '#e9ecef', true: '#28a745' }}
            thumbColor={isPublic ? '#fff' : '#fff'}
            disabled={isLoading}
          />
        </View>
      </View>

      {isPublic && (
        <View style={styles.guidelinesSection}>
          <Text style={styles.sectionTitle}>{t('community.guidelines')}</Text>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
            <Text style={styles.guidelineText}>{t('community.guideline1')}</Text>
          </View>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
            <Text style={styles.guidelineText}>{t('community.guideline2')}</Text>
          </View>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
            <Text style={styles.guidelineText}>{t('community.guideline3')}</Text>
          </View>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
            <Text style={styles.guidelineText}>{t('community.guideline4')}</Text>
          </View>
        </View>
      )}

      <View style={styles.attribution}>
        <Text style={styles.attributionTitle}>{t('community.attribution')}</Text>
        <Text style={styles.attributionText}>{t('community.attributionDescription')}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title={t('common.cancel')}
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
          disabled={isLoading}
        />
        <Button
          title={
            isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              isPublic ? t('community.publishToComm') : t('community.makePrivate')
            )
          }
          onPress={handlePublish}
          style={styles.publishButton}
          disabled={!hasChanges || isLoading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  content: {
    padding: 16
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24
  },
  mealPreview: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12
  },
  visibilitySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  visibilityText: {
    marginLeft: 12,
    flex: 1
  },
  visibilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4
  },
  visibilityDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20
  },
  guidelinesSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  guidelineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    flex: 1
  },
  attribution: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  attributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8
  },
  attributionText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1
  },
  publishButton: {
    flex: 2
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa'
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 16,
    marginBottom: 8
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24
  },
  errorButton: {
    paddingHorizontal: 32
  }
});

export default ShareRecipeScreen;
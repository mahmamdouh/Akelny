import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store';
import { 
  fetchEntriesForMonth, 
  deleteCalendarEntry, 
  clearError 
} from '../../store/calendarSlice';
import { CalendarEntry } from '../../../../shared/src/types/calendar';
import { useLocalization } from '../../hooks/useLocalization';
import Button from '../../components/common/Button';

const CalendarScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { t, isRTL } = useLocalization();
  
  const { entries, loading, error } = useSelector((state: RootState) => state.calendar);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCalendarEntries();
  }, [currentDate]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('error'), error);
      dispatch(clearError());
    }
  }, [error]);

  const loadCalendarEntries = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    dispatch(fetchEntriesForMonth({ year, month }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCalendarEntries();
    setRefreshing(false);
  };

  const handleDeleteEntry = (entry: CalendarEntry) => {
    Alert.alert(
      t('calendar.confirmDelete'),
      t('calendar.confirmDeleteMessage').replace('{meal}', entry.meal?.title_en || 'Unknown meal'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => dispatch(deleteCalendarEntry(entry.id))
        }
      ]
    );
  };

  const navigateToMealDetail = (mealId: string) => {
    (navigation as any).navigate('MealDetail', { mealId });
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const groupEntriesByDate = (entries: CalendarEntry[]) => {
    const grouped: { [key: string]: CalendarEntry[] } = {};
    
    entries.forEach(entry => {
      const date = entry.scheduled_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date,
        entries: grouped[date]
      }));
  };

  const renderCalendarEntry = ({ item: entry }: { item: CalendarEntry }) => (
    <View style={[styles.entryCard, isRTL && styles.entryCardRTL]}>
      <TouchableOpacity
        style={styles.entryContent}
        onPress={() => navigateToMealDetail(entry.meal_id)}
      >
        <View style={styles.entryHeader}>
          <Text style={[styles.mealTitle, isRTL && styles.textRTL]}>
            {isRTL ? entry.meal?.title_ar || entry.meal?.title_en : entry.meal?.title_en}
          </Text>
          <View style={styles.mealTypeTag}>
            <Text style={styles.mealTypeText}>
              {t(`mealTypes.${entry.meal?.meal_type}`)}
            </Text>
          </View>
        </View>
        
        {entry.meal?.description_en && (
          <Text style={[styles.mealDescription, isRTL && styles.textRTL]} numberOfLines={2}>
            {isRTL ? entry.meal?.description_ar || entry.meal?.description_en : entry.meal?.description_en}
          </Text>
        )}
        
        {entry.notes && (
          <Text style={[styles.entryNotes, isRTL && styles.textRTL]} numberOfLines={2}>
            {t('calendar.notes')}: {entry.notes}
          </Text>
        )}
        
        <View style={styles.entryFooter}>
          <Text style={styles.entryTime}>
            {new Date(entry.created_at).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          
          {entry.meal?.prep_time_min && (
            <Text style={styles.prepTime}>
              {t('meal.prepTime')}: {entry.meal.prep_time_min} {t('common.minutes')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteEntry(entry)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  const renderDateGroup = ({ item }: { item: { date: string; entries: CalendarEntry[] } }) => (
    <View style={styles.dateGroup}>
      <Text style={[styles.dateHeader, isRTL && styles.textRTL]}>
        {formatDate(item.date)}
      </Text>
      {item.entries.map(entry => (
        <View key={entry.id}>
          {renderCalendarEntry({ item: entry })}
        </View>
      ))}
    </View>
  );

  const groupedEntries = groupEntriesByDate(entries);

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={[styles.monthNavigation, isRTL && styles.monthNavigationRTL]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeMonth(isRTL ? 'next' : 'prev')}
        >
          <Ionicons 
            name={isRTL ? "chevron-forward" : "chevron-back"} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
        
        <Text style={[styles.monthTitle, isRTL && styles.textRTL]}>
          {formatMonthYear()}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeMonth(isRTL ? 'prev' : 'next')}
        >
          <Ionicons 
            name={isRTL ? "chevron-back" : "chevron-forward"} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Calendar Entries */}
      <FlatList
        data={groupedEntries}
        renderItem={renderDateGroup}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
            <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
              {t('calendar.noEntries')}
            </Text>
            <Text style={[styles.emptySubtext, isRTL && styles.textRTL]}>
              {t('calendar.noEntriesSubtext')}
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
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  monthNavigationRTL: {
    flexDirection: 'row-reverse'
  },
  navButton: {
    padding: 8
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000'
  },
  listContainer: {
    padding: 16
  },
  dateGroup: {
    marginBottom: 24
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
    paddingHorizontal: 4
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  entryCardRTL: {
    flexDirection: 'row-reverse'
  },
  entryContent: {
    flex: 1,
    padding: 16
  },
  entryHeader: {
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
  entryNotes: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
    fontStyle: 'italic'
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  entryTime: {
    fontSize: 12,
    color: '#8E8E93'
  },
  prepTime: {
    fontSize: 12,
    color: '#8E8E93'
  },
  deleteButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    paddingHorizontal: 32
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl'
  }
});

export default CalendarScreen;
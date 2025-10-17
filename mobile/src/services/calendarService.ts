import { apiClient } from './apiClient';
import { 
  CalendarEntry, 
  CreateCalendarEntryRequest, 
  UpdateCalendarEntryRequest,
  CalendarFilters,
  CalendarListResponse 
} from '../../../shared/src/types/calendar';

export class CalendarService {
  /**
   * Create a new calendar entry
   */
  static async createEntry(data: CreateCalendarEntryRequest): Promise<CalendarEntry> {
    const response = await apiClient.post('/calendar', data);
    return response.data;
  }

  /**
   * Get calendar entries with optional filters
   */
  static async getEntries(filters?: CalendarFilters): Promise<CalendarListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.meal_type) params.append('meal_type', filters.meal_type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/calendar?${params.toString()}`);
    return response.data;
  }

  /**
   * Get a specific calendar entry
   */
  static async getEntry(id: string): Promise<CalendarEntry> {
    const response = await apiClient.get(`/calendar/${id}`);
    return response.data;
  }

  /**
   * Update a calendar entry
   */
  static async updateEntry(id: string, data: UpdateCalendarEntryRequest): Promise<CalendarEntry> {
    const response = await apiClient.put(`/calendar/${id}`, data);
    return response.data;
  }

  /**
   * Delete a calendar entry
   */
  static async deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/calendar/${id}`);
  }

  /**
   * Get recent meal IDs (for suggestion exclusion)
   */
  static async getRecentMeals(days: number = 1): Promise<{ recent_meal_ids: string[] }> {
    const response = await apiClient.get(`/calendar/recent-meals?days=${days}`);
    return response.data;
  }

  /**
   * Get calendar entries for a specific date range
   */
  static async getEntriesForDateRange(startDate: string, endDate: string): Promise<CalendarEntry[]> {
    const response = await this.getEntries({
      start_date: startDate,
      end_date: endDate,
      limit: 100
    });
    return response.entries;
  }

  /**
   * Get calendar entries for a specific month
   */
  static async getEntriesForMonth(year: number, month: number): Promise<CalendarEntry[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
    
    return this.getEntriesForDateRange(startDate, endDate);
  }

  /**
   * Check if a meal is scheduled for a specific date
   */
  static async isMealScheduled(mealId: string, date: string): Promise<boolean> {
    try {
      const entries = await this.getEntriesForDateRange(date, date);
      return entries.some(entry => entry.meal_id === mealId);
    } catch (error) {
      console.error('Error checking if meal is scheduled:', error);
      return false;
    }
  }
}
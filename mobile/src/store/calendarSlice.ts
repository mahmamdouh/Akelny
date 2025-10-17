import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CalendarService } from '../services/calendarService';
import { 
  CalendarEntry, 
  CreateCalendarEntryRequest, 
  UpdateCalendarEntryRequest,
  CalendarFilters 
} from '../../../shared/src/types/calendar';

interface CalendarState {
  entries: CalendarEntry[];
  currentEntry: CalendarEntry | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: CalendarFilters;
}

const initialState: CalendarState = {
  entries: [],
  currentEntry: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  filters: {}
};

// Async thunks
export const createCalendarEntry = createAsyncThunk(
  'calendar/createEntry',
  async (data: CreateCalendarEntryRequest, { rejectWithValue }) => {
    try {
      return await CalendarService.createEntry(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create calendar entry');
    }
  }
);

export const fetchCalendarEntries = createAsyncThunk(
  'calendar/fetchEntries',
  async (filters?: CalendarFilters, { rejectWithValue }) => {
    try {
      return await CalendarService.getEntries(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch calendar entries');
    }
  }
);

export const fetchCalendarEntry = createAsyncThunk(
  'calendar/fetchEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      return await CalendarService.getEntry(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch calendar entry');
    }
  }
);

export const updateCalendarEntry = createAsyncThunk(
  'calendar/updateEntry',
  async ({ id, data }: { id: string; data: UpdateCalendarEntryRequest }, { rejectWithValue }) => {
    try {
      return await CalendarService.updateEntry(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update calendar entry');
    }
  }
);

export const deleteCalendarEntry = createAsyncThunk(
  'calendar/deleteEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      await CalendarService.deleteEntry(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete calendar entry');
    }
  }
);

export const fetchEntriesForMonth = createAsyncThunk(
  'calendar/fetchEntriesForMonth',
  async ({ year, month }: { year: number; month: number }, { rejectWithValue }) => {
    try {
      return await CalendarService.getEntriesForMonth(year, month);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch calendar entries for month');
    }
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<CalendarFilters>) => {
      state.filters = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEntry: (state) => {
      state.currentEntry = null;
    },
    resetCalendar: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create calendar entry
      .addCase(createCalendarEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCalendarEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createCalendarEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch calendar entries
      .addCase(fetchCalendarEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCalendarEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.entries;
        state.totalCount = action.payload.total;
      })
      .addCase(fetchCalendarEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch single calendar entry
      .addCase(fetchCalendarEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCalendarEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEntry = action.payload;
      })
      .addCase(fetchCalendarEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update calendar entry
      .addCase(updateCalendarEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCalendarEntry.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.entries.findIndex(entry => entry.id === action.payload.id);
        if (index !== -1) {
          state.entries[index] = action.payload;
        }
        if (state.currentEntry?.id === action.payload.id) {
          state.currentEntry = action.payload;
        }
      })
      .addCase(updateCalendarEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete calendar entry
      .addCase(deleteCalendarEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCalendarEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.filter(entry => entry.id !== action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
        if (state.currentEntry?.id === action.payload) {
          state.currentEntry = null;
        }
      })
      .addCase(deleteCalendarEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch entries for month
      .addCase(fetchEntriesForMonth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntriesForMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.totalCount = action.payload.length;
      })
      .addCase(fetchEntriesForMonth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  setFilters,
  setCurrentPage,
  clearError,
  clearCurrentEntry,
  resetCalendar
} = calendarSlice.actions;

export default calendarSlice.reducer;
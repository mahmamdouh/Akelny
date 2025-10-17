import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { 
  getCurrentLanguage, 
  isRTL, 
  getLanguageDirection, 
  getFontFamily,
  getTextAlign,
  getFlexDirection,
  formatNumber,
  formatCurrency,
  formatDate,
  switchLanguage,
  getAvailableLanguages,
  getCurrentLanguageInfo,
} from '../utils/localization';

/**
 * Enhanced localization hook with RTL support and utilities
 */
export const useLocalization = () => {
  const { t: originalT, i18n } = useTranslation();

  // Enhanced translation function with fallback
  const t = useCallback((key: string, fallback?: string, options?: any): string => {
    try {
      const translation = originalT(key, options);
      const translationStr = typeof translation === 'string' ? translation : key;
      
      // If translation is the same as key, it might be missing
      if (translationStr === key && fallback) {
        return fallback;
      }
      
      return translationStr;
    } catch (error) {
      console.warn(`Translation failed for key: ${key}`, error);
      return fallback || key;
    }
  }, [originalT]);

  // Language information
  const language = getCurrentLanguage();
  const languageInfo = getCurrentLanguageInfo();
  const availableLanguages = getAvailableLanguages();

  // RTL information
  const rtl = isRTL();
  const direction = getLanguageDirection();

  // Style utilities
  const textAlign = getTextAlign();
  const flexDirection = getFlexDirection();

  // Font utilities
  const getFontStyle = useCallback((weight: 'regular' | 'bold' = 'regular') => ({
    fontFamily: getFontFamily(weight),
  }), []);

  const getTextStyle = useCallback((weight: 'regular' | 'bold' = 'regular') => ({
    ...getFontStyle(weight),
    textAlign,
    writingDirection: direction as 'ltr' | 'rtl',
  }), [getFontStyle, textAlign, direction]);

  // Formatting utilities
  const formatters = useMemo(() => ({
    number: formatNumber,
    currency: formatCurrency,
    date: formatDate,
  }), []);

  // Language switching
  const changeLanguage = useCallback(async (languageCode: string) => {
    try {
      await switchLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  }, []);

  // Common translations with fallbacks
  const commonTranslations = useMemo(() => ({
    loading: t('common.loading', 'Loading...'),
    error: t('common.error', 'Error'),
    retry: t('common.retry', 'Retry'),
    cancel: t('common.cancel', 'Cancel'),
    save: t('common.save', 'Save'),
    delete: t('common.delete', 'Delete'),
    edit: t('common.edit', 'Edit'),
    next: t('common.next', 'Next'),
    back: t('common.back', 'Back'),
    continue: t('common.continue', 'Continue'),
    welcome: t('common.welcome', 'Welcome'),
    ok: t('common.ok', 'OK'),
    yes: t('common.yes', 'Yes'),
    no: t('common.no', 'No'),
    success: t('common.success', 'Success'),
  }), [t]);

  return {
    // Translation function
    t,
    
    // Language information
    language,
    languageInfo,
    availableLanguages,
    
    // RTL information
    rtl,
    direction,
    isRTL: rtl,
    
    // Style utilities
    textAlign,
    flexDirection,
    getFontStyle,
    getTextStyle,
    
    // Formatting utilities
    formatters,
    
    // Language management
    changeLanguage,
    
    // Common translations
    common: commonTranslations,
    
    // Original i18n instance for advanced usage
    i18n,
  };
};

export default useLocalization;
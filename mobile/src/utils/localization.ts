import { I18nManager } from 'react-native';
import i18n, { 
  changeLanguage, 
  getCurrentLanguage, 
  isRTL, 
  getLanguageDirection, 
  getFontFamily 
} from '../localization/i18n';

/**
 * Translation utility functions
 */

// Get translated text with fallback
export const t = (key: string, options?: any): string => {
  try {
    const result = i18n.t(key, options);
    return typeof result === 'string' ? result : key;
  } catch (error) {
    console.warn(`Translation failed for key: ${key}`, error);
    return key;
  }
};

// Check if translation exists
export const hasTranslation = (key: string): boolean => {
  return i18n.exists(key);
};

// Get translation with explicit fallback
export const tWithFallback = (key: string, fallback: string, options?: any): string => {
  if (hasTranslation(key)) {
    return t(key, options);
  }
  return fallback;
};

/**
 * RTL utility functions
 */

// Get text alignment based on language direction
export const getTextAlign = (): 'left' | 'right' | 'center' => {
  return isRTL() ? 'right' : 'left';
};

// Get flex direction for RTL support
export const getFlexDirection = (): 'row' | 'row-reverse' => {
  return isRTL() ? 'row-reverse' : 'row';
};

// Get writing direction
export const getWritingDirection = (): 'ltr' | 'rtl' => {
  return getLanguageDirection() as 'ltr' | 'rtl';
};

// Transform style object for RTL
export const transformStyleForRTL = (style: any) => {
  if (!isRTL()) return style;
  
  const transformedStyle = { ...style };
  
  // Transform margin and padding
  if (style.marginLeft !== undefined || style.marginRight !== undefined) {
    const marginLeft = style.marginLeft;
    const marginRight = style.marginRight;
    transformedStyle.marginLeft = marginRight;
    transformedStyle.marginRight = marginLeft;
  }
  
  if (style.paddingLeft !== undefined || style.paddingRight !== undefined) {
    const paddingLeft = style.paddingLeft;
    const paddingRight = style.paddingRight;
    transformedStyle.paddingLeft = paddingRight;
    transformedStyle.paddingRight = paddingLeft;
  }
  
  // Transform border radius
  if (style.borderTopLeftRadius !== undefined || style.borderTopRightRadius !== undefined) {
    const borderTopLeftRadius = style.borderTopLeftRadius;
    const borderTopRightRadius = style.borderTopRightRadius;
    transformedStyle.borderTopLeftRadius = borderTopRightRadius;
    transformedStyle.borderTopRightRadius = borderTopLeftRadius;
  }
  
  if (style.borderBottomLeftRadius !== undefined || style.borderBottomRightRadius !== undefined) {
    const borderBottomLeftRadius = style.borderBottomLeftRadius;
    const borderBottomRightRadius = style.borderBottomRightRadius;
    transformedStyle.borderBottomLeftRadius = borderBottomRightRadius;
    transformedStyle.borderBottomRightRadius = borderBottomLeftRadius;
  }
  
  // Transform position
  if (style.left !== undefined || style.right !== undefined) {
    const left = style.left;
    const right = style.right;
    transformedStyle.left = right;
    transformedStyle.right = left;
  }
  
  return transformedStyle;
};

/**
 * Language management utilities
 */

// Switch language with proper RTL handling
export const switchLanguage = async (languageCode: string): Promise<void> => {
  try {
    await changeLanguage(languageCode);
    
    // Force re-render by updating I18nManager if needed
    const shouldBeRTL = languageCode === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
    }
  } catch (error) {
    console.error('Failed to switch language:', error);
    throw error;
  }
};

// Get available languages with their display names
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

// Get current language info
export const getCurrentLanguageInfo = () => {
  const currentLang = getCurrentLanguage();
  return getAvailableLanguages().find(lang => lang.code === currentLang) || getAvailableLanguages()[0];
};

/**
 * Font utilities
 */

// Get font style object
export const getFontStyle = (weight: 'regular' | 'bold' = 'regular') => ({
  fontFamily: getFontFamily(weight),
});

// Get text style with proper font and alignment
export const getTextStyle = (weight: 'regular' | 'bold' = 'regular') => ({
  ...getFontStyle(weight),
  textAlign: getTextAlign(),
  writingDirection: getWritingDirection() as 'ltr' | 'rtl',
});

/**
 * Number and date formatting utilities
 */

// Format numbers according to locale
export const formatNumber = (number: number): string => {
  try {
    const locale = getCurrentLanguage() === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale).format(number);
  } catch (error) {
    return number.toString();
  }
};

// Format currency according to locale
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  try {
    const locale = getCurrentLanguage() === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency}`;
  }
};

// Format date according to locale
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const locale = getCurrentLanguage() === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    return date.toLocaleDateString();
  }
};

/**
 * Validation utilities
 */

// Validate if text contains Arabic characters
export const containsArabic = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
};

// Get appropriate keyboard type for current language
export const getKeyboardType = (): 'default' | 'ascii-capable' => {
  return getCurrentLanguage() === 'ar' ? 'default' : 'ascii-capable';
};

// Export commonly used functions
export {
  changeLanguage,
  getCurrentLanguage,
  isRTL,
  getLanguageDirection,
  getFontFamily,
};
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';

import en from './en.json';
import ar from './ar.json';

const LANGUAGE_STORAGE_KEY = 'user_language';
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

// Language detection with persistence
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // First try to get saved language from storage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Fall back to device language
      const deviceLanguage = Localization.locale.split('-')[0];
      const supportedLanguage = ['en', 'ar'].includes(deviceLanguage) ? deviceLanguage : 'en';
      callback(supportedLanguage);
    } catch (error) {
      console.warn('Language detection failed:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch (error) {
      console.warn('Failed to cache language:', error);
    }
  },
};

// Font loading configuration
const loadFonts = async () => {
  try {
    await Font.loadAsync({
      // Arabic fonts - using system fonts for now, can be replaced with custom fonts
      'NotoKufiArabic-Regular': Platform.select({
        ios: 'Geeza Pro',
        android: 'Noto Kufi Arabic',
        default: 'Arial',
      }),
      'NotoKufiArabic-Bold': Platform.select({
        ios: 'Geeza Pro Bold',
        android: 'Noto Kufi Arabic Bold',
        default: 'Arial Bold',
      }),
      // English fonts
      'Inter-Regular': Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'Arial',
      }),
      'Inter-Bold': Platform.select({
        ios: 'System Bold',
        android: 'Roboto Bold',
        default: 'Arial Bold',
      }),
    });
  } catch (error) {
    console.warn('Font loading failed:', error);
  }
};

// RTL configuration
const configureRTL = (language: string) => {
  const isRTL = RTL_LANGUAGES.includes(language);
  
  // Allow RTL globally
  I18nManager.allowRTL(true);
  
  // Only force RTL if current setting doesn't match desired state
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    
    // Note: On some platforms, changing RTL requires app restart
    if (Platform.OS === 'android') {
      console.warn('RTL change detected. App restart may be required for full effect.');
    }
  }
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    
    // Namespace and key separator configuration
    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: '.',
    nsSeparator: ':',
    
    // Missing key handling
    saveMissing: __DEV__,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (__DEV__) {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    },
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Load path for dynamic loading (if needed in future)
    load: 'languageOnly',
  });

// Configure RTL when language changes
i18n.on('languageChanged', (lng) => {
  configureRTL(lng);
});

// Initial RTL configuration
configureRTL(i18n.language);

// Load fonts
loadFonts();

// Helper functions for external use
export const changeLanguage = async (language: string) => {
  try {
    await i18n.changeLanguage(language);
    configureRTL(language);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

export const getCurrentLanguage = () => i18n.language;

export const isRTL = () => RTL_LANGUAGES.includes(i18n.language);

export const getSupportedLanguages = () => Object.keys(resources);

export const getLanguageDirection = () => isRTL() ? 'rtl' : 'ltr';

export const getFontFamily = (weight: 'regular' | 'bold' = 'regular') => {
  const currentLang = i18n.language;
  
  if (currentLang === 'ar') {
    return weight === 'bold' ? 'NotoKufiArabic-Bold' : 'NotoKufiArabic-Regular';
  }
  
  return weight === 'bold' ? 'Inter-Bold' : 'Inter-Regular';
};

export default i18n;
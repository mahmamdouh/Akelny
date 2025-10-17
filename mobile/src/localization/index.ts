// Main i18n configuration
export { default as i18n } from './i18n';

// Utility functions
export * from '../utils/localization';

// Hooks
export { default as useLocalization } from '../hooks/useLocalization';

// Components
export { default as RTLView } from '../components/common/RTLView';
export { default as RTLText } from '../components/common/RTLText';
export { default as LanguageSwitcher } from '../components/common/LanguageSwitcher';

// Storage utilities
export * from '../utils/storage';

// Re-export react-i18next hooks for convenience
export { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  switchLanguage, 
  getAvailableLanguages, 
  getCurrentLanguageInfo 
} from '../../utils/localization';
import Button from './Button';
import RTLText from './RTLText';
import RTLView from './RTLView';

interface LanguageSwitcherProps {
  onLanguageChange?: (languageCode: string) => void;
  showCurrentLanguage?: boolean;
  style?: any;
}

/**
 * Language switcher component with RTL support
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  onLanguageChange,
  showCurrentLanguage = true,
  style,
}) => {
  const { t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  
  const availableLanguages = getAvailableLanguages();
  const currentLanguage = getCurrentLanguageInfo();

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage.code || isChanging) {
      return;
    }

    setIsChanging(true);
    
    try {
      await switchLanguage(languageCode);
      onLanguageChange?.(languageCode);
      
      // Show success message
      Alert.alert(
        t('common.success', 'Success'),
        t('settings.languageChanged', 'Language changed successfully'),
        [{ text: t('common.ok', 'OK') }]
      );
    } catch (error) {
      console.error('Language change failed:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('settings.languageChangeError', 'Failed to change language'),
        [{ text: t('common.ok', 'OK') }]
      );
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <RTLView style={[styles.container, style]}>
      {showCurrentLanguage && (
        <RTLText style={styles.currentLanguageText}>
          {t('settings.currentLanguage', 'Current Language')}: {currentLanguage.nativeName}
        </RTLText>
      )}
      
      <RTLView style={styles.buttonContainer}>
        {availableLanguages.map((language) => {
          const isActive = language.code === currentLanguage.code;
          const buttonStyle = StyleSheet.flatten([
            styles.languageButton,
            isActive && styles.activeButton
          ]);
          const textStyle = StyleSheet.flatten([
            styles.buttonText,
            isActive && styles.activeButtonText
          ]);
            
          return (
            <Button
              key={language.code}
              title={language.nativeName}
              onPress={() => handleLanguageChange(language.code)}
              disabled={isChanging || isActive}
              style={buttonStyle}
              textStyle={textStyle}
            />
          );
        })}
      </RTLView>
      
      {isChanging && (
        <RTLText style={styles.changingText}>
          {t('settings.changingLanguage', 'Changing language...')}
        </RTLText>
      )}
    </RTLView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  currentLanguageText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  changingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LanguageSwitcher;
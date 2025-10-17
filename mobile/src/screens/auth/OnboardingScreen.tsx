import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { signupUser } from '../../store/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Picker from '../../components/common/Picker';
import { 
  RTLView, 
  RTLText, 
  LanguageSwitcher, 
  useLocalization 
} from '../../localization';

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { t, rtl, getTextStyle } = useLocalization();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    country: '',
    language: 'en' as 'en' | 'ar',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const countryOptions = [
    { label: t('countries.EG'), value: 'EG' },
    { label: t('countries.SA'), value: 'SA' },
    { label: t('countries.AE'), value: 'AE' },
    { label: t('countries.KW'), value: 'KW' },
    { label: t('countries.QA'), value: 'QA' },
    { label: t('countries.BH'), value: 'BH' },
    { label: t('countries.OM'), value: 'OM' },
    { label: t('countries.CN'), value: 'CN' },
    { label: t('countries.JP'), value: 'JP' },
    { label: t('countries.KR'), value: 'KR' },
    { label: t('countries.TH'), value: 'TH' },
    { label: t('countries.VN'), value: 'VN' },
    { label: t('countries.IN'), value: 'IN' },
    { label: t('countries.PK'), value: 'PK' },
    { label: t('countries.BD'), value: 'BD' },
    { label: t('countries.US'), value: 'US' },
    { label: t('countries.GB'), value: 'GB' },
    { label: t('countries.FR'), value: 'FR' },
    { label: t('countries.DE'), value: 'DE' },
    { label: t('countries.IT'), value: 'IT' },
    { label: t('countries.ES'), value: 'ES' },
    { label: t('countries.MX'), value: 'MX' },
    { label: t('countries.GT'), value: 'GT' },
    { label: t('countries.HN'), value: 'HN' },
  ];

  const languageOptions = [
    { label: t('auth.english'), value: 'en' },
    { label: t('auth.arabic'), value: 'ar' },
  ];

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t('auth.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.validationError');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.validationError');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.passwordTooShort');
    }

    if (!formData.country) {
      newErrors.country = t('auth.countryRequired');
    }

    if (!formData.language) {
      newErrors.language = t('auth.languageRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(signupUser(formData)).unwrap();
      // Navigation will be handled by the auth state change
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err || t('auth.signupError')
      );
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Language Switcher */}
          <LanguageSwitcher 
            showCurrentLanguage={false}
            style={styles.languageSwitcher}
            onLanguageChange={(lang) => {
              // Update form language when changed
              updateFormData('language', lang);
            }}
          />

          <RTLView style={styles.header}>
            <RTLText style={[styles.title, getTextStyle('bold')]}>
              {t('auth.onboardingTitle')}
            </RTLText>
            <RTLText style={[styles.subtitle, getTextStyle('regular')]}>
              {t('auth.onboardingSubtitle')}
            </RTLText>
          </RTLView>

          <RTLView style={styles.form}>
            <Input
              label={t('auth.name')}
              placeholder={t('auth.namePlaceholder')}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              error={errors.name}
              leftIcon="person-outline"
              autoCapitalize="words"
              textContentType="name"
            />

            <Input
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text.toLowerCase())}
              error={errors.email}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry
              textContentType="newPassword"
            />

            <Picker
              label={t('auth.country')}
              placeholder={t('auth.selectCountry')}
              value={formData.country}
              options={countryOptions}
              onValueChange={(value) => updateFormData('country', value)}
              error={errors.country}
            />

            <Picker
              label={t('auth.language')}
              placeholder={t('auth.selectLanguage')}
              value={formData.language}
              options={languageOptions}
              onValueChange={(value) => updateFormData('language', value as 'en' | 'ar')}
              error={errors.language}
            />
          </RTLView>

          <RTLView style={styles.actions}>
            <Button
              title={t('auth.signup')}
              onPress={handleSignup}
              loading={isLoading}
              style={styles.signupButton}
            />

            <RTLView style={styles.loginPrompt}>
              <RTLText style={[styles.loginPromptText, getTextStyle('regular')]}>
                {t('auth.alreadyHaveAccount')}
              </RTLText>
              <Button
                title={t('auth.login')}
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                size="small"
                style={styles.loginButton}
              />
            </RTLView>
          </RTLView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  languageSwitcher: {
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  actions: {
    marginTop: 24,
  },
  signupButton: {
    marginBottom: 16,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
});

export default OnboardingScreen;
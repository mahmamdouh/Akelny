import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginUser } from '../../store/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = t('auth.validationError');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.validationError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(loginUser(formData)).unwrap();
      // Navigation will be handled by the auth state change
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err || t('auth.loginError')
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
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
          </View>

          <View style={styles.form}>
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
              textContentType="password"
            />

            <Button
              title={t('auth.login')}
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            {/* Forgot password placeholder - can be implemented later */}
            <Button
              title={t('auth.forgotPassword')}
              onPress={() => {
                Alert.alert(
                  t('common.error'),
                  'Forgot password feature coming soon!'
                );
              }}
              variant="outline"
              size="small"
              style={styles.forgotButton}
            />
          </View>

          <View style={styles.signupPrompt}>
            <Text style={styles.signupPromptText}>
              {t('auth.dontHaveAccount')}
            </Text>
            <Button
              title={t('auth.signup')}
              onPress={() => navigation.navigate('Onboarding')}
              variant="outline"
              size="small"
              style={styles.signupButton}
            />
          </View>
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
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
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
    marginBottom: 32,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  signupPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signupPromptText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  signupButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
});

export default LoginScreen;
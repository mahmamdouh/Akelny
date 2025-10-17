# Localization and RTL Support

This directory contains the complete localization system for the Akelny mobile app, including RTL (Right-to-Left) support for Arabic language.

## Features

- ✅ i18next configuration with language detection and persistence
- ✅ RTL layout support with automatic style transformation
- ✅ Dynamic font loading for Arabic text
- ✅ Language switching with persistent storage
- ✅ RTL-aware components (RTLView, RTLText)
- ✅ Localization utilities and hooks
- ✅ Fallback mechanisms for missing translations

## Quick Start

### Basic Usage

```typescript
import { useLocalization } from '../localization';

const MyComponent = () => {
  const { t, rtl, getTextStyle } = useLocalization();
  
  return (
    <RTLView>
      <RTLText style={getTextStyle('bold')}>
        {t('welcome.title', 'Welcome')}
      </RTLText>
    </RTLView>
  );
};
```

### Language Switching

```typescript
import { LanguageSwitcher } from '../localization';

const SettingsScreen = () => {
  return (
    <LanguageSwitcher 
      onLanguageChange={(lang) => console.log('Language changed to:', lang)}
    />
  );
};
```

## Components

### RTLView
RTL-aware View component that automatically transforms styles for RTL languages.

```typescript
<RTLView style={{ marginLeft: 10 }}>
  {/* In RTL, marginLeft becomes marginRight automatically */}
</RTLView>
```

### RTLText
RTL-aware Text component with automatic font and alignment handling.

```typescript
<RTLText weight="bold" style={{ color: 'blue' }}>
  {t('some.key')}
</RTLText>
```

### LanguageSwitcher
Complete language switching component with UI.

```typescript
<LanguageSwitcher 
  showCurrentLanguage={true}
  onLanguageChange={(lang) => handleLanguageChange(lang)}
/>
```

## Hooks

### useLocalization
Enhanced localization hook with RTL support and utilities.

```typescript
const {
  t,                    // Translation function with fallback
  rtl,                  // Boolean: is current language RTL?
  language,             // Current language code
  getTextStyle,         // Get RTL-aware text style
  changeLanguage,       // Change language function
  formatters,           // Number, currency, date formatters
} = useLocalization();
```

## Utilities

### Translation Functions
- `t(key, options)` - Get translated text with fallback
- `hasTranslation(key)` - Check if translation exists
- `tWithFallback(key, fallback, options)` - Get translation with explicit fallback

### RTL Functions
- `isRTL()` - Check if current language is RTL
- `getTextAlign()` - Get text alignment for current language
- `getFlexDirection()` - Get flex direction for current language
- `transformStyleForRTL(style)` - Transform style object for RTL

### Language Management
- `switchLanguage(code)` - Switch language with RTL handling
- `getCurrentLanguage()` - Get current language code
- `getAvailableLanguages()` - Get list of available languages

## Adding New Languages

1. Create translation file: `src/localization/[lang].json`
2. Add to resources in `i18n.ts`:
   ```typescript
   const resources = {
     en: { translation: en },
     ar: { translation: ar },
     fr: { translation: fr }, // New language
   };
   ```
3. Add to RTL_LANGUAGES array if RTL:
   ```typescript
   const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'your_rtl_lang'];
   ```

## Translation File Structure

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "save": "Save"
  },
  "auth": {
    "login": "Login",
    "signup": "Sign Up"
  },
  "home": {
    "title": "Home",
    "subtitle": "Welcome back"
  }
}
```

## RTL Style Transformations

The system automatically transforms these style properties for RTL:
- `marginLeft` ↔ `marginRight`
- `paddingLeft` ↔ `paddingRight`
- `borderTopLeftRadius` ↔ `borderTopRightRadius`
- `borderBottomLeftRadius` ↔ `borderBottomRightRadius`
- `left` ↔ `right`

## Font Configuration

Fonts are automatically selected based on language:
- **English**: Inter (fallback: System/Roboto)
- **Arabic**: Noto Kufi Arabic (fallback: Geeza Pro/system Arabic fonts)

## Storage

Language preferences are automatically persisted using AsyncStorage:
- Current language selection
- User preferences
- Onboarding completion status

## Best Practices

1. **Always use translation keys**: Never hardcode text
2. **Use RTL components**: Use RTLView and RTLText instead of View and Text
3. **Test both languages**: Always test your UI in both English and Arabic
4. **Provide fallbacks**: Always provide fallback text for translations
5. **Use semantic keys**: Use descriptive translation keys like `auth.loginButton` instead of `button1`

## Troubleshooting

### Language not changing
- Check if AsyncStorage is working
- Verify the language code is supported
- Check console for error messages

### RTL layout issues
- Use RTLView instead of View
- Check if styles are being transformed correctly
- Test on both iOS and Android

### Missing translations
- Check translation files for the key
- Use fallback text in t() function
- Check console warnings for missing keys

### Font issues
- Verify font loading in i18n.ts
- Check platform-specific font names
- Test on physical devices for accurate font rendering
// ============================================
// i18n CONFIGURATION - Internationalization
// ============================================
// Multi-language support for Turkish, English, Spanish, German, French, Portuguese, Japanese, Korean, and Chinese

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import tr from './tr/translation.json';
import en from './en/translation.json';
import es from './es/translation.json';
import de from './de/translation.json';
import fr from './fr/translation.json';
import pt from './pt/translation.json';
import ja from './ja/translation.json';
import ko from './ko/translation.json';
import zh from './zh/translation.json';

const LANGUAGE_KEY = '@app_language';

// Supported languages
export const LANGUAGES = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: '简体中文', flag: '🇨🇳' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

// Resources
const resources = {
    tr: { translation: tr },
    en: { translation: en },
    zh: { translation: zh },
    fr: { translation: fr },
    pt: { translation: pt },
    es: { translation: es },
    de: { translation: de },
    ja: { translation: ja },
    ko: { translation: ko },
};

// Initialize i18n
i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'tr', // Default language
        fallbackLng: 'tr',
        interpolation: {
            escapeValue: false,
        },
        compatibilityJSON: 'v4',
    });

// Load saved language preference
export async function loadSavedLanguage(): Promise<void> {
    try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLang && (savedLang === 'tr' || savedLang === 'en' || savedLang === 'es' || savedLang === 'de' || savedLang === 'fr' || savedLang === 'pt' || savedLang === 'ja' || savedLang === 'ko' || savedLang === 'zh')) {
            await i18n.changeLanguage(savedLang);
        } else {
            // Use device language if available, fallback to Turkish
            const deviceLocales = Localization.getLocales();
            const deviceLang = deviceLocales?.[0]?.languageCode || 'tr';
            let langToUse = 'tr';
            if (deviceLang === 'en') langToUse = 'en';
            else if (deviceLang === 'zh') langToUse = 'zh';
            else if (deviceLang === 'fr') langToUse = 'fr';
            else if (deviceLang === 'pt') langToUse = 'pt';
            else if (deviceLang === 'es') langToUse = 'es';
            else if (deviceLang === 'de') langToUse = 'de';
            else if (deviceLang === 'ja') langToUse = 'ja';
            else if (deviceLang === 'ko') langToUse = 'ko';
            await i18n.changeLanguage(langToUse);
        }
    } catch (error) {
        console.error('Language load error:', error);
    }
}


// Change language and save preference
export async function changeLanguage(langCode: string): Promise<void> {
    try {
        await i18n.changeLanguage(langCode);
        await AsyncStorage.setItem(LANGUAGE_KEY, langCode);
    } catch (error) {
        console.error('Language change error:', error);
    }
}

// Get current language
export function getCurrentLanguage(): string {
    return i18n.language || 'tr';
}

// Initialize on app load
loadSavedLanguage();

export default i18n;

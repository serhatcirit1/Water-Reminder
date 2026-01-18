// ============================================
// i18n CONFIGURATION - Internationalization
// ============================================
// Multi-language support for Turkish, English, Spanish, and German

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import tr from './tr/translation.json';
import en from './en/translation.json';
import es from './es/translation.json';
import de from './de/translation.json';

const LANGUAGE_KEY = '@app_language';

// Supported languages
export const LANGUAGES = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Resources
const resources = {
    tr: { translation: tr },
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
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
        if (savedLang && (savedLang === 'tr' || savedLang === 'en' || savedLang === 'es' || savedLang === 'de')) {
            await i18n.changeLanguage(savedLang);
        } else {
            // Use device language if available, fallback to Turkish
            const deviceLocales = Localization.getLocales();
            const deviceLang = deviceLocales?.[0]?.languageCode || 'tr';
            let langToUse = 'tr';
            if (deviceLang === 'en') langToUse = 'en';
            else if (deviceLang === 'es') langToUse = 'es';
            else if (deviceLang === 'de') langToUse = 'de';
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

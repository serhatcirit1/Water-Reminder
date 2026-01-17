// ============================================
// i18n CONFIGURATION - Internationalization
// ============================================
// Multi-language support for Turkish and English

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import tr from './tr/translation.json';
import en from './en/translation.json';

const LANGUAGE_KEY = '@app_language';

// Supported languages
export const LANGUAGES = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
];

// Resources
const resources = {
    tr: { translation: tr },
    en: { translation: en },
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
        compatibilityJSON: 'v3',
    });

// Load saved language preference
export async function loadSavedLanguage(): Promise<void> {
    try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
            await i18n.changeLanguage(savedLang);
        } else {
            // Use device language if available, fallback to Turkish
            const deviceLang = Localization.locale.split('-')[0];
            const langToUse = deviceLang === 'en' ? 'en' : 'tr';
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

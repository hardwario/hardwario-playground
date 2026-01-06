// Import language files
import enTranslations from '../assets/i18n/en.json';
import csTranslations from '../assets/i18n/cs.json';

type Translations = Record<string, string>;

const translations: Record<string, Translations> = {
  en: enTranslations,
  cs: csTranslations,
};

let currentLanguage = 'en';
let loadedLanguage: Translations = enTranslations;
const fallBackLanguage: Translations = enTranslations;

// Listeners for language changes
const listeners: Set<() => void> = new Set();

/**
 * Get current language code
 */
export function getLanguage(): string {
  return currentLanguage;
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): { code: string; name: string }[] {
  return [
    { code: 'en', name: 'English' },
    { code: 'cs', name: 'Čeština' },
  ];
}

/**
 * Setup the i18n module with a specific language
 */
export function setup(language: string | null): void {
  const lang = language || 'en';

  if (translations[lang]) {
    currentLanguage = lang;
    loadedLanguage = translations[lang];
  } else {
    console.warn(`Language "${lang}" not found, using English`);
    currentLanguage = 'en';
    loadedLanguage = enTranslations;
  }

  // Notify all listeners
  listeners.forEach(listener => listener());
}

/**
 * Subscribe to language changes
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Translate a phrase
 */
export function __(phrase: string): string {
  if (!loadedLanguage || !fallBackLanguage) {
    return phrase;
  }

  let translation = loadedLanguage[phrase];
  if (translation === undefined) {
    translation = fallBackLanguage[phrase];
    if (translation === undefined) {
      translation = phrase;
    }
  }
  return translation;
}

// Default export for CommonJS compatibility
export default { __, setup, getLanguage, getAvailableLanguages, subscribe };

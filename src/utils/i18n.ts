// Import language files
import enTranslations from '../assets/i18n/en.json';

type TranslationKey = keyof typeof enTranslations;
type Translations = Record<string, string>;

let loadedLanguage: Translations = enTranslations;
const fallBackLanguage: Translations = enTranslations;

/**
 * Setup the i18n module with a specific language
 */
export function setup(language: string | null): void {
  if (!language || language === 'en') {
    loadedLanguage = enTranslations;
    return;
  }

  // For now, we only support English and Czech
  // Additional languages can be added by importing their JSON files
  if (language === 'cs') {
    // Dynamic import for Czech (if file exists)
    import('../assets/i18n/cs.json')
      .then((csTranslations) => {
        loadedLanguage = csTranslations.default || csTranslations;
      })
      .catch(() => {
        console.warn(`Language file for "${language}" not found, using English`);
        loadedLanguage = enTranslations;
      });
  } else {
    loadedLanguage = enTranslations;
  }
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
export default { __, setup };

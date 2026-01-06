import { useState, useEffect, useCallback } from 'react';
import * as i18n from '../../utils/i18n';

export function useLanguage() {
  const [language, setLanguageState] = useState(i18n.getLanguage());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Subscribe to language changes
    const unsubscribe = i18n.subscribe(() => {
      setLanguageState(i18n.getLanguage());
      forceUpdate(n => n + 1);
    });

    return unsubscribe;
  }, []);

  const setLanguage = useCallback((lang: string) => {
    i18n.setup(lang);
    // Save to settings
    window.electronAPI.settings.set('language', lang);
  }, []);

  const availableLanguages = i18n.getAvailableLanguages();

  return {
    language,
    setLanguage,
    availableLanguages,
    __: i18n.__,
  };
}

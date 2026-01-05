import { useState, useEffect } from 'react';
import * as i18n from '../../utils/i18n';

interface SettingsState {
  language?: string;
  [key: string]: unknown;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({});

  useEffect(() => {
    const unsubAll = window.electronAPI.settings.onAll((allSettings) => {
      setSettings(allSettings as SettingsState);
    });

    window.electronAPI.settings.getAll().then((allSettings) => {
      setSettings(allSettings as SettingsState);
    });

    return () => {
      unsubAll();
    };
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSettings((prev) => ({ ...prev, language: newLanguage }));
    window.electronAPI.settings.set('language', newLanguage);
  };

  if (Object.keys(settings).length === 0) {
    return null;
  }

  return (
    <div id="settings" className="p-4">
      <h2 className="text-2xl font-semibold mb-6">{i18n.__('Settings')}</h2>

      <div className="form-group max-w-md">
        <label className="form-label">{i18n.__('Languages')}</label>
        <select
          className="form-control"
          value={settings.language || 'en'}
          onChange={handleLanguageChange}
        >
          {['en', 'cs'].map((lang) => (
            <option value={lang} key={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

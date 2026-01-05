import { useState, useEffect } from 'react';
import { FiSettings, FiGlobe, FiServer, FiInfo } from 'react-icons/fi';
import * as i18n from '../../utils/i18n';

interface SettingsState {
  language?: string;
  'mqtt.ip'?: string;
  'mqtt-broker-bind'?: string;
  [key: string]: unknown;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({});
  const [saved, setSaved] = useState(false);

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
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (Object.keys(settings).length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-hardwario-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'cs', name: 'Czech' },
  ];

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiSettings className="w-6 h-6" />
            {i18n.__('Settings')}
          </h1>
          <p className="text-gray-500 mt-1">Configure your HARDWARIO Playground preferences</p>
        </div>

        {/* Saved Toast */}
        {saved && (
          <div className="fixed top-4 right-4 px-4 py-2 bg-green-500 text-white rounded shadow-lg animate-fade-in z-50">
            Settings saved
          </div>
        )}

        {/* Language Settings Card */}
        <div className="bg-white border border-gray-200 shadow-sm mb-4">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <FiGlobe className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-800">{i18n.__('Languages')}</h2>
          </div>

          <div className="p-4">
            <div className="max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interface Language
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-hardwario-primary focus:border-transparent"
                value={settings.language || 'en'}
                onChange={handleLanguageChange}
              >
                {languages.map((lang) => (
                  <option value={lang.code} key={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Changes will take effect after restarting the application.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Info Card */}
        <div className="bg-white border border-gray-200 shadow-sm mb-4">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <FiServer className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Connection Information</h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1">MQTT Broker</div>
                <div className="text-gray-900 font-mono">
                  {settings['mqtt.ip'] || '127.0.0.1'}:1883
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1">Node-RED Editor</div>
                <div className="text-gray-900 font-mono">
                  http://127.0.0.1:1880
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1">Node-RED Dashboard</div>
                <div className="text-gray-900 font-mono">
                  http://127.0.0.1:1880/ui
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1">MQTT WebSocket</div>
                <div className="text-gray-900 font-mono">
                  ws://127.0.0.1:9001
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Card */}
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <FiInfo className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-800">About</h2>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-hardwario-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">HW</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">HARDWARIO Playground</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Desktop application for IoT hardware prototyping with HARDWARIO TOWER.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    Node-RED
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    MQTT
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    Blockly
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    Firmware Flasher
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

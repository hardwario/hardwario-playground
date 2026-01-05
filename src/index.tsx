import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './render/App';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

// Import types for window.electronAPI
import './types/electron.d';

// Initialize i18n with language from settings
const initializeApp = async () => {
  // Get language setting through preload API
  const language = window.electronAPI.settings.getSync('language') as string | null;

  // Dynamic import of i18n utility
  const i18n = await import('./utils/i18n');
  i18n.setup(language || 'en');

  // Get root element
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }

  // Create React 18 root
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

initializeApp().catch(console.error);

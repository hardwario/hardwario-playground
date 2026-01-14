import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCode, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import * as i18n from '../../utils/i18n';

type LoadingState = 'loading' | 'ready' | 'error';

export default function Blockly() {
  const navigate = useNavigate();
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.path) {
        console.log('Path to firmware', event.data.path);
        navigate(`/firmware/${encodeURIComponent(event.data.path)}`);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  const handleLoad = () => {
    setLoadingState('ready');
  };

  const handleError = () => {
    setLoadingState('error');
  };

  const handleRetry = () => {
    setLoadingState('loading');
  };

  return (
    <div className="h-full w-full relative bg-gray-50">
      {/* Loading Overlay */}
      {loadingState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <FiCode className="w-8 h-8 text-purple-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Blockly IDE</h3>
            <p className="text-gray-500 mb-4">Initializing visual programming environment...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadingState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center max-w-md px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Blockly IDE</h3>
            <p className="text-gray-500 mb-6">
              The Blockly server might not be running. Make sure all services are started correctly.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-all"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        key={loadingState === 'loading' ? 'loading' : 'ready'}
        src="http://127.0.0.1:8000"
        className={`w-full h-full border-0 ${loadingState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        title={i18n.__('Blockly IDE')}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

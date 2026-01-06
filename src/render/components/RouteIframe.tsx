import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiActivity, FiLayout, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface RouteIframeProps {
  path: string;
  src: string;
  id: string;
  alwaysVisible?: boolean;
}

type LoadingState = 'loading' | 'ready' | 'error';

export default function RouteIframe({ path, src, id, alwaysVisible = false }: RouteIframeProps) {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');

  useEffect(() => {
    if (!id) return;

    const unsubVisible = window.electronAPI.iframe.onVisible(id, (isVisible) => {
      console.log(`iframe:${id}:visible`, isVisible);
      setVisible(isVisible);
    });

    const unsubReload = window.electronAPI.iframe.onReload(id, () => {
      console.log(`iframe:${id}:reload`);
      setReloadKey((prev) => prev + 1);
      setLoadingState('loading');
    });

    return () => {
      unsubVisible();
      unsubReload();
    };
  }, [id]);

  // Reset loading state when reloadKey changes
  useEffect(() => {
    setLoadingState('loading');
  }, [reloadKey]);

  if (!visible) return null;

  const isActive = alwaysVisible || location.pathname === path;

  const handleLoad = () => {
    setLoadingState('ready');
  };

  const handleError = () => {
    setLoadingState('error');
  };

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };

  // Get icon and title based on iframe id
  const getIconAndTitle = () => {
    if (id === 'node-red') {
      return {
        icon: FiActivity,
        title: 'Node-RED Editor',
        description: 'Loading visual programming environment...',
        color: 'red',
      };
    }
    if (id === 'node-red-dashboard') {
      return {
        icon: FiLayout,
        title: 'Node-RED Dashboard',
        description: 'Loading dashboard interface...',
        color: 'blue',
      };
    }
    return {
      icon: FiActivity,
      title: 'Loading',
      description: 'Please wait...',
      color: 'gray',
    };
  };

  const { icon: Icon, title, description, color } = getIconAndTitle();

  const colorClasses = {
    red: {
      bg: 'bg-red-100',
      text: 'text-red-500',
      dot: 'bg-red-500',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-500',
      dot: 'bg-blue-500',
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      dot: 'bg-gray-500',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <div
      className={`route-iframe absolute inset-0 ${alwaysVisible ? 'z-0' : ''}`}
      style={{ display: isActive ? 'block' : 'none' }}
    >
      {/* Loading Overlay */}
      {loadingState === 'loading' && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colors.bg} mb-4`}>
              <Icon className={`w-8 h-8 ${colors.text} animate-pulse`} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 mb-4">{description}</p>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-2 h-2 ${colors.dot} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
              <div className={`w-2 h-2 ${colors.dot} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
              <div className={`w-2 h-2 ${colors.dot} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadingState === 'error' && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center max-w-md px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load {title}</h3>
            <p className="text-gray-500 mb-6">
              The service might still be starting up. Please wait a moment and try again.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-hardwario-primary text-white font-medium hover:bg-blue-600 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={src}
        key={reloadKey}
        className={`w-full h-full border-0 ${loadingState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        id={id}
        title={id}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteIframeProps {
  path: string;
  src: string;
  id: string;
}

export default function RouteIframe({ path, src, id }: RouteIframeProps) {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;

    const unsubVisible = window.electronAPI.iframe.onVisible(id, (isVisible) => {
      console.log(`iframe:${id}:visible`, isVisible);
      setVisible(isVisible);
    });

    const unsubReload = window.electronAPI.iframe.onReload(id, () => {
      console.log(`iframe:${id}:reload`);
      setReloadKey((prev) => prev + 1);
    });

    return () => {
      unsubVisible();
      unsubReload();
    };
  }, [id]);

  if (!visible) return null;

  const isActive = location.pathname === path;

  return (
    <iframe
      src={src}
      key={reloadKey}
      className="route-iframe absolute inset-0"
      style={{ display: isActive ? 'block' : 'none' }}
      id={id}
      title={id}
    />
  );
}

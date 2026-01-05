import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Blockly() {
  const navigate = useNavigate();

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

  return (
    <iframe
      src="http://127.0.0.1:8000"
      className="w-full h-full border-0"
      title="Blockly IDE"
    />
  );
}

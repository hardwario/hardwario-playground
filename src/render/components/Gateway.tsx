import { useState, useEffect, useCallback, useRef } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import type { SerialPortInfo, GatewayStatus } from '../../../electron/preload';

export default function Gateway() {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [gatewayOnline, setGatewayOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubPortList = window.electronAPI.gateway.onPortList((newPorts) => {
      console.log('GatewayPortList:ipcPortListUpdate', newPorts);

      setPorts((prevPorts) => {
        let changed = false;

        if (prevPorts.length === newPorts.length) {
          for (let i = 0; i < newPorts.length; i++) {
            if (prevPorts[i].path !== newPorts[i].path) {
              changed = true;
              break;
            }
          }
        } else {
          changed = true;
        }

        if (changed) {
          // Update selected port if needed
          setSelectedPort((prevSelected) => {
            if (prevSelected === '' && newPorts.length > 0) {
              return newPorts[0].path;
            } else if (newPorts.length === 0) {
              return '';
            }
            return prevSelected;
          });
          return newPorts;
        }

        return prevPorts;
      });

      // Poll for port updates
      timerRef.current = setTimeout(() => {
        window.electronAPI.gateway.getPortList();
      }, 1000);
    });

    const unsubStatus = window.electronAPI.gateway.onStatus((payload: GatewayStatus) => {
      const isOnline = payload.status === 'online';
      setGatewayOnline(isOnline);
      setError(payload.error || null);
    });

    const unsubDevice = window.electronAPI.gateway.onDevice((device) => {
      if (device) {
        setSelectedPort(device);
      }
    });

    // Request initial data
    window.electronAPI.gateway.getDevice();
    window.electronAPI.gateway.getPortList();
    window.electronAPI.gateway.getStatus();

    return () => {
      unsubPortList();
      unsubStatus();
      unsubDevice();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleButtonClick = useCallback(() => {
    if (gatewayOnline) {
      window.electronAPI.gateway.disconnect();
      return;
    }

    if (selectedPort === '') return;

    console.log('Connecting to:', selectedPort);
    window.electronAPI.gateway.connect(selectedPort);
  }, [gatewayOnline, selectedPort]);

  const openExternal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.electronAPI.shell.openExternal(e.currentTarget.href);
  };

  return (
    <div id="gateway" className="p-2.5 m-1.5">
      {error && (
        <div className="alert-danger mb-4">
          <FiAlertCircle className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="font-medium whitespace-nowrap">Radio Dongle</label>
          <select
            className="form-control w-auto min-w-[200px]"
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
          >
            {ports.length === 0 && <option>(no device available)</option>}
            {ports.map((port, index) => (
              <option value={port.path} key={index}>
                {port.path}
                {port.serialNumber ? ` ${port.serialNumber}` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          disabled={ports.length === 0}
          className={gatewayOnline ? 'btn-danger' : 'btn-success'}
          onClick={handleButtonClick}
        >
          {gatewayOnline ? 'Disconnect' : 'Connect'}
        </button>

        {ports.length === 0 && (
          <a
            href="https://www.hardwario.com/doc/basics/quick-start-guide/#troubleshooting"
            onClick={openExternal}
            className="text-hardwario-primary hover:underline"
          >
            Can&apos;t see your connected device?
          </a>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { FiAlertCircle, FiWifi, FiWifiOff, FiRefreshCw, FiHelpCircle } from 'react-icons/fi';
import type { SerialPortInfo, GatewayStatus } from '../../../electron/preload';
import * as i18n from '../../utils/i18n';

export default function Gateway() {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [gatewayOnline, setGatewayOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Listen for port list updates (polling is handled by App.tsx)
    const unsubPortList = window.electronAPI.gateway.onPortList((newPorts) => {
      setPorts((prevPorts) => {
        let changed = prevPorts.length !== newPorts.length;
        if (!changed) {
          for (let i = 0; i < newPorts.length; i++) {
            if (prevPorts[i].path !== newPorts[i].path) {
              changed = true;
              break;
            }
          }
        }
        if (changed) {
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
    });

    const unsubStatus = window.electronAPI.gateway.onStatus((payload: GatewayStatus) => {
      const isOnline = payload.status === 'online';
      setGatewayOnline(isOnline);
      setError(payload.error || null);
      setIsConnecting(false);
    });

    const unsubDevice = window.electronAPI.gateway.onDevice((device) => {
      if (device) {
        setSelectedPort(device);
      }
    });

    window.electronAPI.gateway.getDevice();
    window.electronAPI.gateway.getStatus();

    return () => {
      unsubPortList();
      unsubStatus();
      unsubDevice();
    };
  }, []);

  const handleButtonClick = useCallback(() => {
    if (gatewayOnline) {
      window.electronAPI.gateway.disconnect();
      return;
    }

    if (selectedPort === '') return;

    setIsConnecting(true);
    window.electronAPI.gateway.connect(selectedPort);
  }, [gatewayOnline, selectedPort]);

  const handleRefresh = useCallback(() => {
    window.electronAPI.gateway.getPortList();
  }, []);

  const openExternal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.electronAPI.shell.openExternal(e.currentTarget.href);
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-800">{i18n.__('Radio Dongle')}</h2>
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {gatewayOnline ? (
              <>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-sm text-green-600 font-medium">{i18n.__('Connected')}</span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
                <span className="text-sm text-gray-500">{i18n.__('Disconnected')}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title={i18n.__('Refresh device list')}
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
          <FiAlertCircle className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {ports.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FiWifiOff className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{i18n.__('No device found')}</h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
              {i18n.__('Connect your HARDWARIO Radio Dongle via USB to get started.')}
            </p>
            <a
              href="https://www.hardwario.com/doc/basics/quick-start-guide/#troubleshooting"
              onClick={openExternal}
              className="inline-flex items-center gap-1 text-hardwario-primary hover:underline text-sm"
            >
              <FiHelpCircle className="w-4 h-4" />
              {i18n.__('Need help? View troubleshooting guide')}
            </a>
          </div>
        ) : (
          /* Device Selection */
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i18n.__('Manage Devices')}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-hardwario-primary focus:border-transparent transition-shadow"
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                disabled={gatewayOnline}
              >
                {ports.map((port, index) => (
                  <option value={port.path} key={index}>
                    {port.path}
                    {port.serialNumber ? ` (${port.serialNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-6">
              <button
                disabled={(!gatewayOnline && ports.length === 0) || isConnecting}
                className={`
                  px-6 py-2 font-medium transition-all duration-200 flex items-center gap-2
                  ${gatewayOnline
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                onClick={handleButtonClick}
              >
                {isConnecting ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    {i18n.__('Connecting...')}
                  </>
                ) : gatewayOnline ? (
                  <>
                    <FiWifiOff className="w-4 h-4" />
                    {i18n.__('Disconnect')}
                  </>
                ) : (
                  <>
                    <FiWifi className="w-4 h-4" />
                    {i18n.__('Connect')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import Select from 'react-select';
import { HashRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { FiAlertTriangle, FiWifi, FiWifiOff, FiRefreshCw, FiX, FiZoomIn, FiZoomOut, FiChevronDown, FiGlobe, FiCpu, FiMessageSquare, FiDownload, FiHelpCircle, FiExternalLink, FiBook, FiVideo, FiGrid } from 'react-icons/fi';
import type { SerialPortInfo } from '../../electron/preload';

import { useRadioManager } from './hooks/useRadioManager';
import { useMqttLog } from './hooks/useMqttLog';
import { useLanguage } from './hooks/useLanguage';

import MqttLog from './components/MqttLog';
import Settings from './components/Settings';
import Firmware from './components/Firmware';
import Devices from './components/Devices';
import RouteIframe from './components/RouteIframe';

// Import i18n
import * as i18n from '../utils/i18n';

// Import logos
import logoShort from '../assets/images/hw-logo-pos.svg';
import logoLong from '../assets/images/hardwario-playground.svg';
import logoNoText from '../assets/images/hw-mark-pos.svg';

// Modal title keys for each route (will be translated)
const modalTitleKeys: Record<string, string> = {
  '/devices': 'Devices',
  '/messages': 'Messages',
  '/settings': 'Settings',
  '/firmware': 'Firmware',
};

// Modal icons for each route
const modalIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '/devices': FiCpu,
  '/messages': FiMessageSquare,
  '/settings': FiGlobe,
  '/firmware': FiDownload,
};

// Hardware dropdown component for Devices, Messages, and Firmware (responsive)
function HardwareDropdown({ gwOffline, mqttOffline }: { gwOffline: boolean; mqttOffline: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isActive = location.pathname === '/devices' || location.pathname === '/messages' || location.pathname.startsWith('/firmware');
  const hasWarning = gwOffline || mqttOffline;

  const openExternal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    if (href) {
      window.electronAPI.shell.openExternal(href);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center md:hidden" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 mx-1 text-xs font-semibold uppercase rounded transition-all
          ${isActive
            ? 'bg-hardwario-primary text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
      >
        <FiCpu className="w-3.5 h-3.5" />
        {i18n.__('Hardware')}
        {hasWarning && <FiAlertTriangle className="ml-0.5 text-amber-500" />}
        <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg min-w-[160px] z-[100] rounded">
          <NavLink
            to="/devices"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm uppercase text-gray-600 hover:bg-gray-50 hover:text-hardwario-primary ${isActive ? 'bg-blue-50/50 text-hardwario-primary' : ''}`
            }
            onClick={() => setIsOpen(false)}
            title={gwOffline ? i18n.__('No Radio Dongle connected') : undefined}
          >
            <FiCpu className="w-4 h-4" />
            {i18n.__('Devices')}
            {gwOffline && <FiAlertTriangle className="ml-1 text-amber-500" />}
          </NavLink>
          <NavLink
            to="/messages"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm uppercase text-gray-600 hover:bg-gray-50 hover:text-hardwario-primary ${isActive ? 'bg-blue-50/50 text-hardwario-primary' : ''}`
            }
            onClick={() => setIsOpen(false)}
            title={mqttOffline ? i18n.__('MQTT broker is shut down') : undefined}
          >
            <FiMessageSquare className="w-4 h-4" />
            {i18n.__('Messages')}
            {mqttOffline && <FiAlertTriangle className="ml-1 text-amber-500" />}
          </NavLink>
          <NavLink
            to="http://localhost:1880/ui"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm uppercase text-gray-600 hover:bg-gray-50 hover:text-hardwario-primary ${isActive ? 'bg-blue-50/50 text-hardwario-primary' : ''}`
            }
            onClick={openExternal}
          >
            <FiGrid className="w-3.5 h-3.5" />
            {i18n.__('Dashboard')}
          </NavLink>
          <NavLink
            to="/firmware"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm uppercase text-gray-600 hover:bg-gray-50 hover:text-hardwario-primary ${isActive ? 'bg-blue-50/50 text-hardwario-primary' : ''}`
            }
            onClick={() => setIsOpen(false)}
          >
            <FiDownload className="w-4 h-4" />
            {i18n.__('Firmware')}
          </NavLink>
        </div>
      )}
    </div>
  );
}


// Language switcher component
function LanguageSwitcher({ language, setLanguage, availableLanguages }: {
  language: string;
  setLanguage: (lang: string) => void;
  availableLanguages: { code: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative h-full flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-gray-500 hover:text-hardwario-primary hover:bg-gray-100 rounded transition-colors"
        title={i18n.__('Language')}
      >
        <FiGlobe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{language}</span>
        <FiChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 shadow-lg min-w-[120px] z-[100]">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-hardwario-primary ${language === lang.code ? 'bg-blue-50/50 text-hardwario-primary font-medium' : 'text-gray-600'
                }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Modal wrapper component
function ModalPage({ children, title, wide }: { children: React.ReactNode; title?: string; wide?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    navigate('/functions');
  };

  const titleKey = title || modalTitleKeys[location.pathname] || '';
  const modalTitle = titleKey ? i18n.__(titleKey) : '';
  const IconComponent = modalIcons[location.pathname];

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className={`flex flex-col shadow-2xl rounded ${wide ? 'w-[90svw] h-auto max-h-[80vh] my-10' : 'w-[90svw] h-[80vh]'}`}
        style={{
          background: 'linear-gradient(to right, #f3f4f6 0%, #f9fafb 20%, #ffffff 50%, #f9fafb 80%, #f3f4f6 100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-200">
          <h2 className="font-semibold text-lg text-hardwario-nearblack uppercase flex items-center gap-2">
            {IconComponent && <IconComponent className="w-5 h-5" />}
            {modalTitle}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={i18n.__('Close')}
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [gatewayStatus, setGatewayStatus] = useState<string>('unknown');
  const [noderedStatus, setNoderedStatus] = useState<string>('unknown');
  const [brokerStatus, setBrokerStatus] = useState<string>('unknown');
  const [mqttIp, setMqttIp] = useState<string>('127.0.0.1');

  // Gateway connection state
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Language hook
  const { language, setLanguage, availableLanguages } = useLanguage();

  // Initialize hooks with MQTT URL
  const mqttUrl = `mqtt://${mqttIp}`;
  const radioManager = useRadioManager(mqttUrl);
  const mqttLog = useMqttLog(mqttUrl);

  const gatewayOnline = gatewayStatus === 'online';

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(100);
  const ZOOM_MIN = 50;
  const ZOOM_MAX = 200;

  useEffect(() => {
    window.electronAPI.nodered.setDirty(false);

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      if (!data || data.source !== 'hardwario-nodered-dirty-bridge' || data.type !== 'dirty-state') {
        return;
      }

      window.electronAPI.nodered.setDirty(!!data.dirty);
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.electronAPI.nodered.setDirty(false);
    };
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (zoomLevel >= ZOOM_MAX) return;
    window.electronAPI.zoom.zoomIn();
    window.electronAPI.zoom.get().then(setZoomLevel);
  }, [zoomLevel]);

  const handleZoomOut = useCallback(() => {
    if (zoomLevel <= ZOOM_MIN) return;
    window.electronAPI.zoom.zoomOut();
    window.electronAPI.zoom.get().then(setZoomLevel);
  }, [zoomLevel]);

  const handleZoomReset = useCallback(() => {
    window.electronAPI.zoom.reset();
    setZoomLevel(100);
  }, []);

  useEffect(() => {
    console.log('App:componentDidMount');

    // Subscribe to status updates
    const unsubGateway = window.electronAPI.gateway.onStatus((payload) => {
      setGatewayStatus(payload.status);
      setIsConnecting(false);

      // Clear any pending connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Show connection status toast
      if (payload.status === 'offline' && payload.error) {
        toast.error(`${i18n.__('Connection failed')}: ${payload.error}`);
      }
    });

    const unsubNodered = window.electronAPI.nodered.onStatus((status) => {
      if (noderedStatus !== status) {
        setNoderedStatus(status);
      }
    });

    const unsubBroker = window.electronAPI.broker.onStatus((status) => {
      if (brokerStatus !== status) {
        setBrokerStatus(status);
      }
    });

    const unsubMqttIp = window.electronAPI.settings.onValue('mqtt.ip', (ip) => {
      setMqttIp(ip as string);
    });

    // Subscribe to port list updates
    const unsubPortList = window.electronAPI.gateway.onPortList((rawPorts) => {
      let newPorts = [];
      if (rawPorts.some(p => p.parentId)) {
        newPorts = rawPorts.filter(p => p.parentId?.includes('usb-dongle'));
      }
      else {
        newPorts = rawPorts.filter(p => p.serialNumber?.includes('usb-dongle'));
      }
      setPorts((prevPorts) => {
        let changed = prevPorts.length !== newPorts.length;
        if (!changed) {
          for (let i = 0; i < newPorts.length; i++) {
            if (prevPorts[i].path !== newPorts[i].path ||
              prevPorts[i].serialNumber !== newPorts[i].serialNumber) {
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

      // Clear previous timeout before setting new one
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        window.electronAPI.gateway.getPortList();
      }, 2000); // Poll every 2 seconds instead of 1
    });

    const unsubDevice = window.electronAPI.gateway.onDevice((device) => {
      if (device) {
        setSelectedPort(device);
      }
    });

    // Request initial status
    window.electronAPI.gateway.getStatus();
    window.electronAPI.nodered.getStatus();
    window.electronAPI.broker.getStatus();
    window.electronAPI.gateway.getPortList();
    window.electronAPI.gateway.getDevice();

    // Get initial MQTT IP
    window.electronAPI.settings.get('mqtt.ip').then((ip) => {
      if (ip) setMqttIp(ip as string);
    });

    // Get initial language
    window.electronAPI.settings.get('language').then((lang) => {
      if (lang) {
        i18n.setup(lang as string);
      }
    });

    // Get initial zoom level
    window.electronAPI.zoom.get().then(setZoomLevel);

    return () => {
      console.log('App:componentWillUnmount');
      unsubGateway();
      unsubNodered();
      unsubBroker();
      unsubMqttIp();
      unsubPortList();
      unsubDevice();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  const gwOffline = gatewayStatus === 'offline';
  const mqttOffline = brokerStatus === 'offline';

  // Gateway connection handlers
  const handleConnect = useCallback(() => {
    if (gatewayOnline) {
      window.electronAPI.gateway.disconnect();
      return;
    }
    if (selectedPort === '') return;
    setIsConnecting(true);

    // Add timeout to prevent infinite connecting state
    connectionTimeoutRef.current = setTimeout(() => {
      setIsConnecting(false);
      connectionTimeoutRef.current = null;
      toast.error(i18n.__('Connection timeout - device may be busy or unavailable'));
    }, 1000); // 10 second timeout

    window.electronAPI.gateway.connect(selectedPort);
  }, [gatewayOnline, selectedPort]);

  const openExternal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    if (href) {
      window.electronAPI.shell.openExternal(href);
    }
  };

  const formatPortLabel = (port: SerialPortInfo) => {
    const parts = [port.path];
    if (port.parentId) {
      parts.push(`${port.parentId.split('\\').slice(-1)[0]}`);
    }
    else {
      if (port.serialNumber) {
        parts.push(`${port.serialNumber}`);
      }
    }

    return parts.join(" ");
  };

  return (
    <HashRouter>
      <div id="app" className="flex flex-col h-full w-full" key={language}>
        {/* Top Navigation */}
        <header id="navbar" className="w-full relative z-50 overflow-visible">
          <nav className="navbar overflow-visible">
            <a
              href="https://www.hardwario.com/"
              onClick={openExternal}
              className="navbar-brand"
            >
              <img src={logoNoText} className="h-6 block lg:hidden" alt="HARDWARIO Logo" />
              <img src={logoShort} className="h-6 hidden lg:block xl:hidden" alt="HARDWARIO Logo" />
              <img src={logoLong} className="h-6 hidden xl:block" alt="HARDWARIO Playground" />
            </a>

            <div className="navbar-nav">
              {/* Hardware dropdown - visible only on small screens */}
              <HardwareDropdown gwOffline={gwOffline} mqttOffline={mqttOffline} />

              {/* Individual links - visible only on medium+ screens */}
              <div className="flex flex-wrap gap-1">
                <NavLink
                  to="/devices"
                  className={({ isActive }) =>
                    `hidden md:flex items-center gap-1.5 px-3 py-1.5 mx-1 text-xs font-semibold uppercase rounded transition-all
                  ${isActive
                      ? 'bg-hardwario-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }
                  title={gwOffline ? i18n.__('No Radio Dongle connected') : undefined}
                >
                  <FiCpu className="w-3.5 h-3.5" />
                  {i18n.__('Devices')}
                  {gwOffline && <FiAlertTriangle className="ml-0.5 text-amber-500" />}
                </NavLink>

                <NavLink
                  to="/messages"
                  className={({ isActive }) =>
                    `hidden md:flex items-center gap-1.5 px-3 py-1.5 mx-1 text-xs font-semibold uppercase rounded transition-all
                  ${isActive
                      ? 'bg-hardwario-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }
                  title={mqttOffline ? i18n.__('MQTT broker is shut down') : undefined}
                >
                  <FiMessageSquare className="w-3.5 h-3.5" />
                  {i18n.__('Messages')}
                  {mqttOffline && <FiAlertTriangle className="ml-0.5 text-amber-500" />}
                </NavLink>

                <NavLink
                  to="http://localhost:1880/ui"
                  title={i18n.__('Dashboard')}
                  className={({ isActive }) =>
                    `hidden md:flex items-center gap-1.5 px-3 py-1.5 mx-1 text-xs font-semibold uppercase rounded transition-all
                  ${isActive
                      ? 'bg-hardwario-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }
                  onClick={openExternal}
                >
                  <FiGrid className="w-3.5 h-3.5" />
                </NavLink>

                <NavLink
                  to="/firmware"
                  className={({ isActive }) =>
                    `hidden md:flex items-center gap-1.5 px-3 py-1.5 mx-1 text-xs font-semibold uppercase rounded transition-all
                  ${isActive
                      ? 'bg-hardwario-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  {i18n.__('Firmware')}
                </NavLink>
              </div>

            </div>

            {/* Right side - Controls */}
            <div className="ml-auto flex items-center h-full min-w-0">
              {/* Language Switcher */}
              <div className="px-2 h-full flex items-center border-l border-gray-200">
                <LanguageSwitcher
                  language={language}
                  setLanguage={setLanguage}
                  availableLanguages={availableLanguages}
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5 px-3 h-full border-l border-gray-200">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= ZOOM_MIN}
                  className="p-1.5 text-gray-500 hover:text-hardwario-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                  title={i18n.__('Zoom Out')}
                >
                  <FiZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-2 py-1 text-gray-600 text-xs font-medium hover:bg-gray-100 rounded transition-colors min-w-[40px]"
                  title={i18n.__('Reset Zoom')}
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= ZOOM_MAX}
                  className="p-1.5 text-gray-500 hover:text-hardwario-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                  title={i18n.__('Zoom In')}
                >
                  <FiZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Help Dropdown */}
              <div className="relative flex items-center px-2 h-full border-l border-gray-200">
                <div className="relative group">
                  <button
                    className="p-1.5 text-gray-500 hover:text-hardwario-primary hover:bg-gray-100 rounded transition-colors"
                    title={i18n.__('Help & Resources')}
                  >
                    <FiHelpCircle className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-2">
                      <a
                        href="https://forum.hardwario.com/"
                        onClick={openExternal}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FiMessageSquare className="w-4 h-4 text-blue-500" />
                        <span>{i18n.__('Community Forum')}</span>
                        <FiExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                      </a>
                      <a
                        href="https://www.youtube.com/watch?v=3AR432bguOY&list=PLKYvTRORAnx6a9tETvF95o35mykuysuOw"
                        onClick={openExternal}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FiVideo className="w-4 h-4 text-purple-500" />
                        <span>{i18n.__('Video Tutorials')}</span>
                        <FiExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                      </a>
                      <a
                        href="https://docs.hardwario.com/"
                        onClick={openExternal}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FiBook className="w-4 h-4 text-green-500" />
                        <span>{i18n.__('Documentation')}</span>
                        <FiExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                      </a>
                      <a
                        href="https://docs.hardwario.com/tower/mqtt-protocol/topics-reference"
                        onClick={openExternal}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FiCpu className="w-4 h-4 text-amber-500" />
                        <span>{i18n.__('MQTT Topics')}</span>
                        <FiExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gateway Controls */}
              <div className="flex items-center gap-1 px-2 h-full border-l border-gray-200">
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-2">
                  {radioManager.pairingMode ? (
                    <>
                      <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </span>
                      <span className="hidden xl:inline text-xs text-amber-600 font-medium">
                        {i18n.__('Pairing')}
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${gatewayOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={gatewayOnline ? i18n.__('Connected') : i18n.__('Disconnected')}
                      ></div>
                      <span className="hidden xl:inline text-xs text-gray-500 font-medium">
                        {gatewayOnline ? i18n.__('Connected') : i18n.__('Disconnected')}
                      </span>
                    </>
                  )}
                </div>

                <Select<{ value: string; label: string }>
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '28px',
                      height: '28px',
                      fontSize: '0.75rem',
                      borderColor: '#d1d5db',
                      boxShadow: 'none',
                      minWidth: '80px',
                      maxWidth: '150px',
                      '&:hover': { borderColor: '#9ca3af' },
                    }),
                    valueContainer: (base) => ({ ...base, padding: '0 6px', flexWrap: 'nowrap' }),
                    placeholder: (base) => ({ ...base, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
                    indicatorsContainer: (base) => ({ ...base, height: '28px' }),
                    dropdownIndicator: (base) => ({ ...base, padding: '0 4px' }),
                    option: (base, state) => ({
                      ...base,
                      fontSize: '0.75rem',
                      backgroundColor: state.isSelected ? '#1f2937' : state.isFocused ? '#f3f4f6' : 'white',
                      color: state.isSelected ? 'white' : '#374151',
                      padding: '6px 12px',
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                  options={ports.map((p) => ({ value: p.path, label: formatPortLabel(p) }))}
                  value={selectedPort ? { value: selectedPort, label: formatPortLabel(ports.find(p => p.path === selectedPort) ?? { path: selectedPort }) } : null}
                  onChange={(selected) => selected && setSelectedPort(selected.value)}
                  isDisabled={gatewayOnline || ports.length === 0}
                  isClearable={false}
                  isSearchable={false}
                  placeholder={i18n.__('No device')}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
                <button
                  disabled={(!gatewayOnline && ports.length === 0) || isConnecting}
                  className={`
                    px-2 py-1.5 text-xs font-semibold uppercase rounded flex items-center gap-1 transition-all
                    ${gatewayOnline
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                      : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  onClick={handleConnect}
                  title={isConnecting ? i18n.__('Connecting') : gatewayOnline ? i18n.__('Disconnect') : i18n.__('Connect')}
                >
                  {isConnecting ? (
                    <>
                      <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span className="hidden lg:inline">{i18n.__('Connecting')}</span>
                    </>
                  ) : gatewayOnline ? (
                    <>
                      <FiWifiOff className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">{i18n.__('Disconnect')}</span>
                    </>
                  ) : (
                    <>
                      <FiWifi className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">{i18n.__('Connect')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-white relative overflow-hidden">
          {/* Functions (Node-RED) is always visible as background */}
          <RouteIframe path="/functions" src="http://127.0.0.1:1880/" id="node-red" alwaysVisible />

          {/* Modal routes - appear on top of Functions */}
          <Routes>
            <Route path="/" element={null} />
            <Route path="/devices" element={<ModalPage><Devices radioManager={radioManager} /></ModalPage>} />
            <Route path="/messages" element={<ModalPage><MqttLog mqttLog={mqttLog} /></ModalPage>} />
            <Route path="/settings" element={<ModalPage><Settings /></ModalPage>} />
            <Route path="/firmware" element={<ModalPage wide><Firmware /></ModalPage>} />
            <Route path="/firmware/:fw" element={<ModalPage wide><Firmware /></ModalPage>} />
          </Routes>
        </main>

        <ToastContainer position="top-right" autoClose={2000} closeOnClick />
      </div>
    </HashRouter>
  );
}

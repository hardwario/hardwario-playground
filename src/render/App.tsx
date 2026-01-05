import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { FiAlertTriangle } from 'react-icons/fi';

import { useRadioManager } from './hooks/useRadioManager';
import { useMqttLog } from './hooks/useMqttLog';

import MqttLog from './components/MqttLog';
import Settings from './components/Settings';
import Firmware from './components/Firmware';
import Devices from './components/Devices';
import Blockly from './components/Blockly';
import RouteIframe from './components/RouteIframe';

// Import i18n
import * as i18n from '../utils/i18n';

// Import logo
import logoWhite from '../assets/images/hw-logo-white.svg';

export default function App() {
  const [gatewayStatus, setGatewayStatus] = useState<string>('unknown');
  const [noderedStatus, setNoderedStatus] = useState<string>('unknown');
  const [brokerStatus, setBrokerStatus] = useState<string>('unknown');
  const [mqttIp, setMqttIp] = useState<string>('127.0.0.1');

  // Initialize hooks with MQTT URL
  const mqttUrl = `mqtt://${mqttIp}`;
  const radioManager = useRadioManager(mqttUrl);
  const mqttLog = useMqttLog(mqttUrl);

  useEffect(() => {
    console.log('App:componentDidMount');

    // Subscribe to status updates
    const unsubGateway = window.electronAPI.gateway.onStatus((payload) => {
      if (gatewayStatus !== payload.status) {
        setGatewayStatus(payload.status);
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

    // Request initial status
    window.electronAPI.gateway.getStatus();
    window.electronAPI.nodered.getStatus();
    window.electronAPI.broker.getStatus();

    // Get initial MQTT IP
    window.electronAPI.settings.get('mqtt.ip').then((ip) => {
      if (ip) setMqttIp(ip as string);
    });

    return () => {
      console.log('App:componentWillUnmount');
      unsubGateway();
      unsubNodered();
      unsubBroker();
      unsubMqttIp();
    };
  }, []);

  const gwOffline = gatewayStatus === 'offline';
  const nodeRedOffline = noderedStatus === 'offline';
  const mqttOffline = brokerStatus === 'offline';

  const openExternal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    if (href) {
      window.electronAPI.shell.openExternal(href);
    }
  };

  return (
    <HashRouter>
      <div id="app" className="flex h-full w-full">
        {/* Sidebar Navigation */}
        <div id="navbar" className="h-full">
          <aside className="navbar animate-slide-right w-[120px]">
            <nav className="navbar-nav">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`
                }
                title={gwOffline ? 'No Radio Dongle connected' : undefined}
              >
                {i18n.__('Devices')}
                {gwOffline && <FiAlertTriangle className="text-hardwario-warning" />}
              </NavLink>

              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`
                }
                title={mqttOffline ? 'MQTT broker is shut down' : undefined}
              >
                {i18n.__('Messages')}
                {mqttOffline && <FiAlertTriangle className="text-hardwario-warning" />}
              </NavLink>

              <NavLink
                to="/functions"
                className={({ isActive }) =>
                  `nav-link flex items-center justify-between ${isActive ? 'active' : ''}`
                }
                title={nodeRedOffline ? 'Node-RED is shut down' : undefined}
              >
                {i18n.__('Functions')}
                {nodeRedOffline && <FiAlertTriangle className="text-hardwario-warning" />}
              </NavLink>

              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {i18n.__('dashboard')}
              </NavLink>

              <NavLink
                to="/blockly"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {i18n.__('Blockly (Beta)')}
              </NavLink>

              <NavLink
                to="/firmware"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {i18n.__('firmware')}
              </NavLink>

              <a
                href="https://tower.hardwario.com/en/latest/basics/hardwario-playground"
                onClick={openExternal}
                className="nav-link"
              >
                {i18n.__('Help')}
              </a>
            </nav>

            <a
              href="https://www.hardwario.com/"
              onClick={openExternal}
              className="block p-3"
            >
              <img src={logoWhite} className="w-[100px]" alt="HARDWARIO Logo" />
            </a>
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-white relative overflow-auto">
          <Routes>
            <Route path="/" element={<Devices radioManager={radioManager} />} />
            <Route path="/messages" element={<MqttLog mqttLog={mqttLog} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/blockly" element={<Blockly />} />
            <Route path="/firmware" element={<Firmware />} />
            <Route path="/firmware/:fw" element={<Firmware />} />
          </Routes>

          {/* Iframe routes - always mounted but visibility controlled by path */}
          <RouteIframe path="/functions" src="http://127.0.0.1:1880/" id="node-red" />
          <RouteIframe path="/dashboard" src="http://127.0.0.1:1880/ui" id="node-red-dashboard" />
        </main>

        <ToastContainer position="top-right" autoClose={2000} closeOnClick />
      </div>
    </HashRouter>
  );
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';

// Types
export interface GatewayInfo {
  id?: string;
  firmware?: string;
  version?: string;
}

export interface Node {
  id: string;
  alias?: string;
  firmware?: string;
  version?: string;
}

interface UseRadioManagerReturn {
  mqttConnected: boolean;
  gatewayConnected: boolean;
  info: GatewayInfo;
  nodes: Node[];
  pairingMode: boolean;
  lastAttach: string | null;
  pairingStart: () => void;
  pairingStop: () => void;
  nodeListUpdate: () => void;
  nodeRename: (id: string, newAlias: string) => void;
  nodeRemove: (id: string) => void;
}

const GATEWAY_TOPICS = [
  '/info',
  '/nodes',
  '/attach',
  '/detach',
  '/alias/set/ok',
  '/alias/remove/ok',
  '/pairing-mode',
];

export function useRadioManager(mqttUrl: string | null, name = 'usb-dongle'): UseRadioManagerReturn {
  // Convert mqtt:// to ws:// for browser MQTT client (WebSocket on port 9001)
  const wsUrl = mqttUrl
    ? mqttUrl.replace(/^mqtt:\/\//, 'ws://').replace(/:1883/, ':9001').replace(/^(ws:\/\/[^/:]+)$/, '$1:9001')
    : null;
  const [mqttConnected, setMqttConnected] = useState(false);
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [info, setInfo] = useState<GatewayInfo>({});
  const [nodes, setNodes] = useState<Node[]>([]);
  const [pairingMode, setPairingMode] = useState(false);
  const [lastAttach, setLastAttach] = useState<string | null>(null);

  const clientRef = useRef<MqttClient | null>(null);
  const urlRef = useRef<string | null>(null);

  // Publish helper
  const publish = useCallback((topic: string, payload: unknown = null) => {
    if (clientRef.current && mqttConnected) {
      clientRef.current.publish(topic, JSON.stringify(payload));
    }
  }, [mqttConnected]);

  // Connect to MQTT
  useEffect(() => {
    if (!mqttUrl) return;

    // Don't reconnect if URL is the same
    if (urlRef.current === wsUrl && clientRef.current) return;

    // Cleanup existing connection
    if (clientRef.current) {
      clientRef.current.end(true);
      setMqttConnected(false);
      setGatewayConnected(false);
    }

    urlRef.current = wsUrl;
    const client = mqtt.connect(wsUrl as string);
    clientRef.current = client;

    client.on('connect', () => {
      setMqttConnected(true);

      // Subscribe to gateway topics
      GATEWAY_TOPICS.forEach((topic) => {
        client.subscribe(`gateway/${name}${topic}`);
      });
      client.subscribe('node/+/info');

      // Request gateway info
      client.publish('gateway/all/info/get', '');

      // Check gateway connection after timeout
      setTimeout(() => {
        if (!gatewayConnected) {
          setGatewayConnected(false);
        }
      }, 1000);
    });

    client.on('disconnect', () => {
      setMqttConnected(false);
      setGatewayConnected(false);
      setInfo({});
      setNodes([]);
      setPairingMode(false);
    });

    client.on('message', (topic, message) => {
      let payload: unknown;
      try {
        payload = JSON.parse(message.toString());
      } catch {
        console.error('Failed to parse MQTT message:', message.toString());
        return;
      }

      if (topic === `gateway/${name}/info`) {
        setInfo(payload as GatewayInfo);
        if (payload) {
          setGatewayConnected(true);
          client.publish(`gateway/${name}/nodes/get`, '');
        } else {
          setGatewayConnected(false);
          setNodes([]);
          setPairingMode(false);
        }
      } else if (topic === `gateway/${name}/nodes`) {
        setNodes(payload as Node[]);
      } else if (topic === `gateway/${name}/pairing-mode`) {
        setPairingMode(payload === 'start');
      } else if (topic === `gateway/${name}/attach`) {
        // Stop pairing and refresh nodes
        client.publish(`gateway/${name}/pairing-mode/stop`, '');
        client.publish(`gateway/${name}/nodes/get`, '');
        setLastAttach(payload as string);
        // Clear last attach after 3 seconds
        setTimeout(() => setLastAttach(null), 3000);
      } else {
        // Refresh nodes on other gateway events
        client.publish(`gateway/${name}/nodes/get`, '');
      }
    });

    return () => {
      client.end(true);
      clientRef.current = null;
      urlRef.current = null;
    };
  }, [wsUrl, name]);

  // Actions
  const pairingStart = useCallback(() => {
    publish(`gateway/${name}/pairing-mode/start`);
  }, [publish, name]);

  const pairingStop = useCallback(() => {
    publish(`gateway/${name}/pairing-mode/stop`);
  }, [publish, name]);

  const nodeListUpdate = useCallback(() => {
    publish(`gateway/${name}/nodes/get`);
  }, [publish, name]);

  const nodeRename = useCallback((id: string, newAlias: string) => {
    publish(`gateway/${name}/alias/set`, { id, alias: newAlias });
  }, [publish, name]);

  const nodeRemove = useCallback((id: string) => {
    publish(`gateway/${name}/nodes/remove`, id);
  }, [publish, name]);

  return useMemo(() => ({
    mqttConnected,
    gatewayConnected,
    info,
    nodes,
    pairingMode,
    lastAttach,
    pairingStart,
    pairingStop,
    nodeListUpdate,
    nodeRename,
    nodeRemove,
  }), [
    mqttConnected,
    gatewayConnected,
    info,
    nodes,
    pairingMode,
    lastAttach,
    pairingStart,
    pairingStop,
    nodeListUpdate,
    nodeRename,
    nodeRemove,
  ]);
}

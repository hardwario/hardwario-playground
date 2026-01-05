import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';

// Types
export interface MqttMessage {
  topic: string;
  payload: string;
  time: Date;
  key: number;
}

interface UseMqttLogReturn {
  connected: boolean;
  messages: MqttMessage[];
  subscribed: string[];
  highlightedMessages: MqttMessage[];
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  unsubscribeAll: () => void;
  clear: () => void;
  publish: (topic: string, message: string) => void;
  addHighlightedMessage: (message: MqttMessage) => boolean;
  removeHighlightedMessage: (topic: string) => boolean;
  isHighlightedMessage: (topic: string) => boolean;
}

const MAX_MESSAGES = 50;
const DEFAULT_SUBSCRIPTIONS = ['node/#'];

export function useMqttLog(mqttUrl: string | null): UseMqttLogReturn {
  // Convert mqtt:// to ws:// for browser MQTT client (WebSocket on port 9001)
  const wsUrl = mqttUrl
    ? mqttUrl.replace(/^mqtt:\/\//, 'ws://').replace(/:1883/, ':9001').replace(/^(ws:\/\/[^/:]+)$/, '$1:9001')
    : null;

  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const [subscribed, setSubscribed] = useState<string[]>(DEFAULT_SUBSCRIPTIONS);
  const [highlightedMessages, setHighlightedMessages] = useState<Record<string, MqttMessage>>({});

  const clientRef = useRef<MqttClient | null>(null);
  const urlRef = useRef<string | null>(null);
  const counterRef = useRef(0);

  // Connect to MQTT
  useEffect(() => {
    if (!wsUrl) {
      console.log('useMqttLog: No WebSocket URL');
      return;
    }

    // Don't reconnect if URL is the same
    if (urlRef.current === wsUrl && clientRef.current) return;

    console.log('useMqttLog: Connecting to', wsUrl);

    // Cleanup existing connection
    if (clientRef.current) {
      clientRef.current.end(true);
      setConnected(false);
    }

    urlRef.current = wsUrl;
    const client = mqtt.connect(wsUrl);
    clientRef.current = client;

    client.on('connect', () => {
      console.log('useMqttLog: Connected to MQTT broker');
      setConnected(true);

      // Subscribe to default topics
      subscribed.forEach((topic) => {
        client.subscribe(topic);
      });
    });

    client.on('disconnect', () => {
      console.log('useMqttLog: Disconnected from MQTT broker');
      setConnected(false);
    });

    client.on('error', (err) => {
      console.error('useMqttLog: MQTT error', err);
    });

    client.on('message', (topic, data) => {
      const message: MqttMessage = {
        topic,
        payload: data.toString(),
        time: new Date(),
        key: counterRef.current++,
      };

      setMessages((prev) => {
        const updated = [...prev, message];
        if (updated.length > MAX_MESSAGES) {
          updated.shift();
        }
        return updated;
      });

      // Update highlighted message if exists
      setHighlightedMessages((prev) => {
        if (topic in prev) {
          return { ...prev, [topic]: message };
        }
        return prev;
      });
    });

    return () => {
      client.end(true);
      clientRef.current = null;
      urlRef.current = null;
    };
  }, [wsUrl]);

  // Re-subscribe when subscribed list changes
  useEffect(() => {
    if (!clientRef.current || !connected) return;

    subscribed.forEach((topic) => {
      clientRef.current?.subscribe(topic);
    });
  }, [subscribed, connected]);

  // Actions
  const subscribe = useCallback((topic: string) => {
    setSubscribed((prev) => {
      if (prev.includes(topic)) return prev;

      if (clientRef.current && connected) {
        clientRef.current.subscribe(topic);
      }

      return [...prev, topic];
    });
  }, [connected]);

  const unsubscribe = useCallback((topic: string) => {
    setSubscribed((prev) => {
      const index = prev.indexOf(topic);
      if (index === -1) return prev;

      if (clientRef.current && connected) {
        clientRef.current.unsubscribe(topic);
      }

      return prev.filter((t) => t !== topic);
    });
  }, [connected]);

  const unsubscribeAll = useCallback(() => {
    if (clientRef.current && connected) {
      subscribed.forEach((topic) => {
        clientRef.current?.unsubscribe(topic);
      });
    }
    setSubscribed([]);
  }, [connected, subscribed]);

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  const publish = useCallback((topic: string, message: string) => {
    if (clientRef.current && connected) {
      clientRef.current.publish(topic, message);
    }
  }, [connected]);

  const addHighlightedMessage = useCallback((message: MqttMessage): boolean => {
    if (message.topic in highlightedMessages) return false;

    setHighlightedMessages((prev) => ({
      ...prev,
      [message.topic]: message,
    }));
    return true;
  }, [highlightedMessages]);

  const removeHighlightedMessage = useCallback((topic: string): boolean => {
    if (!(topic in highlightedMessages)) return false;

    setHighlightedMessages((prev) => {
      const updated = { ...prev };
      delete updated[topic];
      return updated;
    });
    return true;
  }, [highlightedMessages]);

  const isHighlightedMessage = useCallback((topic: string): boolean => {
    return topic in highlightedMessages;
  }, [highlightedMessages]);

  return useMemo(() => ({
    connected,
    messages,
    subscribed,
    highlightedMessages: Object.values(highlightedMessages),
    subscribe,
    unsubscribe,
    unsubscribeAll,
    clear,
    publish,
    addHighlightedMessage,
    removeHighlightedMessage,
    isHighlightedMessage,
  }), [
    connected,
    messages,
    subscribed,
    highlightedMessages,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    clear,
    publish,
    addHighlightedMessage,
    removeHighlightedMessage,
    isHighlightedMessage,
  ]);
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import copy from 'copy-to-clipboard';
import {
  FiCopy, FiX, FiSend, FiPlus, FiTrash2, FiWifi, FiWifiOff,
  FiMessageSquare, FiHash
} from 'react-icons/fi';
import { BsPinAngleFill, BsPinAngle } from 'react-icons/bs';
import type { useMqttLog, MqttMessage } from '../hooks/useMqttLog';

interface MqttLogProps {
  mqttLog: ReturnType<typeof useMqttLog>;
}

function formatTime(time: Date): string {
  return time.toTimeString().split(' ')[0];
}

function formatPayload(payload: string): string {
  try {
    const parsed = JSON.parse(payload);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return payload;
  }
}

export default function MqttLog({ mqttLog }: MqttLogProps) {
  const {
    connected,
    messages,
    subscribed,
    highlightedMessages,
    subscribe,
    unsubscribe,
    clear,
    publish,
    addHighlightedMessage,
    removeHighlightedMessage,
    isHighlightedMessage,
  } = mqttLog;

  const [subTopic, setSubTopic] = useState('');
  const [pubTopic, setPubTopic] = useState('');
  const [pubPayload, setPubPayload] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleSubscribe = useCallback((e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (subTopic.trim()) {
      subscribe(subTopic.trim());
      setSubTopic('');
    }
  }, [subTopic, subscribe]);

  const handlePublish = useCallback((e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (pubTopic.trim()) {
      publish(pubTopic, pubPayload);
      toast.success('Message published');
    }
  }, [pubTopic, pubPayload, publish]);

  const handleCopyTopic = useCallback((message: MqttMessage) => {
    copy(message.topic);
    toast.success('Topic copied');
  }, []);

  const handleCopyPayload = useCallback((message: MqttMessage) => {
    copy(message.payload);
    toast.success('Payload copied');
  }, []);

  const handleKeyDownPub = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handlePublish(e);
    }
  }, [handlePublish]);

  const handleKeyDownSub = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubscribe(e);
    }
  }, [handleSubscribe]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-800">MQTT Messages</h2>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <FiWifi className="w-3 h-3" />
                  Connected
                </span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <FiWifiOff className="w-3 h-3" />
                  Disconnected
                </span>
              </>
            )}
          </div>

          {/* Message Count */}
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
            {messages.length} messages
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-scroll
          </label>
          <button
            onClick={clear}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
          >
            <FiTrash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Pinned Messages */}
        {highlightedMessages.length > 0 && (
          <div className="flex-shrink-0 px-4 py-2 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <BsPinAngleFill className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Pinned Messages</span>
            </div>
            <div className="space-y-1">
              {highlightedMessages.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-amber-200 rounded text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-gray-400 text-xs font-mono">{formatTime(item.time)}</span>
                    <span className="font-medium text-gray-800 truncate">{item.topic}</span>
                    <span className="text-gray-600 truncate">{item.payload}</span>
                  </div>
                  <button
                    onClick={() => removeHighlightedMessage(item.topic)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Unpin"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages List */}
        <div
          ref={messagesRef}
          className="flex-1 overflow-auto p-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FiMessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500 max-w-sm">
                {connected
                  ? 'Messages will appear here when received from subscribed topics.'
                  : 'Connect to MQTT broker to start receiving messages.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((item) => (
                <div
                  key={item.key}
                  className="bg-white border border-gray-200 rounded shadow-sm hover:shadow transition-shadow"
                >
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-mono">{formatTime(item.time)}</span>
                      <span
                        className="font-medium text-hardwario-primary cursor-pointer hover:underline"
                        onClick={() => handleCopyTopic(item)}
                        title="Click to copy topic"
                      >
                        {item.topic}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyTopic(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Copy topic"
                      >
                        <FiHash className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyPayload(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Copy payload"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                      </button>
                      {!isHighlightedMessage(item.topic) ? (
                        <button
                          onClick={() => addHighlightedMessage(item)}
                          className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded transition-colors"
                          title="Pin message"
                        >
                          <BsPinAngle className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => removeHighlightedMessage(item.topic)}
                          className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Unpin message"
                        >
                          <BsPinAngleFill className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <pre className="px-3 py-2 text-sm text-gray-700 font-mono whitespace-pre-wrap break-all bg-gray-50">
                    {formatPayload(item.payload)}
                  </pre>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        {/* Subscriptions */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Subscriptions</span>
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {subscribed.length}
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-hardwario-primary focus:border-transparent"
                placeholder="Enter topic to subscribe (e.g., node/#)"
                value={subTopic}
                onChange={(e) => setSubTopic(e.target.value)}
                onKeyDown={handleKeyDownSub}
              />
            </div>
            <button
              disabled={!connected || !subTopic.trim()}
              onClick={handleSubscribe}
              className="px-4 py-2 bg-hardwario-primary text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Subscribe
            </button>
          </div>
          {subscribed.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {subscribed.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded"
                >
                  <FiHash className="w-3 h-3" />
                  {topic}
                  <button
                    onClick={() => unsubscribe(topic)}
                    className="ml-1 p-0.5 hover:bg-blue-100 rounded transition-colors"
                    title="Unsubscribe"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Publish */}
        <div className="px-4 py-3">
          <span className="text-sm font-medium text-gray-700 mb-2 block">Publish Message</span>
          <div className="flex gap-2">
            <input
              type="text"
              className="w-1/3 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-hardwario-primary focus:border-transparent"
              placeholder="Topic"
              value={pubTopic}
              onChange={(e) => setPubTopic(e.target.value)}
              onKeyDown={handleKeyDownPub}
            />
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-hardwario-primary focus:border-transparent"
              placeholder="Payload (JSON or text)"
              value={pubPayload}
              onChange={(e) => setPubPayload(e.target.value)}
              onKeyDown={handleKeyDownPub}
            />
            <button
              disabled={!connected || !pubTopic.trim()}
              onClick={handlePublish}
              className="px-4 py-2 bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FiSend className="w-4 h-4" />
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

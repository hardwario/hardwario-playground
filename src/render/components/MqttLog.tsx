import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import copy from 'copy-to-clipboard';
import { FiClipboard, FiX } from 'react-icons/fi';
import { BsPinAngle } from 'react-icons/bs';
import type { useMqttLog, MqttMessage } from '../hooks/useMqttLog';

interface MqttLogProps {
  mqttLog: ReturnType<typeof useMqttLog>;
}

function formatTime(time: Date): string {
  return time.toTimeString().split(' ')[0];
}

export default function MqttLog({ mqttLog }: MqttLogProps) {
  const {
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
  } = mqttLog;

  const [subTopic, setSubTopic] = useState('');
  const [pubTopic, setPubTopic] = useState('');
  const [pubPayload, setPubPayload] = useState('');

  const messagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

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
    }
  }, [pubTopic, pubPayload, publish]);

  const handleCopyTopic = useCallback((message: MqttMessage) => {
    copy(message.topic);
    toast.success(`Copied to clipboard: ${message.topic}`);
  }, []);

  const handleKeyDownPub = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePublish(e);
    }
  }, [handlePublish]);

  const handleKeyDownSub = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubscribe(e);
    }
  }, [handleSubscribe]);

  return (
    <div id="mqttlog" className="flex flex-col h-full">
      {/* Messages Log */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-auto p-2 bg-gray-50 border-b border-gray-200"
        style={{ maxHeight: 'calc(100% - 260px)' }}
      >
        <ul className="space-y-2">
          {messages.map((item) => (
            <li
              key={item.key}
              className="p-2 bg-white border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">{formatTime(item.time)}</span>
                <FiClipboard
                  className="cursor-pointer text-gray-500 hover:text-hardwario-primary"
                  title="Copy topic to Clipboard"
                  onClick={() => handleCopyTopic(item)}
                />
                <span
                  className="font-bold cursor-pointer hover:text-hardwario-primary"
                  onClick={() => handleCopyTopic(item)}
                >
                  {item.topic}
                </span>
                {!isHighlightedMessage(item.topic) && (
                  <BsPinAngle
                    className="cursor-pointer text-gray-500 hover:text-hardwario-primary ml-auto"
                    title="Pin topic"
                    onClick={() => addHighlightedMessage(item)}
                  />
                )}
              </div>
              <div className="text-gray-700 mt-1 break-all">{item.payload}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Highlighted/Pinned Messages */}
      {highlightedMessages.length > 0 && (
        <div className="p-2 bg-yellow-50 border-b border-yellow-200">
          <ul className="space-y-2">
            {highlightedMessages.map((item) => (
              <li
                key={item.key}
                className="p-2 bg-white border border-yellow-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">{formatTime(item.time)}</span>
                  <FiClipboard
                    className="cursor-pointer text-gray-500 hover:text-hardwario-primary"
                    title="Copy topic to Clipboard"
                    onClick={() => handleCopyTopic(item)}
                  />
                  <span className="font-bold">{item.topic}</span>
                  <FiX
                    className="cursor-pointer text-red-500 hover:text-red-700 ml-auto"
                    title="Unpin"
                    onClick={() => removeHighlightedMessage(item.topic)}
                  />
                </div>
                <div className="text-gray-700 mt-1 break-all">{item.payload}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clear Button */}
      <div className="flex justify-end p-2 border-b border-gray-200">
        <button onClick={clear} className="btn-secondary btn-sm">
          Clear all messages
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 bg-white" style={{ height: '200px' }}>
        {/* Publish Section */}
        <h4 className="text-lg font-semibold mb-2">Publish message</h4>
        <div className="flex gap-2 mb-4">
          <input
            className="form-control flex-1"
            value={pubTopic}
            onChange={(e) => setPubTopic(e.target.value)}
            onKeyDown={handleKeyDownPub}
            type="text"
            placeholder="Enter topic to publish"
          />
          <input
            className="form-control flex-1"
            value={pubPayload}
            onChange={(e) => setPubPayload(e.target.value)}
            onKeyDown={handleKeyDownPub}
            type="text"
            placeholder="Enter payload to publish"
          />
          <button
            disabled={!connected}
            onClick={handlePublish}
            className="btn-primary btn-sm"
          >
            Publish
          </button>
        </div>

        {/* Subscribe Section */}
        <h4 className="text-lg font-semibold mb-2">Subscribed topics</h4>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="form-control flex-1"
            placeholder="Enter topic to subscribe"
            value={subTopic}
            onChange={(e) => setSubTopic(e.target.value)}
            onKeyDown={handleKeyDownSub}
          />
          <button
            disabled={!connected}
            onClick={handleSubscribe}
            className="btn-primary btn-sm"
          >
            Subscribe
          </button>
        </div>

        {/* Subscribed Topics List */}
        <div className="flex flex-wrap gap-2">
          {subscribed.map((topic, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300"
            >
              <span className="text-sm">{topic}</span>
              <FiX
                className="cursor-pointer text-red-500 hover:text-red-700"
                title="Unsubscribe"
                onClick={() => unsubscribe(topic)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

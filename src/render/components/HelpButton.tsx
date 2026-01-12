import { useState, useRef, useEffect } from 'react';
import { FiHelpCircle, FiExternalLink, FiBook, FiVideo, FiMessageSquare, FiCpu, FiX } from 'react-icons/fi';
import * as i18n from '../../utils/i18n';

interface HelpResource {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  url: string;
  color: string;
}

const helpResources: HelpResource[] = [
  {
    icon: FiMessageSquare,
    title: 'Community Forum',
    description: 'Ask questions and get help from the community',
    url: 'https://forum.hardwario.com/',
    color: 'text-blue-500 bg-blue-50',
  },
  {
    icon: FiVideo,
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides',
    url: 'https://www.hardwario.com/academy/',
    color: 'text-purple-500 bg-purple-50',
  },
  {
    icon: FiBook,
    title: 'Documentation',
    description: 'Read the official documentation',
    url: 'https://docs.hardwario.com/',
    color: 'text-green-500 bg-green-50',
  },
  {
    icon: FiCpu,
    title: 'MQTT Topics Reference',
    description: 'Browse available MQTT topics and commands',
    url: 'https://docs.hardwario.com/tower/radio-communication/mqtt-protocol/',
    color: 'text-amber-500 bg-amber-50',
  },
];

export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close panel on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleResourceClick = (url: string) => {
    window.electronAPI.shell.openExternal(url);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Help Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{i18n.__('Help & Resources')}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Resources List */}
          <div className="p-2">
            {helpResources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleResourceClick(resource.url)}
                  className="w-full p-3 flex items-start gap-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className={`p-2 rounded-lg ${resource.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900">{i18n.__(resource.title)}</span>
                      <FiExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{i18n.__(resource.description)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer tip */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {i18n.__('New to HARDWARIO? Start with the video tutorials!')}
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all
          ${isOpen
            ? 'bg-gray-700 text-white'
            : 'bg-hardwario-primary text-white hover:bg-hardwario-medium hover:scale-105'
          }
        `}
        title={i18n.__('Help & Resources')}
      >
        <FiHelpCircle className="w-6 h-6" />
      </button>
    </div>
  );
}

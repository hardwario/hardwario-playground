import { useState, useRef, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiRadio, FiCpu } from 'react-icons/fi';
import type { useRadioManager, Node } from '../hooks/useRadioManager';

interface RadioManagerProps {
  radioManager: ReturnType<typeof useRadioManager>;
}

export default function RadioManager({ radioManager }: RadioManagerProps) {
  const {
    gatewayConnected,
    nodes,
    pairingMode,
    lastAttach,
    pairingStart,
    pairingStop,
    nodeRename,
    nodeRemove,
  } = radioManager;

  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handlePairingClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (pairingMode) {
      pairingStop();
    } else {
      pairingStart();
    }
  }, [pairingMode, pairingStart, pairingStop]);

  const handleSaveAlias = useCallback(() => {
    if (editId && textInputRef.current) {
      const newAlias = textInputRef.current.value;
      nodeRename(editId, newAlias);
    }
    setEditId(null);
  }, [editId, nodeRename]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveAlias();
    } else if (e.key === 'Escape') {
      setEditId(null);
    }
  }, [handleSaveAlias]);

  const handleRemove = useCallback((node: Node) => {
    nodeRemove(node.id);
    setConfirmDeleteId(null);
  }, [nodeRemove]);

  return (
    <div className="bg-white border border-gray-200 shadow-sm mt-4">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-800">Paired Devices</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
            {nodes.length} {nodes.length === 1 ? 'device' : 'devices'}
          </span>
        </div>

        {/* Pairing Button */}
        <button
          disabled={!gatewayConnected}
          type="button"
          className={`
            px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2
            ${pairingMode
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-hardwario-primary hover:bg-blue-600 text-white'}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          onClick={handlePairingClick}
        >
          {pairingMode ? (
            <>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Stop Pairing
            </>
          ) : (
            <>
              <FiRadio className="w-4 h-4" />
              Start Pairing
            </>
          )}
        </button>
      </div>

      {/* Pairing Mode Banner */}
      {pairingMode && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-3">
          <div className="flex-shrink-0">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Pairing mode active</p>
            <p className="text-xs text-blue-600">Press the button on your device to pair it</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {nodes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FiCpu className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices paired</h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
              {gatewayConnected
                ? 'Click "Start Pairing" and press the button on your device to add it.'
                : 'Connect a Radio Dongle first, then pair your devices.'}
            </p>
          </div>
        ) : (
          /* Device List */
          <div className="space-y-2">
            {nodes.map((item) => {
              const isEditing = editId === item.id;
              const isConfirmingDelete = confirmDeleteId === item.id;
              const isNewlyAttached = lastAttach === item.id;

              return (
                <div
                  key={item.id}
                  className={`
                    p-3 border rounded transition-all duration-300
                    ${isNewlyAttached
                      ? 'border-green-400 bg-green-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
                  `}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Device Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <FiCpu className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            className="w-full px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-hardwario-primary focus:border-transparent text-sm"
                            defaultValue={item.alias || ''}
                            ref={textInputRef}
                            onKeyDown={handleKeyPress}
                            placeholder="Enter device alias"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-gray-900 truncate">
                              {item.alias || <span className="text-gray-400 italic">No alias</span>}
                            </p>
                            <p className="text-xs text-gray-500 font-mono truncate">{item.id}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveAlias}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Save"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                            title="Cancel"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </>
                      ) : isConfirmingDelete ? (
                        <>
                          <span className="text-sm text-red-600 mr-2">Delete?</span>
                          <button
                            onClick={() => handleRemove(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Confirm delete"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                            title="Cancel"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditId(item.id)}
                            className="p-2 text-gray-500 hover:text-hardwario-primary hover:bg-blue-50 rounded transition-colors"
                            title="Rename device"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove device"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* New device indicator */}
                  {isNewlyAttached && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <span className="text-xs font-medium text-green-600">
                        ✓ Just paired
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

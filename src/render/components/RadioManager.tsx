import { useState, useRef, useCallback } from 'react';
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
    }
  }, [handleSaveAlias]);

  const handleRemove = useCallback((node: Node) => {
    nodeRemove(node.id);
  }, [nodeRemove]);

  return (
    <div id="radiomanager" className="p-2.5">
      <div className="mb-4">
        <button
          disabled={!gatewayConnected}
          type="button"
          className={pairingMode ? 'btn-danger' : 'btn-success'}
          onClick={handlePairingClick}
        >
          {pairingMode ? (
            <span className="flex items-center gap-2">
              Stop pairing
              <span className="blink text-lg">{'\u25cf'}</span>
            </span>
          ) : (
            'Start pairing'
          )}
        </button>
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Alias</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((item) => {
            if (editId === item.id) {
              return (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <input
                      type="text"
                      autoFocus
                      className="form-control"
                      defaultValue={item.alias || ''}
                      ref={textInputRef}
                      onKeyPress={handleKeyPress}
                    />
                  </td>
                  <td className="space-x-2">
                    <button
                      onClick={handleSaveAlias}
                      className="btn-success btn-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="btn-warning btn-sm"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={item.id}
                className={lastAttach === item.id ? 'last-attach' : ''}
              >
                <td>{item.id}</td>
                <td>{item.alias}</td>
                <td className="space-x-2">
                  <button
                    onClick={() => setEditId(item.id)}
                    className="btn-warning btn-sm"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleRemove(item)}
                    className="btn-danger btn-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

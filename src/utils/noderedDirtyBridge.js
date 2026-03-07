(() => {
  const BRIDGE_SOURCE = 'hardwario-nodered-dirty-bridge';
  let lastDirty = null;

  function getDirtyState() {
    try {
      return !!window.RED?.nodes?.dirty?.();
    } catch {
      return false;
    }
  }

  function publishDirtyState() {
    const dirty = getDirtyState();

    if (dirty === lastDirty) {
      return;
    }

    lastDirty = dirty;

    if (window.parent) {
      window.parent.postMessage(
        {
          source: BRIDGE_SOURCE,
          type: 'dirty-state',
          dirty,
        },
        '*'
      );
    }
  }

  // Initial publish after editor has had a moment to boot
  window.addEventListener('load', () => {
    setTimeout(publishDirtyState, 300);
  });

  // Polling is simple and robust here
  setInterval(publishDirtyState, 250);

  // Reset on unload/reload
  window.addEventListener('beforeunload', () => {
    if (window.parent) {
      window.parent.postMessage(
        {
          source: BRIDGE_SOURCE,
          type: 'dirty-state',
          dirty: false,
        },
        '*'
      );
    }
  });
})();

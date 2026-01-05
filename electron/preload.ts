import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from 'electron';

// Type definitions for IPC payloads
export interface SerialPortInfo {
  path: string;
  serialNumber?: string;
  manufacturer?: string;
}

export interface GatewayStatus {
  status: 'online' | 'offline';
  error?: string;
}

export interface FlashProgress {
  erase: number;
  write: number;
  verify: number;
}

export interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
}

export interface FirmwareItem {
  name: string;
  description?: string;
  article?: string;
  video?: string;
  repository?: string;
  images?: Array<{ url: string; title: string }>;
  articles?: Array<{
    title: string;
    description: string;
    url: string;
    video?: string;
    images?: Array<{ url: string; title: string }>;
  }>;
  versions?: Array<{ name: string; url: string }>;
  tags: string[];
}

export interface FlashParams {
  firmware: string;
  port: string;
  version?: string;
}

export interface FileDialogResult {
  filePath: string | null;
  canceled: boolean;
}

// Helper to create unsubscribe function for event listeners
function createListener<T>(channel: string, callback: (data: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

// ElectronAPI interface
export interface ElectronAPI {
  settings: {
    get: (key: string) => Promise<unknown>;
    getSync: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    getAll: () => Promise<Record<string, unknown>>;
    onValue: (key: string, callback: (value: unknown) => void) => () => void;
    onAll: (callback: (settings: Record<string, unknown>) => void) => () => void;
  };
  gateway: {
    connect: (port: string) => void;
    disconnect: () => void;
    getStatus: () => void;
    getDevice: () => void;
    getPortList: () => void;
    onStatus: (callback: (status: GatewayStatus) => void) => () => void;
    onDevice: (callback: (device: string) => void) => () => void;
    onPortList: (callback: (ports: SerialPortInfo[]) => void) => () => void;
  };
  firmware: {
    runFlash: (params: FlashParams) => void;
    getPortList: () => void;
    getList: () => void;
    openFileDialog: () => void;
    onProgress: (callback: (progress: FlashProgress) => void) => () => void;
    onPortList: (callback: (ports: SerialPortInfo[]) => void) => () => void;
    onList: (callback: (list: FirmwareItem[]) => void) => () => void;
    onError: (callback: (error: string) => void) => () => void;
    onDone: (callback: () => void) => () => void;
    onDownload: (callback: (progress: DownloadProgress) => void) => () => void;
    onFileDialogResult: (callback: (result: FileDialogResult) => void) => () => void;
  };
  nodered: {
    getStatus: () => void;
    onStatus: (callback: (status: string) => void) => () => void;
  };
  broker: {
    getStatus: () => void;
    onStatus: (callback: (status: string) => void) => () => void;
  };
  iframe: {
    onVisible: (id: string, callback: (visible: boolean) => void) => () => void;
    onReload: (id: string, callback: () => void) => () => void;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
  };
}

const electronAPI: ElectronAPI = {
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings/get', key),
    getSync: (key: string) => ipcRenderer.sendSync('settings/get-sync', key),
    set: (key: string, value: unknown) => ipcRenderer.send('settings/set', { key, value }),
    getAll: () => ipcRenderer.invoke('settings/getAll'),
    onValue: (key: string, callback: (value: unknown) => void) =>
      createListener(`settings/value/${key}`, callback),
    onAll: (callback: (settings: Record<string, unknown>) => void) =>
      createListener('settings/all', callback),
  },

  gateway: {
    connect: (port: string) => ipcRenderer.send('gateway/connect', port),
    disconnect: () => ipcRenderer.send('gateway/disconnect'),
    getStatus: () => ipcRenderer.send('gateway/status/get'),
    getDevice: () => ipcRenderer.send('gateway/device/get'),
    getPortList: () => ipcRenderer.send('gateway/port-list/get'),
    onStatus: (callback: (status: GatewayStatus) => void) =>
      createListener('gateway/status', callback),
    onDevice: (callback: (device: string) => void) =>
      createListener('gateway/device', callback),
    onPortList: (callback: (ports: SerialPortInfo[]) => void) =>
      createListener('gateway/port-list', callback),
  },

  firmware: {
    runFlash: (params: FlashParams) => ipcRenderer.send('firmware:run-flash', params),
    getPortList: () => ipcRenderer.send('firmware:get-port-list'),
    getList: () => ipcRenderer.send('firmware:get-list'),
    openFileDialog: () => ipcRenderer.send('firmware:open-file-dialog'),
    onProgress: (callback: (progress: FlashProgress) => void) =>
      createListener('firmware:progress', callback),
    onPortList: (callback: (ports: SerialPortInfo[]) => void) =>
      createListener('firmware:port-list', callback),
    onList: (callback: (list: FirmwareItem[]) => void) =>
      createListener('firmware:list', callback),
    onError: (callback: (error: string) => void) =>
      createListener('firmware:error', callback),
    onDone: (callback: () => void) =>
      createListener('firmware:done', callback),
    onDownload: (callback: (progress: DownloadProgress) => void) =>
      createListener('firmware:download', callback),
    onFileDialogResult: (callback: (result: FileDialogResult) => void) =>
      createListener('firmware:file-dialog-result', callback),
  },

  nodered: {
    getStatus: () => ipcRenderer.send('nodered/status/get'),
    onStatus: (callback: (status: string) => void) =>
      createListener('nodered/status', callback),
  },

  broker: {
    getStatus: () => ipcRenderer.send('broker/status/get'),
    onStatus: (callback: (status: string) => void) =>
      createListener('broker/status', callback),
  },

  iframe: {
    onVisible: (id: string, callback: (visible: boolean) => void) =>
      createListener(`iframe:${id}:visible`, callback),
    onReload: (id: string, callback: () => void) =>
      createListener(`iframe:${id}:reload`, callback),
  },

  shell: {
    openExternal: async (url: string) => {
      // Validate URL before sending to main process
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          await shell.openExternal(url);
        }
      } catch {
        console.error('Invalid URL:', url);
      }
    },
  },

  app: {
    getVersion: () => ipcRenderer.invoke('app/getVersion'),
    getPath: (name: string) => ipcRenderer.invoke('app/getPath', name),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Export types for use in renderer
export type { ElectronAPI };

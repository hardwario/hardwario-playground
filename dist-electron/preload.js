"use strict";
const electron = require("electron");
function createListener(channel, callback) {
  const listener = (_event, data) => callback(data);
  electron.ipcRenderer.on(channel, listener);
  return () => electron.ipcRenderer.removeListener(channel, listener);
}
const electronAPI = {
  settings: {
    get: (key) => electron.ipcRenderer.invoke("settings/get", key),
    getSync: (key) => electron.ipcRenderer.sendSync("settings/get-sync", key),
    set: (key, value) => electron.ipcRenderer.send("settings/set", { key, value }),
    getAll: () => electron.ipcRenderer.invoke("settings/getAll"),
    onValue: (key, callback) => createListener(`settings/value/${key}`, callback),
    onAll: (callback) => createListener("settings/all", callback)
  },
  gateway: {
    connect: (port) => electron.ipcRenderer.send("gateway/connect", port),
    disconnect: () => electron.ipcRenderer.send("gateway/disconnect"),
    getStatus: () => electron.ipcRenderer.send("gateway/status/get"),
    getDevice: () => electron.ipcRenderer.send("gateway/device/get"),
    getPortList: () => electron.ipcRenderer.send("gateway/port-list/get"),
    onStatus: (callback) => createListener("gateway/status", callback),
    onDevice: (callback) => createListener("gateway/device", callback),
    onPortList: (callback) => createListener("gateway/port-list", callback)
  },
  firmware: {
    runFlash: (params) => electron.ipcRenderer.send("firmware:run-flash", params),
    getPortList: () => electron.ipcRenderer.send("firmware:get-port-list"),
    getList: () => electron.ipcRenderer.send("firmware:get-list"),
    openFileDialog: () => electron.ipcRenderer.send("firmware:open-file-dialog"),
    onProgress: (callback) => createListener("firmware:progress", callback),
    onPortList: (callback) => createListener("firmware:port-list", callback),
    onList: (callback) => createListener("firmware:list", callback),
    onError: (callback) => createListener("firmware:error", callback),
    onDone: (callback) => createListener("firmware:done", callback),
    onDownload: (callback) => createListener("firmware:download", callback),
    onFileDialogResult: (callback) => createListener("firmware:file-dialog-result", callback)
  },
  nodered: {
    getStatus: () => electron.ipcRenderer.send("nodered/status/get"),
    onStatus: (callback) => createListener("nodered/status", callback)
  },
  broker: {
    getStatus: () => electron.ipcRenderer.send("broker/status/get"),
    onStatus: (callback) => createListener("broker/status", callback)
  },
  iframe: {
    onVisible: (id, callback) => createListener(`iframe:${id}:visible`, callback),
    onReload: (id, callback) => createListener(`iframe:${id}:reload`, callback)
  },
  shell: {
    openExternal: async (url) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          await electron.shell.openExternal(url);
        }
      } catch {
        console.error("Invalid URL:", url);
      }
    }
  },
  app: {
    getVersion: () => electron.ipcRenderer.invoke("app/getVersion"),
    getPath: (name) => electron.ipcRenderer.invoke("app/getPath", name)
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);

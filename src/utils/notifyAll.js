
const { BrowserWindow } = require("electron");

function notifyAll(topic, data) {
    let newList = [];
    BrowserWindow.getAllWindows().forEach((view) => {
      try {
        view.webContents.send(topic, data);
      }
      catch (error) {
        // Window no longer exists
      }
    });
}

module.exports = notifyAll;

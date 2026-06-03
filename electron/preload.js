/* preload.js — безпечний міст рендер ↔ головний процес (contextIsolation). */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  // зберегти JSON результату через нативний діалог (за замовчуванням — на флешку)
  saveResults: (filename, json) => ipcRenderer.invoke("save-results", { filename, json })
});

/* ============================================================
   main.js — Electron-обгортка курсу «Освітній Простір №8».
   Завантажує index.html (офлайн), ховає меню. Додає нативне
   збереження результату на флешку через діалог (IPC save-results).
   ============================================================ */
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 360,
    backgroundColor: "#F6F7F4",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "..", "index.html"));

  // зовнішні посилання (target=_blank) — у системному браузері, а не в новому вікні Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });
  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

// Пошук знімного диска (флешки) — Windows: DriveType=2 (Removable)
function findRemovableDrive() {
  try {
    const out = execSync(
      'powershell -NoProfile -Command "Get-CimInstance Win32_LogicalDisk -Filter \\"DriveType=2\\" | Select-Object -ExpandProperty DeviceID"',
      { encoding: "utf8", timeout: 5000 }
    );
    const line = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0];
    if (line && /^[A-Za-z]:$/.test(line)) return line + "\\";
  } catch (e) { /* немає флешки або не Windows */ }
  return null;
}

// Збереження результату: діалог, за замовчуванням — на флешку (якщо є), інакше Робочий стіл
ipcMain.handle("save-results", async (e, { filename, json }) => {
  const usb = findRemovableDrive();
  const base = usb || app.getPath("desktop");
  const win = BrowserWindow.getFocusedWindow();
  const res = await dialog.showSaveDialog(win, {
    title: "Зберегти роботу учня",
    defaultPath: path.join(base, filename || "OP8.json"),
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(res.filePath, json, "utf8");
    return { ok: true, path: res.filePath, usb: !!usb };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }
});

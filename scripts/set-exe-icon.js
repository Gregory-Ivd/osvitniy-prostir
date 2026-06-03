/* Встановлює іконку на готовий portable .exe через rcedit
   (electron-builder це не робить, бо signAndEditExecutable:false). */
const path = require("path");
const fs = require("fs");
const _rc = require("rcedit");
const rcedit = typeof _rc === "function" ? _rc : _rc.rcedit;
const pkg = require("../package.json");

const exe = path.join(__dirname, "..", "dist", `OsvitniyProstir8-${pkg.version}.exe`);
const ico = path.join(__dirname, "..", "build", "icon.ico");

if (!fs.existsSync(exe)) { console.error("Не знайдено .exe:", exe); process.exit(1); }
if (!fs.existsSync(ico)) { console.error("Не знайдено icon.ico:", ico); process.exit(1); }

rcedit(exe, { icon: ico })
  .then(() => console.log("Іконку встановлено на", exe))
  .catch(e => { console.error("rcedit помилка:", e); process.exit(1); });

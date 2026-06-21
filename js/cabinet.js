/* ============================================================
   cabinet.js — локальні кабінети учнів (офлайн, для спільних ПК).
   Кілька профілів на одній машині, вхід за іменем + PIN,
   експорт/імпорт профілю файлом. Дані не покидають пристрій.
   PIN — лише захист від випадкового перегляду, НЕ криптостійкий.
   ============================================================ */
(function () {
  const REG_KEY = "op8.cabinets.v1";
  const progKey = (id) => "op8.progress.v1::" + id;

  function loadReg() {
    try { return Object.assign({ profiles:{}, active:null }, JSON.parse(localStorage.getItem(REG_KEY) || "{}")); }
    catch (e) { return { profiles:{}, active:null }; }
  }
  function saveReg(r) { try { localStorage.setItem(REG_KEY, JSON.stringify(r)); } catch (e) {} }

  // простий хеш (djb2) — не для безпеки, лише щоб PIN не лежав відкрито
  function hash(str) {
    let h = 5381; for (let i=0;i<str.length;i++) h = ((h<<5)+h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(36);
  }
  function uid(name) {
    return name.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-zа-яіїєґ0-9-]/gi,"")
      .slice(0,24) + "-" + hash(name + Math.random().toString());
  }
  function now() { return new Date().toISOString(); }

  let reg = loadReg();

  // Захист від ін'єкції через підмінений файл/введення: прибираємо кутові дужки й
  // обмежуємо довжину. Імʼя/група виводяться як innerHTML — тож знешкоджуємо на вході.
  const clean = s => String(s == null ? "" : s).replace(/[<>]/g, "").trim().slice(0, 80);

  const Cabinet = {
    list() {
      return Object.values(reg.profiles).map(p => ({ id:p.id, name:p.name, group:p.group }));
    },
    activeId() { return reg.active; },
    active() { return reg.active ? reg.profiles[reg.active] : null; },

    create(name, group, pin) {
      name = clean(name); group = clean(group);
      if (!name) throw new Error("Вкажіть імʼя");
      const id = uid(name);
      reg.profiles[id] = { id, name, group, pin: hash(String(pin||"")), createdAt: now() };
      reg.active = id; saveReg(reg);
      return id;
    },
    login(id, pin) {
      const p = reg.profiles[id];
      if (!p) return false;
      if (p.pin && p.pin !== hash(String(pin||""))) return false;
      reg.active = id; saveReg(reg);
      return true;
    },
    logout() { reg.active = null; saveReg(reg); },

    setPin(id, newPin) {
      const p = reg.profiles[id]; if (!p) return false;
      p.pin = hash(String(newPin || ""));
      saveReg(reg); return true;
    },

    remove(id) {
      delete reg.profiles[id];
      try { localStorage.removeItem(progKey(id)); } catch(e) {}
      if (reg.active === id) reg.active = null;
      saveReg(reg);
    },

    /* Експорт активного профілю (meta + прогрес) у файл. */
    exportProfile(id) {
      id = id || reg.active; if (!id) return;
      const p = reg.profiles[id];
      let prog = {}; try { prog = JSON.parse(localStorage.getItem(progKey(id)) || "{}"); } catch(e){}
      const data = { kind:"op8-profile", version:1, profile:{ name:p.name, group:p.group, createdAt:p.createdAt }, progress: prog, exportedAt: now() };
      const json = JSON.stringify(data, null, 2);
      const filename = "OP8_" + (p.name||"учень").replace(/\s+/g,"_") + ".json";
      // Десктоп (Electron) — нативне збереження на флешку; браузер — завантаження файлу.
      const notify = window.toast || ((m) => alert(m));
      if (window.electronAPI && window.electronAPI.saveResults) {
        window.electronAPI.saveResults(filename, json).then(res => {
          if (res && res.ok) notify("Збережено: " + res.path + (res.usb ? " (на флешку)" : ""), "t-success");
          else if (!(res && res.canceled)) notify("Не вдалося зберегти" + (res && res.error ? ": " + res.error : "."), "t-error");
        });
        return;
      }
      // Android WebView не підтримує blob-download — показуємо явне повідомлення
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        notify("На Android збереження файлу недоступне. Попросіть викладача імпортувати дані через кабінет викладача.", "t-warn");
        return;
      }
      const blob = new Blob([json], { type:"application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
    },

    /* Імпорт профілю з файлу (повертає id). */
    importProfile(obj, pin) {
      if (!obj || obj.kind !== "op8-profile") throw new Error("Невірний файл профілю");
      const name = clean(obj.profile?.name) || "Учень";
      const id = uid(name);
      reg.profiles[id] = { id, name, group: clean(obj.profile?.group), pin: hash(String(pin||"")), createdAt: obj.profile?.createdAt || now() };
      try { localStorage.setItem(progKey(id), JSON.stringify(obj.progress || {})); } catch(e){}
      saveReg(reg);
      return id;
    },

    getProfile(id) { return reg.profiles[id] || null; },
    readProgress(id) {
      try { return JSON.parse(localStorage.getItem(progKey(id)) || "{}"); } catch(e) { return {}; }
    },

    progKey
  };

  window.Cabinet = Cabinet;
})();

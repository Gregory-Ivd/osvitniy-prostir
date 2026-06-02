/* ============================================================
   sync.js — НЕОБОВʼЯЗКОВА хмарна синхронізація (offline-first).
   ------------------------------------------------------------
   Принцип: курс завжди працює офлайн (localStorage). Хмара —
   надбудова. Поки не вписано URL скрипта, усе вимкнено і нічого
   назовні не йде (важливо для режиму УВП).

   Бекенд — Google Apps Script (див. cloud/Code.gs), розгорнутий
   як веб-застосунок. Щоб уникнути CORS-preflight, шлемо POST із
   Content-Type:text/plain (класичний прийом для Apps Script).

   Формат запису = той самий, що й експорт профілю в cabinet.js:
   { kind:"op8-profile", version:1, profile:{name,group,createdAt},
     progress:{...}, exportedAt }
   ============================================================ */
(function () {
  const URL_KEY = "op8.cloud.url";   // адреса розгорнутого Apps Script
  const KEY_KEY = "op8.cloud.key";   // спільний секрет (щоб писали лише свої)

  function getUrl() { try { return localStorage.getItem(URL_KEY) || ""; } catch (e) { return ""; } }
  function getKey() { try { return localStorage.getItem(KEY_KEY) || ""; } catch (e) { return ""; } }

  /* Зібрати «пакет» профілю у тому ж форматі, що й експорт файлом. */
  function packProfile(id) {
    const C = window.Cabinet; if (!C) return null;
    const p = C.getProfile(id); if (!p) return null;
    return {
      kind: "op8-profile", version: 1,
      profile: { name: p.name, group: p.group, createdAt: p.createdAt },
      progress: C.readProgress(id),
      exportedAt: new Date().toISOString()
    };
  }

  /* Низькорівневий виклик до Apps Script. action: "push" | "pull". */
  async function call(action, payload) {
    const url = getUrl();
    if (!url) throw new Error("Хмару не налаштовано (немає URL скрипта).");
    const body = JSON.stringify({ action, key: getKey(), payload: payload || null });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // без preflight
      body,
      redirect: "follow"
    });
    if (!res.ok) throw new Error("Хмара відповіла помилкою " + res.status);
    const text = await res.text();
    try { return JSON.parse(text); } catch (e) { throw new Error("Хмара повернула не-JSON."); }
  }

  const Sync = {
    /* --- налаштування (виклик із кабінету/консолі) --- */
    isEnabled() { return !!getUrl(); },
    url: getUrl,
    configure(url, key) {
      try {
        if (url != null) localStorage.setItem(URL_KEY, String(url).trim());
        if (key != null) localStorage.setItem(KEY_KEY, String(key).trim());
      } catch (e) {}
      return this.isEnabled();
    },
    disable() { try { localStorage.removeItem(URL_KEY); localStorage.removeItem(KEY_KEY); } catch (e) {} },

    /* --- учень: відправити свій прогрес у хмару --- */
    async pushProfile(id) {
      const pack = packProfile(id);
      if (!pack) throw new Error("Профіль не знайдено.");
      return call("push", pack);
    },
    pushActive() {
      const id = window.Cabinet && window.Cabinet.activeId();
      if (!id) throw new Error("Немає активного кабінету.");
      return this.pushProfile(id);
    },

    /* --- викладач: забрати всі профілі групи --- */
    async pullAll() {
      const r = await call("pull", null);
      return (r && r.profiles) ? r.profiles : [];
    }
  };

  window.Sync = Sync;
})();

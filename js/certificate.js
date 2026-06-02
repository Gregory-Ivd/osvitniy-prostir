/* ============================================================
   certificate.js — рівень сертифіката, зведення профілю, рендер
   сертифіката + «Карти індивідуального плану та успішності».
   Працює і для активного учня, і для читання чужого профілю (викладач).
   ============================================================ */
(function () {
  const TOTAL = (window.COURSE && window.COURSE.modules.length) || 13;

  function summarize(prog, total) {
    total = total || TOTAL;
    const modules = prog.modules || {};
    const quiz = prog.quiz || {};
    const done = Object.values(modules).filter(m => m && m.completed).length;
    const qs = Object.values(quiz);
    const avg = qs.length ? Math.round(100 * qs.reduce((a,q)=>a+(q.total?q.best/q.total:0),0)/qs.length) : 0;
    return {
      learner: prog.learner || { name:"", group:"" },
      completed: done, total,
      quizAvgPercent: avg,
      signals: Object.assign({ hintsUsed:0, optionalDone:0, selfTaskDone:0 }, prog.signals || {}),
      updatedAt: prog.updatedAt || ""
    };
  }

  // Рівень сертифіката (попередня логіка; точне рішення — викладач за рубрикою 5 сигналів)
  function level(s) {
    if (s.completed >= 12 && s.quizAvgPercent >= 70)
      return { key:3, label:"Готовність до працевлаштування / IT-трек",
               note:"Кандидат на вихід до Біржі працевлаштування." };
    if (s.completed >= 6 && s.quizAvgPercent >= 60)
      return { key:2, label:"Цифрова грамотність + ШІ",
               note:"Впевнена база, продуктивність і робота зі штучним інтелектом." };
    return { key:1, label:"Цифрове громадянство",
             note:"Базові навички, Дія та повсякденні цифрові права." };
  }

  function bar(label, val, max, color) {
    const pct = Math.max(0, Math.min(100, max ? Math.round(100*val/max) : 0));
    return `<div class="pf-row"><span>${label}</span>
      <span class="pf-bar"><i style="width:${pct}%;background:${color}"></i></span>
      <b>${val}${max?(" / "+max):""}</b></div>`;
  }

  function render(container, profileId) {
    const Cab = window.Cabinet;
    const p = Cab.getProfile(profileId);
    if (!p) { container.innerHTML = "<p>Профіль не знайдено.</p>"; return; }
    const prog = Cab.readProgress(profileId);
    const s = summarize(prog, TOTAL);
    s.learner.name = s.learner.name || p.name;
    s.learner.group = s.learner.group || p.group;
    const lv = level(s);

    container.innerHTML = `
      <!-- ЛИЦЕ: СЕРТИФІКАТ -->
      <section class="cert-page cert-face">
        <div class="cert-top">
          <img src="../brand/logo.svg" alt="Освітній Простір №8" class="cert-logo">
          <div class="cert-issuers">ГО «Союз Золотий вік України» · Університет «Україна» · ДУ «Житомирська УВП №8»</div>
        </div>
        <div class="cert-body">
          <div class="cert-kicker">СЕРТИФІКАТ</div>
          <div class="cert-sub">про проходження курсу цифрової грамотності проєкту «Освітній простір»</div>
          <div class="cert-name">${s.learner.name || "—"}</div>
          ${s.learner.group ? `<div class="cert-group">${s.learner.group}</div>` : ""}
          <div class="cert-level">Рівень ${lv.key}: <b>${lv.label}</b></div>
          <div class="cert-note">${lv.note}</div>
          <div class="cert-stats">Пройдено модулів: <b>${s.completed} із ${s.total}</b> · Середній результат тестів: <b>${s.quizAvgPercent}%</b></div>
        </div>
        <div class="cert-sign">
          <div><span class="sig-line"></span>Куратор проєкту — Я. Баранова</div>
          <div><span class="sig-line"></span>Викладач</div>
          <div class="cert-id">ID: ${profileId}</div>
        </div>
      </section>

      <!-- ОБОРОТ: КАРТА ПРОФІЛЮ -->
      <section class="cert-page cert-card">
        <h2>Карта індивідуального плану та успішності</h2>
        <p class="muted">${s.learner.name} ${s.learner.group ? "· "+s.learner.group : ""}</p>

        <h3>Успішність</h3>
        ${bar("Пройдено модулів", s.completed, s.total, "#2E9E5B")}
        ${bar("Середній бал тестів", s.quizAvgPercent, 100, "#15356B")}

        <h3>Сигнали самостійності</h3>
        ${bar("Самонавчання (задачі «сам собі вчитель»)", s.signals.selfTaskDone, Math.max(5,s.signals.selfTaskDone), "#F39200")}
        ${bar("Ініціатива (опційні завдання)", s.signals.optionalDone, Math.max(5,s.signals.optionalDone), "#F39200")}
        <p class="muted small">Підказок використано: ${s.signals.hintsUsed}. Повна оцінка 5 сигналів — за рубрикою викладача.</p>

        <h3>Рекомендований трек (заповнює викладач)</h3>
        <p class="fillable">веб-розробка · маркетинг · контент/копірайтинг · дані-ФОП · AI-оператор — потрібне підкреслити</p>

        <h3>Індивідуальний план «куди далі»</h3>
        <p class="fillable">Що доучити: __________________________________________________________</p>
        <p class="fillable">Що додати в портфоліо: ______________________________________________</p>
        <p class="fillable">Наступний крок (вехи, Біржа workprison.com.ua): ____________________</p>
      </section>

      <div class="cert-actions no-print">
        <button class="btn primary" onclick="window.print()">🖨 Друк / зберегти в PDF</button>
      </div>`;
  }

  window.Certificate = { summarize, level, render };
})();

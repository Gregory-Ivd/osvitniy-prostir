/* ============================================================
   progress.js — прогрес і телеметрія (localStorage, офлайн)
   Збирає дані для майбутньої «Карти індивідуального плану та успішності».
   ============================================================ */
(function () {
  // Ключ привʼязаний до активного профілю кабінету (спільні ПК → кілька учнів).
  function KEYf() {
    const C = window.Cabinet;
    const id = C && C.activeId && C.activeId();
    return id ? C.progKey(id) : "op8.progress.v1::guest";
  }

  const blank = () => ({
    learner: { name: "", group: "" },
    modules: {},          // id -> {visited, completed, reflection}
    quiz: {},             // id -> {best, total, attempts, lastScore}
    signals: {            // сигнали самостійності (телеметрія)
      hintsUsed: 0,       // скільки разів відкрито підказку
      optionalDone: 0,    // виконані опційні/просунуті задачі
      selfTaskDone: 0     // виконані задачі «сам собі вчитель»
    },
    startedAt: null,
    updatedAt: null
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEYf());
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return blank();
  }
  function save() {
    state.updatedAt = stamp();
    if (!state.startedAt) state.startedAt = state.updatedAt;
    try { localStorage.setItem(KEYf(), JSON.stringify(state)); } catch (e) {}
  }
  // дата без Date.now-залежності в коді движка не потрібна — беремо реальний час браузера користувача
  function stamp() { return new Date().toISOString(); }

  function mod(id) { return (state.modules[id] = state.modules[id] || { visited:false, completed:false, reflection:"" }); }

  const Progress = {
    raw: () => state,
    setLearner(name, group) { state.learner = { name: name||"", group: group||"" }; save(); },

    visit(id) { mod(id).visited = true; save(); },
    complete(id) { const m = mod(id); m.visited = true; m.completed = true; save(); },
    isCompleted(id) { return !!(state.modules[id] && state.modules[id].completed); },

    setReflection(id, text) { mod(id).reflection = text || ""; save(); },
    getReflection(id) { return (state.modules[id] && state.modules[id].reflection) || ""; },

    setQuiz(id, score, total) {
      const q = (state.quiz[id] = state.quiz[id] || { best:0, total:total, attempts:0, lastScore:0 });
      q.attempts += 1; q.lastScore = score; q.total = total;
      if (score > q.best) q.best = score;
      save();
    },
    getQuiz(id) { return state.quiz[id] || null; },

    addHint() { state.signals.hintsUsed += 1; save(); },
    addOptional() { state.signals.optionalDone += 1; save(); },
    addSelfTask() { state.signals.selfTaskDone += 1; save(); },

    completedCount() { return Object.values(state.modules).filter(m => m.completed).length; },

    /* Зведення для сертифіката/карти профілю (використається пізніше). */
    summary(totalModules) {
      const done = this.completedCount();
      const quizzes = Object.entries(state.quiz).map(([id,q]) => ({ id, best:q.best, total:q.total }));
      const avg = quizzes.length
        ? Math.round(100 * quizzes.reduce((a,q)=>a+(q.total?q.best/q.total:0),0) / quizzes.length)
        : 0;
      return {
        learner: state.learner,
        completed: done, totalModules: totalModules || 13,
        quizAvgPercent: avg,
        signals: { ...state.signals },
        startedAt: state.startedAt, updatedAt: state.updatedAt
      };
    },

    reset() { state = blank(); save(); },

    /* Перечитати стан після зміни активного профілю (вхід/вихід). */
    rebind() { state = load(); }
  };

  window.Progress = Progress;
})();

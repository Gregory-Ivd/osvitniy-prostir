/* ============================================================
   quiz.js — рушій тестів. Рендерить питання, перевіряє, пише в Progress.
   Формат питання: { q:"...", options:["..."], answer:0, explain:"..." }
   ============================================================ */
(function () {
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function render(container, questions, moduleId, onResult) {
    container.innerHTML = "";
    if (!questions || !questions.length) return;

    const wrap = el("div", "quiz");
    wrap.appendChild(el("h2", null, "✔ Перевір себе"));
    const qNodes = [];

    questions.forEach((item, qi) => {
      const q = el("div", "q");
      q.appendChild(el("div", "qtext", `${qi + 1}. ${item.q}`));
      (item.options || []).forEach((opt, oi) => {
        const label = el("label", "opt");
        const input = el("input");
        input.type = "radio"; input.name = `${moduleId}-q${qi}`; input.value = oi;
        label.appendChild(input);
        label.appendChild(el("span", null, opt));
        q.appendChild(label);
      });
      q.appendChild(el("div", "explain", item.explain || ""));
      wrap.appendChild(q);
      qNodes.push(q);
    });

    const bar = el("div");
    const checkBtn = el("button", "btn primary", "Перевірити");
    const result = el("div", "progress-label");
    result.style.marginTop = "10px";
    bar.appendChild(checkBtn);
    bar.appendChild(result);
    wrap.appendChild(bar);
    container.appendChild(wrap);

    let graded = false;

    checkBtn.addEventListener("click", () => {
      if (!graded) {
        let score = 0;
        questions.forEach((item, qi) => {
          const q = qNodes[qi];
          q.classList.add("answered");
          const chosen = q.querySelector("input:checked");
          const opts = q.querySelectorAll(".opt");
          opts.forEach(o => o.classList.remove("correct", "wrong"));
          if (chosen) {
            const ci = +chosen.value;
            if (ci === item.answer) { score++; opts[ci].classList.add("correct"); }
            else { opts[ci].classList.add("wrong"); opts[item.answer].classList.add("correct"); }
          } else {
            opts[item.answer].classList.add("correct");
          }
          q.querySelectorAll("input").forEach(i => i.disabled = true);
        });
        if (!window._demo && window.Progress) Progress.setQuiz(moduleId, score, questions.length);
        const pct = Math.round(100 * score / questions.length);
        result.textContent = `Результат: ${score} із ${questions.length} (${pct}%). ` +
          (pct >= 70 ? "Добре! Можна рухатися далі." : "Переглянь матеріал і спробуй ще.");
        checkBtn.textContent = "Спробувати ще";
        graded = true;
        if (onResult) onResult(score, questions.length);
      } else {
        // повторна спроба
        qNodes.forEach(q => {
          q.classList.remove("answered");
          q.querySelectorAll(".opt").forEach(o => o.classList.remove("correct", "wrong"));
          q.querySelectorAll("input").forEach(i => { i.disabled = false; i.checked = false; });
        });
        result.textContent = "";
        checkBtn.textContent = "Перевірити";
        graded = false;
      }
    });
  }

  window.Quiz = { render };
})();

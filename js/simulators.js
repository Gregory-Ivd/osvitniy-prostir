/* ============================================================
   simulators.js — інтерактивні тренажери-симулятори.
   Рендеряться всередині модулів (тип блоку "simulator").
   Кожен симулятор — самостійна функція, dispatcher — Simulators.render().
   ============================================================ */
(function () {
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ------------------------------------------------------------------ */
  /*  EMAIL REPLY SIMULATOR (M3 — Інтернет, пошта і цифрова безпека)   */
  /* ------------------------------------------------------------------ */
  /*
     Сценарій: лист-запрошення на співбесіду від HR-менеджерки компанії
     «Меблі Плюс». Завдання — написати ділову відповідь із п'ятьма
     обов'язковими елементами. Той самий сценарій, що в тексті M3.
  */
  function EmailReply(container, block, moduleId) {
    const simId = block.id;
    const wasDone = () => !!(window.Progress && Progress.getSimulatorDone && Progress.getSimulatorDone(simId) && Progress.getSimulatorDone(simId).done);

    container.innerHTML = "";
    const wrap = el("div", "sim-card");

    const hd = el("div", "sim-header");
    hd.appendChild(el("h2", "sim-title", "✉ Ділове листування: відповідь на запрошення"));
    hd.appendChild(el("p", "sim-desc",
      "Ознайомтеся з листом нижче. Напишіть ділову відповідь з п'ятьма обов'язковими елементами: " +
      "тема, привітання, подяка, підтвердження дати і часу, підпис."));
    wrap.appendChild(hd);

    // Вхідний лист
    const inbox = el("div", "sim-inbox");
    inbox.innerHTML = `
      <div class="sim-email-meta">
        <div><span class="sim-label">Від:</span> Тетяна Ковальчук &lt;hr@mebliplus.com.ua&gt;</div>
        <div><span class="sim-label">Кому:</span> Вам</div>
        <div><span class="sim-label">Тема:</span> Запрошення на співбесіду — оператор ПК</div>
      </div>
      <div class="sim-email-body">
        <p>Добрий день!</p>
        <p>Мене звати Тетяна, я HR-менеджер компанії «Меблі Плюс».<br>
        Ваше резюме нас зацікавило. Запрошуємо вас на співбесіду на посаду <strong>оператора ПК</strong>.</p>
        <p><strong>Дата:</strong> п'ятниця, 27 червня<br>
        <strong>Час:</strong> 10:00<br>
        <strong>Адреса:</strong> вул. Перемоги, 14, офіс 305</p>
        <p>Будь ласка, підтвердіть свою присутність відповіддю на цей лист.</p>
        <p>З повагою,<br>Тетяна Ковальчук<br><em>HR-менеджер, Меблі Плюс</em></p>
      </div>`;
    wrap.appendChild(inbox);

    // Форма відповіді
    const comp = el("div", "sim-composer");
    comp.appendChild(el("h3", "sim-composer-title", "Відповідь"));

    const metaRow = el("div", "sim-email-meta");
    metaRow.innerHTML = `<div><span class="sim-label">Кому:</span> hr@mebliplus.com.ua</div>`;
    comp.appendChild(metaRow);

    const subjWrap = el("div", "sim-field-wrap");
    const subjLbl = el("label", "sim-field-label"); subjLbl.textContent = "Тема:";
    const subjInp = el("input", "sim-inp");
    subjInp.type = "text";
    subjInp.placeholder = "Тема листа...";
    subjLbl.appendChild(subjInp);
    subjWrap.appendChild(subjLbl);
    comp.appendChild(subjWrap);

    const bodyWrap = el("div", "sim-field-wrap");
    const bodyLbl = el("label", "sim-field-label"); bodyLbl.textContent = "Текст листа:";
    const bodyTA = el("textarea", "sim-textarea");
    bodyTA.placeholder = "Текст листа...";
    bodyTA.rows = 7;
    bodyLbl.appendChild(bodyTA);
    bodyWrap.appendChild(bodyLbl);
    comp.appendChild(bodyWrap);

    // Контрольний список
    const CHECKS = [
      { id:"c-subj",  label:"Тема заповнена",                key:"subj"  },
      { id:"c-greet", label:"Привітання",                    key:"greet" },
      { id:"c-thank", label:"Подяка за запрошення",          key:"thank" },
      { id:"c-conf",  label:"Підтвердження дати і часу",     key:"conf"  },
      { id:"c-sign",  label:"Підпис",                        key:"sign"  },
    ];
    const clWrap = el("div", "sim-checklist");
    const checkNodes = {};
    CHECKS.forEach(c => {
      const row = el("div", "sim-check-row"); row.id = c.id;
      row.innerHTML = `<span class="sim-check-icon">○</span>${c.label}`;
      checkNodes[c.key] = row;
      clWrap.appendChild(row);
    });
    comp.appendChild(clWrap);

    const btn = el("button", "btn primary sim-btn", "Перевірити");
    const resultDiv = el("div", "sim-result");
    comp.appendChild(btn);
    comp.appendChild(resultDiv);
    wrap.appendChild(comp);

    function resetForm() {
      subjInp.disabled = false; bodyTA.disabled = false;
      subjInp.value = ""; bodyTA.value = "";
      CHECKS.forEach(c => {
        const row = checkNodes[c.key];
        row.className = "sim-check-row";
        row.querySelector(".sim-check-icon").textContent = "○";
      });
      resultDiv.className = "sim-result"; resultDiv.textContent = "";
      btn.textContent = "Перевірити"; btn.className = "btn primary sim-btn";
    }

    function markDoneUI() {
      subjInp.disabled = true; bodyTA.disabled = true;
      CHECKS.forEach(c => {
        const row = checkNodes[c.key];
        row.className = "sim-check-row pass";
        row.querySelector(".sim-check-icon").textContent = "✓";
      });
      resultDiv.className = "sim-result success";
      resultDiv.textContent = "Виконано.";
      btn.textContent = "Повторити"; btn.className = "btn ghost sim-btn";
      btn.onclick = () => { resetForm(); btn.onclick = () => doCheck(); };
    }

    function doCheck() {
      const subj = subjInp.value.trim();
      const body = bodyTA.value;
      const bodyL = body.toLowerCase();

      const res = {
        subj:  subj.length > 3,
        greet: /добрий|добридень|вітаю|здрастуй|шановн/i.test(bodyL),
        thank: /дякую|вдячн/i.test(bodyL),
        conf:  /(підтвердж|буду|присутн|п.ятниц|27|10:00)/i.test(bodyL),
        sign:  /(з повагою|щиро|ваш[аи]?)/i.test(bodyL) || /\n[А-ЯІЇЄ]/.test(body),
      };

      let passed = 0;
      CHECKS.forEach(c => {
        const row = checkNodes[c.key];
        if (res[c.key]) {
          row.className = "sim-check-row pass";
          row.querySelector(".sim-check-icon").textContent = "✓";
          passed++;
        } else {
          row.className = "sim-check-row fail";
          row.querySelector(".sim-check-icon").textContent = "✗";
        }
      });

      if (passed === CHECKS.length) {
        if (!window._demo && window.Progress && Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
        markDoneUI();
      } else {
        const missing = CHECKS.filter(c => !res[c.key]).map(c => c.label).join(", ");
        resultDiv.className = "sim-result warn";
        resultDiv.textContent = "Відсутнє: " + missing + ".";
      }
    }

    btn.onclick = () => doCheck();

    if (wasDone()) {
      subjInp.value = "Re: Запрошення на співбесіду — оператор ПК";
      bodyTA.value = "Добрий день, Тетяно!\n\nДякую за запрошення. Підтверджую присутність на співбесіді у п'ятницю, 27 червня, о 10:00.\n\nБуду вчасно за вказаною адресою.\n\nЗ повагою,\n[Ваше ім'я]";
      markDoneUI();
    }

    container.appendChild(wrap);
  }

  /* ------------------------------------------------------------------ */
  /*  FILE MANAGER SIMULATOR (M2 — Операційна система, файли і програми) */
  /* ------------------------------------------------------------------ */
  /*
     Сценарій: папка «Вхідні файли» з 8 перемішаними документами.
     Завдання — розкласти їх по папках «Накази», «Заяви», «Фото», «Таблиці».
     Той самий сценарій, що в selftask M2.
  */
  const FM_FILES = [
    { name:"наказ_001.docx",          icon:"📄", folder:"Накази"  },
    { name:"наказ_прийом.pdf",         icon:"📄", folder:"Накази"  },
    { name:"заява_відпустка.docx",     icon:"📝", folder:"Заяви"   },
    { name:"заява_звільнення.docx",    icon:"📝", folder:"Заяви"   },
    { name:"фото_посвідчення.jpg",     icon:"🖼", folder:"Фото"    },
    { name:"фото_команда.jpg",         icon:"🖼", folder:"Фото"    },
    { name:"табель_серпень.xlsx",      icon:"📊", folder:"Таблиці" },
    { name:"зарплата_вересень.xlsx",   icon:"📊", folder:"Таблиці" },
  ];
  const FM_FOLDERS = ["Накази", "Заяви", "Фото", "Таблиці"];

  function FileManager(container, block, moduleId) {
    const simId = block.id;
    const wasDone = () => !!(window.Progress && Progress.getSimulatorDone && Progress.getSimulatorDone(simId) && Progress.getSimulatorDone(simId).done);

    container.innerHTML = "";
    const wrap = el("div", "sim-card");

    const hd = el("div", "sim-header");
    hd.appendChild(el("h2", "sim-title", "🗂 Файловий менеджер: упорядкуй документи"));
    hd.appendChild(el("p", "sim-desc",
      "Папка «Вхідні файли» містить 8 документів першого дня роботи. " +
      "Клацніть на файл → клацніть на цільову папку. Всі файли мають бути розміщені правильно."));
    wrap.appendChild(hd);

    const placed = {};
    if (wasDone()) FM_FILES.forEach(f => { placed[f.name] = f.folder; });

    let selected = null;
    const resultDiv = el("div", "sim-result");

    function renderArea() {
      const old = wrap.querySelector(".sim-fm-area");
      if (old) old.remove();

      const area = el("div", "sim-fm-area");

      // Джерело
      const srcBox = el("div", "sim-fm-src");
      srcBox.appendChild(el("div", "sim-fm-box-title", "📁 Вхідні файли"));
      const remaining = FM_FILES.filter(f => !placed[f.name]);
      if (!remaining.length) {
        srcBox.appendChild(el("div", "sim-fm-empty", "— порожньо —"));
      }
      remaining.forEach(f => {
        const item = el("div", "sim-fm-file" + (selected === f.name ? " selected" : ""), `${f.icon} ${f.name}`);
        item.dataset.name = f.name;
        item.addEventListener("click", () => {
          if (selected === f.name) { selected = null; renderArea(); return; }
          selected = f.name; renderArea();
        });
        srcBox.appendChild(item);
      });
      area.appendChild(srcBox);

      // Цільові папки
      const tgtWrap = el("div", "sim-fm-targets");
      FM_FOLDERS.forEach(folder => {
        const box = el("div", "sim-fm-folder" + (selected ? " droppable" : ""));
        box.appendChild(el("div", "sim-fm-box-title", "📂 " + folder));
        FM_FILES.filter(f => placed[f.name] === folder).forEach(f => {
          const correct = f.folder === folder;
          const item = el("div", "sim-fm-file placed " + (correct ? "correct" : "wrong"),
            `${f.icon} ${f.name} ${correct ? "✓" : "✗"}`);
          if (!correct) {
            item.title = "Неправильна папка";
            item.addEventListener("click", () => { delete placed[f.name]; renderArea(); });
          }
          box.appendChild(item);
        });
        box.addEventListener("click", () => {
          if (!selected) return;
          placed[selected] = folder;
          selected = null;
          renderArea();
          checkAll();
        });
        tgtWrap.appendChild(box);
      });
      area.appendChild(tgtWrap);

      wrap.insertBefore(area, resultDiv);
    }

    function checkAll() {
      if (Object.keys(placed).length < FM_FILES.length) return;
      const correct = FM_FILES.filter(f => placed[f.name] === f.folder).length;
      if (correct === FM_FILES.length) {
        resultDiv.className = "sim-result success";
        resultDiv.textContent = "Виконано. Усі файли на місці.";
        if (!window._demo && window.Progress && Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
      } else {
        const wrong = FM_FILES.filter(f => placed[f.name] !== f.folder).map(f => f.name);
        resultDiv.className = "sim-result warn";
        resultDiv.textContent = `${correct} з ${FM_FILES.length} правильно. Неправильно: ${wrong.join(", ")}. Клацніть на помилковий файл у папці, щоб повернути його.`;
      }
    }

    const resetBtn = el("button", "btn ghost sim-btn sim-reset", "Почати знову");
    resetBtn.addEventListener("click", () => {
      FM_FILES.forEach(f => delete placed[f.name]);
      selected = null;
      resultDiv.className = "sim-result"; resultDiv.textContent = "";
      renderArea();
    });

    wrap.appendChild(resultDiv);
    wrap.appendChild(resetBtn);

    renderArea();
    if (wasDone()) {
      resultDiv.className = "sim-result success";
      resultDiv.textContent = "Виконано. Усі файли на місці.";
    }

    container.appendChild(wrap);
  }

  /* ------------------------------------------------------------------ */
  /*  DISPATCHER                                                          */
  /* ------------------------------------------------------------------ */
  const COMPONENTS = {
    EmailReply,
    FileManager,
  };

  window.Simulators = {
    render(container, block, moduleId) {
      const Comp = COMPONENTS[block.component];
      if (Comp) Comp(container, block, moduleId);
      else {
        const msg = el("div", "callout warn");
        msg.textContent = `Симулятор «${block.component}» не знайдено.`;
        container.appendChild(msg);
      }
    }
  };
})();

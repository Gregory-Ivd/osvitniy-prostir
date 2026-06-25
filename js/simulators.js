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
  /*  JOB BOARD SIMULATOR (M6 — Резюме, портфоліо і Біржа праці)        */
  /* ------------------------------------------------------------------ */
  /*
     Сценарій: офлайн-копія біржі workprison.com.ua — 10 вакансій,
     фільтр за категорією. Клік на вакансію → деталі → «Відгукнутися»
     → email-форма з валідацією (5 критеріїв). Той самий шлях, що
     описаний у тексті M6: навички → резюме → відгук на вакансію.
  */
  const JB_JOBS = [
    { id:1, cat:"Оператор ПК",
      title:"Оператор введення даних",
      company:"ТОВ «Логістик Груп»", email:"hr@logistikgroup.com.ua",
      salary:"від 8 000 грн", format:"Дистанційно",
      desc:"Введення замовлень у базу даних, перевірка відповідності накладних. Потрібна увага та впевнена робота з таблицями.",
      req:["MS Excel або Google Sheets","Уважність","Швидкий набір тексту"] },
    { id:2, cat:"Тексти",
      title:"Копірайтер — опис товарів",
      company:"Інтернет-магазин «HomeStyle»", email:"content@homestyle.ua",
      salary:"від 6 000 грн + відрядна", format:"Дистанційно",
      desc:"Написання коротких описів товарів (50–150 слів). Є шаблони й приклади. Підходить для початківців.",
      req:["Грамотна українська мова","Word або Google Docs","Відповідальність"] },
    { id:3, cat:"Документи",
      title:"Помічник діловода",
      company:"ГО «Правова допомога»", email:"office@pravdop.org.ua",
      salary:"за домовленістю", format:"Дистанційно",
      desc:"Оформлення документів, ведення реєстрів у Word та Excel, підготовка матеріалів до архіву.",
      req:["Word, Excel","Акуратність","Базова комп'ютерна грамотність"] },
    { id:4, cat:"Тексти",
      title:"Транскрибатор (аудіо → текст)",
      company:"Студія «Медіапро»", email:"jobs@mediapro.com.ua",
      salary:"від 40 грн/хв аудіо", format:"Дистанційно",
      desc:"Переводити аудіо- та відеозаписи в текст. Потрібна увага й грамотність, спеціальних знань не треба.",
      req:["Швидкий набір","Грамотна мова","Навушники"] },
    { id:5, cat:"Тексти",
      title:"Коректор текстів",
      company:"Видавництво «Слово»", email:"editor@slovopub.com.ua",
      salary:"від 7 000 грн", format:"Дистанційно",
      desc:"Перевірка текстів на граматичні й пунктуаційні помилки. Робота у Google Docs.",
      req:["Знання української орфографії","Уважність","Google Docs"] },
    { id:6, cat:"Оператор ПК",
      title:"Адміністратор бази клієнтів",
      company:"Медичний центр «Здоров'я»", email:"admin@zdorovua.com.ua",
      salary:"від 9 000 грн", format:"Дистанційно",
      desc:"Внесення даних у CRM-систему, обробка заявок. Навчання від компанії.",
      req:["Впевнена робота з ПК","Акуратність","Конфіденційність"] },
    { id:7, cat:"Дизайн",
      title:"Помічник дизайнера (Canva)",
      company:"Агенція «Бренд»", email:"design@brand-agency.com.ua",
      salary:"від 5 000 грн", format:"Дистанційно",
      desc:"Виготовлення банерів за шаблонами у Canva. Навчання надається.",
      req:["Базові навички ПК","Естетичний смак","Canva або бажання навчитися"] },
    { id:8, cat:"Веб",
      title:"Верстальник сайтів (початковий рівень)",
      company:"Студія «WebStart»", email:"hr@webstart.com.ua",
      salary:"від 10 000 грн", format:"Дистанційно",
      desc:"Верстка сторінок за макетами (HTML/CSS). Компанія навчає з нуля.",
      req:["Базова грамотність","Логічне мислення","Готовність навчатися"] },
    { id:9, cat:"Тексти",
      title:"Контент-менеджер соцмереж",
      company:"Бренд «Стиль UA»", email:"smm@styleuа.com.ua",
      salary:"від 6 500 грн", format:"Дистанційно",
      desc:"Підготовка текстів для публікацій. Є контент-план і шаблони.",
      req:["Грамотна мова","Google Docs","Відповідальність"] },
    { id:10, cat:"Документи",
      title:"Оцифровщик документів",
      company:"Консалтинг «Документ»", email:"archive@doc-consult.ua",
      salary:"від 7 500 грн", format:"Дистанційно",
      desc:"Сканування, впорядкування й іменування документів за стандартом.",
      req:["Уважність","Excel або таблиці","Базова робота з файлами"] },
  ];
  const JB_CATS = ["Всі","Оператор ПК","Тексти","Документи","Дизайн","Веб"];

  function JobBoard(container, block, moduleId) {
    const simId = block.id;
    const wasDone = () => !!(window.Progress && Progress.getSimulatorDone && Progress.getSimulatorDone(simId) && Progress.getSimulatorDone(simId).done);

    container.innerHTML = "";
    const wrap = el("div", "sim-card");

    // Header
    const hd = el("div", "sim-header");
    hd.appendChild(el("h2", "sim-title", "🏗 Біржа праці — workprison.com.ua"));
    hd.appendChild(el("p", "sim-desc",
      "Оберіть вакансію, ознайомтесь з умовами та надішліть відгук. " +
      "Відгук має містити п'ять обов'язкових елементів ділового листа."));
    wrap.appendChild(hd);

    let activeCat = "Всі";
    let activeJob = null;
    let applied = false;

    // Panels
    const listPanel  = el("div", "jb-panel jb-list-panel");
    const detailPanel = el("div", "jb-panel jb-detail-panel");
    detailPanel.style.display = "none";
    const body = el("div", "jb-body");
    body.appendChild(listPanel); body.appendChild(detailPanel);
    wrap.appendChild(body);

    // Done banner
    const doneBanner = el("div", "sim-result success jb-done-banner");
    doneBanner.style.margin = "0 24px 20px";
    if (wasDone()) { doneBanner.textContent = "Виконано. Відгук надіслано."; }
    wrap.appendChild(doneBanner);

    function renderList() {
      listPanel.innerHTML = "";

      // Filter bar
      const filterBar = el("div", "jb-filters");
      JB_CATS.forEach(cat => {
        const btn = el("button", "jb-filter" + (cat === activeCat ? " active" : ""), cat);
        btn.addEventListener("click", () => { activeCat = cat; activeJob = null; renderList(); detailPanel.style.display = "none"; });
        filterBar.appendChild(btn);
      });
      listPanel.appendChild(filterBar);

      // Cards
      const grid = el("div", "jb-grid");
      const jobs = activeCat === "Всі" ? JB_JOBS : JB_JOBS.filter(j => j.cat === activeCat);
      jobs.forEach(job => {
        const card = el("div", "jb-card" + (activeJob && activeJob.id === job.id ? " active" : ""));
        card.appendChild(el("div", "jb-cat-badge", job.cat));
        card.appendChild(el("div", "jb-card-title", job.title));
        card.appendChild(el("div", "jb-card-company", job.company));
        card.appendChild(el("div", "jb-card-meta", `${job.salary} · ${job.format}`));
        card.addEventListener("click", () => { activeJob = job; renderList(); renderDetail(); detailPanel.style.display = ""; });
        grid.appendChild(card);
      });
      listPanel.appendChild(grid);
    }

    const JB_CHECKS = [
      { key:"subj",   label:"Тема заповнена"                     },
      { key:"greet",  label:"Привітання"                         },
      { key:"vacancy",label:"Назва вакансії або «вакансія»"       },
      { key:"resume", label:"Згадка про резюме або портфоліо"     },
      { key:"sign",   label:"Підпис"                             },
    ];

    function renderDetail() {
      detailPanel.innerHTML = "";

      if (!activeJob) return;
      const job = activeJob;

      const backBtn = el("button", "btn ghost jb-back", "← Назад до списку");
      backBtn.addEventListener("click", () => { activeJob = null; detailPanel.style.display = "none"; renderList(); });
      detailPanel.appendChild(backBtn);

      detailPanel.appendChild(el("div", "jb-cat-badge", job.cat));
      detailPanel.appendChild(el("h3", "jb-detail-title", job.title));
      detailPanel.appendChild(el("div", "jb-detail-company", job.company));
      detailPanel.appendChild(el("div", "jb-detail-meta", `${job.salary} · ${job.format}`));
      detailPanel.appendChild(el("p", "jb-detail-desc", job.desc));

      const reqList = el("ul", "jb-req-list");
      job.req.forEach(r => reqList.appendChild(el("li", null, r)));
      const reqBlock = el("div");
      reqBlock.appendChild(el("div", "jb-req-label", "Вимоги:"));
      reqBlock.appendChild(reqList);
      detailPanel.appendChild(reqBlock);

      // Email form
      const formDiv = el("div", "jb-email-form");
      formDiv.appendChild(el("h4", "sim-composer-title", "Відгук на вакансію"));

      const metaRow = el("div", "sim-email-meta");
      metaRow.innerHTML = `<div><span class="sim-label">Кому:</span> ${job.email}</div>`;
      formDiv.appendChild(metaRow);

      const subjWrap = el("div", "sim-field-wrap");
      const subjLbl = el("label", "sim-field-label"); subjLbl.textContent = "Тема:";
      const subjInp = el("input", "sim-inp");
      subjInp.placeholder = "Тема листа...";
      subjInp.value = applied ? `Відгук на вакансію: ${job.title}` : "";
      if (applied) subjInp.disabled = true;
      subjLbl.appendChild(subjInp); subjWrap.appendChild(subjLbl);
      formDiv.appendChild(subjWrap);

      const bodyWrap = el("div", "sim-field-wrap");
      const bodyLbl = el("label", "sim-field-label"); bodyLbl.textContent = "Текст листа:";
      const bodyTA = el("textarea", "sim-textarea");
      bodyTA.placeholder = "Текст листа...";
      bodyTA.rows = 6;
      if (applied) {
        bodyTA.value = `Добрий день!\n\nМене зацікавила ваша вакансія «${job.title}». Маю відповідні навички та готовий до роботи.\n\nДодаю резюме для ознайомлення. Готовий відповісти на запитання.\n\nЗ повагою,\n[Ваше ім'я]`;
        bodyTA.disabled = true;
      }
      bodyLbl.appendChild(bodyTA); bodyWrap.appendChild(bodyLbl);
      formDiv.appendChild(bodyWrap);

      // Checklist
      const clWrap = el("div", "sim-checklist");
      const checkNodes = {};
      JB_CHECKS.forEach(c => {
        const row = el("div", "sim-check-row" + (applied ? " pass" : ""));
        row.innerHTML = `<span class="sim-check-icon">${applied ? "✓" : "○"}</span>${c.label}`;
        checkNodes[c.key] = row;
        clWrap.appendChild(row);
      });
      formDiv.appendChild(clWrap);

      const checkBtn = el("button", applied ? "btn ghost sim-btn" : "btn primary sim-btn", applied ? "Повторити" : "Надіслати відгук");
      const resultDiv = el("div", "sim-result" + (applied ? " success" : ""));
      if (applied) resultDiv.textContent = "Відгук надіслано.";
      formDiv.appendChild(checkBtn);
      formDiv.appendChild(resultDiv);

      checkBtn.addEventListener("click", () => {
        if (applied) {
          // Reset
          applied = false;
          subjInp.disabled = false; bodyTA.disabled = false;
          subjInp.value = ""; bodyTA.value = "";
          JB_CHECKS.forEach(c => {
            const row = checkNodes[c.key];
            row.className = "sim-check-row";
            row.querySelector(".sim-check-icon").textContent = "○";
          });
          resultDiv.className = "sim-result"; resultDiv.textContent = "";
          checkBtn.textContent = "Надіслати відгук"; checkBtn.className = "btn primary sim-btn";
          return;
        }

        const subj = subjInp.value.trim();
        const bodyRaw = bodyTA.value;
        const bodyL = bodyRaw.toLowerCase();
        const titleL = job.title.toLowerCase().split(" ")[0]; // перше слово вакансії

        const res = {
          subj:    subj.length > 3,
          greet:   /добрий|вітаю|шановн/i.test(bodyL),
          vacancy: new RegExp(titleL + "|вакансі|посад", "i").test(bodyL) || /вакансі|посад/i.test(subj),
          resume:  /резюме|портфоліо|надішлю|додаю|кваліфікац|досвід/i.test(bodyL),
          sign:    /(з повагою|щиро|ваш[аи]?)/i.test(bodyL) || /\n[А-ЯІЇЄ]/.test(bodyRaw),
        };

        let passed = 0;
        JB_CHECKS.forEach(c => {
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

        if (passed === JB_CHECKS.length) {
          applied = true;
          subjInp.disabled = true; bodyTA.disabled = true;
          resultDiv.className = "sim-result success";
          resultDiv.textContent = "Відгук надіслано.";
          checkBtn.textContent = "Повторити"; checkBtn.className = "btn ghost sim-btn";
          doneBanner.textContent = "Виконано. Відгук надіслано.";
          if (!window._demo && window.Progress && Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
        } else {
          const missing = JB_CHECKS.filter(c => !res[c.key]).map(c => c.label).join(", ");
          resultDiv.className = "sim-result warn";
          resultDiv.textContent = "Відсутнє: " + missing + ".";
        }
      });

      detailPanel.appendChild(formDiv);
    }

    renderList();
    container.appendChild(wrap);
  }

  /* ------------------------------------------------------------------ */
  /*  DIIA FORM SIMULATOR (M4 — Дія та електронні послуги)              */
  /* ------------------------------------------------------------------ */
  const DIIA_SERVICES = [
    { id:"id-card", icon:"🪪", title:"Заміна ID-картки",
      desc:"Замінити паспорт у вигляді книжечки на сучасну ID-картку", time:"⏱ Термін: 20 хвилин",
      extraLabel:"Серія та номер старого паспорта", extraPlaceholder:"АА 123456" },
    { id:"residence", icon:"🏠", title:"Реєстрація місця проживання",
      desc:"Зареєструватися за адресою після переїзду", time:"⏱ Термін: 1 робочий день",
      extraLabel:"Нова адреса реєстрації", extraPlaceholder:"м. Житомир, вул. Перемоги, 14" },
    { id:"fop", icon:"💼", title:"Реєстрація ФОП",
      desc:"Стати фізичною особою-підприємцем для легальної роботи на себе", time:"⏱ Термін: 1 робочий день",
      extraLabel:"Вид діяльності (КВЕД)", extraPlaceholder:"62.01 — Комп'ютерне програмування" },
  ];

  function DiiaForm(container, block, moduleId) {
    const simId = block.id;
    const wasDone = () => !!(window.Progress && Progress.getSimulatorDone && Progress.getSimulatorDone(simId) && Progress.getSimulatorDone(simId).done);

    container.innerHTML = "";
    const wrap = el("div", "sim-card");

    const hdr = el("div", "diia-header");
    hdr.innerHTML = `<div class="diia-logo"><span class="diia-trident">✶</span><span class="diia-wordmark">ДІЯ</span></div><div class="diia-header-sub">Портал державних послуг · diia.gov.ua</div>`;
    wrap.appendChild(hdr);

    let step = wasDone() ? 3 : 1;
    let selectedService = wasDone() ? DIIA_SERVICES[0] : null;
    let appNum = "ЗВ-" + (Math.floor(Math.random() * 900000) + 100000);

    function renderSteps(active) {
      const old = wrap.querySelector(".diia-steps");
      if (old) old.remove();
      const div = el("div", "diia-steps");
      [["Вибір послуги",1],["Заповнення",2],["Підтвердження",3]].forEach(([label,n],i) => {
        const s = el("div","diia-step "+(n<active?"done":n===active?"active":""));
        s.appendChild(el("div","diia-step-num",n<active?"✓":String(n)));
        s.appendChild(el("div","diia-step-label",label));
        div.appendChild(s);
        if (i<2) div.appendChild(el("div","diia-step-connector"));
      });
      const cont = wrap.querySelector(".diia-content");
      if (cont) wrap.insertBefore(div,cont); else wrap.appendChild(div);
    }

    function renderContent() {
      const old = wrap.querySelector(".diia-content");
      if (old) old.remove();
      const cont = el("div","diia-content");

      if (step===1) {
        cont.appendChild(el("div","diia-section-title","Оберіть послугу"));
        const grid = el("div","diia-service-grid");
        let nextBtn;
        DIIA_SERVICES.forEach(svc => {
          const card = el("div","diia-service-card"+(selectedService&&selectedService.id===svc.id?" selected":""));
          card.innerHTML = `<div class="diia-svc-icon">${svc.icon}</div><div class="diia-svc-title">${svc.title}</div><div class="diia-svc-desc">${svc.desc}</div><div class="diia-svc-time">${svc.time}</div>`;
          card.addEventListener("click",()=>{
            selectedService=svc;
            grid.querySelectorAll(".diia-service-card").forEach(c=>c.classList.remove("selected"));
            card.classList.add("selected");
            if(nextBtn) nextBtn.disabled=false;
          });
          grid.appendChild(card);
        });
        cont.appendChild(grid);
        const row=el("div","diia-btn-row");
        nextBtn=el("button","diia-next-btn"); nextBtn.textContent="Далі →"; nextBtn.disabled=!selectedService;
        nextBtn.addEventListener("click",()=>{step=2;render();});
        row.appendChild(nextBtn); cont.appendChild(row);

      } else if (step===2) {
        cont.appendChild(el("div","diia-section-title",selectedService?selectedService.title:"Заповнення форми"));
        const form=el("div","diia-form");
        const fields=[
          {label:"Прізвище, ім'я, по батькові",placeholder:"Іванов Іван Іванович",id:"pib"},
          {label:"Дата народження",placeholder:"01.01.1990",id:"dob"},
          {label:"РНОКПП (ідентифікаційний код)",placeholder:"1234567890",id:"rno"},
        ];
        if(selectedService) fields.push({label:selectedService.extraLabel,placeholder:selectedService.extraPlaceholder,id:"extra"});
        const inputs={};
        fields.forEach(f=>{
          const g=el("div","diia-field-group");
          g.appendChild(el("div","diia-field-label",f.label));
          const inp=el("input","diia-input"); inp.type="text"; inp.placeholder=f.placeholder; inp.autocomplete="off";
          g.appendChild(inp); form.appendChild(g); inputs[f.id]=inp;
        });
        cont.appendChild(form);
        const err=el("div","diia-err"); err.textContent="Будь ласка, заповніть усі поля."; cont.appendChild(err);
        const row=el("div","diia-btn-row");
        const back=el("button","diia-back-btn"); back.textContent="← Назад";
        back.addEventListener("click",()=>{step=1;render();});
        const submit=el("button","diia-next-btn"); submit.textContent="Подати заяву";
        submit.addEventListener("click",()=>{
          if(!Object.values(inputs).every(i=>i.value.trim().length>0)){err.classList.add("show");return;}
          err.classList.remove("show"); step=3;
          if(!window._demo&&window.Progress&&Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
          render();
        });
        row.appendChild(back); row.appendChild(submit); cont.appendChild(row);

      } else {
        const svc=selectedService||DIIA_SERVICES[0];
        cont.innerHTML=`<div class="diia-success">
          <div class="diia-success-icon">✅</div>
          <div class="diia-success-title">Заяву прийнято!</div>
          <div class="diia-success-appnum">Номер заяви: <strong>${appNum}</strong></div>
          <div class="diia-success-desc">Послуга: <strong>${svc.title}</strong><br>Ви отримаєте повідомлення про готовність у застосунку «Дія».</div>
          <div class="diia-status-track">
            <div class="diia-track-item done">✅ Прийнято</div>
            <div class="diia-track-item current">⏳ В обробці</div>
            <div class="diia-track-item">— Готово до отримання</div>
          </div>
          <div style="margin-top:16px"><button class="diia-next-btn diia-try-again">Спробувати іншу послугу</button></div>
        </div>`;
        cont.querySelector(".diia-try-again").addEventListener("click",()=>{step=1;selectedService=null;render();});
      }
      wrap.appendChild(cont);
    }

    function render(){renderSteps(step);renderContent();}
    render();
    container.appendChild(wrap);
  }

  /* ------------------------------------------------------------------ */
  /*  DOCS EDITOR SIMULATOR (M5 — Документи й таблиці, part 1)          */
  /* ------------------------------------------------------------------ */
  const DOCS_INITIAL_HTML = `<p>ЗАЯВА</p>
<p>Начальнику ДУ «Житомирська УВП №8»<br>Квасному А.В.</p>
<p>від [ваше ім'я та прізвище]</p>
<p>Прошу надати дозвіл на навчання в рамках пілотного проекту «Освітній простір».</p>
<p>Підстави:</p>
<p>Бажання отримати цифрові навички</p>
<p>Мета — підвищення шансів на працевлаштування</p>
<p>Готовність дотримуватись вимог навчального процесу</p>
<p>Дата: ___.____.2026</p>
<p>Підпис: ___________</p>`;

  const DOCS_DONE_HTML = `<h1>ЗАЯВА</h1>
<p>Начальнику ДУ «Житомирська УВП №8»<br>Квасному А.В.</p>
<p>від <strong>[ваше ім'я та прізвище]</strong></p>
<p>Прошу надати дозвіл на навчання в рамках пілотного проекту «Освітній простір».</p>
<p>Підстави:</p>
<ul><li>Бажання отримати цифрові навички</li><li>Мета — підвищення шансів на працевлаштування</li><li>Готовність дотримуватись вимог навчального процесу</li></ul>
<p>Дата: ___.____.2026</p>
<p>Підпис: ___________</p>`;

  function DocsEditor(container, block, moduleId) {
    const simId = block.id;
    const isDone = () => !!(window.Progress && Progress.getSimulatorDone && Progress.getSimulatorDone(simId) && Progress.getSimulatorDone(simId).done);

    container.innerHTML = "";
    const simHdr = el("div","sim-header");
    simHdr.appendChild(el("h2","sim-title","📝 Google Документи: відформатуй заяву"));
    simHdr.appendChild(el("p","sim-desc","Завдання: 1) зроби «ЗАЯВА» заголовком — виділи слово і обери Заголовок 1; 2) виділи жирним своє ім'я; 3) перетвори список підстав на маркований список."));
    container.appendChild(simHdr);

    const shell = el("div","gdocs-shell");

    const titlebar = el("div","gdocs-titlebar");
    titlebar.innerHTML = `<span class="gdocs-icon">📄</span><span class="gdocs-filename">Заява.docx</span><span class="gdocs-saved">Збережено на диску</span>`;
    shell.appendChild(titlebar);

    const menubar = el("div","gdocs-menubar");
    ["Файл","Правка","Вигляд","Вставити","Формат","Інструменти"].forEach(m=>menubar.appendChild(el("span",null,m)));
    shell.appendChild(menubar);

    const toolbar = el("div","gdocs-toolbar");
    const headingSel = el("select","gdocs-heading-sel");
    [["Звичайний текст","p"],["Заголовок 1","h1"],["Заголовок 2","h2"]].forEach(([lbl,val])=>{
      const o=document.createElement("option"); o.value=val; o.textContent=lbl; headingSel.appendChild(o);
    });
    // зберігаємо виділення перед тим, як <select> забере фокус у contenteditable
    let _hSel=null;
    headingSel.addEventListener("mousedown",()=>{const s=window.getSelection();if(s&&s.rangeCount>0)_hSel=s.getRangeAt(0).cloneRange();});
    headingSel.addEventListener("change",()=>{
      if(!isDone()){
        if(_hSel){const s=window.getSelection();s.removeAllRanges();s.addRange(_hSel);}
        document.execCommand("formatBlock",false,headingSel.value);
        checkProgress();
      }
      _hSel=null;
    });

    const fontSel = el("select","gdocs-font-sel");
    ["Arial","Times New Roman","Courier New"].forEach(f=>{
      const o=document.createElement("option"); o.value=f; o.textContent=f; fontSel.appendChild(o);
    });
    const sizeSel = el("select","gdocs-size-sel");
    ["10","11","12","14","16"].forEach(s=>{
      const o=document.createElement("option"); o.value=s; o.textContent=s;
      if(s==="11") o.selected=true; sizeSel.appendChild(o);
    });

    function mkBtn(html,cmd,val){
      const b=el("button","gdocs-btn"); b.innerHTML=html;
      b.addEventListener("mousedown",e=>e.preventDefault());
      b.addEventListener("click",()=>{if(!isDone()){document.execCommand(cmd,false,val||null);}checkProgress();});
      return b;
    }
    const grp0=el("div","gdocs-tool-group");
    grp0.appendChild(headingSel); grp0.appendChild(fontSel); grp0.appendChild(sizeSel);
    const sep=()=>el("div","gdocs-tool-sep");
    const grp1=el("div","gdocs-tool-group");
    grp1.appendChild(mkBtn("<b>Ж</b>","bold"));
    grp1.appendChild(mkBtn("<i>К</i>","italic"));
    grp1.appendChild(mkBtn("<u>П</u>","underline"));
    const grp2=el("div","gdocs-tool-group");
    grp2.appendChild(mkBtn("≡•","insertUnorderedList"));
    grp2.appendChild(mkBtn("≡1","insertOrderedList"));
    const grp3=el("div","gdocs-tool-group");
    grp3.appendChild(mkBtn("⬅","justifyLeft"));
    grp3.appendChild(mkBtn("↔","justifyFull"));
    grp3.appendChild(mkBtn("➡","justifyRight"));
    toolbar.appendChild(grp0); toolbar.appendChild(sep()); toolbar.appendChild(grp1);
    toolbar.appendChild(sep()); toolbar.appendChild(grp2); toolbar.appendChild(sep()); toolbar.appendChild(grp3);
    shell.appendChild(toolbar);

    const docWrapper = el("div","gdocs-doc-wrapper");
    const doc = el("div","gdocs-doc");
    doc.contentEditable = isDone() ? "false" : "true";
    doc.spellcheck = false;
    doc.innerHTML = isDone() ? DOCS_DONE_HTML : DOCS_INITIAL_HTML;
    doc.addEventListener("input", checkProgress);
    docWrapper.appendChild(doc); shell.appendChild(docWrapper);
    container.appendChild(shell);

    const CHECKS=[
      {key:"heading",label:"Заголовок застосовано (ЗАЯВА → Заголовок 1 або 2)"},
      {key:"bold",   label:"Жирний текст є"},
      {key:"list",   label:"Маркований або нумерований список є"},
    ];
    const clWrap=el("div","sim-checklist"); clWrap.style.padding="12px 20px 0";
    const checkNodes={};
    CHECKS.forEach(c=>{
      const row=el("div","sim-check-row"+(isDone()?" pass":""));
      row.innerHTML=`<span class="sim-check-icon">${isDone()?"✓":"○"}</span>${c.label}`;
      checkNodes[c.key]=row; clWrap.appendChild(row);
    });
    container.appendChild(clWrap);

    const resultDiv=el("div","sim-result"); resultDiv.style.margin="8px 20px 16px";
    if(isDone()){resultDiv.className="sim-result success";resultDiv.textContent="Виконано. Документ відформатовано.";}
    container.appendChild(resultDiv);

    function checkProgress(){
      const html=doc.innerHTML;
      const res={heading:/<h[1-3]/i.test(html),bold:/<strong|<b[> ]/i.test(html),list:/<ul|<ol/i.test(html)};
      let passed=0;
      CHECKS.forEach(c=>{
        const row=checkNodes[c.key];
        if(res[c.key]){row.className="sim-check-row pass";row.querySelector(".sim-check-icon").textContent="✓";passed++;}
        else{row.className="sim-check-row";row.querySelector(".sim-check-icon").textContent="○";}
      });
      if(passed===CHECKS.length){
        resultDiv.className="sim-result success"; resultDiv.textContent="Виконано. Документ відформатовано.";
        doc.contentEditable="false";
        if(!window._demo&&window.Progress&&Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
      } else {resultDiv.className="sim-result";resultDiv.textContent="";}
    }
    if(isDone()) checkProgress();
  }

  /* ------------------------------------------------------------------ */
  /*  SHEETS EDITOR SIMULATOR (M5 — Документи й таблиці, part 2)        */
  /* ------------------------------------------------------------------ */
  const SHEETS_ROWS = [
    {a:"Категорія",      b:"Сума (грн)", header:true},
    {a:"Оренда",         b:"3 500"},
    {a:"Продукти",       b:"2 800"},
    {a:"Транспорт",      b:"650"},
    {a:"Комунальні",     b:"1 200"},
    {a:"Інше",           b:"400"},
    {a:"РАЗОМ",          b:"", task:true},
    {a:"Найбільша стаття",b:"", bonus:true},
  ];

  function evalSheetFormula(raw){
    const f=raw.trim().toUpperCase();
    if(f==="=SUM(B2:B6)") return "8 550";
    if(f==="=MAX(B2:B6)") return "3 500";
    if(f.startsWith("=")) return "#ЗНАЧ!";
    return raw;
  }

  function SheetsEditor(container, block, moduleId){
    const simId=block.id;
    const isDone=()=>!!(window.Progress&&Progress.getSimulatorDone&&Progress.getSimulatorDone(simId)&&Progress.getSimulatorDone(simId).done);

    container.innerHTML="";
    const simHdr=el("div","sim-header");
    simHdr.appendChild(el("h2","sim-title","📊 Google Таблиці: формула SUM"));
    simHdr.appendChild(el("p","sim-desc","Клацніть на комірку B7 (РАЗОМ) і введіть =SUM(B2:B6), натисніть Enter. Бонус: у B8 введіть =MAX(B2:B6)."));
    container.appendChild(simHdr);

    const shell=el("div","gsheets-shell");

    const fbar=el("div","gsheets-fbar");
    const cellRef=el("div","gsheets-cell-ref","A1");
    fbar.appendChild(cellRef);
    fbar.appendChild(el("div","gsheets-fbar-fx","fx"));
    const fbarInp=el("input","gsheets-fbar-input"); fbarInp.placeholder="Формула або значення"; fbarInp.readOnly=true;
    fbar.appendChild(fbarInp);
    shell.appendChild(fbar);

    const gridWrap=el("div","gsheets-grid-wrap");
    const table=el("table","gsheets-table");
    const thead=document.createElement("thead");
    const hr=document.createElement("tr");
    hr.appendChild(el("th","gsheets-corner"));
    ["A","B"].forEach(c=>hr.appendChild(el("th","gsheets-col-header",c)));
    thead.appendChild(hr); table.appendChild(thead);

    const tbody=document.createElement("tbody");
    const cellInps={};
    const done=isDone();

    SHEETS_ROWS.forEach((row,i)=>{
      const rn=i+1;
      const tr=document.createElement("tr");
      tr.appendChild(el("td","gsheets-row-header",String(rn)));
      const cls=" "+(row.header?"gsheets-header-row":(row.task||row.bonus)?"gsheets-sum-row":"");
      tr.appendChild(el("td","gsheets-cell"+cls,row.a));
      const tdB=el("td","gsheets-cell"+cls);
      const cellKey="B"+rn;
      if(row.task||row.bonus){
        const inp=el("input","gsheets-cell-input");
        inp.readOnly=done;
        if(done){inp.value=evalSheetFormula(row.task?"=SUM(B2:B6)":"=MAX(B2:B6)");inp.style.color="#333";}
        inp.placeholder=row.task?"=SUM(B2:B6)":"=MAX(B2:B6)";
        inp.addEventListener("focus",()=>{
          tdB.classList.add("gsheets-cell-selected");
          cellRef.textContent=cellKey; fbarInp.readOnly=false; fbarInp.value=inp.value;
        });
        inp.addEventListener("blur",()=>{tdB.classList.remove("gsheets-cell-selected");fbarInp.readOnly=true;});
        inp.addEventListener("input",()=>{fbarInp.value=inp.value;});
        inp.addEventListener("keydown",e=>{
          if(e.key==="Enter"){e.preventDefault();applyFml(inp,cellKey,row);inp.blur();}
        });
        tdB.appendChild(inp); cellInps[cellKey]=inp;
      } else {
        tdB.textContent=row.b;
      }
      tr.appendChild(tdB); tbody.appendChild(tr);
    });
    table.appendChild(tbody); gridWrap.appendChild(table); shell.appendChild(gridWrap);

    const tabs=el("div","gsheets-tabs");
    tabs.innerHTML=`<div class="gsheets-tab active">📄 Лист1</div><div class="gsheets-tab">+</div>`;
    shell.appendChild(tabs);
    container.appendChild(shell);

    const resultDiv=el("div","sim-result"); resultDiv.style.marginTop="10px";
    if(done){resultDiv.className="sim-result success";resultDiv.textContent="Виконано. Формула =SUM(B2:B6) введена правильно.";}
    container.appendChild(resultDiv);

    function applyFml(inp,key,row){
      const raw=inp.value.trim();
      const val=evalSheetFormula(raw);
      inp.value=val; inp.style.color=val==="#ЗНАЧ!"?"#c0392b":"#333";
      if(key==="B7"&&raw.toUpperCase()==="=SUM(B2:B6)"){
        resultDiv.className="sim-result success";
        resultDiv.textContent="Правильно! =SUM(B2:B6) = 8 550 грн. Загальна сума витрат.";
        if(!window._demo&&window.Progress&&Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
      } else if(key==="B8"&&raw.toUpperCase()==="=MAX(B2:B6)"){
        if(!resultDiv.parentNode.querySelector(".gsheets-bonus")){
          const bonusDiv=el("div","sim-result success gsheets-bonus"); bonusDiv.style.marginTop="6px";
          bonusDiv.textContent="Бонус! =MAX(B2:B6) = 3 500 грн (найбільша стаття — оренда).";
          resultDiv.parentNode.insertBefore(bonusDiv,resultDiv.nextSibling);
        }
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  AI CHAT SIMULATOR (M8 — AI як особистий асистент: промптинг)       */
  /* ------------------------------------------------------------------ */
  function scorePromptText(text){
    const t=text.toLowerCase();
    return {
      task:   /напиш|поясн|допоможи|порад|склад|опиш|зроб|підказ|розкаж|переклад|знайд/i.test(t),
      context:/для|щоб|тому що|бо|мені|моєму|я хочу|мета|після|перед|коли|якщо/i.test(t),
      format: /список|таблиц|коротко|докладно|пункт|форматі|нумерован|маркован|по кроках|у вигляді|одним реченням|простими словами/i.test(t),
    };
  }

  function getAIResponse(text,score){
    const t=text.toLowerCase();
    if(!score.task) return "Я не зрозумів, що саме потрібно зробити. Спробуй почати з дієслова: «напиши», «поясни», «допоможи», «знайди»...";
    if(!score.context) return "Можу відповісти, але контекст допоможе точніше. Уточни: для кого це? Навіщо? В якій ситуації?";
    if(!score.format) return "Хороше завдання! Але в якому форматі потрібна відповідь — список, таблиця, коротко, по кроках?";
    if(/резюм/i.test(t)) return "Ось структура резюме для оператора ПК:\n\n1. Контактна інформація\n2. Ціль: посада оператора ПК\n3. Навички: MS Excel, введення даних, уважність\n4. Досвід (конкретно що робив)\n5. Освіта\n\nПорада: збережи у форматі .pdf перед надсиланням.";
    if(/дія|паспорт|id.картк/i.test(t)) return "Кроки для заміни ID-картки через Дія:\n\n1. Відкрий diia.gov.ua у браузері\n2. Обери «Паспорт → Замовити ID-картку»\n3. Заповни форму: ПІБ, дата народження, РНОКПП\n4. Завантаж фото (якщо потрібно)\n5. Підтверди — термін до 20 хвилин";
    if(/excel|таблиц|формул|sum/i.test(t)) return "Корисні формули Excel:\n\n=SUM(A1:A10) — сума діапазону\n=AVERAGE(A1:A10) — середнє\n=MAX(A1:A10) — максимум\n=MIN(A1:A10) — мінімум\n\nВведи формулу в комірку і натисни Enter.";
    if(/html|сайт|веб/i.test(t)) return "Базова HTML-сторінка:\n\n<!DOCTYPE html>\n<html>\n<head><title>Назва</title></head>\n<body>\n  <h1>Заголовок</h1>\n  <p>Абзац</p>\n  <a href=\"...\">Посилання</a>\n</body>\n</html>";
    return "Зрозумів завдання. Ось відповідь:\n\n• Перший крок: визначте конкретну мету\n• Другий крок: зберіть потрібні дані або ресурси\n• Третій крок: виконайте завдання за планом\n\nЯкщо потрібні деталі — уточни!";
  }

  function AIChat(container, block, moduleId){
    const simId=block.id;
    const isDone=()=>!!(window.Progress&&Progress.getSimulatorDone&&Progress.getSimulatorDone(simId)&&Progress.getSimulatorDone(simId).done);

    container.innerHTML="";
    const simHdr=el("div","sim-header");
    simHdr.appendChild(el("h2","sim-title","🤖 ChatGPT: практика промптингу"));
    simHdr.appendChild(el("p","sim-desc","Напиши промпт за формулою: Завдання + Контекст + Формат. Усі три індикатори мають стати зеленими."));
    container.appendChild(simHdr);

    const ui=el("div","aichat-ui");

    const sidebar=el("div","aichat-sidebar");
    sidebar.innerHTML=`<div class="aichat-brand"><span class="aichat-brand-icon">◉</span> ChatGPT</div>
      <button class="aichat-new-btn">+ Нова розмова</button>
      <div class="aichat-history">
        <div class="aichat-hist-label">Сьогодні</div>
        <div class="aichat-hist-item active">Практика промптингу</div>
        <div class="aichat-hist-item">Вакансії та резюме</div>
      </div>
      <div class="aichat-sidebar-bottom"><div class="aichat-user-row">👤 Учень</div></div>`;
    ui.appendChild(sidebar);

    const main=el("div","aichat-main");
    const messages=el("div","aichat-messages");

    function addMsg(role,text){
      const msg=el("div","aichat-msg "+role);
      const av=el("div","aichat-avatar",role==="user"?"👤":"◉");
      if(role==="user") av.style.background="#5b7fff";
      const bubble=el("div","aichat-bubble"); bubble.style.whiteSpace="pre-wrap"; bubble.textContent=text;
      msg.appendChild(av); msg.appendChild(bubble); messages.appendChild(msg);
      messages.scrollTop=messages.scrollHeight;
    }

    addMsg("assistant","Привіт! Я — тренажер ChatGPT.\n\nПрактикуй формулу промпту:\n\n📌 Завдання + 🔍 Контекст + 📋 Формат\n\nПриклад: «Напиши резюме для оператора ПК без досвіду у вигляді списку.»\n\nСпробуй!");
    main.appendChild(messages);

    const scoreRow=el("div","aichat-score-row");
    const scoreItems={};
    [["task","📌 Завдання"],["context","🔍 Контекст"],["format","📋 Формат"]].forEach(([k,lbl])=>{
      const item=el("div","aichat-score-item"+(isDone()?" pass":""),lbl); scoreItems[k]=item; scoreRow.appendChild(item);
    });
    main.appendChild(scoreRow);

    const inputArea=el("div","aichat-input-area");
    const input=el("textarea","aichat-input"); input.placeholder="Напишіть промпт..."; input.rows=2; input.disabled=isDone();
    const sendBtn=el("button","aichat-send-btn","↑"); sendBtn.disabled=isDone();
    inputArea.appendChild(input); inputArea.appendChild(sendBtn);
    main.appendChild(inputArea);
    main.appendChild(el("div","aichat-footer","Це навчальний тренажер. Відповіді заздалегідь написані для практики промптингу."));
    ui.appendChild(main);
    container.appendChild(ui);

    const resultDiv=el("div","sim-result"); resultDiv.style.marginTop="10px";
    if(isDone()){resultDiv.className="sim-result success";resultDiv.textContent="Виконано. Ви склали правильний промпт з усіма трьома критеріями.";}
    container.appendChild(resultDiv);

    input.addEventListener("input",()=>{
      const s=scorePromptText(input.value);
      Object.entries(s).forEach(([k,v])=>{scoreItems[k].className="aichat-score-item"+(v?" pass":"");});
    });

    function send(){
      const text=input.value.trim(); if(!text) return;
      addMsg("user",text); input.value="";
      Object.values(scoreItems).forEach(s=>s.className="aichat-score-item");
      const score=scorePromptText(text);
      const typingMsg=el("div","aichat-msg assistant");
      const tAv=el("div","aichat-avatar","◉");
      const tBubble=el("div","aichat-bubble aichat-typing");
      tBubble.innerHTML="<span></span><span></span><span></span>";
      typingMsg.appendChild(tAv); typingMsg.appendChild(tBubble);
      messages.appendChild(typingMsg); messages.scrollTop=messages.scrollHeight;
      setTimeout(()=>{
        typingMsg.remove();
        addMsg("assistant",getAIResponse(text,score));
        if(score.task&&score.context&&score.format){
          resultDiv.className="sim-result success";
          resultDiv.textContent="Виконано! Усі три критерії виконані. Чудовий промпт!";
          input.disabled=true; sendBtn.disabled=true;
          if(!window._demo&&window.Progress&&Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
        }
      },1200);
    }

    sendBtn.addEventListener("click",send);
    input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}});
  }

  /* ------------------------------------------------------------------ */
  /*  FACT CHECKER SIMULATOR (M9 — Критичне мислення зі ШІ)             */
  /* ------------------------------------------------------------------ */
  const FC_STATEMENTS=[
    {text:"Портал Дія (diia.gov.ua) — офіційний сервіс Міністерства цифрової трансформації України, де доступно понад 70 державних послуг онлайн.",
     correct:"вірю", explain:"✅ Правда. Дія — офіційний урядовий портал, запущений у 2019 р. Надає понад 70 послуг онлайн."},
    {text:"ChatGPT може підключатися до бази даних Державного реєстру населення і перевіряти особисті документи громадян у реальному часі.",
     correct:"перевірити", explain:"❌ Неправда (галюцинація). ChatGPT не має доступу до жодних державних реєстрів. Він генерує текст, а не шукає реальні дані."},
    {text:"Microsoft Excel — програма для роботи з електронними таблицями, яка входить до пакету Microsoft Office.",
     correct:"вірю", explain:"✅ Правда. Excel — класична програма для таблиць від Microsoft, частина пакету Office (поруч із Word і PowerPoint)."},
    {text:"Google Gemini і ChatGPT — це одна й та сама програма, яку спільно розробили Google і OpenAI у 2021 році.",
     correct:"перевірити", explain:"❌ Неправда. ChatGPT — від OpenAI, Gemini — від Google. Різні компанії-конкуренти, вони не розробляли нічого разом."},
    {text:"Засуджені в Україні мають право на освіту відповідно до Кримінально-виконавчого кодексу України.",
     correct:"вірю", explain:"✅ Правда. Стаття 125 КВК України гарантує засудженим право на освіту. Пілотний проєкт «Освітній простір» реалізує саме це право."},
  ];

  function FactChecker(container, block, moduleId){
    const simId=block.id;
    const isDone=()=>!!(window.Progress&&Progress.getSimulatorDone&&Progress.getSimulatorDone(simId)&&Progress.getSimulatorDone(simId).done);

    container.innerHTML="";
    const simHdr=el("div","sim-header");
    simHdr.appendChild(el("h2","sim-title","🔍 Перевірка тверджень AI"));
    simHdr.appendChild(el("p","sim-desc","AI «сказав» 5 речей. Для кожного оберіть: «✓ Вірю» — якщо правда, «⚠ Потрібно перевірити» — якщо схоже на галюцинацію. Правильно мінімум 4 з 5."));
    container.appendChild(simHdr);

    const answers={};
    let submitted=false;
    const stmts=el("div","factcheck-statements");
    const verdicts={}, btnPairs={};
    const ctr=el("span","factcheck-counter","0 / "+FC_STATEMENTS.length);

    FC_STATEMENTS.forEach((s,i)=>{
      const card=el("div","factcheck-card");
      const bubble=el("div","factcheck-bubble");
      const av=el("div","factcheck-ai-avatar","◉");
      bubble.appendChild(av); bubble.appendChild(el("div","factcheck-text",s.text));
      card.appendChild(bubble);
      const btnRow=el("div","factcheck-btn-row");
      const bB=el("button","factcheck-btn believe","✓ Вірю");
      const bC=el("button","factcheck-btn check","⚠ Потрібно перевірити");
      [bB,bC].forEach(btn=>btn.addEventListener("click",()=>{
        if(submitted||isDone()) return;
        answers[i]=btn===bB?"вірю":"перевірити";
        bB.classList.toggle("selected",answers[i]==="вірю");
        bC.classList.toggle("selected",answers[i]==="перевірити");
        ctr.textContent=Object.keys(answers).length+" / "+FC_STATEMENTS.length;
      }));
      btnRow.appendChild(bB); btnRow.appendChild(bC); card.appendChild(btnRow);
      const v=el("div","factcheck-verdict"); v.style.display="none"; card.appendChild(v);
      verdicts[i]=v; btnPairs[i]={bB,bC};
      stmts.appendChild(card);
    });
    container.appendChild(stmts);

    const ctrRow=el("div","factcheck-ctr-row");
    ctrRow.appendChild(el("span",null,"Обрано: ")); ctrRow.appendChild(ctr);
    container.appendChild(ctrRow);

    const submitBtn=el("button","btn primary sim-btn"); submitBtn.textContent="Перевірити відповіді"; submitBtn.style.marginTop="6px";
    const resultDiv=el("div","sim-result"); resultDiv.style.marginTop="10px";
    container.appendChild(submitBtn); container.appendChild(resultDiv);

    function showAllDone(){
      FC_STATEMENTS.forEach((s,i)=>{
        verdicts[i].className="factcheck-verdict correct"; verdicts[i].textContent=s.explain; verdicts[i].style.display="";
        btnPairs[i].bB.disabled=true; btnPairs[i].bC.disabled=true;
        btnPairs[i].bB.classList.toggle("selected",s.correct==="вірю");
        btnPairs[i].bC.classList.toggle("selected",s.correct==="перевірити");
      });
      submitBtn.style.display="none";
      resultDiv.className="sim-result success"; resultDiv.textContent="Виконано. Ви успішно розрізнили правду від галюцинацій AI.";
    }

    if(isDone()){FC_STATEMENTS.forEach((s,i)=>{answers[i]=s.correct;});showAllDone();return;}

    submitBtn.addEventListener("click",()=>{
      if(Object.keys(answers).length<FC_STATEMENTS.length){
        resultDiv.className="sim-result warn"; resultDiv.textContent="Оцініть усі 5 тверджень перед перевіркою."; return;
      }
      const correct=FC_STATEMENTS.filter((s,i)=>answers[i]===s.correct).length;
      FC_STATEMENTS.forEach((s,i)=>{
        verdicts[i].className="factcheck-verdict "+(answers[i]===s.correct?"correct":"wrong");
        verdicts[i].textContent=s.explain; verdicts[i].style.display="";
      });
      if(correct>=4){
        submitted=true;
        Object.values(btnPairs).forEach(p=>{p.bB.disabled=true;p.bC.disabled=true;});
        submitBtn.style.display="none"; ctrRow.style.display="none";
        resultDiv.className="sim-result success"; resultDiv.textContent=correct+" з 5 правильно. Виконано!";
        if(!window._demo&&window.Progress&&Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
      } else {
        resultDiv.className="sim-result warn";
        resultDiv.textContent=correct+" з 5 правильно. Потрібно мінімум 4. Перегляньте відмічені та спробуйте ще раз.";
        submitBtn.textContent="Спробувати ще раз";
        FC_STATEMENTS.forEach((s,i)=>{
          if(answers[i]!==s.correct){
            verdicts[i].style.display="none";
            btnPairs[i].bB.classList.remove("selected"); btnPairs[i].bC.classList.remove("selected");
            delete answers[i];
          }
        });
        ctr.textContent=Object.keys(answers).length+" / "+FC_STATEMENTS.length;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  HTML EDITOR SIMULATOR (M11 — Практикум оркестрації)               */
  /* ------------------------------------------------------------------ */
  const HTML_STARTER=`<!DOCTYPE html>
<html>
<head>
  <title>Моя перша сторінка</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#1a1c2e;}</style>
</head>
<body>

  <!-- Додайте заголовок <h1> -->

  <!-- Додайте абзац <p> -->

  <!-- Додайте посилання <a href="..."> -->

</body>
</html>`;

  const HTML_DONE=`<!DOCTYPE html>
<html>
<head>
  <title>Моя перша сторінка</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#1a1c2e;}</style>
</head>
<body>

  <h1>Привіт! Це моя перша веб-сторінка</h1>

  <p>Я навчився створювати сайти на курсі «Освітній простір».</p>

  <a href="https://diia.gov.ua">Перейти на портал Дія</a>

</body>
</html>`;

  function HTMLEditor(container, block, moduleId){
    const simId=block.id;
    const isDone=()=>!!(window.Progress&&Progress.getSimulatorDone&&Progress.getSimulatorDone(simId)&&Progress.getSimulatorDone(simId).done);

    container.innerHTML="";
    const simHdr=el("div","sim-header");
    simHdr.appendChild(el("h2","sim-title","💻 HTML-редактор: перша веб-сторінка"));
    simHdr.appendChild(el("p","sim-desc","Додайте в код: 1) заголовок <h1>…</h1>, 2) абзац <p>…</p>, 3) посилання <a href=\"…\">…</a>. Прев'ю оновлюється одразу. Усі три індикатори мають стати зеленими."));
    container.appendChild(simHdr);

    const shell=el("div","htmled-shell");
    const toolbar=el("div","htmled-toolbar");
    toolbar.innerHTML=`<span class="htmled-filename">📄 index.html</span><span class="htmled-lang-badge">HTML</span>`;
    shell.appendChild(toolbar);

    const panels=el("div","htmled-panels");

    const edPanel=el("div","htmled-editor-panel");
    edPanel.appendChild(el("div","htmled-panel-header","EDITOR"));
    const textarea=el("textarea","htmled-textarea");
    textarea.value=isDone()?HTML_DONE:HTML_STARTER;
    textarea.disabled=isDone(); textarea.spellcheck=false;
    edPanel.appendChild(textarea); panels.appendChild(edPanel);

    const pvPanel=el("div","htmled-preview-panel");
    pvPanel.appendChild(el("div","htmled-panel-header","PREVIEW"));
    const browserBar=el("div","htmled-browser-bar");
    browserBar.innerHTML=`<div class="htmled-browser-dots"><span></span><span></span><span></span></div><div class="htmled-browser-url">мій-сайт.html</div>`;
    pvPanel.appendChild(browserBar);
    const iframe=document.createElement("iframe");
    iframe.className="htmled-iframe"; iframe.sandbox="allow-same-origin"; iframe.srcdoc=textarea.value;
    pvPanel.appendChild(iframe); panels.appendChild(pvPanel);
    shell.appendChild(panels);
    container.appendChild(shell);

    const CHECKS=[
      {key:"h1",label:"Заголовок <h1> є"},
      {key:"p", label:"Абзац <p> є"},
      {key:"a", label:"Посилання <a href> є"},
    ];
    const clWrap=el("div","sim-checklist"); clWrap.style.marginTop="12px";
    const checkNodes={};
    CHECKS.forEach(c=>{
      const row=el("div","sim-check-row"+(isDone()?" pass":""));
      row.innerHTML=`<span class="sim-check-icon">${isDone()?"✓":"○"}</span>${c.label}`;
      checkNodes[c.key]=row; clWrap.appendChild(row);
    });
    container.appendChild(clWrap);

    const resultDiv=el("div","sim-result"); resultDiv.style.marginTop="8px";
    if(isDone()){resultDiv.className="sim-result success";resultDiv.textContent="Виконано. Ваша перша веб-сторінка містить усі три елементи!";}
    container.appendChild(resultDiv);

    function checkCode(html){
      const res={h1:/<h1[^>]*>[\s\S]*?<\/h1>/i.test(html),p:/<p[^>]*>[\s\S]*?<\/p>/i.test(html),a:/<a\s+[^>]*href[^>]*>/i.test(html)};
      let passed=0;
      CHECKS.forEach(c=>{
        const row=checkNodes[c.key];
        if(res[c.key]){row.className="sim-check-row pass";row.querySelector(".sim-check-icon").textContent="✓";passed++;}
        else{row.className="sim-check-row";row.querySelector(".sim-check-icon").textContent="○";}
      });
      if(passed===CHECKS.length){
        resultDiv.className="sim-result success"; resultDiv.textContent="Виконано. Ваша перша веб-сторінка містить усі три елементи!";
        textarea.disabled=true;
        if(!window._demo&&window.Progress&&Progress.setSimulatorDone) Progress.setSimulatorDone(simId);
      } else {resultDiv.className="sim-result";resultDiv.textContent="";}
    }

    textarea.addEventListener("input",()=>{iframe.srcdoc=textarea.value;checkCode(textarea.value);});
    if(isDone()) checkCode(HTML_DONE);
  }

  /* ------------------------------------------------------------------ */
  /*  DISPATCHER                                                          */
  /* ------------------------------------------------------------------ */
  const COMPONENTS = {
    EmailReply,
    FileManager,
    JobBoard,
    DiiaForm,
    DocsEditor,
    SheetsEditor,
    AIChat,
    FactChecker,
    HTMLEditor,
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

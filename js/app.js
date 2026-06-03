/* ============================================================
   app.js — контролер курсу: навігація, рендер модулів, маршрут, тема.
   Дані курсу беруться з window.COURSE (content/course.js) — працює на file://.
   ============================================================ */
(function () {
  const COURSE = window.COURSE || { meta:{}, modules:[] };
  const M = COURSE.modules;
  const $ = (s, r=document) => r.querySelector(s);
  const elc = (t,c,h)=>{const n=document.createElement(t); if(c)n.className=c; if(h!=null)n.innerHTML=h; return n;};

  /* ---------- ТЕМА ---------- */
  const THEME_KEY = "op8.theme";
  function applyTheme(t){ document.documentElement.setAttribute("data-theme", t); try{localStorage.setItem(THEME_KEY,t);}catch(e){} }
  applyTheme((()=>{ try{return localStorage.getItem(THEME_KEY)||"light";}catch(e){return "light";} })());
  $("#themeBtn").addEventListener("click", ()=>{
    applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");
  });
  $("#menuToggle").addEventListener("click", ()=> $("#sidebar").classList.toggle("open"));

  /* ---------- РОЗМІР ТЕКСТУ (А− / А+) ---------- */
  const FS_KEY = "op8.fs";
  const FS_STEPS = ["s","m","l","xl"];      // компактний / звичайний / великий / екран = 19 / 22 / 26 / 30px
  function applyFs(s){
    if(!FS_STEPS.includes(s)) s = "m";
    document.documentElement.setAttribute("data-fs", s);
    try{ localStorage.setItem(FS_KEY, s); }catch(e){}
    const i = FS_STEPS.indexOf(s);
    const down = $("#fsDown"), up = $("#fsUp");
    if(down) down.disabled = (i<=0);
    if(up)   up.disabled   = (i>=FS_STEPS.length-1);
  }
  function stepFs(dir){
    const cur = document.documentElement.getAttribute("data-fs") || "m";
    let i = FS_STEPS.indexOf(cur); if(i<0) i = 1;
    applyFs(FS_STEPS[ Math.max(0, Math.min(FS_STEPS.length-1, i+dir)) ]);
  }
  applyFs((()=>{ try{ return localStorage.getItem(FS_KEY) || "m"; }catch(e){ return "m"; } })());
  $("#fsDown").addEventListener("click", ()=> stepFs(-1));
  $("#fsUp").addEventListener("click",   ()=> stepFs(1));

  /* ---------- КАБІНЕТ / ВХІД ---------- */
  function renderUserArea(){
    const area = $("#userArea"); area.innerHTML="";
    const a = Cabinet.active();
    // Кнопка «Здати роботу» в бічній панелі — показуємо лише коли учень увійшов.
    const submit = $("#submitBtn");
    if(submit){
      submit.style.display = a ? "block" : "none";
      submit.onclick = ()=>{
        Cabinet.exportProfile();
        alert("Файл з твоїм результатом збережено (зазвичай у теку «Завантаження»).\n\n" +
              "Скопіюй його на флешку викладача — він додасть твій результат у журнал.");
      };
    }
    if(!a){ return; }
    const chip = elc("span","chip", `👤 ${a.name}${a.group?(" · "+a.group):""}`);
    const exp = elc("button","iconbtn","⬇"); exp.title="Експорт мого профілю (резервна копія / перенос)";
    exp.onclick = ()=> Cabinet.exportProfile();
    const out = elc("button","iconbtn","Вийти"); out.title="Завершити сеанс";
    out.onclick = ()=>{ Cabinet.logout(); Progress.rebind(); location.hash=""; gateAndRender(); };
    area.appendChild(chip);
    // Хмарна синхронізація — кнопка зʼявляється лише якщо хмару налаштовано (інакше повний офлайн).
    if(window.Sync && Sync.isEnabled()){
      const cloud = elc("button","iconbtn","☁"); cloud.title="Синхронізувати мій прогрес із хмарою";
      cloud.onclick = async ()=>{
        cloud.disabled=true; const t=cloud.textContent; cloud.textContent="…";
        try{ await Sync.pushActive(); cloud.textContent="✓"; }
        catch(e){ cloud.textContent="✗"; alert("Не вдалося синхронізувати: "+e.message); }
        finally{ setTimeout(()=>{ cloud.textContent=t; cloud.disabled=false; }, 1500); }
      };
      area.appendChild(cloud);
    }
    area.appendChild(exp); area.appendChild(out);
  }

  function renderLogin(){
    $("#sidebar").style.visibility = "hidden";
    const c = $("#content"); c.innerHTML=""; window.scrollTo(0,0);
    const box = elc("div","hero");
    box.appendChild(elc("div","tagline","Освітній Простір №8"));
    box.appendChild(elc("h1", null, "Хто навчається?"));
    box.appendChild(elc("p", null, "Оберіть свій кабінет або створіть новий. Прогрес кожного учня зберігається окремо на цьому комп'ютері."));

    // наявні профілі
    const list = Cabinet.list();
    if(list.length){
      const cards = elc("div","cards");
      list.forEach(p=>{
        const card = elc("div","card"); card.style.cursor="pointer";
        card.appendChild(elc("h3", null, "👤 "+p.name));
        card.appendChild(elc("p", null, p.group||"&nbsp;"));
        card.onclick = ()=> askPin(p);
        cards.appendChild(card);
      });
      box.appendChild(cards);
    }

    // новий учень
    const reg = elc("div","callout info");
    reg.appendChild(elc("div","c-title","➕ Я тут уперше"));
    reg.innerHTML += `
      <label><strong>Прізвище та ім'я</strong></label>
      <input id="nName" class="fld" placeholder="Напр., Йовдій Григорій">
      <label><strong>Група</strong></label>
      <input id="nGroup" class="fld" placeholder="Напр., Група 1">
      <label><strong>PIN (4 цифри — щоб ніхто інший не відкрив твій кабінет)</strong></label>
      <input id="nPin" class="fld" inputmode="numeric" maxlength="4" placeholder="••••">
    `;
    const create = elc("button","btn primary","Створити кабінет і почати");
    create.onclick = ()=>{
      const name = $("#nName").value.trim();
      if(!name){ alert("Вкажи прізвище та ім'я"); return; }
      Cabinet.create(name, $("#nGroup").value, $("#nPin").value);
      Progress.rebind(); Progress.setLearner(name, $("#nGroup").value);
      gateAndRender();
    };
    reg.appendChild(create);
    box.appendChild(reg);

    // викладач
    const teach = elc("p", null,
      '<a href="kabinet-vykladacha.html">Кабінет викладача →</a>' +
      ' &nbsp;·&nbsp; <a href="zayava.html">Заява на доступ до онлайн-ресурсу →</a>');
    teach.style.marginTop="18px";
    box.appendChild(teach);
    c.appendChild(box);
  }

  function askPin(p){
    const pin = prompt(`Кабінет: ${p.name}\nВведи свій PIN (якщо ставив):`) ?? "";
    if(Cabinet.login(p.id, pin)){ Progress.rebind(); gateAndRender(); }
    else alert("Невірний PIN.");
  }

  function gateAndRender(){
    renderUserArea();
    if(!Cabinet.active()){ renderLogin(); return; }
    $("#sidebar").style.visibility = "visible";
    render();
  }

  /* ---------- НАВІГАЦІЯ ---------- */
  function buildNav(){
    const nav = $("#nav"); nav.innerHTML = "";
    let lastBlock = null;
    M.forEach(m=>{
      if(m.block !== lastBlock){ nav.appendChild(elc("div","nav-block", m.block)); lastBlock = m.block; }
      const a = elc("a","nav-item");
      a.href = `#/${m.id}`;
      if(Progress.isCompleted(m.id)) a.classList.add("done");
      if(currentId===m.id) a.classList.add("active");
      a.appendChild(elc("span","nav-num", m.num));
      a.appendChild(elc("span",null, m.title));
      if(m.level==="it") a.appendChild(elc("span","badge-it","IT"));
      nav.appendChild(a);
    });
    // Окремий розділ (не модуль): тренажер сліпого набору
    if(window.Trainer){
      nav.appendChild(elc("div","nav-block","Практика"));
      const tr = elc("a","nav-item"); tr.href = "#/trainer";
      if(currentId==="trainer") tr.classList.add("active");
      tr.appendChild(elc("span","nav-num","⌨"));
      tr.appendChild(elc("span", null, "Тренажер набору"));
      nav.appendChild(tr);
    }
    // Окремий розділ (не модуль): корисні посилання
    if(window.LINKS){
      nav.appendChild(elc("div","nav-block","Ресурси"));
      const lk = elc("a","nav-item"); lk.href = "#/links";
      if(currentId==="links") lk.classList.add("active");
      lk.appendChild(elc("span","nav-num","★"));
      lk.appendChild(elc("span", null, "Корисні посилання"));
      nav.appendChild(lk);
    }
    updateProgress();
  }
  function updateProgress(){
    const total = M.length, done = Progress.completedCount();
    $("#progressFill").style.width = (100*done/total).toFixed(0)+"%";
    $("#progressLabel").textContent = `Пройдено ${done} із ${total}`;
  }

  /* ---------- РЕНДЕР БЛОКІВ УРОКУ ---------- */
  function renderBlock(b){
    if(b.type==="html")   return elc("div", null, b.html);
    if(b.type==="callout"){
      const c = elc("div", "callout "+(b.variant||"info"));
      if(b.title) c.appendChild(elc("div","c-title", b.title));
      c.appendChild(elc("div", null, b.html||""));
      return c;
    }
    if(b.type==="fig"){
      const f = elc("figure","fig");
      const fr = elc("div","frame");
      const img = elc("img"); img.src=b.src; img.alt=b.alt||""; img.loading="lazy";
      fr.appendChild(img); f.appendChild(fr);
      if(b.caption) f.appendChild(elc("figcaption", null, b.caption));
      return f;
    }
    if(b.type==="selftask"){
      const s = elc("div","selftask");
      s.appendChild(elc("div","level", b.level||"Самостійне завдання"));
      s.appendChild(elc("div", null, b.html||""));
      return s;
    }
    return elc("div", null, "");
  }

  /* ---------- РЕНДЕР МОДУЛЯ ---------- */
  function renderModule(m){
    Progress.visit(m.id);
    const c = $("#content"); c.innerHTML = ""; window.scrollTo(0,0);

    const head = elc("div","module-head");
    head.appendChild(elc("div","eyebrow", `${m.block} · Модуль ${m.num}`));
    head.appendChild(elc("h1", null, m.title));
    if(m.goal) head.appendChild(elc("div","goal", "<strong>Мета:</strong> "+m.goal));
    c.appendChild(head);

    if(m.status==="stub"){
      c.appendChild(renderBlock({type:"callout",variant:"info",title:"🛠 Модуль у розробці",
        html:"Структуру затверджено. Повний зміст і тести цього модуля додамо на наступному етапі."}));
    }

    const lesson = elc("div","lesson");
    (m.lessons||[]).forEach(b=> lesson.appendChild(renderBlock(b)));
    c.appendChild(lesson);

    // Тест
    if(m.quiz && m.quiz.length){
      const qbox = elc("div"); c.appendChild(qbox);
      Quiz.render(qbox, m.quiz, m.id);
    }

    // Рефлексія
    if(m.reflection && m.reflection.length){
      const r = elc("div","reflect");
      r.appendChild(elc("h2", null, "✍ Рефлексія"));
      r.appendChild(elc("p", null, "Кілька рядків чесно — частина твоєї карти самостійності."));
      m.reflection.forEach((q,i)=>{
        r.appendChild(elc("label", null, `<strong>${q}</strong>`));
        const ta = elc("textarea"); ta.dataset.qi=i;
        ta.value = (Progress.getReflection(m.id).split("\n###\n")[i]||"");
        ta.addEventListener("change", ()=>{
          const parts = Array.from(r.querySelectorAll("textarea")).map(t=>t.value);
          Progress.setReflection(m.id, parts.join("\n###\n"));
        });
        r.appendChild(ta);
      });
      c.appendChild(r);
    }

    // Підвал: позначити пройденим + навігація
    const foot = elc("div","module-foot");
    const prev = M[m.num-1], next = M[m.num+1];
    const left = elc("div");
    if(prev){ const b=elc("a","btn ghost","← "+("Модуль "+prev.num)); b.href=`#/${prev.id}`; left.appendChild(b); }
    const right = elc("div"); right.style.display="flex"; right.style.gap="10px";
    const doneBtn = elc("button","btn "+(Progress.isCompleted(m.id)?"ghost":"primary"),
      Progress.isCompleted(m.id) ? "✓ Пройдено" : "Позначити пройденим");
    doneBtn.addEventListener("click", ()=>{ Progress.complete(m.id); buildNav();
      doneBtn.textContent="✓ Пройдено"; doneBtn.className="btn ghost"; });
    right.appendChild(doneBtn);
    if(next){ const b=elc("a","btn ghost",("Модуль "+next.num)+" →"); b.href=`#/${next.id}`; right.appendChild(b); }
    foot.appendChild(left); foot.appendChild(right);
    c.appendChild(foot);
  }

  /* ---------- МОДАЛКА «ДОКЛАДНІШЕ» (плитки лендингу) ---------- */
  function openInfo(h){
    closeInfo();
    const back = elc("div","modal-back"); back.id="infoModal";
    const win = elc("div","modal");
    const x = elc("button","modal-x","✕"); x.setAttribute("aria-label","Закрити"); x.onclick = closeInfo;
    win.appendChild(x);
    win.appendChild(elc("h2","modal-title", h.t));
    win.appendChild(elc("div","modal-body", h.more||h.d||""));
    const foot = elc("div","modal-foot");
    if(h.link){
      const go = elc("a","btn primary", h.linkLabel || "Перейти →");
      go.href = h.link; go.onclick = ()=> closeInfo();
      foot.appendChild(go);
    }
    const ok = elc("button","btn ghost", h.link ? "Закрити" : "Зрозуміло"); ok.onclick = closeInfo;
    foot.appendChild(ok);
    win.appendChild(foot);
    back.appendChild(win);
    back.addEventListener("click", e=>{ if(e.target===back) closeInfo(); });
    document.body.appendChild(back);
    document.addEventListener("keydown", escClose);
    x.focus();
  }
  function escClose(e){ if(e.key==="Escape") closeInfo(); }
  function closeInfo(){
    const m = $("#infoModal"); if(m) m.remove();
    document.removeEventListener("keydown", escClose);
  }

  /* ---------- КОРИСНІ ПОСИЛАННЯ ---------- */
  function renderLinks(){
    const c = $("#content"); c.innerHTML=""; window.scrollTo(0,0);
    const L = window.LINKS || { groups:[] };
    const head = elc("div","module-head");
    head.appendChild(elc("div","eyebrow","Ресурси"));
    head.appendChild(elc("h1", null, "Корисні посилання"));
    c.appendChild(head);

    if(L.note) c.appendChild(renderBlock({ type:"callout", variant:"info",
      title:"ℹ Що дозволено і як це працює", html:L.note }));

    (L.groups||[]).forEach(g=>{
      const sec = elc("div","links-group");
      sec.appendChild(elc("h2", null, g.group));
      if(g.note) sec.appendChild(elc("p","links-note", g.note));
      const grid = elc("div","cards");
      (g.items||[]).forEach(it=>{
        const a = elc("a","card clickable link-card");
        a.href = it.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.appendChild(elc("h3", null, it.name));
        if(it.desc) a.appendChild(elc("p", null, it.desc));
        a.appendChild(elc("span","card-more", it.url.replace(/^https?:\/\//,"") + " ↗"));
        grid.appendChild(a);
      });
      sec.appendChild(grid);
      c.appendChild(sec);
    });

    if(L.callToAction) c.appendChild(renderBlock({ type:"callout", variant:"task",
      title:"➕ Додати ресурс",
      html: L.callToAction + ' <a href="zayava.html">Заповнити заяву →</a>' }));
  }

  /* ---------- ТРЕНАЖЕР НАБОРУ ---------- */
  function renderTrainer(){
    const c = $("#content"); c.innerHTML=""; window.scrollTo(0,0);
    if(window.Trainer) Trainer.render(c);
    else c.appendChild(elc("p", null, "Тренажер недоступний."));
  }

  /* ---------- ЛЕНДИНГ ---------- */
  function renderHome(){
    const c = $("#content"); c.innerHTML=""; window.scrollTo(0,0);
    const meta = COURSE.meta||{};
    const hero = elc("div","hero");
    hero.appendChild(elc("div","tagline", meta.tagline||"Навчання як шлях"));
    hero.appendChild(elc("h1", null, meta.title||"Курс цифрової грамотності"));
    hero.appendChild(elc("p", null, meta.intro||""));
    const start = elc("a","btn primary","Почати з вступу →"); start.href="#/"+(M[0]&&M[0].id);
    hero.appendChild(start);
    c.appendChild(hero);

    const cards = elc("div","cards");
    (meta.highlights||[]).forEach(h=>{
      const card = elc("div","card");
      if(h.more){
        card.classList.add("clickable");
        card.tabIndex = 0; card.setAttribute("role","button");
        const open = ()=> openInfo(h);
        card.addEventListener("click", open);
        card.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); open(); } });
      }
      card.appendChild(elc("h3", null, h.t));
      card.appendChild(elc("p", null, h.d));
      if(h.more) card.appendChild(elc("span","card-more","Докладніше →"));
      cards.appendChild(card);
    });
    c.appendChild(cards);
  }

  /* ---------- МАРШРУТ ---------- */
  let currentId = null;
  function render(){
    const hash = location.hash.replace(/^#\/?/, "");
    // Повноекранний режим тренажера: згортаємо дерево модулів зліва.
    const layout = $(".layout"); if(layout) layout.classList.toggle("focus", hash==="trainer");
    if(!hash){ currentId=null; renderHome(); buildNav(); return; }
    if(hash==="links"){ currentId="links"; renderLinks(); buildNav(); $("#sidebar").classList.remove("open"); return; }
    if(hash==="trainer"){ currentId="trainer"; renderTrainer(); buildNav(); $("#sidebar").classList.remove("open"); return; }
    const m = M.find(x=>x.id===hash);
    currentId = m ? m.id : null;
    if(m){ renderModule(m); } else { renderHome(); }
    buildNav();
    $("#sidebar").classList.remove("open");
  }
  window.addEventListener("hashchange", gateAndRender);
  gateAndRender();
})();

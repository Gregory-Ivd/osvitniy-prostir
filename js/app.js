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

  /* #9 — ESC закриває PIN-modal або мобільний sidebar */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      const overlay = document.getElementById("pinOverlay");
      if (overlay) { overlay.remove(); return; }
      $("#sidebar").classList.remove("open");
    }
  });

  /* ---------- РЕЖИМ ПРОЄКТОРА ---------- */
  (function(){
    const btn = document.getElementById("projBtn"); if(!btn) return;
    const KEY = "op8.projector";
    function apply(on){ document.body.classList.toggle("projector",on); btn.title=on?"Вийти з режиму проєктора":"Режим проєктора"; }
    try{ apply(localStorage.getItem(KEY)==="1"); }catch(e){}
    btn.addEventListener("click",()=>{
      const on=!document.body.classList.contains("projector");
      apply(on); try{ localStorage.setItem(KEY,on?"1":"0"); }catch(e){}
    });
  })();

  /* ---------- РОЗМІР ТЕКСТУ (А− / А+) ---------- */
  const FS_KEY = "op8.fs";
  const FS_STEPS = ["s","m","l","xl"];
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

  /* ---------- #2 FADE-IN HELPERS ---------- */
  function clearContent(){
    const c = document.getElementById("content");
    c.style.opacity = "0"; c.innerHTML = ""; window.scrollTo(0,0); return c;
  }
  function showContent(c){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      c.style.transition="opacity .18s ease"; c.style.opacity="1";
    }));
  }

  /* ---------- #6 TOAST ---------- */
  function toast(msg, type) {
    let wrap = document.getElementById("toastWrap");
    if (!wrap) { wrap = elc("div","toast-wrap"); wrap.id="toastWrap"; document.body.appendChild(wrap); }
    const t = elc("div","toast"+(type?" t-"+type:""), msg);
    wrap.appendChild(t);
    requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add("in")));
    setTimeout(()=>{ t.classList.remove("in"); setTimeout(()=>t.remove(),300); }, 3500);
  }

  /* ---------- #5 PIN MODAL ---------- */
  function openPinModal(p) {
    const back = elc("div","pin-overlay"); back.id="pinOverlay";
    const box  = elc("div","pin-box");
    box.appendChild(elc("h2", null, "👤 " + p.name));
    box.appendChild(elc("p","pin-sub", p.group || "Введи свій PIN для входу"));
    const inp = elc("input","fld"); inp.type="password"; inp.inputMode="numeric";
    inp.maxLength=4; inp.placeholder="••••"; inp.autocomplete="off";
    box.appendChild(inp);
    const err = elc("div","pin-err","");
    box.appendChild(err);
    const actions = elc("div","pin-actions");
    const cancel  = elc("button","btn ghost","Скасувати");
    const ok      = elc("button","btn primary","Увійти →");
    actions.appendChild(cancel); actions.appendChild(ok);
    box.appendChild(actions);
    back.appendChild(box);
    back.addEventListener("click", e=>{ if(e.target===back) back.remove(); });
    document.body.appendChild(back);
    requestAnimationFrame(()=>inp.focus());
    function doLogin(){
      if(Cabinet.login(p.id, inp.value)){
        back.remove(); Progress.rebind(); gateAndRender();
      } else {
        err.textContent="Невірний PIN. Спробуй ще."; inp.value=""; inp.focus();
      }
    }
    ok.addEventListener("click", doLogin);
    cancel.addEventListener("click", ()=>back.remove());
    inp.addEventListener("keydown", e=>{ if(e.key==="Enter") doLogin(); });
  }

  /* ---------- КАБІНЕТ / ВХІД ---------- */
  function renderUserArea(){
    const area = $("#userArea"); area.innerHTML="";
    const a = Cabinet.active();
    const submit = $("#submitBtn");
    if(submit){
      submit.style.display = a ? "block" : "none";
      submit.onclick = ()=>{
        Cabinet.exportProfile();
        if(!(window.electronAPI && window.electronAPI.saveResults)){
          toast("Файл збережено у «Завантаження». Скопіюй на флешку викладача.", "success");
        }
      };
    }
    if(!a){ return; }
    const chip = elc("span","chip", `👤 ${a.name}${a.group?(" · "+a.group):""}`);
    const exp = elc("button","iconbtn","⬇"); exp.title="Експорт мого профілю (резервна копія / перенос)";
    exp.onclick = ()=> Cabinet.exportProfile();
    const out = elc("button","iconbtn","Вийти"); out.title="Завершити сеанс";
    out.onclick = ()=>{ Cabinet.logout(); Progress.rebind(); location.hash=""; gateAndRender(); };
    area.appendChild(chip);
    if(window.Sync && Sync.isEnabled()){
      const cloud = elc("button","iconbtn","☁"); cloud.title="Синхронізувати мій прогрес із хмарою";
      cloud.onclick = async ()=>{
        cloud.disabled=true; const t=cloud.textContent; cloud.textContent="…";
        try{ await Sync.pushActive(); cloud.textContent="✓"; }
        catch(e){ cloud.textContent="✗"; toast("Не вдалося синхронізувати: "+e.message, "error"); }
        finally{ setTimeout(()=>{ cloud.textContent=t; cloud.disabled=false; }, 1500); }
      };
      area.appendChild(cloud);
    }
    area.appendChild(exp); area.appendChild(out);
  }

  function renderLogin(){
    $("#sidebar").style.visibility = "hidden";
    const c = clearContent();
    const box = elc("div","hero");
    box.appendChild(elc("div","tagline","Освітній Простір №8"));
    box.appendChild(elc("h1", null, "Хто навчається?"));
    box.appendChild(elc("p", null, "Оберіть свій кабінет або створіть новий. Прогрес кожного учня зберігається окремо на цьому комп'ютері."));

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
      if(!name){ toast("Вкажи прізвище та ім'я", "warn"); return; }
      Cabinet.create(name, $("#nGroup").value, $("#nPin").value);
      Progress.rebind(); Progress.setLearner(name, $("#nGroup").value);
      gateAndRender();
    };
    reg.appendChild(create);
    box.appendChild(reg);

    const teach = elc("p", null,
      '<a href="kabinet-vykladacha.html">Кабінет викладача →</a>' +
      ' &nbsp;·&nbsp; <a href="zayava.html">Заява на доступ до онлайн-ресурсу →</a>' +
      ' &nbsp;·&nbsp; <a href="prezentatsiya.html" target="_blank" rel="noopener">Презентація проєкту →</a>');
    teach.style.marginTop="18px";
    box.appendChild(teach);

    const demoWrap = elc("div"); demoWrap.style.cssText="text-align:center;margin-top:14px;";
    const demoBtn = elc("button","btn ghost","👁 Переглянути курс без реєстрації");
    demoWrap.appendChild(demoBtn);
    box.appendChild(demoWrap);
    demoBtn.addEventListener("click", ()=>{
      window._demo = true;
      gateAndRender();
      setTimeout(()=>{
        const banner = document.createElement("div");
        banner.id = "demoBanner";
        banner.className = "callout warn";
        banner.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px;max-width:760px;";
        banner.innerHTML = '<span>👁 <b>Демо-режим</b> — прогрес не зберігається</span>';
        const exitBtn = elc("button","btn ghost","Зареєструватися");
        exitBtn.style.cssText="padding:5px 12px;font-size:.8rem;white-space:nowrap;";
        exitBtn.addEventListener("click",()=>{ window._demo=false; gateAndRender(); });
        banner.appendChild(exitBtn);
        const content = document.getElementById("content");
        if(content && !document.getElementById("demoBanner")) content.insertAdjacentElement("afterbegin", banner);
      }, 150);
    });

    c.appendChild(box);
    showContent(c);
  }

  /* #5 — askPin делегує до inline modal */
  function askPin(p){ openPinModal(p); }

  function gateAndRender(){
    renderUserArea();
    if (window._demo) { $("#sidebar").style.visibility = "visible"; render(); return; }
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
    if(window.Trainer){
      nav.appendChild(elc("div","nav-block","Практика"));
      const tr = elc("a","nav-item"); tr.href = "#/trainer";
      if(currentId==="trainer") tr.classList.add("active");
      tr.appendChild(elc("span","nav-num","⌨"));
      tr.appendChild(elc("span", null, "Тренажер набору"));
      nav.appendChild(tr);
    }
    if(window.LINKS){
      nav.appendChild(elc("div","nav-block","Ресурси"));
      const lk = elc("a","nav-item"); lk.href = "#/links";
      if(currentId==="links") lk.classList.add("active");
      lk.appendChild(elc("span","nav-num","★"));
      lk.appendChild(elc("span", null, "Корисні посилання"));
      nav.appendChild(lk);
    }
    updateProgress();
    /* #3 — auto-scroll до активного пункту */
    setTimeout(()=>{
      const active = nav.querySelector(".nav-item.active");
      if(active) active.scrollIntoView({ block:"nearest", behavior:"smooth" });
    }, 80);
  }

  /* #11 — SVG progress ring */
  function updateProgress(){
    const total = M.length, done = Progress.completedCount();
    const circ = 100.53;
    const fill = document.getElementById("progressFill");
    if(fill) fill.style.strokeDashoffset = total ? (circ*(1-done/total)).toFixed(2) : circ;
    const num = document.getElementById("progressRingNum");
    if(num) num.textContent = done+"/"+total;
    const lbl = document.getElementById("progressLabel");
    if(lbl) lbl.textContent = (done===total && total>0) ? "Завершено!" : "Пройдено";
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
    const c = clearContent();

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

    if(m.quiz && m.quiz.length){
      const qbox = elc("div"); c.appendChild(qbox);
      Quiz.render(qbox, m.quiz, m.id);
    }

    /* #4 — рефлексія: input + «✓ збережено» badge з debounce */
    if(m.reflection && m.reflection.length){
      const r = elc("div","reflect");
      r.appendChild(elc("h2", null, "✍ Рефлексія"));
      r.appendChild(elc("p", null, "Кілька рядків чесно — частина твоєї карти самостійності."));
      let saveTimer=null;
      m.reflection.forEach((q,i)=>{
        const lbl = elc("label");
        lbl.appendChild(elc("strong",null,q));
        const badge = elc("span","saved-badge","✓ збережено"); lbl.appendChild(badge);
        r.appendChild(lbl);
        const ta = elc("textarea"); ta.dataset.qi=i;
        ta.value = (Progress.getReflection(m.id).split("\n###\n")[i]||"");
        ta.addEventListener("input", ()=>{
          if (window._demo) return;
          badge.classList.remove("show");
          clearTimeout(saveTimer);
          saveTimer = setTimeout(()=>{
            const parts = Array.from(r.querySelectorAll("textarea")).map(t=>t.value);
            Progress.setReflection(m.id, parts.join("\n###\n"));
            badge.classList.add("show");
            setTimeout(()=>badge.classList.remove("show"), 2000);
          }, 600);
        });
        r.appendChild(ta);
      });
      c.appendChild(r);
    }

    const foot = elc("div","module-foot");
    const prev = M[m.num-1], next = M[m.num+1];
    const left = elc("div");
    if(prev){ const b=elc("a","btn ghost","← "+("Модуль "+prev.num)); b.href=`#/${prev.id}`; left.appendChild(b); }
    const right = elc("div"); right.style.display="flex"; right.style.gap="10px";
    const doneBtn = elc("button","btn "+(Progress.isCompleted(m.id)?"ghost":"primary"),
      Progress.isCompleted(m.id) ? "✓ Пройдено" : "Позначити пройденим");
    /* #7 — пульс nav-num при позначенні пройденим */
    doneBtn.addEventListener("click", ()=>{
      if (window._demo) { toast("У демо-режимі прогрес не зберігається", "t-warn"); return; }
      Progress.complete(m.id); buildNav();
      doneBtn.textContent="✓ Пройдено"; doneBtn.className="btn ghost";
      const navNum = document.querySelector(`.nav-item[href="#/${m.id}"] .nav-num`);
      if(navNum){ navNum.classList.add("pulse"); setTimeout(()=>navNum.classList.remove("pulse"),600); }
      const cnt = Progress.completedCount();
      if (cnt > 0 && cnt % 3 === 0) {
        setTimeout(()=> toast(
          "📤 Ти пройшов уже " + cnt + " модулів! Не забудь здати роботу викладачу — натисни «Здати роботу» на панелі ліворуч.",
          "t-warn"
        ), 800);
      }
    });
    right.appendChild(doneBtn);
    if(next){ const b=elc("a","btn ghost",("Модуль "+next.num)+" →"); b.href=`#/${next.id}`; right.appendChild(b); }
    foot.appendChild(left); foot.appendChild(right);
    c.appendChild(foot);
    showContent(c);
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
    const c = clearContent();
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
    showContent(c);
  }

  /* ---------- ТРЕНАЖЕР НАБОРУ ---------- */
  function renderTrainer(){
    const c = clearContent();
    if(window.Trainer) Trainer.render(c);
    else c.appendChild(elc("p", null, "Тренажер недоступний."));
    showContent(c);
  }

  /* ---------- ЛЕНДИНГ ---------- */
  function renderHome(){
    const c = clearContent();
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
    showContent(c);
  }

  /* ---------- МАРШРУТ ---------- */
  let currentId = null;
  function render(){
    const hash = location.hash.replace(/^#\/?/, "");
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

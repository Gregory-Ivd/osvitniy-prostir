/* ============================================================
   trainer.js — тренажер сліпого набору (українська ЙЦУКЕН).
   Чистий JS, офлайн. Екранна клавіатура із зонами пальців,
   підсвічування наступної клавіши, жива статистика, рекорди,
   довідник комбінацій клавіш. Результати → Progress.
   window.Trainer.render(container)
   ============================================================ */
(function () {
  const elc = (t,c,h)=>{const n=document.createElement(t); if(c)n.className=c; if(h!=null)n.innerHTML=h; return n;};

  /* --- розкладка ЙЦУКЕН (нижній регістр) --- */
  const ROWS = [
    ["1","2","3","4","5","6","7","8","9","0"],
    ["й","ц","у","к","е","н","г","ш","щ","з","х","ї"],
    ["ф","і","в","а","п","р","о","л","д","ж","є"],
    ["я","ч","с","м","и","т","ь","б","ю","."]
  ];

  /* --- палець для кожної клавіши --- */
  const FINGER = {
    "1":"lp","2":"lr","3":"lm","4":"li","5":"li","6":"ri","7":"ri","8":"rm","9":"rr","0":"rp",
    "й":"lp","ц":"lr","у":"lm","к":"li","е":"li","н":"ri","г":"ri","ш":"rm","щ":"rr","з":"rp","х":"rp","ї":"rp",
    "ф":"lp","і":"lr","в":"lm","а":"li","п":"li","р":"ri","о":"ri","л":"rm","д":"rr","ж":"rp","є":"rp",
    "я":"lp","ч":"lr","с":"lm","м":"li","и":"li","т":"ri","ь":"ri","б":"rm","ю":"rr",".":"rp",",":"rp",
    " ":"th"
  };
  const FINGER_NAME = {
    lp:"лівий мізинець", lr:"лівий безіменний", lm:"лівий середній", li:"лівий вказівний",
    ri:"правий вказівний", rm:"правий середній", rr:"правий безіменний", rp:"правий мізинець",
    th:"великий палець (пробіл)"
  };
  // фізична клавіша для символу + чи треба Shift
  function keyForChar(ch){ if(ch === ",") return "."; return ch.toLowerCase(); }
  function needsShift(ch){ if(ch === " ") return false; if(ch === ",") return true; return ch !== ch.toLowerCase(); }

  /* --- комбінації клавіш для довідника --- */
  const SHORTCUTS = [
    ["Ctrl + C", "копіювати"],
    ["Ctrl + X", "вирізати"],
    ["Ctrl + V", "вставити"],
    ["Ctrl + Z", "скасувати дію"],
    ["Ctrl + Y", "повторити скасоване"],
    ["Ctrl + A", "виділити все"],
    ["Ctrl + S", "зберегти"],
    ["Ctrl + F", "знайти на сторінці"],
    ["Ctrl + P", "друк"],
    ["Alt + Tab", "перемкнути вікно"],
    ["Shift + клавіша", "велика літера або символ"]
  ];

  /* --- набори символів і уроки --- */
  const HOME = ["ф","і","в","а","п","р","о","л","д","ж","є"];
  const TOP  = ["й","ц","у","к","е","н","г","ш","щ","з","х","ї"];
  const BOT  = ["я","ч","с","м","и","т","ь","б","ю"];
  const DIG  = ["1","2","3","4","5","6","7","8","9","0"];
  const WORDS = ["дім","рука","сила","право","робота","освіта","навик","текст","лист","план",
                 "мета","крок","успіх","знання","життя","вибір","шлях","праця","час","день",
                 "папір","друк","екран","миша","файл","папка","пошта","банк","картка","профіль",
                 "замовлення","клієнт","оплата","графік","звіт","ідея","слово","речення","абзац","договір"];
  const TEXTS = [
    "Документ краще зберігати часто, щоб не втратити роботу.",
    "Спочатку зроби чернетку, потім перевір і виправ помилки.",
    "Пароль має бути довгим, різним для кожного сервісу.",
    "Резюме пишуть коротко, без зайвих слів, на одну сторінку.",
    "Якщо лист важливий, перечитай його, перш ніж надіслати.",
    "Перевіряй факти, навіть коли відповідь звучить упевнено."
  ];

  /* --- оцінка результату за швидкістю і точністю --- */
  function grade(cpm, acc){
    if(acc < 80)              return { label:"Погано — більше точності", cls:"bad",   icon:"🔴" };
    if(cpm < 90 || acc < 90)  return { label:"Нормально",                cls:"ok",    icon:"🟡" };
    if(cpm < 170 || acc < 97) return { label:"Добре",                    cls:"good",  icon:"🟢" };
    return                           { label:"Відмінно",                 cls:"great", icon:"⭐" };
  }

  function pick(set){ return set[Math.floor(Math.random()*set.length)]; }
  function groups(set, n, min, max){
    const out = [];
    for(let g=0; g<n; g++){
      const len = min + Math.floor(Math.random()*(max-min+1));
      let w=""; for(let i=0;i<len;i++) w += pick(set);
      out.push(w);
    }
    return out.join(" ");
  }
  function pairs(set, n){
    const out = [];
    for(let g=0; g<n; g++){
      let a = pick(set), b = pick(set);
      while(b===a) b = pick(set);
      out.push(a+b+a+b);
    }
    return out.join(" ");
  }
  function shuffleWords(n){
    const a = WORDS.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a.slice(0, n).join(" ");
  }
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
  function shuffleWordsCap(n){ return shuffleWords(n).split(" ").map(cap).join(" "); }

  const LESSONS = [
    { id:"home", name:"Домашній ряд", hint:"Тримай пальці на ряду ФІВА — ОЛДЖ. Вказівні — на «а» та «о».",
      gen:()=>groups(HOME, 8, 2, 4) },
    { id:"pairs", name:"Пари клавіш", hint:"Чергуй дві клавіші, не поспішаючи. Один палець — одна клавіша.",
      gen:()=>pairs(HOME, 6) },
    { id:"top",  name:"Верхній ряд",  hint:"Тягнися вгору з домашнього ряду й повертай пальці назад.",
      gen:()=>groups(TOP, 8, 2, 4) },
    { id:"bottom", name:"Нижній ряд",  hint:"Тягнися вниз із домашнього ряду й повертай пальці назад.",
      gen:()=>groups(BOT, 8, 2, 4) },
    { id:"digits", name:"Цифри",       hint:"Верхній ряд цифр. Кожен палець — над своєю цифрою.",
      gen:()=>groups(DIG, 8, 2, 4) },
    { id:"words", name:"Слова",        hint:"Справжні слова. Намагайся не дивитися на клавіатуру.",
      gen:()=>shuffleWords(10) },
    { id:"caps",  name:"Великі літери", hint:"Велика літера — це Shift + клавіша. Великий палець тримає Shift, поки інший палець тисне літеру.",
      gen:()=>shuffleWordsCap(8) },
    { id:"text",  name:"Текст",        hint:"Цілісні речення: великі літери, коми й крапки. Кома — це Shift + крапка.",
      gen:()=>pick(TEXTS) }
  ];

  function render(container){
    // На Android без фізичної клавіатури тренажер не реагує на натискання
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      container.appendChild(elc("div","callout warn",
        "Тренажер сліпого набору потребує фізичну клавіатуру. Підключіть USB-клавіатуру до планшета або використовуйте комп’ютер."));
    }
    const root = elc("div","trainer");
    root.tabIndex = 0; // фокус для перехоплення клавіш

    const back = elc("a","tr-back","← До курсу"); back.href = "#/";
    root.appendChild(back);

    const head = elc("div","module-head");
    head.appendChild(elc("div","eyebrow","Практика"));
    head.appendChild(elc("h1", null, "Тренажер сліпого набору"));
    head.appendChild(elc("div","goal","<strong>Мета:</strong> навчитися друкувати, не дивлячись на клавіатуру. Тримай руки на домашньому ряду й розганяйся поступово — спершу точність, потім швидкість."));
    root.appendChild(head);

    // вибір уроку
    const tabs = elc("div","tr-lessons");
    LESSONS.forEach((L,i)=>{
      const b = elc("button","tr-lesson"+(i===0?" active":""), L.name);
      b.onclick = ()=>{ selectLesson(i); };
      tabs.appendChild(b);
    });
    root.appendChild(tabs);

    const hintLine = elc("div","tr-hint");
    root.appendChild(hintLine);
    const recLine = elc("div","tr-rec");
    root.appendChild(recLine);

    // статистика
    const stats = elc("div","tr-stats");
    const sSpeed = elc("div","tr-stat","<b>0</b><span>знаків/хв</span>");
    const sAcc   = elc("div","tr-stat","<b>100%</b><span>точність</span>");
    const sErr   = elc("div","tr-stat","<b>0</b><span>помилки</span>");
    const sProg  = elc("div","tr-stat","<b>0%</b><span>рядок</span>");
    stats.append(sSpeed, sAcc, sErr, sProg);
    root.appendChild(stats);

    // текст для набору
    const targetBox = elc("div","tr-target");
    root.appendChild(targetBox);

    // підказка наступного пальця
    const nextHint = elc("div","tr-next");
    root.appendChild(nextHint);

    // екранна клавіатура
    const kbd = elc("div","tr-kbd");
    const keyEls = {};
    ROWS.forEach(row=>{
      const r = elc("div","tr-row");
      row.forEach(ch=>{
        const k = elc("div","tr-key f-"+(FINGER[ch]||"th"), ch);
        k.dataset.char = ch;
        keyEls[ch] = k;
        r.appendChild(k);
      });
      kbd.appendChild(r);
    });
    // пробіл окремим рядком
    const rspace = elc("div","tr-row");
    const space = elc("div","tr-key tr-space f-th","пробіл");
    space.dataset.char = " "; keyEls[" "] = space;
    rspace.appendChild(space); kbd.appendChild(rspace);
    root.appendChild(kbd);

    // керування
    const controls = elc("div","tr-controls");
    const restart = elc("button","btn ghost","↻ Інший рядок");
    restart.onclick = ()=> selectLesson(state.lessonIdx);
    const result = elc("div","tr-result");
    controls.append(restart, result);
    root.appendChild(controls);

    const note = elc("div","tr-note","Порада: перемкни розкладку клавіатури на <strong>українську</strong> і не підглядай на клавіші — дивися на екран. Клацни сюди, якщо набір не реагує.");
    root.appendChild(note);

    // довідник комбінацій клавіш
    const ref = elc("details","tr-ref");
    ref.appendChild(elc("summary", null, "⌨ Корисні комбінації клавіш"));
    const tbl = elc("table","tr-ref-table");
    SHORTCUTS.forEach(([k,d])=>{
      const tr = elc("tr"); tr.appendChild(elc("td","tr-ref-k", k)); tr.appendChild(elc("td", null, d));
      tbl.appendChild(tr);
    });
    ref.appendChild(tbl);
    root.appendChild(ref);

    container.appendChild(root);

    /* --- стан --- */
    const state = { lessonIdx:0, target:"", pos:0, correct:0, errors:0, startedAt:null, done:false };
    let timer = null;

    function clearTimer(){ if(timer){ clearInterval(timer); timer=null; } }

    function showRecord(lessonId){
      const r = (window.Progress && Progress.getTyping) ? Progress.getTyping(lessonId) : null;
      recLine.innerHTML = (r && r.bestCpm)
        ? `Твій рекорд у цьому уроці: <b>${r.bestCpm}</b> зн/хв · точність <b>${r.bestAcc}%</b> (спроб: ${r.attempts})`
        : "Рекорду ще немає — це твоя перша спроба в цьому уроці.";
    }

    function selectLesson(i){
      state.lessonIdx = i;
      Array.from(tabs.children).forEach((b,bi)=> b.classList.toggle("active", bi===i));
      const L = LESSONS[i];
      hintLine.textContent = L.hint;
      state.target = L.gen();
      state.pos = 0; state.correct = 0; state.errors = 0; state.startedAt = null; state.done = false;
      result.textContent = "";
      showRecord(L.id);
      drawTarget(); updateStats(); highlightNext();
      root.focus();
    }

    function drawTarget(){
      targetBox.innerHTML = "";
      [...state.target].forEach((ch,idx)=>{
        const sp = elc("span","tr-char"+(ch===" "?" sp":""), ch===" " ? "␣" : ch);
        if(idx < state.pos) sp.classList.add("done");
        else if(idx === state.pos) sp.classList.add("cur");
        targetBox.appendChild(sp);
      });
    }

    function highlightNext(){
      Object.values(keyEls).forEach(k=> k.classList.remove("next"));
      if(state.done){ nextHint.textContent = ""; return; }
      const raw = state.target[state.pos] || "";
      if(!raw){ nextHint.textContent = ""; return; }
      const keyCh = keyForChar(raw);
      const k = keyEls[keyCh];
      if(k){ k.classList.add("next"); }
      const f = FINGER[keyCh];
      const shown = raw===" " ? "пробіл" : (raw==="," ? "кома" : raw);
      nextHint.innerHTML = f ? `Наступна: <b>${shown}</b> — ${FINGER_NAME[f]}${needsShift(raw)?' <b>+ Shift</b>':''}` : "";
    }

    function updateStats(){
      const mins = state.startedAt ? (Date.now() - state.startedAt)/60000 : 0;
      const cpm = mins>0 ? Math.min(999, Math.round(state.correct/mins)) : 0;
      const total = state.correct + state.errors;
      const acc = total>0 ? Math.round(100*state.correct/total) : 100;
      const prog = state.target.length ? Math.round(100*state.pos/state.target.length) : 0;
      sSpeed.querySelector("b").textContent = cpm;
      sAcc.querySelector("b").textContent = acc+"%";
      sErr.querySelector("b").textContent = state.errors;
      sProg.querySelector("b").textContent = prog+"%";
    }

    function finish(){
      state.done = true; clearTimer();
      const mins = state.startedAt ? (Date.now() - state.startedAt)/60000 : 0;
      const cpm = mins>0 ? Math.min(999, Math.round(state.correct/mins)) : 0;
      const total = state.correct + state.errors;
      const acc = total>0 ? Math.round(100*state.correct/total) : 100;
      updateStats(); highlightNext();
      const L = LESSONS[state.lessonIdx];
      let saved = "";
      if(window.Progress && Progress.setTyping){
        const rec = Progress.setTyping(L.id, { cpm, acc });
        if(rec && rec.bestCpm) saved = ` · рекорд: <b>${rec.bestCpm}</b> зн/хв`;
        showRecord(L.id);
      }
      const g = grade(cpm, acc);
      result.innerHTML = `Оцінка: <b class="tr-grade ${g.cls}">${g.icon} ${g.label}</b> · <b>${cpm}</b> зн/хв · точність <b>${acc}%</b>${saved}.`;
    }

    function onKey(e){
      if(state.done) return;
      let got;
      if(e.key === " " || e.code === "Space"){ got = " "; }
      else if(e.key && e.key.length === 1){ got = e.key; } // регістр важливий: велика літера / кома = Shift
      else { return; } // Shift, Backspace, стрілки тощо — ігноруємо
      e.preventDefault();

      if(!state.startedAt){
        state.startedAt = Date.now();
        timer = setInterval(()=>{
          if(!document.body.contains(root)){ clearTimer(); return; } // пішли з тренажера
          updateStats();
        }, 500);
      }

      const expected = (state.target[state.pos]||"");
      const curSpan = targetBox.children[state.pos];
      if(got === expected){
        if(curSpan){ curSpan.classList.remove("cur","err"); curSpan.classList.add("done"); }
        state.pos++; state.correct++;
        const nextSpan = targetBox.children[state.pos];
        if(nextSpan) nextSpan.classList.add("cur");
        if(state.pos >= state.target.length){ finish(); return; }
        highlightNext();
      } else {
        state.errors++;
        if(curSpan){ curSpan.classList.add("err"); }
      }
      updateStats();
    }

    root.addEventListener("keydown", onKey);
    root.addEventListener("click", ()=> root.focus());

    selectLesson(0);
    setTimeout(()=> root.focus(), 50);
  }

  window.Trainer = { render };
})();

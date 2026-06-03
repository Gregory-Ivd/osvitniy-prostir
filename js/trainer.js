/* ============================================================
   trainer.js — тренажер сліпого набору (українська ЙЦУКЕН).
   Чистий JS, офлайн. Екранна клавіатура із зонами пальців,
   підсвічування наступної клавіши, жива статистика, збереження
   найкращого результату в Progress (живить «карту самостійності»).
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
    "я":"lp","ч":"lr","с":"lm","м":"li","и":"li","т":"ri","ь":"ri","б":"rm","ю":"rr",".":"rp",
    " ":"th"
  };
  const FINGER_NAME = {
    lp:"лівий мізинець", lr:"лівий безіменний", lm:"лівий середній", li:"лівий вказівний",
    ri:"правий вказівний", rm:"правий середній", rr:"правий безіменний", rp:"правий мізинець",
    th:"великий палець (пробіл)"
  };

  /* --- набори символів і уроки --- */
  const HOME = ["ф","і","в","а","п","р","о","л","д","ж","є"];
  const TOP  = ["й","ц","у","к","е","н","г","ш","щ","з","х","ї"];
  const BOT  = ["я","ч","с","м","и","т","ь","б","ю"];
  const DIG  = ["1","2","3","4","5","6","7","8","9","0"];
  const WORDS = ["дім","рука","сила","право","робота","освіта","навик","текст","лист","план",
                 "мета","крок","успіх","знання","вільний","життя","вибір","шлях","праця","добро"];

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
  function shuffleWords(n){
    const a = WORDS.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a.slice(0, n).join(" ");
  }

  const LESSONS = [
    { id:"home", name:"Домашній ряд", hint:"Тримай пальці на ряду ФІВА — ОЛДЖ. Вказівні — на «а» та «о».",
      gen:()=>groups(HOME, 8, 2, 4) },
    { id:"top",  name:"Верхній ряд",  hint:"Тягнися вгору з домашнього ряду й повертай пальці назад.",
      gen:()=>groups(TOP, 8, 2, 4) },
    { id:"bottom", name:"Нижній ряд",  hint:"Тягнися вниз із домашнього ряду й повертай пальці назад.",
      gen:()=>groups(BOT, 8, 2, 4) },
    { id:"digits", name:"Цифри",       hint:"Верхній ряд цифр. Кожен палець — над своєю цифрою.",
      gen:()=>groups(DIG, 8, 2, 4) },
    { id:"words", name:"Слова",        hint:"Справжні слова. Намагайся не дивитися на клавіатуру.",
      gen:()=>shuffleWords(10) },
    { id:"text",  name:"Текст",        hint:"Цілісний текст із пробілами й крапкою.",
      gen:()=>"дорогу долає той хто йде. перший крок за тобою." }
  ];

  function render(container){
    const root = elc("div","trainer");
    root.tabIndex = 0; // фокус для перехоплення клавіш

    const head = elc("div","module-head");
    head.appendChild(elc("div","eyebrow","Практика"));
    head.appendChild(elc("h1", null, "Тренажер сліпого набору"));
    head.appendChild(elc("div","goal","<strong>Мета:</strong> навчитися друкувати, не дивлячись на клавіатуру. Тримай руки на домашньому ряду й розганяйся поступово — головне не швидкість, а точність."));
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

    container.appendChild(root);

    /* --- стан --- */
    const state = { lessonIdx:0, target:"", pos:0, correct:0, errors:0, startedAt:null, done:false };
    let timer = null;

    function clearTimer(){ if(timer){ clearInterval(timer); timer=null; } }

    function selectLesson(i){
      state.lessonIdx = i;
      Array.from(tabs.children).forEach((b,bi)=> b.classList.toggle("active", bi===i));
      const L = LESSONS[i];
      hintLine.textContent = L.hint;
      state.target = L.gen();
      state.pos = 0; state.correct = 0; state.errors = 0; state.startedAt = null; state.done = false;
      result.textContent = "";
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
      const ch = (state.target[state.pos]||"").toLowerCase();
      const k = keyEls[ch];
      if(k){ k.classList.add("next"); }
      const f = FINGER[ch];
      nextHint.innerHTML = f ? `Наступна: <b>${ch===" "?"пробіл":ch}</b> — ${FINGER_NAME[f]}` : "";
    }

    function updateStats(){
      const mins = state.startedAt ? (Date.now() - state.startedAt)/60000 : 0;
      const cpm = mins>0 ? Math.round(state.correct/mins) : 0;
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
      const cpm = mins>0 ? Math.round(state.correct/mins) : 0;
      const total = state.correct + state.errors;
      const acc = total>0 ? Math.round(100*state.correct/total) : 100;
      updateStats(); highlightNext();
      const L = LESSONS[state.lessonIdx];
      let saved = "";
      if(window.Progress && Progress.setTyping){
        const rec = Progress.setTyping(L.id, { cpm, acc });
        if(rec && rec.bestCpm) saved = ` · твій рекорд: <b>${rec.bestCpm}</b> зн/хв`;
      }
      result.innerHTML = `✓ Готово! Швидкість <b>${cpm}</b> зн/хв, точність <b>${acc}%</b>${saved}. Натисни «Інший рядок».`;
    }

    function onKey(e){
      if(state.done) return;
      let got;
      if(e.key === " " || e.code === "Space"){ got = " "; }
      else if(e.key && e.key.length === 1){ got = e.key.toLowerCase(); }
      else { return; } // Shift, Backspace, стрілки тощо — ігноруємо
      e.preventDefault();

      if(!state.startedAt){
        state.startedAt = Date.now();
        timer = setInterval(()=>{
          if(!document.body.contains(root)){ clearTimer(); return; } // пішли з тренажера
          updateStats();
        }, 500);
      }

      const expected = (state.target[state.pos]||"").toLowerCase();
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

/* ============================================================
   instructor.js — кабінет викладача (офлайн).
   Бачить локальні профілі учнів, імпортує файли профілів,
   показує зведення й веде до сертифіката.
   ============================================================ */
(function () {
  const root = document.getElementById("teacher");
  const elc = (t,c,h)=>{const n=document.createElement(t); if(c)n.className=c; if(h!=null)n.innerHTML=h; return n;};

  function toast(msg, type) {
    let wrap = document.getElementById("toastWrap");
    if (!wrap) { wrap = elc("div","toast-wrap"); wrap.id="toastWrap"; document.body.appendChild(wrap); }
    const t = elc("div","toast"+(type?" t-"+type:""), msg);
    wrap.appendChild(t);
    requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add("in")));
    setTimeout(()=>{ t.classList.remove("in"); setTimeout(()=>t.remove(),300); }, 3500);
  }

  function row(p) {
    const prog = Cabinet.readProgress(p.id);
    const s = Certificate.summarize(prog);
    const lv = Certificate.level(s);
    const tr = elc("tr");
    tr.innerHTML = `
      <td><b>${p.name}</b><div class="muted small">${p.group||""}</div></td>
      <td style="text-align:center">${s.completed}/${s.total}</td>
      <td style="text-align:center">${s.quizAvgPercent}%</td>
      <td><span class="lvl lvl${lv.key}">Р${lv.key}</span> ${lv.label}</td>
      <td style="text-align:right; white-space:nowrap">
        <a class="btn ghost" href="certificate/sertyfikat.html?id=${encodeURIComponent(p.id)}">Сертифікат</a>
        <button class="iconbtn" data-pin="${p.id}" title="Скинути PIN">🔑</button>
        <button class="iconbtn" data-del="${p.id}" title="Видалити профіль">🗑</button>
      </td>`;
    return tr;
  }

  function openPinReset(id, name) {
    const overlay = elc("div","pin-overlay"); overlay.id="pinResetOverlay";
    const box = elc("div","pin-box");
    box.appendChild(elc("h2",null,"🔑 Змінити PIN"));
    box.appendChild(elc("p","pin-sub","Учень: " + name));
    const inp = elc("input","fld"); inp.type="password"; inp.inputMode="numeric";
    inp.maxLength=4; inp.placeholder="Новий PIN (або порожньо — без PIN)"; inp.autocomplete="off";
    box.appendChild(inp);
    const actions = elc("div","pin-actions");
    const cancel = elc("button","btn ghost","Скасувати");
    const ok = elc("button","btn primary","Зберегти");
    actions.appendChild(cancel); actions.appendChild(ok);
    box.appendChild(actions);
    overlay.appendChild(box);
    overlay.addEventListener("click", e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>inp.focus());
    ok.addEventListener("click", ()=>{
      Cabinet.setPin(id, inp.value);
      overlay.remove();
      toast("PIN учня змінено", "t-success");
    });
    cancel.addEventListener("click", ()=>overlay.remove());
    inp.addEventListener("keydown", e=>{ if(e.key==="Enter") ok.click(); });
  }

  function exportCSV() {
    const list = Cabinet.list();
    if (!list.length) { toast("Немає жодного учня", "t-warn"); return; }
    const rows = [["Імʼя","Група","Модулів","Із","Тести %","Рівень","Мітка рівня"]];
    list.forEach(p=>{
      const prog = Cabinet.readProgress(p.id);
      const s = Certificate.summarize(prog);
      const lv = Certificate.level(s);
      rows.push([p.name, p.group||"", s.completed, s.total, s.quizAvgPercent, "Р"+lv.key, lv.label]);
    });
    const csv = "﻿" + rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\r\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="OP8_students.csv"; document.body.appendChild(a); a.click(); a.remove();
    toast("CSV завантажено — відкрий у Excel", "t-success");
  }

  function printAll() {
    const list = Cabinet.list();
    if (!list.length) { toast("Немає жодного учня", "t-warn"); return; }
    const ids = list.map(p=>encodeURIComponent(p.id)).join(",");
    window.open("certificate/sertyfikat.html?ids="+ids, "_blank");
  }

  function render() {
    root.innerHTML = "";
    const list = Cabinet.list();

    const head = elc("div");
    head.innerHTML = `<h1>Кабінет викладача</h1>
      <p class="muted">Учнів на цьому комп'ютері: <b>${list.length}</b>. Дані зберігаються локально й не передаються в інтернет.</p>`;
    if (list.length) {
      const csvBtn = elc("button","btn ghost","⬇ Завантажити таблицю CSV");
      csvBtn.style.marginRight = "8px";
      csvBtn.addEventListener("click", exportCSV);
      head.appendChild(csvBtn);
      const printBtn = elc("button","btn ghost","🖨 Всі сертифікати");
      printBtn.addEventListener("click", printAll);
      head.appendChild(printBtn);
    }
    root.appendChild(head);

    // імпорт
    const imp = elc("div","callout info");
    imp.innerHTML = `<div class="c-title">⬆ Імпорт робіт учнів (файли .json — можна кілька одразу)</div>
      <div class="muted small">Обери один або кілька файлів, які учні здали (з флешки).</div>`;
    const file = elc("input"); file.type="file"; file.accept="application/json,.json"; file.multiple=true; file.className="fld";
    file.addEventListener("change", e=>{
      const files = Array.from(e.target.files||[]); if(!files.length) return;
      let ok=0, fail=0, pending=files.length;
      const done = ()=>{ render(); toast("Імпортовано: "+ok+(fail?(" · не вдалося: "+fail):""), fail?"t-warn":"t-success"); };
      files.forEach(f=>{
        const r = new FileReader();
        r.onload = ()=>{ try { Cabinet.importProfile(JSON.parse(r.result), ""); ok++; } catch(err){ fail++; }
          if(--pending===0) done(); };
        r.onerror = ()=>{ fail++; if(--pending===0) done(); };
        r.readAsText(f);
      });
    });
    imp.appendChild(file);
    root.appendChild(imp);

    // таблиця
    if(!list.length){ root.appendChild(elc("p","muted","Поки немає жодного учня. Учні створюють кабінети на головній сторінці курсу.")); return; }
    const table = elc("table","tbl");
    table.innerHTML = `<thead><tr>
      <th>Учень</th><th>Модулі</th><th>Тести</th><th>Рівень</th><th></th></tr></thead>`;
    const tb = elc("tbody");
    list.forEach(p=> tb.appendChild(row(p)));
    table.appendChild(tb);
    root.appendChild(table);

    table.addEventListener("click", e=>{
      const pinId = e.target.getAttribute && e.target.getAttribute("data-pin");
      if (pinId) {
        const prof = Cabinet.getProfile(pinId);
        openPinReset(pinId, prof ? prof.name : "");
        return;
      }
      const id = e.target.getAttribute && e.target.getAttribute("data-del");
      if(id && confirm("Видалити профіль цього учня з цього комп'ютера?")){ Cabinet.remove(id); render(); }
    });
  }

  // тема
  (function(){ try{ document.documentElement.setAttribute("data-theme", localStorage.getItem("op8.theme")||"light"); }catch(e){} })();
  render();
})();

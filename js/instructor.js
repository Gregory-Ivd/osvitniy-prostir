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
        <button class="iconbtn" data-del="${p.id}" title="Видалити профіль">🗑</button>
      </td>`;
    return tr;
  }

  function render() {
    root.innerHTML = "";
    const list = Cabinet.list();

    const head = elc("div");
    head.innerHTML = `<h1>Кабінет викладача</h1>
      <p class="muted">Учнів на цьому комп'ютері: <b>${list.length}</b>. Дані зберігаються локально й не передаються в інтернет.</p>`;
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
      const id = e.target.getAttribute && e.target.getAttribute("data-del");
      if(id && confirm("Видалити профіль цього учня з цього комп'ютера?")){ Cabinet.remove(id); render(); }
    });
  }

  // тема
  (function(){ try{ document.documentElement.setAttribute("data-theme", localStorage.getItem("op8.theme")||"light"); }catch(e){} })();
  render();
})();

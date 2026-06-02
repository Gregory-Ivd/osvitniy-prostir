/* ============================================================
   instructor.js — кабінет викладача (офлайн).
   Бачить локальні профілі учнів, імпортує файли профілів,
   показує зведення й веде до сертифіката.
   ============================================================ */
(function () {
  const root = document.getElementById("teacher");
  const elc = (t,c,h)=>{const n=document.createElement(t); if(c)n.className=c; if(h!=null)n.innerHTML=h; return n;};

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
    imp.innerHTML = `<div class="c-title">⬆ Імпорт профілю учня (файл .json з іншого ПК)</div>`;
    const file = elc("input"); file.type="file"; file.accept="application/json,.json"; file.className="fld";
    file.addEventListener("change", e=>{
      const f = e.target.files[0]; if(!f) return;
      const r = new FileReader();
      r.onload = ()=>{ try { Cabinet.importProfile(JSON.parse(r.result), ""); render(); }
        catch(err){ alert("Не вдалося імпортувати: "+err.message); } };
      r.readAsText(f);
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

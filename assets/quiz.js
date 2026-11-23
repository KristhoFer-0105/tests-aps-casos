/* Motor de los tests de APS (modo práctica).
   Todas las preguntas en lista. Se elige una respuesta y se presiona "Comprobar respuesta":
   aparece la respuesta correcta, el razonamiento, por qué las otras alternativas no lo son,
   la recomendación práctica para APS y la fuente.
   Formatos: mc (alternativas) y num (respuesta numérica). Casos clínicos con parts.
   Con <body data-mode="pauta"> la misma librería dibuja la Parte II (pauta completa). */
(function () {
  "use strict";
  var L = ["A", "B", "C", "D", "E"];
  var FMT = { mc: "Selección múltiple", num: "Cálculo" };
  var LV = { "Intermedia": "lv2", "Avanzada": "lv3" };

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function perm(n, seed) { var r = rng(seed), p = []; for (var i = 0; i < n; i++) p.push(i); for (var k = n - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)); var t = p[k]; p[k] = p[j]; p[j] = t; } return p; }
  function num(s) { if (s == null) return NaN; s = String(s).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."); return s === "" ? NaN : Number(s); }
  function fmtN(x) { return String(x).replace(".", ","); }

  /* Las alternativas se barajan con una semilla fija: el orden es el mismo en el test y en la pauta. */
  function prep(key, p, id) {
    var c = {}; for (var k in p) c[k] = p[k];
    c.type = p.type || "mc";
    if (c.type === "mc") {
      var pm = p.k ? p.o.map(function (_, i) { return i; }) : perm(p.o.length, hash(key + "#" + id));
      c.o = pm.map(function (i) { return p.o[i]; });
      c.x = pm.map(function (i) { return p.x ? p.x[i] : ""; });
      c.a = pm.indexOf(p.a);
    }
    return c;
  }

  function build(Q) {
    var units = [], blocks = [];
    Q.items.forEach(function (it, i) {
      var n = i + 1;
      if (it.parts) {
        var ids = [];
        it.parts.forEach(function (p, k) { var id = n + String.fromCharCode(97 + k); units.push({ id: id, num: n, sub: String.fromCharCode(97 + k), p: prep(Q.key, p, id) }); ids.push(id); });
        blocks.push({ num: n, it: it, ids: ids, isCase: true });
      } else {
        units.push({ id: String(n), num: n, sub: "", p: prep(Q.key, it, String(n)) });
        blocks.push({ num: n, it: it, ids: [String(n)], isCase: false });
      }
    });
    var byId = {}; units.forEach(function (u) { byId[u.id] = u; });
    return { units: units, blocks: blocks, byId: byId };
  }

  function keyText(p) { return p.type === "num" ? fmtN(p.ans) + (p.unit ? " " + p.unit : "") + (p.tol ? " (± " + fmtN(p.tol) + ")" : "") : L[p.a] + ". " + p.o[p.a]; }

  /* Bloques de retroalimentación compartidos por el test y la pauta */
  function explainHTML(p) {
    var h = "<h4>" + (p.type === "num" ? "Desarrollo paso a paso" : "Razonamiento: por qué es la correcta") + "</h4><p>" + p.f + "</p>";
    if (p.type === "mc") h += "<h4>Por qué las otras alternativas no son correctas</h4><ul>" + p.o.map(function (o, k) { return k === p.a ? "" : "<li><b>" + L[k] + ".</b> " + (p.x[k] || "") + "</li>"; }).join("") + "</ul>";
    if (p.ap) h += "<h4>Recomendación práctica en APS</h4><p>" + p.ap + "</p>";
    h += '<p class="cont"><b>Contenido evaluado:</b> ' + p.t + (p.r ? "<br><b>Fuente:</b> " + p.r : "") + "</p>";
    return h;
  }

  function refPanel(Q) {
    if (!window.APS_REF) return null;
    var d = el("details", "refbox");
    d.innerHTML = "<summary>Tabla de referencia para los cálculos</summary>" + window.APS_REF;
    return d;
  }

  /* =================================== TEST =================================== */
  function renderTest(Q) {
    var S = build(Q), units = S.units, blocks = S.blocks, byId = S.byId;
    var KEY = "aps-casos-v1-" + Q.key;
    var st = { ans: {}, chk: {}, notes: {} };
    try { var raw = JSON.parse(localStorage.getItem(KEY) || "null"); if (raw && raw.ans && raw.chk) { st = raw; st.notes = st.notes || {}; } } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

    function answered(u) { var a = st.ans[u.id]; if (a == null) return false; return u.p.type === "mc" ? typeof a === "number" : String(a).trim() !== ""; }
    function correct(u) { var a = st.ans[u.id], p = u.p; if (!answered(u)) return false; if (p.type === "mc") return a === p.a; var v = num(a); return !isNaN(v) && Math.abs(v - p.ans) <= (p.tol || 0) + 1e-9; }
    function status(u) { return st.chk[u.id] ? (correct(u) ? "ok" : "bad") : ""; }
    function blockStatus(b) {
      var ss = b.ids.map(function (id) { return status(byId[id]); });
      if (ss.every(function (s) { return s === ""; })) return "";
      if (ss.some(function (s) { return s === ""; })) return "prog";
      if (ss.every(function (s) { return s === "ok"; })) return "ok";
      if (ss.every(function (s) { return s === "bad"; })) return "bad";
      return "part";
    }

    function rMC(u, box, review) {
      var p = u.p, a = st.ans[u.id], opts = el("div", "opts");
      p.o.forEach(function (o, k) {
        var b = el("button", "opt", "<b>" + L[k] + ".</b><span>" + o + "</span>"); b.type = "button";
        if (review) { b.disabled = true; if (k === p.a) b.classList.add("ok"); else if (a === k) b.classList.add("bad"); }
        else {
          if (a === k) b.classList.add("sel");
          b.setAttribute("aria-pressed", a === k ? "true" : "false");
          b.addEventListener("click", function () {
            st.ans[u.id] = k; save();
            opts.querySelectorAll(".opt").forEach(function (x) { var on = x === b; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
            var ck = box.querySelector(".ckbtn"); if (ck) ck.disabled = false;
            var nh = box.querySelector(".needans"); if (nh) nh.hidden = true;
          });
        }
        opts.appendChild(b);
      });
      box.appendChild(opts);
    }
    function rNum(u, box, review) {
      var p = u.p, a = st.ans[u.id] || "", row = el("div", "numrow");
      var inp = el("input", ""); inp.type = "text"; inp.inputMode = "decimal"; inp.value = a; inp.setAttribute("aria-label", "Respuesta numérica");
      row.appendChild(inp); if (p.unit) row.appendChild(el("span", "unit", p.unit));
      if (review) { inp.disabled = true; inp.classList.add(correct(u) ? "ok" : "bad"); }
      else {
        inp.addEventListener("input", function () { st.ans[u.id] = inp.value; save(); var ck = box.querySelector(".ckbtn"); if (ck) ck.disabled = inp.value.trim() === ""; });
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") check(u); });
        row.appendChild(el("span", "hint", p.hint || "Usa coma o punto decimal"));
      }
      box.appendChild(row);
    }

    function fbHTML(u) {
      var p = u.p, a = st.ans[u.id], ok = correct(u);
      var mine = p.type === "mc" ? (typeof a === "number" ? L[a] + ". " + p.o[a] : "—") : (a ? fmtN(String(a).trim()) + (p.unit ? " " + p.unit : "") : "—");
      return '<p class="key">' + (ok ? '<span class="ok">✔ Correcta</span>' : '<span class="bad">✘ Incorrecta</span>') + "<br>Respuesta correcta: <span class=\"ok\">" + keyText(p) + "</span>" + (ok ? "" : "<br>Tu respuesta: " + mine) + "</p>" + explainHTML(p);
    }

    function check(u) {
      if (!answered(u)) { var h = document.querySelector("#u" + u.id + " .needans"); if (h) h.hidden = false; return; }
      st.chk[u.id] = 1; save(); refreshUnit(u);
      var nb = document.getElementById("u" + u.id); if (nb) { var fb = nb.querySelector(".fb"); if (fb && fb.getBoundingClientRect().top > window.innerHeight) fb.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
    }

    function partEl(u) {
      var p = u.p, review = !!st.chk[u.id], box = el("div", "part");
      box.id = "u" + u.id;
      var lab = u.sub ? '<span class="lab">' + u.id + ")</span>" : "";
      var tags = u.sub ? ' <span class="tag">' + FMT[p.type] + "</span>" : "";
      box.appendChild(el("p", u.sub ? "pq" : "stem", lab + p.q + tags));
      (p.type === "num" ? rNum : rMC)(u, box, review);
      var acts = el("div", "acts");
      if (review) {
        box.appendChild(el("div", "fb fb-" + (correct(u) ? "ok" : "bad"), fbHTML(u)));
        var rt = el("button", "btn", "↺ Reintentar pregunta"); rt.type = "button";
        rt.addEventListener("click", function () { delete st.ans[u.id]; delete st.chk[u.id]; save(); refreshUnit(u); });
        acts.appendChild(rt);
      } else {
        var ck = el("button", "btn primary ckbtn", "Comprobar respuesta"); ck.type = "button"; ck.disabled = !answered(u);
        ck.addEventListener("click", function () { check(u); });
        acts.appendChild(ck);
        var nh = el("span", "needans", p.type === "num" ? "Escribe tu resultado antes de comprobar." : "Elige una alternativa antes de comprobar."); nh.hidden = true; acts.appendChild(nh);
      }
      box.appendChild(acts);
      return box;
    }

    function headEl(b) {
      var it = b.it, h = el("div", "qh");
      h.appendChild(el("span", "num", String(b.num)));
      h.appendChild(el("span", "tag", b.isCase ? it.kind : FMT[byId[b.ids[0]].p.type]));
      if (it.stage) h.appendChild(el("span", "tag stage", it.stage));
      if (it.d) h.appendChild(el("span", "tag " + (LV[it.d] || ""), it.d));
      var bs = blockStatus(b), lbl = { ok: b.isCase ? "Todo correcto" : "Correcta", bad: b.isCase ? "Con errores" : "Incorrecta", part: "Con errores", prog: "En curso" }[bs];
      if (lbl) h.appendChild(el("span", "state " + (bs === "prog" ? "" : bs === "part" ? "warn" : bs), lbl));
      return h;
    }

    function blockEl(b) {
      var it = b.it, card = el("article", "q");
      card.id = "q" + b.num;
      var bs = blockStatus(b); if (bs === "ok" || bs === "bad") card.classList.add(bs); if (bs === "part") card.classList.add("pt");
      card.appendChild(headEl(b));
      if (b.isCase) {
        card.appendChild(el("h3", "ctitle", it.title));
        card.appendChild(el("div", "casebox", it.html));
      }
      b.ids.forEach(function (id) { card.appendChild(partEl(byId[id])); });
      if (b.isCase) {
        var nd = el("details", "notes"); nd.open = !!st.notes[b.num];
        nd.appendChild(el("summary", "", "Espacio de desarrollo: cálculos y justificación"));
        var ta = el("textarea", ""); ta.rows = 5; ta.value = st.notes[b.num] || ""; ta.placeholder = "Escribe aquí tus cálculos, el diagnóstico integrado y la justificación de tus decisiones. Se guarda en este navegador.";
        ta.setAttribute("aria-label", "Espacio de desarrollo del caso " + b.num);
        ta.addEventListener("input", function () { if (ta.value) st.notes[b.num] = ta.value; else delete st.notes[b.num]; save(); });
        nd.appendChild(ta); card.appendChild(nd);
      }
      return card;
    }

    function refreshUnit(u) {
      var old = document.getElementById("u" + u.id); if (old) old.replaceWith(partEl(u));
      var b = blocks[u.num - 1], card = document.getElementById("q" + b.num);
      if (card) {
        card.classList.remove("ok", "bad", "pt");
        var bs = blockStatus(b); if (bs === "ok" || bs === "bad") card.classList.add(bs); if (bs === "part") card.classList.add("pt");
        card.querySelector(".qh").replaceWith(headEl(b));
      }
      renderBar(); renderMap(); renderSummary();
    }

    var main = document.getElementById("main"), gridEl = document.getElementById("grid"), filter = "all";
    document.title = Q.docTitle;
    document.getElementById("hero").innerHTML = '<div class="wrap"><div class="kicker">' + Q.module + " · Programas de APS · Nutrición y Dietética UCM</div><h1>" + Q.title + "</h1><p>" + Q.subtitle + '</p><div class="chips">' + Q.chips.map(function (c) { return "<span>" + c + "</span>"; }).join("") + "<span>Botón «Comprobar» en cada pregunta</span></div></div>";

    function totals() {
      var pts = 0, done = 0;
      units.forEach(function (u) { if (st.chk[u.id]) { done++; if (correct(u)) pts++; } });
      var max = units.length, r = pts / max;
      var nota = r < 0.6 ? 1 + 3 * r / 0.6 : 4 + 3 * (r - 0.6) / 0.4;
      return { pts: pts, max: max, done: done, pct: done ? Math.round(pts * 1000 / done) / 10 : null, nota: Math.round(nota * 10) / 10 };
    }
    function renderBar() {
      var T = totals();
      document.getElementById("stats").innerHTML = "<span><b>" + T.done + "/" + T.max + "</b> comprobadas</span><span><b>" + T.pts + "</b> correctas</span><span><b>" + (T.pct == null ? "—" : fmtN(T.pct) + " %") + "</b> logro</span><span><b>" + (T.done ? fmtN(T.nota.toFixed(1)) : "—") + "</b> nota (60 %)</span>";
      document.getElementById("track").style.width = (T.done * 100 / T.max) + "%";
    }
    function visible(b) {
      var bs = blockStatus(b);
      if (filter === "pend") return bs === "" || bs === "prog";
      if (filter === "bad") return b.ids.some(function (id) { return status(byId[id]) === "bad"; });
      return true;
    }
    function renderMap() {
      gridEl.innerHTML = "";
      blocks.forEach(function (b) {
        var bs = blockStatus(b);
        var n = el("button", "n" + (bs ? " " + ({ ok: "ok", bad: "bad", part: "part", prog: "part" }[bs]) : ""), String(b.num)); n.type = "button";
        n.title = "Pregunta " + b.num + (b.isCase ? " · " + b.it.kind : "");
        n.addEventListener("click", function () { if (!visible(b)) setFilter("all"); var t = document.getElementById("q" + b.num); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); });
        gridEl.appendChild(n);
      });
    }
    var sumEl = el("details", "result summary");
    function renderSummary() {
      var T = totals(), open = sumEl.open;
      var head = "<summary>Hoja de respuestas y resultados (" + T.done + " de " + T.max + " comprobadas)</summary>";
      if (!T.done) { sumEl.innerHTML = head + "<p>Aún no has comprobado preguntas. Aquí se irá llenando tu hoja de respuestas.</p>"; sumEl.open = open; return; }
      var areas = {};
      units.forEach(function (u) {
        if (!st.chk[u.id]) return;
        var ar = u.p.t.split(":")[0].trim(); if (!areas[ar]) areas[ar] = { pts: 0, max: 0, ids: [] };
        areas[ar].max++; if (correct(u)) areas[ar].pts++; else areas[ar].ids.push(u.id);
      });
      var weak = Object.keys(areas).filter(function (k) { return areas[k].ids.length; }).sort(function (a, b) { return areas[a].pts / areas[a].max - areas[b].pts / areas[b].max; });
      sumEl.innerHTML = head + '<div class="kpis"><div><b>' + T.pts + " / " + T.done + "</b><span>correctas en lo comprobado</span></div><div><b>" + fmtN(T.pct) + ' %</b><span>logro</span></div><div><b class="nota ' + (T.nota >= 4 ? "ok" : "bad") + '">' + fmtN(T.nota.toFixed(1)) + "</b><span>nota sobre el total (" + T.max + " ítems, exigencia 60 %)</span></div></div>" +
        "<h3>Contenidos que debes reforzar</h3>" + (weak.length ? "<ul class='weak'>" + weak.map(function (k) { var A = areas[k]; return "<li><b>" + k + "</b> — " + Math.round(A.pts * 100 / A.max) + " % de logro · ítems " + A.ids.map(function (id) { return '<a href="#u' + id + '">' + id + "</a>"; }).join(", ") + "</li>"; }).join("") + "</ul>" : "<p>Sin errores en lo comprobado.</p>") +
        "<h3>Hoja de respuestas</h3><div class='tbl'><table><thead><tr><th>Ítem</th><th>Tu respuesta</th><th>Correcta</th><th>Contenido evaluado</th><th>Resultado</th></tr></thead><tbody>" +
        units.map(function (u) {
          var a = st.ans[u.id], mine = u.p.type === "mc" ? (typeof a === "number" ? L[a] : "—") : (a ? fmtN(String(a).trim()) : "—");
          if (!st.chk[u.id]) return '<tr><td><a href="#u' + u.id + '">' + u.id + "</a></td><td>" + mine + "</td><td>—</td><td>" + u.p.t + "</td><td>Pendiente</td></tr>";
          var ok = correct(u);
          return '<tr><td><a href="#u' + u.id + '">' + u.id + "</a></td><td>" + mine + "</td><td>" + (u.p.type === "mc" ? L[u.p.a] : fmtN(u.p.ans)) + "</td><td>" + u.p.t + '</td><td class="' + (ok ? "ok" : "bad") + '">' + (ok ? "Correcta" : "Incorrecta") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      sumEl.open = open;
    }
    function renderAll() {
      main.innerHTML = "";
      var rp = refPanel(Q); if (rp) main.appendChild(rp);
      var shown = 0, lastSec = null;
      blocks.forEach(function (b) {
        var sec = b.it.sec || null;
        if (!visible(b)) { if (sec) lastSec = sec; return; }
        if (sec && sec !== lastSec && filter === "all") main.appendChild(el("h2", "sec", sec));
        if (sec) lastSec = sec;
        main.appendChild(blockEl(b)); shown++;
      });
      if (!shown) main.appendChild(el("p", "empty", "No hay preguntas en este filtro."));
      renderSummary(); main.appendChild(sumEl); renderBar(); renderMap();
    }
    function setFilter(f) {
      filter = f;
      document.querySelectorAll(".f[data-f]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-f") === f ? "true" : "false"); });
      renderAll();
    }
    document.querySelectorAll(".f[data-f]").forEach(function (b) { b.addEventListener("click", function () { setFilter(b.getAttribute("data-f")); }); });
    document.getElementById("reset").addEventListener("click", function () {
      var old = document.querySelector(".confirm"); if (old) { old.remove(); return; }
      var box = el("div", "confirm");
      box.innerHTML = "<h3>¿Borrar todas tus respuestas y notas de este módulo?</h3><p>Podrás comenzar de nuevo desde cero.</p>";
      var row = el("div", "acts"), ok = el("button", "btn primary", "Sí, borrar todo"), no = el("button", "btn", "Cancelar"); ok.type = no.type = "button";
      ok.addEventListener("click", function () { st = { ans: {}, chk: {}, notes: {} }; save(); renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      no.addEventListener("click", function () { box.remove(); });
      row.appendChild(ok); row.appendChild(no); box.appendChild(row);
      main.insertBefore(box, main.firstChild); box.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    document.getElementById("printBtn").addEventListener("click", function () { sumEl.open = true; window.print(); });
    renderAll();
  }

  /* =================================== PAUTA =================================== */
  function renderPauta() {
    var main = document.getElementById("main"), Z = window.QUIZZES || {};
    var order = ["t1", "t2", "t3"];
    var toc = el("nav", "ptoc"); toc.setAttribute("aria-label", "Módulos de la pauta");
    order.forEach(function (k) { if (!Z[k]) return; var a = el("a", "", Z[k].module + " · " + Z[k].short); a.href = "#p-" + k; toc.appendChild(a); });
    main.appendChild(toc);
    order.forEach(function (k) {
      var Q = Z[k]; if (!Q) return;
      var S = build(Q), sec = el("section", "pmod"); sec.id = "p-" + k;
      sec.appendChild(el("h2", "sec", Q.module + " · " + Q.title));
      var sheet = el("details", "pauta"); sheet.open = true;
      sheet.innerHTML = "<summary>Hoja de respuestas · " + Q.module + "</summary>";
      var g = el("div", "pgrid");
      S.units.forEach(function (u) { g.appendChild(el("span", "", '<a href="#p' + k + "-" + u.id + '">' + u.id + "</a> <b>" + (u.p.type === "mc" ? L[u.p.a] : fmtN(u.p.ans) + (u.p.unit ? " " + u.p.unit : "")) + "</b>")); });
      sheet.appendChild(g); sec.appendChild(sheet);
      var lastSec = null;
      S.blocks.forEach(function (b) {
        if (b.it.sec && b.it.sec !== lastSec) { sec.appendChild(el("h3", "psec", b.it.sec)); lastSec = b.it.sec; }
        var card = el("article", "q pq-card");
        var hd = el("div", "qh"); hd.appendChild(el("span", "num", String(b.num))); hd.appendChild(el("span", "tag", b.isCase ? b.it.kind : FMT[S.byId[b.ids[0]].p.type])); if (b.it.stage) hd.appendChild(el("span", "tag stage", b.it.stage));
        card.appendChild(hd);
        if (b.isCase) { card.appendChild(el("h3", "ctitle", b.it.title)); var cw = el("details", "casewrap"); cw.innerHTML = "<summary>Ver antecedentes del caso</summary>"; cw.appendChild(el("div", "casebox", b.it.html)); card.appendChild(cw); }
        b.ids.forEach(function (id) {
          var u = S.byId[id], p = u.p, box = el("div", "part"); box.id = "p" + k + "-" + u.id;
          box.appendChild(el("p", u.sub ? "pq" : "stem", (u.sub ? '<span class="lab">' + u.id + ")</span>" : "") + p.q));
          if (p.type === "mc") { var ol = el("div", "opts"); p.o.forEach(function (o, j) { var r = el("div", "opt" + (j === p.a ? " ok" : ""), "<b>" + L[j] + ".</b><span>" + o + "</span>"); ol.appendChild(r); }); box.appendChild(ol); }
          box.appendChild(el("div", "fb fb-ok", '<p class="key">Respuesta correcta: <span class="ok">' + keyText(p) + "</span></p>" + explainHTML(p)));
          card.appendChild(box);
        });
        sec.appendChild(card);
      });
      main.appendChild(sec);
    });
    var pb = document.getElementById("printBtn"); if (pb) pb.addEventListener("click", function () { window.print(); });
  }

  if (document.body.getAttribute("data-mode") === "pauta") renderPauta(); else renderTest(window.QUIZ);
})();

/* Motor de los tests de APS · versión 2 (formatos mixtos).
   Todas las preguntas en lista; cada ítem se responde y se presiona «Comprobar respuesta».
   Formatos: mc (alternativas), multi (marca todas las correctas), tf (verdadero/falso),
   match (términos pareados), order (ordenar), num (cálculo), cloze (completar) y
   spot (detecta los errores de una ficha clínica). Ítems compuestos: minicasos y casos (parts).
   Con <body data-mode="pauta"> dibuja la Parte II (pauta completa). Cada ítem vale 1 punto;
   los formatos con varias partes dan puntaje parcial. */
(function () {
  "use strict";
  var L = ["A", "B", "C", "D", "E", "F", "G", "H"];
  var FMT = { mc: "Alternativas", multi: "Marca todas las correctas", tf: "Verdadero o falso", match: "Términos pareados", order: "Ordenar", num: "Cálculo", cloze: "Completar", spot: "Detecta el error" };
  var LV = { "Intermedia": "lv2", "Avanzada": "lv3" };

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function perm(n, seed) { var r = rng(seed), p = []; for (var i = 0; i < n; i++) p.push(i); for (var k = n - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)); var t = p[k]; p[k] = p[j]; p[j] = t; } return p; }
  function num(s) { if (s == null) return NaN; s = String(s).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."); return s === "" ? NaN : Number(s); }
  function fmtN(x) { return String(x).replace(".", ","); }
  function pct(x) { return Math.round(x * 100); }

  /* Barajado con semilla fija: el mismo orden en el test y en la pauta. */
  function prep(key, p, id) {
    var c = {}; for (var k in p) c[k] = p[k];
    c.type = p.type || "mc";
    var seed = hash(key + "#" + id);
    if (c.type === "mc" || c.type === "multi") {
      var pm = p.k ? p.o.map(function (_, i) { return i; }) : perm(p.o.length, seed);
      c.o = pm.map(function (i) { return p.o[i]; });
      c.x = pm.map(function (i) { return p.x ? p.x[i] : ""; });
      if (c.type === "mc") c.a = pm.indexOf(p.a);
      else c.c = pm.map(function (i) { return p.c.indexOf(i) >= 0; });
    } else if (c.type === "match") {
      var ch = []; p.rows.forEach(function (r) { if (ch.indexOf(r.r) < 0) ch.push(r.r); });
      (p.extra || []).forEach(function (e) { if (ch.indexOf(e) < 0) ch.push(e); });
      var pc = perm(ch.length, seed); c.choices = pc.map(function (i) { return ch[i]; });
      var pr = p.fixed ? p.rows.map(function (_, i) { return i; }) : perm(p.rows.length, seed + 3);
      c.rows = pr.map(function (i) { return p.rows[i]; });
      c.why = pr.map(function (i) { return p.why ? p.why[i] : ""; });
    } else if (c.type === "order") {
      var po = perm(p.steps.length, seed);
      if (po.every(function (v, i) { return v === i; })) po.reverse();
      c.init = po;
    } else if (c.type === "cloze") {
      c.bl = p.blanks.map(function (b, i) { var pb = perm(b.o.length, seed + i * 7); return pb.map(function (j) { return b.o[j]; }); });
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

  /* ---------- Clave y explicación (compartidas por test y pauta) ---------- */
  function keyHTML(p) {
    if (p.type === "mc") return L[p.a] + ". " + p.o[p.a];
    if (p.type === "num") return fmtN(p.ans) + (p.unit ? " " + p.unit : "") + (p.tol ? " (± " + fmtN(p.tol) + ")" : "");
    if (p.type === "multi") return p.o.map(function (o, k) { return p.c[k] ? L[k] : null; }).filter(Boolean).join(", ");
    if (p.type === "spot") return "líneas " + p.lines.map(function (l, k) { return l.e ? (k + 1) : null; }).filter(Boolean).join(", ");
    if (p.type === "tf") return p.s.map(function (s, i) { return (i + 1) + ": " + (s.v ? "V" : "F"); }).join(" · ");
    if (p.type === "match") return "ver la tabla";
    if (p.type === "order") return "ver el orden";
    if (p.type === "cloze") return p.blanks.map(function (b) { return b.a; }).join(" · ");
    return "";
  }
  function explainHTML(p) {
    var h = "";
    if (p.type === "multi") {
      h += "<h4>Alternativa por alternativa</h4><ul>" + p.o.map(function (o, k) { return "<li><b>" + L[k] + ". " + (p.c[k] ? '<span class="ok">Correcta, había que marcarla.</span>' : '<span class="bad">Incorrecta, no había que marcarla.</span>') + "</b> " + (p.x[k] || "") + "</li>"; }).join("") + "</ul>";
    } else if (p.type === "spot") {
      h += "<h4>Línea por línea</h4><ul>" + p.lines.map(function (l, k) { return "<li><b>Línea " + (k + 1) + ": " + (l.e ? '<span class="bad">tiene error.</span>' : '<span class="ok">está correcta.</span>') + "</b> " + (l.w || "") + "</li>"; }).join("") + "</ul>";
    } else if (p.type === "tf") {
      h += "<h4>Afirmación por afirmación</h4><ul>" + p.s.map(function (s, i) { return "<li><b>" + (i + 1) + ". " + (s.v ? "Verdadera" : "Falsa") + ":</b> " + s.f + "</li>"; }).join("") + "</ul>";
    } else if (p.type === "match") {
      h += '<h4>Pares correctos y su fundamento</h4><div class="tbl"><table><thead><tr><th>Elemento</th><th>Pareja correcta</th><th>Por qué</th></tr></thead><tbody>' + p.rows.map(function (r, i) { return "<tr><td>" + r.l + "</td><td><b>" + r.r + "</b></td><td>" + (p.why[i] || "") + "</td></tr>"; }).join("") + "</tbody></table></div>";
      if (p.extra && p.extra.length) h += "<p><b>Distractores sin pareja:</b> " + p.extra.map(function (e) { return "«" + e + "»"; }).join(", ") + (p.extraWhy ? ". " + p.extraWhy : ".") + "</p>";
    } else if (p.type === "order") {
      h += "<h4>Orden correcto</h4><ol>" + p.steps.map(function (s, i) { return "<li>" + s + (p.why && p.why[i] ? ' <span class="muted">— ' + p.why[i] + "</span>" : "") + "</li>"; }).join("") + "</ol>";
    } else if (p.type === "cloze") {
      h += "<h4>Espacio por espacio</h4><ul>" + p.blanks.map(function (b, i) { return "<li>Espacio " + (i + 1) + ": <b>" + b.a + "</b>" + (b.w ? ". " + b.w : "") + "</li>"; }).join("") + "</ul>";
    }
    h += "<h4>" + (p.type === "num" ? "Desarrollo paso a paso" : p.type === "mc" ? "Razonamiento: por qué es la correcta" : "Fundamento") + "</h4><p>" + p.f + "</p>";
    if (p.type === "mc") h += "<h4>Por qué las otras alternativas no son correctas</h4><ul>" + p.o.map(function (o, k) { return k === p.a ? "" : "<li><b>" + L[k] + ".</b> " + (p.x[k] || "") + "</li>"; }).join("") + "</ul>";
    if (p.ap) h += "<h4>Recomendación práctica en APS</h4><p>" + p.ap + "</p>";
    h += '<p class="cont"><b>Contenido evaluado:</b> ' + p.t + (p.r ? "<br><b>Fuente:</b> " + p.r : "") + "</p>";
    return h;
  }
  function refPanel() {
    if (!window.APS_REF) return null;
    var d = el("details", "refbox");
    d.innerHTML = "<summary>Tabla de referencia para los cálculos</summary>" + window.APS_REF;
    return d;
  }

  /* =================================== TEST =================================== */
  function renderTest(Q) {
    var S = build(Q), units = S.units, blocks = S.blocks, byId = S.byId;
    var KEY = "aps-casos-v2-" + Q.key;
    var st = { ans: {}, chk: {}, notes: {} };
    try { var raw = JSON.parse(localStorage.getItem(KEY) || "null"); if (raw && raw.ans && raw.chk) { st = raw; st.notes = st.notes || {}; } } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

    function answered(u) {
      var a = st.ans[u.id], t = u.p.type;
      if (a == null) return false;
      if (t === "mc") return typeof a === "number";
      if (t === "num") return String(a).trim() !== "";
      if (t === "order") return !!a.touched;
      if (t === "multi" || t === "spot") return a.some(Boolean);
      return a.every(function (v) { return v !== null && v !== "" && v !== undefined; });
    }
    function score(u) {
      var p = u.p, a = st.ans[u.id], t = p.type;
      if (!answered(u)) return 0;
      if (t === "mc") return a === p.a ? 1 : 0;
      if (t === "num") { var v = num(a); return !isNaN(v) && Math.abs(v - p.ans) <= (p.tol || 0) + 1e-9 ? 1 : 0; }
      if (t === "multi") return p.c.reduce(function (s, c, k) { return s + (!!a[k] === c ? 1 : 0); }, 0) / p.c.length;
      if (t === "spot") return p.lines.reduce(function (s, l, k) { return s + (!!a[k] === !!l.e ? 1 : 0); }, 0) / p.lines.length;
      if (t === "tf") return p.s.reduce(function (s, x, i) { return s + (a[i] === x.v ? 1 : 0); }, 0) / p.s.length;
      if (t === "match") return p.rows.reduce(function (s, r, i) { return s + (a[i] === r.r ? 1 : 0); }, 0) / p.rows.length;
      if (t === "cloze") return p.blanks.reduce(function (s, b, i) { return s + (a[i] === b.a ? 1 : 0); }, 0) / p.blanks.length;
      if (t === "order") return a.ord.reduce(function (s, v, i) { return s + (v === i ? 1 : 0); }, 0) / p.steps.length;
      return 0;
    }
    function status(u) { if (!st.chk[u.id]) return ""; var s = score(u); return s >= 0.999 ? "ok" : s > 0 ? "part" : "bad"; }
    function blockStatus(b) {
      var ss = b.ids.map(function (id) { return status(byId[id]); });
      if (ss.every(function (s) { return s === ""; })) return "";
      if (ss.some(function (s) { return s === ""; })) return "prog";
      if (ss.every(function (s) { return s === "ok"; })) return "ok";
      if (ss.every(function (s) { return s === "bad"; })) return "bad";
      return "part";
    }
    function setAns(u, v) { st.ans[u.id] = v; save(); var box = document.getElementById("u" + u.id); if (box) { var ck = box.querySelector(".ckbtn"); if (ck) ck.disabled = !answered(u); var nh = box.querySelector(".needans"); if (nh) nh.hidden = true; } }
    function blank(n, v) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }

    /* ---- renderizadores ---- */
    function rMC(u, box, review) {
      var p = u.p, a = st.ans[u.id], opts = el("div", "opts");
      p.o.forEach(function (o, k) {
        var b = el("button", "opt", "<b>" + L[k] + ".</b><span>" + o + "</span>"); b.type = "button";
        if (review) { b.disabled = true; if (k === p.a) b.classList.add("ok"); else if (a === k) b.classList.add("bad"); }
        else {
          if (a === k) b.classList.add("sel");
          b.setAttribute("aria-pressed", a === k ? "true" : "false");
          b.addEventListener("click", function () { opts.querySelectorAll(".opt").forEach(function (x) { var on = x === b; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", on ? "true" : "false"); }); setAns(u, k); });
        }
        opts.appendChild(b);
      });
      box.appendChild(opts);
    }
    function rToggle(u, box, review, items, isCorrect, cls, prefix) {
      var a = (st.ans[u.id] || blank(items.length, false)).slice(), list = el("div", cls);
      items.forEach(function (txt, k) {
        var b = el("button", "opt chk", '<b class="box" aria-hidden="true"></b><span>' + prefix(k) + txt + "</span>"); b.type = "button";
        if (a[k]) b.classList.add("sel");
        b.setAttribute("aria-pressed", a[k] ? "true" : "false");
        if (review) {
          b.disabled = true;
          if (isCorrect(k) && a[k]) b.classList.add("ok"); else if (isCorrect(k) && !a[k]) b.classList.add("sol"); else if (!isCorrect(k) && a[k]) b.classList.add("bad");
        } else {
          b.addEventListener("click", function () { a[k] = !a[k]; b.classList.toggle("sel", a[k]); b.setAttribute("aria-pressed", a[k] ? "true" : "false"); setAns(u, a.slice()); });
        }
        list.appendChild(b);
      });
      box.appendChild(list);
      if (review) box.appendChild(el("p", "legendline", '<span class="ok">■ marcada y correcta</span> <span class="sol">■ debías marcarla</span> <span class="bad">■ no debías marcarla</span>'));
    }
    function rMulti(u, box, review) { var p = u.p; box.appendChild(el("p", "hintline", "Puede haber más de una alternativa correcta.")); rToggle(u, box, review, p.o, function (k) { return p.c[k]; }, "opts", function (k) { return "<b>" + L[k] + ".</b> "; }); }
    function rSpot(u, box, review) {
      var p = u.p; box.appendChild(el("p", "hintline", "Toca las líneas que contienen un error. Puede haber más de una."));
      rToggle(u, box, review, p.lines.map(function (l) { return l.t; }), function (k) { return !!p.lines[k].e; }, "ficha", function (k) { return '<i class="ln">' + (k + 1) + "</i>"; });
    }
    function rTF(u, box, review) {
      var p = u.p, a = st.ans[u.id] || blank(p.s.length, null), list = el("div", "tfl");
      p.s.forEach(function (s, i) {
        var row = el("div", "tfr"); row.appendChild(el("p", "", "<b>" + (i + 1) + ".</b> " + s.p));
        var bs = el("div", "tfbs");
        [["V", true], ["F", false]].forEach(function (pair) {
          var b = el("button", "tfb", pair[0]); b.type = "button"; b.setAttribute("aria-label", (pair[1] ? "Verdadera" : "Falsa") + " la afirmación " + (i + 1));
          if (review) { b.disabled = true; if (pair[1] === s.v) b.classList.add(a[i] === s.v ? "ok" : "sol"); else if (a[i] === pair[1]) b.classList.add("bad"); }
          else {
            if (a[i] === pair[1]) b.classList.add("sel");
            b.addEventListener("click", function () { var cur = (st.ans[u.id] || blank(p.s.length, null)).slice(); cur[i] = pair[1]; setAns(u, cur); bs.querySelectorAll(".tfb").forEach(function (x) { x.classList.toggle("sel", x === b); }); });
          }
          bs.appendChild(b);
        });
        row.appendChild(bs);
        if (review) row.appendChild(el("p", "just " + (a[i] === s.v ? "ok" : "bad"), (a[i] === s.v ? "✔ " : "✘ ") + "<b>Es " + (s.v ? "verdadera" : "falsa") + ":</b> " + s.f));
        list.appendChild(row);
      });
      box.appendChild(list);
    }
    function rMatch(u, box, review) {
      var p = u.p, a = st.ans[u.id] || blank(p.rows.length, ""), list = el("div", "mlist");
      p.rows.forEach(function (r, i) {
        var row = el("div", "mrow"); row.appendChild(el("span", "", r.l));
        var s = el("select", "sel-in"); s.setAttribute("aria-label", "Pareja para: " + r.l.replace(/<[^>]+>/g, ""));
        s.appendChild(new Option("— elegir —", "")); p.choices.forEach(function (c) { s.appendChild(new Option(c, c)); });
        s.value = a[i] || "";
        if (review) { s.disabled = true; s.classList.add(a[i] === r.r ? "ok" : "bad"); var w = el("div", ""); w.appendChild(s); if (a[i] !== r.r) w.appendChild(el("small", "corr", "Correcta: " + r.r)); row.appendChild(w); }
        else { s.addEventListener("change", function () { var cur = (st.ans[u.id] || blank(p.rows.length, "")).slice(); cur[i] = s.value; setAns(u, cur); }); row.appendChild(s); }
        list.appendChild(row);
      });
      box.appendChild(list);
    }
    function rOrder(u, box, review) {
      var p = u.p, a = st.ans[u.id] || { ord: p.init.slice(), touched: false }, list = el("ol", "olist");
      function draw() {
        list.innerHTML = "";
        a.ord.forEach(function (si, pos) {
          var li = el("li", "orow" + (review ? (si === pos ? " ok" : " bad") : "")); li.appendChild(el("span", "otx", p.steps[si]));
          if (!review) {
            var up = el("button", "btn mini", "↑"), dn = el("button", "btn mini", "↓"); up.type = dn.type = "button";
            up.disabled = pos === 0; dn.disabled = pos === a.ord.length - 1; up.setAttribute("aria-label", "Subir"); dn.setAttribute("aria-label", "Bajar");
            up.addEventListener("click", function () { mv(pos, -1); }); dn.addEventListener("click", function () { mv(pos, 1); });
            var g = el("span", "ob"); g.appendChild(up); g.appendChild(dn); li.appendChild(g);
          }
          list.appendChild(li);
        });
      }
      function mv(pos, d) { var o = a.ord.slice(), t = o[pos]; o[pos] = o[pos + d]; o[pos + d] = t; a = { ord: o, touched: true }; setAns(u, a); draw(); }
      if (!review) box.appendChild(el("p", "hintline", "Usa las flechas ↑ ↓ para ordenar los pasos."));
      draw(); box.appendChild(list);
    }
    function rNum(u, box, review) {
      var p = u.p, a = st.ans[u.id] || "", row = el("div", "numrow");
      var inp = el("input", ""); inp.type = "text"; inp.inputMode = "decimal"; inp.value = a; inp.setAttribute("aria-label", "Respuesta numérica");
      row.appendChild(inp); if (p.unit) row.appendChild(el("span", "unit", p.unit));
      if (review) inp.disabled = true, inp.classList.add(score(u) ? "ok" : "bad");
      else { inp.addEventListener("input", function () { setAns(u, inp.value); }); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") check(u); }); row.appendChild(el("span", "hint", p.hint || "Usa coma o punto decimal")); }
      box.appendChild(row);
    }
    function rCloze(u, box, review) {
      var p = u.p, a = st.ans[u.id] || blank(p.blanks.length, "");
      var div = el("div", "cloze", p.text.replace(/\{(\d+)\}/g, function (_, i) { return '<span class="slotc" data-i="' + i + '"></span>'; }));
      div.querySelectorAll(".slotc").forEach(function (sp) {
        var i = +sp.getAttribute("data-i"), s = el("select", "sel-in"); s.setAttribute("aria-label", "Espacio " + (i + 1));
        s.appendChild(new Option("—", "")); u.p.bl[i].forEach(function (o) { s.appendChild(new Option(o, o)); }); s.value = a[i] || "";
        if (review) { s.disabled = true; s.classList.add(a[i] === p.blanks[i].a ? "ok" : "bad"); sp.appendChild(s); if (a[i] !== p.blanks[i].a) sp.appendChild(el("small", "corr inl", "→ " + p.blanks[i].a)); }
        else { s.addEventListener("change", function () { var cur = (st.ans[u.id] || blank(p.blanks.length, "")).slice(); cur[i] = s.value; setAns(u, cur); }); sp.appendChild(s); }
      });
      box.appendChild(div);
    }
    var R = { mc: rMC, multi: rMulti, spot: rSpot, tf: rTF, match: rMatch, order: rOrder, num: rNum, cloze: rCloze };

    function fbHTML(u) {
      var p = u.p, s = score(u), ok = s >= 0.999;
      var head = '<p class="key">' + (ok ? '<span class="ok">✔ Correcta</span>' : s > 0 ? '<span class="warn">◐ Parcialmente correcta: ' + pct(s) + " %</span>" : '<span class="bad">✘ Incorrecta</span>');
      if (p.type === "mc" || p.type === "num" || p.type === "multi" || p.type === "spot") head += '<br>Respuesta correcta: <span class="ok">' + keyHTML(p) + "</span>";
      if (!ok && p.type === "mc") { var a = st.ans[u.id]; head += "<br>Tu respuesta: " + L[a] + ". " + p.o[a]; }
      if (!ok && p.type === "num") head += "<br>Tu respuesta: " + fmtN(String(st.ans[u.id]).trim()) + (p.unit ? " " + p.unit : "");
      return head + "</p>" + explainHTML(p);
    }
    function check(u) {
      if (!answered(u)) { var h = document.querySelector("#u" + u.id + " .needans"); if (h) h.hidden = false; return; }
      st.chk[u.id] = 1; save(); refreshUnit(u);
    }
    function partEl(u) {
      var p = u.p, review = !!st.chk[u.id], box = el("div", "part");
      box.id = "u" + u.id;
      var lab = u.sub ? '<span class="lab">' + u.id + ")</span>" : "";
      var tags = u.sub ? ' <span class="tag">' + FMT[p.type] + "</span>" : "";
      box.appendChild(el("div", u.sub ? "pq" : "stem", lab + p.q + tags));
      if (p.ficha) box.appendChild(el("div", "fichahead", p.ficha));
      R[p.type](u, box, review);
      var acts = el("div", "acts");
      if (review) {
        var s = score(u); box.appendChild(el("div", "fb fb-" + (s >= 0.999 ? "ok" : s > 0 ? "warn" : "bad"), fbHTML(u)));
        var rt = el("button", "btn", "↺ Reintentar"); rt.type = "button";
        rt.addEventListener("click", function () { delete st.ans[u.id]; delete st.chk[u.id]; save(); refreshUnit(u); });
        acts.appendChild(rt);
      } else {
        var ck = el("button", "btn primary ckbtn", "Comprobar respuesta"); ck.type = "button"; ck.disabled = !answered(u);
        ck.addEventListener("click", function () { check(u); }); acts.appendChild(ck);
        var nh = el("span", "needans", "Completa tu respuesta antes de comprobar."); nh.hidden = true; acts.appendChild(nh);
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
      var bs = blockStatus(b), lbl = { ok: "Correcta", bad: "Incorrecta", part: "Con errores", prog: "En curso" }[bs];
      if (lbl) h.appendChild(el("span", "state " + (bs === "prog" ? "" : bs === "part" ? "warn" : bs), lbl));
      return h;
    }
    function blockEl(b) {
      var it = b.it, card = el("article", "q"); card.id = "q" + b.num;
      var bs = blockStatus(b); if (bs === "ok" || bs === "bad") card.classList.add(bs); if (bs === "part") card.classList.add("pt");
      card.appendChild(headEl(b));
      if (b.isCase) { card.appendChild(el("h3", "ctitle", it.title)); card.appendChild(el("div", "casebox", it.html)); }
      b.ids.forEach(function (id) { card.appendChild(partEl(byId[id])); });
      if (b.isCase) {
        var nd = el("details", "notes"); nd.open = !!st.notes[b.num];
        nd.appendChild(el("summary", "", "Espacio de desarrollo: cálculos y justificación"));
        var ta = el("textarea", ""); ta.rows = 4; ta.value = st.notes[b.num] || ""; ta.placeholder = "Escribe aquí tus cálculos y la justificación de tus decisiones. Se guarda en este navegador.";
        ta.setAttribute("aria-label", "Espacio de desarrollo del ítem " + b.num);
        ta.addEventListener("input", function () { if (ta.value) st.notes[b.num] = ta.value; else delete st.notes[b.num]; save(); });
        nd.appendChild(ta); card.appendChild(nd);
      }
      return card;
    }
    function refreshUnit(u) {
      var old = document.getElementById("u" + u.id); if (old) old.replaceWith(partEl(u));
      var b = blocks[u.num - 1], card = document.getElementById("q" + b.num);
      if (card) { card.classList.remove("ok", "bad", "pt"); var bs = blockStatus(b); if (bs === "ok" || bs === "bad") card.classList.add(bs); if (bs === "part") card.classList.add("pt"); card.querySelector(".qh").replaceWith(headEl(b)); }
      renderBar(); renderMap(); renderSummary();
    }

    var main = document.getElementById("main"), gridEl = document.getElementById("grid"), filter = "all";
    document.title = Q.docTitle;
    document.getElementById("hero").innerHTML = '<div class="wrap"><div class="kicker">' + Q.module + " · Programas de APS · Nutrición y Dietética UCM</div><h1>" + Q.title + "</h1><p>" + Q.subtitle + '</p><div class="chips">' + Q.chips.map(function (c) { return "<span>" + c + "</span>"; }).join("") + "<span>Botón «Comprobar» en cada ítem</span></div></div>";

    function totals() {
      var pts = 0, done = 0;
      units.forEach(function (u) { if (st.chk[u.id]) { done++; pts += score(u); } });
      var max = units.length, r = pts / max, nota = r < 0.6 ? 1 + 3 * r / 0.6 : 4 + 3 * (r - 0.6) / 0.4;
      return { pts: Math.round(pts * 10) / 10, max: max, done: done, pct: done ? Math.round(pts * 1000 / done) / 10 : null, nota: Math.round(nota * 10) / 10 };
    }
    function renderBar() {
      var T = totals();
      document.getElementById("stats").innerHTML = "<span><b>" + T.done + "/" + T.max + "</b> comprobados</span><span><b>" + fmtN(T.pts) + "</b> puntos</span><span><b>" + (T.pct == null ? "—" : fmtN(T.pct) + " %") + "</b> logro</span><span><b>" + (T.done ? fmtN(T.nota.toFixed(1)) : "—") + "</b> nota (60 %)</span>";
      document.getElementById("track").style.width = (T.done * 100 / T.max) + "%";
    }
    function visible(b) {
      var bs = blockStatus(b);
      if (filter === "pend") return bs === "" || bs === "prog";
      if (filter === "bad") return b.ids.some(function (id) { var s = status(byId[id]); return s === "bad" || s === "part"; });
      return true;
    }
    function renderMap() {
      gridEl.innerHTML = "";
      blocks.forEach(function (b) {
        var bs = blockStatus(b), n = el("button", "n" + (bs ? " " + ({ ok: "ok", bad: "bad", part: "part", prog: "part" }[bs]) : ""), String(b.num)); n.type = "button";
        n.title = "Ítem " + b.num + (b.isCase ? " · " + b.it.kind : "");
        n.addEventListener("click", function () { if (!visible(b)) setFilter("all"); var t = document.getElementById("q" + b.num); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); });
        gridEl.appendChild(n);
      });
    }
    var sumEl = el("details", "result summary");
    function renderSummary() {
      var T = totals(), open = sumEl.open, head = "<summary>Hoja de respuestas y resultados (" + T.done + " de " + T.max + " comprobados)</summary>";
      if (!T.done) { sumEl.innerHTML = head + "<p>Aún no has comprobado ítems. Aquí se irá llenando tu hoja de respuestas.</p>"; sumEl.open = open; return; }
      var areas = {};
      units.forEach(function (u) {
        if (!st.chk[u.id]) return;
        var ar = u.p.t.split(":")[0].trim(); if (!areas[ar]) areas[ar] = { pts: 0, max: 0, ids: [] };
        var s = score(u); areas[ar].max++; areas[ar].pts += s; if (s < 0.999) areas[ar].ids.push(u.id);
      });
      var weak = Object.keys(areas).filter(function (k) { return areas[k].ids.length; }).sort(function (a, b) { return areas[a].pts / areas[a].max - areas[b].pts / areas[b].max; });
      sumEl.innerHTML = head + '<div class="kpis"><div><b>' + fmtN(T.pts) + " / " + T.done + "</b><span>puntos en lo comprobado</span></div><div><b>" + fmtN(T.pct) + ' %</b><span>logro</span></div><div><b class="nota ' + (T.nota >= 4 ? "ok" : "bad") + '">' + fmtN(T.nota.toFixed(1)) + "</b><span>nota sobre el total (" + T.max + " ítems, exigencia 60 %)</span></div></div>" +
        "<h3>Contenidos que debes reforzar</h3>" + (weak.length ? "<ul class='weak'>" + weak.map(function (k) { var A = areas[k]; return "<li><b>" + k + "</b> — " + Math.round(A.pts * 100 / A.max) + " % de logro · ítems " + A.ids.map(function (id) { return '<a href="#u' + id + '">' + id + "</a>"; }).join(", ") + "</li>"; }).join("") + "</ul>" : "<p>Sin errores en lo comprobado.</p>") +
        "<h3>Hoja de respuestas</h3><div class='tbl'><table><thead><tr><th>Ítem</th><th>Formato</th><th>Contenido evaluado</th><th>Puntaje</th><th>Resultado</th></tr></thead><tbody>" +
        units.map(function (u) {
          if (!st.chk[u.id]) return '<tr><td><a href="#u' + u.id + '">' + u.id + "</a></td><td>" + FMT[u.p.type] + "</td><td>" + u.p.t + "</td><td>—</td><td>Pendiente</td></tr>";
          var s = score(u), r = s >= 0.999 ? "Correcta" : s > 0 ? "Parcial" : "Incorrecta", c = s >= 0.999 ? "ok" : s > 0 ? "warn" : "bad";
          return '<tr><td><a href="#u' + u.id + '">' + u.id + "</a></td><td>" + FMT[u.p.type] + "</td><td>" + u.p.t + "</td><td>" + pct(s) + ' %</td><td class="' + c + '">' + r + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      sumEl.open = open;
    }
    function renderAll() {
      main.innerHTML = "";
      var rp = refPanel(); if (rp) main.appendChild(rp);
      var shown = 0, lastSec = null;
      blocks.forEach(function (b) {
        var sec = b.it.sec || null;
        if (!visible(b)) { if (sec) lastSec = sec; return; }
        if (sec && sec !== lastSec && filter === "all") { main.appendChild(el("h2", "sec", sec)); if (b.it.secnote) main.appendChild(el("p", "secintro", b.it.secnote)); }
        if (sec) lastSec = sec;
        main.appendChild(blockEl(b)); shown++;
      });
      if (!shown) main.appendChild(el("p", "empty", "No hay ítems en este filtro."));
      renderSummary(); main.appendChild(sumEl); renderBar(); renderMap();
    }
    function setFilter(f) { filter = f; document.querySelectorAll(".f[data-f]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-f") === f ? "true" : "false"); }); renderAll(); }
    document.querySelectorAll(".f[data-f]").forEach(function (b) { b.addEventListener("click", function () { setFilter(b.getAttribute("data-f")); }); });
    document.getElementById("reset").addEventListener("click", function () {
      var old = document.querySelector(".confirm"); if (old) { old.remove(); return; }
      var box = el("div", "confirm"); box.innerHTML = "<h3>¿Borrar todas tus respuestas y notas de este módulo?</h3><p>Podrás comenzar de nuevo desde cero.</p>";
      var row = el("div", "acts"), ok = el("button", "btn primary", "Sí, borrar todo"), no = el("button", "btn", "Cancelar"); ok.type = no.type = "button";
      ok.addEventListener("click", function () { st = { ans: {}, chk: {}, notes: {} }; save(); renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      no.addEventListener("click", function () { box.remove(); });
      row.appendChild(ok); row.appendChild(no); box.appendChild(row); main.insertBefore(box, main.firstChild); box.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    document.getElementById("printBtn").addEventListener("click", function () { sumEl.open = true; window.print(); });
    renderAll();
  }

  /* =================================== PAUTA =================================== */
  function keyBlockHTML(p) {
    if (p.type === "mc") return '<div class="opts">' + p.o.map(function (o, j) { return '<div class="opt' + (j === p.a ? " ok" : "") + '"><b>' + L[j] + ".</b><span>" + o + "</span></div>"; }).join("") + "</div>";
    if (p.type === "multi") return '<div class="opts">' + p.o.map(function (o, j) { return '<div class="opt' + (p.c[j] ? " ok" : "") + '"><b>' + L[j] + ".</b><span>" + o + "</span></div>"; }).join("") + "</div>";
    if (p.type === "spot") return '<div class="ficha">' + p.lines.map(function (l, j) { return '<div class="opt chk' + (l.e ? " bad" : "") + '"><b class="box"></b><span><i class="ln">' + (j + 1) + "</i>" + l.t + "</span></div>"; }).join("") + "</div>";
    if (p.type === "cloze") { var i = 0; return '<div class="cloze">' + p.text.replace(/\{(\d+)\}/g, function (_, k) { return '<b class="fillk">' + p.blanks[k].a + "</b>"; }) + "</div>"; }
    return "";
  }
  function renderPauta() {
    var main = document.getElementById("main"), Z = window.QUIZZES || {}, order = ["t1", "t2", "t3"];
    var toc = el("nav", "ptoc"); toc.setAttribute("aria-label", "Módulos de la pauta");
    order.forEach(function (k) { if (!Z[k]) return; var a = el("a", "", Z[k].module + " · " + Z[k].short); a.href = "#p-" + k; toc.appendChild(a); });
    main.appendChild(toc);
    order.forEach(function (k) {
      var Q = Z[k]; if (!Q) return;
      var S = build(Q), sec = el("section", "pmod"); sec.id = "p-" + k;
      sec.appendChild(el("h2", "sec", Q.module + " · " + Q.title));
      var sheet = el("details", "pauta"); sheet.open = true; sheet.innerHTML = "<summary>Hoja de respuestas · " + Q.module + "</summary>";
      var g = el("div", "pgrid wide");
      S.units.forEach(function (u) { g.appendChild(el("span", "", '<a href="#p' + k + "-" + u.id + '">' + u.id + "</a> <small>" + FMT[u.p.type] + "</small> <b>" + keyHTML(u.p) + "</b>")); });
      sheet.appendChild(g); sec.appendChild(sheet);
      var lastSec = null;
      S.blocks.forEach(function (b) {
        if (b.it.sec && b.it.sec !== lastSec) { sec.appendChild(el("h3", "psec", b.it.sec)); lastSec = b.it.sec; }
        var card = el("article", "q pq-card"), hd = el("div", "qh");
        hd.appendChild(el("span", "num", String(b.num))); hd.appendChild(el("span", "tag", b.isCase ? b.it.kind : FMT[S.byId[b.ids[0]].p.type])); if (b.it.stage) hd.appendChild(el("span", "tag stage", b.it.stage));
        card.appendChild(hd);
        if (b.isCase) { card.appendChild(el("h3", "ctitle", b.it.title)); var cw = el("details", "casewrap"); cw.innerHTML = "<summary>Ver antecedentes</summary>"; cw.appendChild(el("div", "casebox", b.it.html)); card.appendChild(cw); }
        b.ids.forEach(function (id) {
          var u = S.byId[id], p = u.p, box = el("div", "part"); box.id = "p" + k + "-" + u.id;
          box.appendChild(el("div", u.sub ? "pq" : "stem", (u.sub ? '<span class="lab">' + u.id + ")</span>" : "") + p.q + ' <span class="tag">' + FMT[p.type] + "</span>"));
          if (p.ficha) box.appendChild(el("div", "fichahead", p.ficha));
          var kb = keyBlockHTML(p); if (kb) box.appendChild(el("div", "", kb));
          var top = (p.type === "mc" || p.type === "num" || p.type === "multi" || p.type === "spot" || p.type === "tf") ? '<p class="key">Respuesta correcta: <span class="ok">' + keyHTML(p) + "</span></p>" : "";
          box.appendChild(el("div", "fb fb-ok", top + explainHTML(p)));
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

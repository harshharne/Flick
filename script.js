(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- The pack ---------- */
  // w = how often the face lands up (an estimate). A blank face doesn't lock.
  var DEFAULT = [
    { k: "front", pos: "Front", title: "Breathe", text: "In for four. Out for six. Five times.", w: 35, rx: 0, ry: 0 },
    { k: "back", pos: "Back", title: "Wait", text: "Four minutes. Then decide.", w: 35, rx: 0, ry: 180 },
    { k: "right", pos: "Side", title: "Walk", text: "The long way to anywhere.", w: 12, rx: 0, ry: -90 },
    { k: "left", pos: "Side", title: "Water", text: "One glass. Small sips.", w: 12, rx: 0, ry: 90 },
    { k: "top", pos: "End", title: "Call", text: "Ring someone. Say anything.", w: 3, rx: -90, ry: 0 },
    { k: "bottom", pos: "End", title: "", text: "", w: 3, rx: 90, ry: 0, blank: true, fixed: true }
  ];

  function tf(y, rx, ry) { return "translateY(" + y + "px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)"; }
  function ahead(target, cur, turns) { var t = target; while (t < cur + 360 * turns) t += 360; return t; }

  function Pack(el, faces) { this.el = el; this.faces = faces; this.x = 0; this.y = 0; this.render(); }
  Pack.prototype.render = function () {
    this.el.innerHTML = this.faces.map(function (f) {
      var title = f.blank ? "Your call" : esc(f.title);
      return '<div class="face f-' + f.k + (f.blank ? " blank" : "") + '"><span class="brand">Flick</span>' +
        '<b class="t' + (!f.blank && f.title.length > 7 ? " long" : "") + '">' + title + "</b>" +
        '<span class="x">' + (f.blank ? "Opens straight away." : esc(f.text)) + "</span></div>";
    }).join("");
    this.el.style.transform = tf(0, this.x, this.y);
  };
  Pack.prototype.pick = function () {
    var total = this.faces.reduce(function (s, f) { return s + f.w; }, 0), r = Math.random() * total;
    for (var i = 0; i < this.faces.length; i++) { r -= this.faces[i].w; if (r < 0) return this.faces[i]; }
    return this.faces[0];
  };
  Pack.prototype.toss = function (done) {
    var self = this, f = this.pick();
    var nx = ahead(f.rx, this.x, 2), ny = ahead(f.ry, this.y, 1);
    function finish() { self.x = nx; self.y = ny; self.el.style.transform = tf(0, nx, ny); done(f); }
    if (reduce || !this.el.animate) { finish(); return; }
    var a = this.el.animate([
      { transform: tf(0, this.x, this.y) },
      { transform: tf(-175, (this.x + nx) / 2, (this.y + ny) / 2), offset: 0.45 },
      { transform: tf(8, nx - 4, ny), offset: 0.88 },
      { transform: tf(0, nx, ny) }
    ], { duration: 1150, easing: "cubic-bezier(.25,.6,.35,1)" });
    a.onfinish = finish;
  };

  /* ---------- Hero pack ---------- */
  (function () {
    var el = $("pack-hero"), btn = $("toss-hero"), out = $("out-hero");
    if (!el || !btn) return;
    var p = new Pack(el, DEFAULT);
    btn.addEventListener("click", function () {
      btn.disabled = true; out.textContent = "";
      p.toss(function (f) {
        btn.disabled = false; btn.textContent = "Toss again";
        out.innerHTML = f.blank
          ? "Face up: <b>Your call.</b> A blank face doesn't lock."
          : "Face up: <b>" + esc(f.title) + ".</b> " + esc(f.text) + " The lid locks for four minutes.";
      });
    });
  })();

  /* ---------- Prototype: the pack and the app, wired together ---------- */
  (function () {
    var packEl = $("pack-proto"), screen = $("app-screen");
    if (!packEl || !screen) return;

    var S = {
      faces: DEFAULT.map(function (f) { var o = {}; for (var k in f) o[k] = f[k]; return o; }),
      shelf: [
        { title: "Stairs", text: "Count them. All of them.", by: "day 212" },
        { title: "Orange", text: "Peel one. Slowly.", by: "day 40" },
        { title: "Sky", text: "Send someone a photo of it.", by: "day 365" }
      ],
      log: [], tab: "pack", going: false, unread: false
    };
    var GATE = { title: "Gate", text: "Walk to the gate with Ankit first." };
    var SKIN = { pack: "red", shelf: "blue", today: "ink", pattern: "blue glow", circle: "yellow" };

    var pack = new Pack(packEl, S.faces);
    var view = $("app-view"), sheet = $("app-sheet"), tabs = $("app-tabs");
    var btn = $("toss-proto"), out = $("out-proto"), hold = $("hold"), holdT = $("hold-t"), holdBar = $("hold-bar"), choice = $("choice");
    var landed = null, pending = null, editing = -1;

    function onCount() { return S.faces.filter(function (f) { return !f.blank; }).length; }

    var V = {
      pack: function () {
        return '<p class="ph-sub">Tap a face to rewrite or retire it.</p><p class="ph-h">Your pack</p><div class="ph-rows">' +
          S.faces.map(function (f, i) {
            return '<button type="button" data-act="edit" data-i="' + i + '"' + (f.blank ? ' class="dim"' : "") + "><span>" + f.pos +
              "</span><b>" + (f.blank ? "Your call" : esc(f.title)) + "</b></button>";
          }).join("") +
          '</div><div class="ph-card"><b>' + onCount() + " instructions on</b><span>Blank faces don't lock.</span></div>";
      },
      shelf: function () {
        return '<p class="ph-h">Toss me one</p><p class="ph-sub">Left by people who quit.</p>' +
          S.shelf.map(function (it, i) {
            return '<div class="ph-card"><b>' + esc(it.title) + "</b><span>" + esc(it.text) + "</span><div><span>" + esc(it.by) +
              '</span><button type="button" class="mini" data-act="take" data-i="' + i + '">Take</button></div></div>';
          }).join("") +
          '<form class="leave"><label class="sr" for="leave-text">Leave an instruction</label>' +
          '<input id="leave-text" maxlength="44" autocomplete="off" placeholder="Leave one line for the next person">' +
          '<button class="mini dark" type="submit">Leave</button></form><p class="err" id="leave-err" hidden>Write a line first.</p>';
      },
      today: function () {
        var slip = S.log.some(function (e) { return e.took; });
        return '<p class="ph-sub">Logged by the pack</p><p class="ph-h">Today</p><p class="ph-num"><b>' + S.log.length + "</b>" +
          (S.log.length === 1 ? "toss" : "tosses") + '</p><div class="ph-rows">' +
          (S.log.length ? S.log.slice(0, 5).map(function (e) {
            return "<div><span>" + e.t + "</span><b>" + esc(e.title) + "</b><em" + (e.took ? ' class="slip"' : "") + ">" + (e.took ? "opened" : "left shut") + "</em></div>";
          }).join("") : '<div class="dim"><span>Toss the pack. It logs itself.</span></div>') + "</div>" +
          (slip ? '<div class="ph-card"><b>Opening it is information.</b><span>It goes on your map, not on a streak.</span></div>' : "");
      },
      pattern: function () {
        var by = {}, order = [];
        S.log.forEach(function (e) {
          if (!by[e.title]) { by[e.title] = { n: 0, left: 0 }; order.push(e.title); }
          by[e.title].n++; if (!e.took) by[e.title].left++;
        });
        return '<p class="ph-sub">Sample week</p><p class="ph-h">4 pm is your hour</p>' +
          '<div class="bars" aria-hidden="true"><i style="height:22%"></i><i style="height:38%"></i><i style="height:30%"></i><i style="height:52%"></i><i class="hot" style="height:100%"></i><i style="height:44%"></i><i style="height:26%"></i><i style="height:60%"></i></div>' +
          '<div class="bar-ax"><span>10 am</span><span>4 pm</span><span>10 pm</span></div>' +
          '<p class="ph-lab">From your tosses</p><div class="ph-rows">' +
          (order.length ? order.map(function (t) {
            return "<div><span>" + esc(t) + "</span><b>left shut " + by[t].left + " of " + by[t].n + "</b></div>";
          }).join("") : '<div class="dim"><span>Nothing yet. Toss the pack.</span></div>') + "</div>";
      },
      circle: function () {
        return '<p class="ph-h">Chai at 4?</p><p class="ph-sub">Your circle knows you quit.</p>' +
          '<div class="faces"><span>A</span><span>M</span><span>S</span>' + (S.going ? "<span>You</span>" : "") + "<em>" + (S.going ? 4 : 3) + " going</em></div>" +
          '<div class="ph-card"><span>Ankit tossed you one</span><b>' + GATE.title + "</b><span>" + GATE.text + "</span>" +
          '<div><span></span><button type="button" class="mini dark" data-act="take-gate">Put it on a face</button></div></div>' +
          '<button type="button" class="ph-btn" data-act="going">' + (S.going ? "You're in" : "I'm in") + "</button>";
      }
    };

    function render() {
      screen.className = "screen " + SKIN[S.tab];
      view.innerHTML = V[S.tab]();
      view.scrollTop = 0;
      Array.prototype.forEach.call(tabs.children, function (b) {
        var name = b.getAttribute("data-tab"), on = name === S.tab;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.classList.toggle("new", name === "today" && S.unread && !on);
      });
    }

    function openEdit(i) {
      var f = S.faces[i]; editing = i; pending = null;
      sheet.innerHTML = f.fixed
        ? '<p class="sh-lab">' + f.pos + ' face</p><p class="sh-h">Always yours</p><p>This face stays blank. Land on it and the pack just opens.</p>' +
          '<button type="button" class="ph-btn" data-act="close">Close</button>'
        : '<p class="sh-lab">' + f.pos + " face</p>" +
          '<label for="f-title">Name</label><input id="f-title" maxlength="10" autocomplete="off" value="' + esc(f.blank ? "" : f.title) + '">' +
          '<label for="f-text">Instruction</label><textarea id="f-text" maxlength="44" rows="2">' + esc(f.blank ? "" : f.text) + "</textarea>" +
          '<p class="err" id="f-err" hidden>Give it a name and one line.</p>' +
          '<button type="button" class="ph-btn" data-act="save">Save to pack</button>' +
          (f.blank ? "" : '<button type="button" class="ph-ghost warn" data-act="retire">Retire this face</button>') +
          '<button type="button" class="ph-ghost" data-act="close">Cancel</button>';
      sheet.hidden = false;
    }
    function openPlace(item) {
      pending = item; editing = -1;
      sheet.innerHTML = '<p class="sh-lab">Put it on</p><p class="sh-h">' + esc(item.title) + '</p><div class="place">' +
        S.faces.map(function (f, i) {
          return f.fixed ? "" : '<button type="button" data-act="place" data-i="' + i + '"><span>' + f.pos + "</span><b>" + (f.blank ? "blank" : esc(f.title)) + "</b></button>";
        }).join("") + '</div><button type="button" class="ph-ghost" data-act="close">Cancel</button>';
      sheet.hidden = false;
    }
    function closeSheet() { sheet.hidden = true; sheet.innerHTML = ""; }
    function setFace(i, title, text) {
      var f = S.faces[i]; f.title = title; f.text = text; f.blank = false; pack.render();
    }

    screen.addEventListener("click", function (e) {
      var t = e.target.closest("[data-act],[data-tab]");
      if (!t) return;
      if (t.hasAttribute("data-tab")) {
        S.tab = t.getAttribute("data-tab");
        if (S.tab === "today") S.unread = false;
        closeSheet(); render(); return;
      }
      var act = t.getAttribute("data-act"), i = parseInt(t.getAttribute("data-i"), 10);
      if (act === "edit") openEdit(i);
      else if (act === "close") closeSheet();
      else if (act === "save") {
        var ti = $("f-title").value.trim(), tx = $("f-text").value.trim();
        if (!ti || !tx) { $("f-err").hidden = false; return; }
        setFace(editing, ti, tx); closeSheet(); render();
      }
      else if (act === "retire") { S.faces[editing].blank = true; pack.render(); closeSheet(); render(); }
      else if (act === "take") openPlace(S.shelf[i]);
      else if (act === "take-gate") openPlace(GATE);
      else if (act === "place") { setFace(i, pending.title, pending.text); closeSheet(); S.tab = "pack"; render(); }
      else if (act === "going") { S.going = !S.going; render(); }
    });
    screen.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("leave-text"), val = input ? input.value.trim() : "";
      if (!val) { $("leave-err").hidden = false; return; }
      S.shelf.unshift({ title: "Yours", text: val, by: "day 0, you" });
      render();
    });
    screen.addEventListener("input", function (e) {
      var err = e.target.id === "leave-text" ? $("leave-err") : $("f-err");
      if (err) err.hidden = true;
    });

    function stamp() {
      var d = new Date(), h = d.getHours(), m = d.getMinutes();
      return ((h % 12) || 12) + ":" + (m < 10 ? "0" : "") + m;
    }
    function openUp(blank) {
      out.innerHTML = blank ? "Face up: <b>Your call.</b> A blank face doesn't lock." : "<b>Click.</b> The pack is open. Your call.";
      btn.hidden = true; choice.hidden = false;
    }
    btn.addEventListener("click", function () {
      btn.disabled = true; out.textContent = "";
      pack.toss(function (f) {
        landed = f;
        if (f.blank) { openUp(true); return; }
        out.innerHTML = "Face up: <b>" + esc(f.title) + ".</b> " + esc(f.text);
        btn.textContent = "Locked";
        holdT.textContent = "4:00"; holdBar.style.width = "100%"; hold.hidden = false;
        var t0 = Date.now(), DUR = 6000;
        var id = setInterval(function () {
          var p = Math.min(1, (Date.now() - t0) / DUR), left = Math.ceil(240 * (1 - p));
          holdT.textContent = Math.floor(left / 60) + ":" + ("0" + (left % 60)).slice(-2);
          holdBar.style.width = (100 - p * 100) + "%";
          if (p >= 1) { clearInterval(id); hold.hidden = true; openUp(false); }
        }, 100);
      });
    });
    choice.addEventListener("click", function (e) {
      var b = e.target.closest("[data-out]");
      if (!b || !landed) return;
      var took = b.getAttribute("data-out") === "took";
      S.log.unshift({ t: stamp(), title: landed.blank ? "Your call" : landed.title, took: took });
      choice.hidden = true; btn.hidden = false; btn.disabled = false; btn.textContent = "Toss again";
      out.textContent = took ? "Logged: opened. That goes on the map." : "Logged: left it shut.";
      S.unread = S.tab !== "today";
      render();
    });

    render();
  })();

  /* ---------- Word map ---------- */
  var svg = $("map");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";
  function add(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    svg.appendChild(e); return e;
  }
  var HUBS = [
    { label: "Toss", pos: "verb", x: 200, plain: ["coin", "luck", "odds", "gesture", "gamble", "catch"], kept: ["chance", "flick", "decide", "pass"] },
    { label: "Withdrawal", pos: "noun", x: 600, plain: ["nicotine", "irritable", "hunger", "sleep", "the break", "day three"], kept: ["craving", "restless hands", "the circle"] },
    { label: "Instructive", pos: "adjective", x: 1000, plain: ["lesson", "command", "recipe", "pattern", "pictogram", "plan"], kept: ["warning", "script", "invitation"] }
  ];
  var MEETS = [
    { label: "Just one", sub: "the craving bargains", x: 140, y: 356, from: ["chance", "craving"] },
    { label: "Which, never whether", sub: "chance picks the instruction", x: 372, y: 356, from: ["decide", "invitation"] },
    { label: "Toss me one", sub: "smokers share", x: 600, y: 356, from: ["pass", "the circle"] },
    { label: "Knowing isn't doing", sub: "everyone has read the pack", x: 824, y: 356, from: ["warning", "craving"] },
    { label: "The old script", sub: "reach, light, inhale, flick", x: 1050, y: 356, from: ["flick", "restless hands", "script"] }
  ];
  var CORE = { x: 600, y: 510 };
  var at = {};

  HUBS.forEach(function (h) {
    h.plain.forEach(function (w, i) { at[w] = { x: h.x + (i % 3 - 1) * 122, y: 150 + Math.floor(i / 3) * 30 }; });
    var n = h.kept.length, gap = n === 4 ? 82 : 128;
    h.kept.forEach(function (w, i) { at[w] = { x: h.x + (i - (n - 1) / 2) * gap, y: 222, on: true }; });
  });

  function curve(x1, y1, x2, y2) {
    var m = (y2 - y1) / 2;
    return "M" + x1 + " " + y1 + "C" + x1 + " " + (y1 + m) + " " + x2 + " " + (y2 - m) + " " + x2 + " " + y2;
  }
  MEETS.forEach(function (m) {
    m.from.forEach(function (w) { add("path", { "class": "ln", d: curve(at[w].x, at[w].y + 9, m.x, m.y - 19) }); });
    add("path", { "class": "ln2", d: curve(m.x, m.y + 42, CORE.x, CORE.y - 24) });
  });
  HUBS.forEach(function (h) {
    add("text", { "class": "hub", x: h.x, y: 78, "text-anchor": "middle" }, h.label);
    add("text", { "class": "pos", x: h.x, y: 104, "text-anchor": "middle" }, h.pos);
    h.plain.concat(h.kept).forEach(function (w) {
      add("text", { "class": "w" + (at[w].on ? " on" : ""), x: at[w].x, y: at[w].y, "text-anchor": "middle" }, w);
    });
  });
  MEETS.forEach(function (m) {
    var w = m.label.length * 8.4 + 34;
    add("rect", { "class": "pill", x: m.x - w / 2, y: m.y - 19, width: w, height: 38, rx: 19 });
    add("text", { "class": "pill-t", x: m.x, y: m.y + 5, "text-anchor": "middle" }, m.label);
    add("text", { "class": "sub", x: m.x, y: m.y + 33, "text-anchor": "middle" }, m.sub);
  });
  add("rect", { "class": "core", x: CORE.x - 130, y: CORE.y - 24, width: 260, height: 48, rx: 24 });
  add("text", { "class": "core-t", x: CORE.x, y: CORE.y + 7, "text-anchor": "middle" }, "The craving minute");
})();

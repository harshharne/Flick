(function () {
  "use strict";

  /* ---------- The pack ---------- */
  // w = how often the face lands up (estimate). until = last day the instruction is on.
  var FACES = [
    { k: "front", title: "Breathe", text: "In for four. Out for six. Five times.", w: 35, rx: 0, ry: 0, until: 28 },
    { k: "back", title: "Wait", text: "Four minutes. Then decide.", w: 35, rx: 0, ry: 180, until: 28 },
    { k: "right", title: "Walk", text: "The long way to anywhere.", w: 12, rx: 0, ry: -90, until: 21 },
    { k: "left", title: "Water", text: "One glass. Small sips.", w: 12, rx: 0, ry: 90, until: 7 },
    { k: "top", title: "Call", text: "Ring someone. Say anything.", w: 3, rx: -90, ry: 0, until: 14 },
    { k: "bottom", title: "Your call", text: "This face is always yours.", w: 3, rx: 90, ry: 0, until: 0 }
  ];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isBlank(f, day) { return day > f.until; }

  function Pack(el, day) {
    this.el = el; this.x = 0; this.y = 0; this.day = day;
    this.render();
  }
  Pack.prototype.render = function () {
    var day = this.day;
    this.el.innerHTML = FACES.map(function (f) {
      var blank = isBlank(f, day);
      return '<div class="face f-' + f.k + (blank ? " blank" : "") + '">' +
        '<span class="brand">Flick</span>' +
        '<b class="t">' + (blank ? "Your call" : f.title) + "</b>" +
        '<span class="x">' + (blank ? "The pack doesn't decide this one." : f.text) + "</span></div>";
    }).join("");
    this.el.style.transform = tf(0, this.x, this.y);
  };
  function tf(y, rx, ry) { return "translateY(" + y + "px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)"; }
  function ahead(target, cur, turns) { var t = target; while (t < cur + 360 * turns) t += 360; return t; }
  function pick() {
    var r = Math.random() * 100;
    for (var i = 0; i < FACES.length; i++) { r -= FACES[i].w; if (r < 0) return FACES[i]; }
    return FACES[0];
  }
  Pack.prototype.toss = function (done) {
    var self = this, f = pick();
    var nx = ahead(f.rx, this.x, 2), ny = ahead(f.ry, this.y, 1);
    function finish() {
      self.x = nx; self.y = ny;
      self.el.style.transform = tf(0, nx, ny);
      done(f, isBlank(f, self.day));
    }
    if (reduce || !this.el.animate) { finish(); return; }
    var a = this.el.animate([
      { transform: tf(0, this.x, this.y) },
      { transform: tf(-175, (this.x + nx) / 2, (this.y + ny) / 2), offset: 0.45 },
      { transform: tf(8, nx - 4, ny), offset: 0.88 },
      { transform: tf(0, nx, ny) }
    ], { duration: 1150, easing: "cubic-bezier(.25,.6,.35,1)" });
    a.onfinish = finish;
  };

  function wire(packId, btnId, outId, day, onLand) {
    var el = document.getElementById(packId), btn = document.getElementById(btnId), out = document.getElementById(outId);
    if (!el || !btn) return null;
    var p = new Pack(el, day);
    btn.addEventListener("click", function () {
      btn.disabled = true; out.textContent = "";
      p.toss(function (f, blank) {
        btn.disabled = false; btn.textContent = "Toss again";
        out.innerHTML = blank
          ? "Face up: <b>Your call.</b> The pack doesn't decide this one."
          : "Face up: <b>" + f.title + ".</b> " + f.text;
        if (onLand) onLand(f, blank);
      });
    });
    return p;
  }

  wire("pack-hero", "toss-hero", "out-hero", 3);

  /* ---------- Prototype: pack + phone + day ---------- */
  var log = document.getElementById("p-log"), count = document.getElementById("p-count");
  var dayIn = document.getElementById("day"), dayOut = document.getElementById("day-out");
  var dayNote = document.getElementById("day-note"), pDay = document.getElementById("p-day"), pLeft = document.getElementById("p-left");
  var entries = [];

  function clock() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    return ((h % 12) || 12) + ":" + (m < 10 ? "0" : "") + m;
  }
  var proto = wire("pack-proto", "toss-proto", "out-proto", 3, function (f, blank) {
    entries.unshift({ t: clock(), name: blank ? "Your call" : f.title });
    count.textContent = entries.length;
    log.innerHTML = entries.slice(0, 4).map(function (e) {
      return "<div><span>" + e.t + "</span><b>" + e.name + "</b></div>";
    }).join("");
  });

  var NOTES = [
    [7, "Week 1. All five instructions are on."],
    [14, "Week 2. Water has retired."],
    [21, "Week 3. Water and Call have retired."],
    [28, "Week 4. Only Breathe and Wait are left."]
  ];
  function setDay() {
    var d = parseInt(dayIn.value, 10);
    dayOut.textContent = d; pDay.textContent = d;
    for (var i = 0; i < NOTES.length; i++) { if (d <= NOTES[i][0]) { dayNote.textContent = NOTES[i][1]; break; } }
    var on = FACES.filter(function (f) { return !isBlank(f, d); }).length;
    pLeft.textContent = on + " instructions on";
    proto.day = d; proto.render();
  }
  if (dayIn && proto) { dayIn.addEventListener("input", setDay); setDay(); }

  /* ---------- Word map ---------- */
  var svg = document.getElementById("map");
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

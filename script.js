(function () {
  "use strict";

  // The starter set. `retires` is the last day the face is active.
  // Schedule follows the 2–4 week withdrawal arc; it is a design proposal, not per-symptom data.
  var FACES = [
    {
      id: "f1", name: "Breathe", for: "Craving",
      text: "Breathe in slowly for four counts, out for six. Five rounds, the rhythm of a long drag.",
      retires: 28,
      icon: '<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>'
    },
    {
      id: "f2", name: "Walk", for: "Restlessness",
      text: "Walk to the water cooler and back, the long way round.",
      retires: 21,
      icon: '<circle cx="13" cy="4.5" r="1.6"/><path d="M12 8l-3 4 3 2-1 7"/><path d="M12 8l3 4h3"/><path d="M9 12l-3 1"/><path d="M12 14l3 3v4"/>'
    },
    {
      id: "f3", name: "Wait", for: "Bargaining",
      text: "Set a four-minute timer. Decide when it rings, not before.",
      retires: 28,
      icon: '<path d="M7 3h10M7 21h10"/><path d="M8 3v3l4 6-4 6v3"/><path d="M16 3v3l-4 6 4 6v3"/>'
    },
    {
      id: "f4", name: "Call", for: "Social withdrawal",
      text: "Call someone on your list. You don't have to mention smoking.",
      retires: 14,
      icon: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'
    },
    {
      id: "f5", name: "Reason", for: "Wavering",
      text: "Read the reason you wrote on quit day. Out loud if you can.",
      retires: 21,
      icon: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/>'
    },
    {
      id: "f6", name: "Water", for: "Hunger and the oral habit",
      text: "Drink a full glass of water, slowly, in small sips.",
      retires: 7,
      icon: '<path d="M6 3h12l-1.5 17a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1z"/><path d="M7 9h10"/>'
    }
  ];

  var DAY_NOTES = [
    { upTo: 7, text: "Days 1 to 7: withdrawal at its strongest. Every face is active." },
    { upTo: 14, text: "Days 8 to 14: hunger and the oral habit ease. Water has retired." },
    { upTo: 21, text: "Days 15 to 21: the social pull settles. Call has retired." },
    { upTo: 28, text: "Days 22 to 28: only the craving faces remain. Most of the die is now your call." }
  ];

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var net = document.getElementById("net");
  var daySlider = document.getElementById("day");
  var dayOut = document.getElementById("day-out");
  var dayNote = document.getElementById("day-note");
  var tossBtn = document.getElementById("toss");
  var result = document.getElementById("result");
  var pacer = document.getElementById("pacer");
  var pacerDot = document.getElementById("pacer-dot");
  var pacerLabel = document.getElementById("pacer-label");
  var pacerBtn = document.getElementById("pacer-btn");

  if (!net) return;

  var faceEls = {};

  FACES.forEach(function (f) {
    var el = document.createElement("div");
    el.className = "face";
    el.style.gridArea = f.id;
    el.setAttribute("role", "img");
    net.appendChild(el);
    faceEls[f.id] = el;
  });

  function day() { return parseInt(daySlider.value, 10); }
  function isRetired(f) { return day() > f.retires; }

  function renderFaces() {
    FACES.forEach(function (f) {
      var el = faceEls[f.id];
      var retired = isRetired(f);
      el.classList.toggle("retired", retired);
      el.innerHTML = retired
        ? "<span>your call</span>"
        : '<svg viewBox="0 0 24 24" aria-hidden="true">' + f.icon + "</svg><span>" + f.name + "</span>";
      el.setAttribute("aria-label", retired ? "Blank face: your call" : f.name + ", for " + f.for.toLowerCase());
    });
  }

  function renderDay() {
    var d = day();
    dayOut.textContent = d;
    for (var i = 0; i < DAY_NOTES.length; i++) {
      if (d <= DAY_NOTES[i].upTo) { dayNote.textContent = DAY_NOTES[i].text; break; }
    }
    renderFaces();
    clearLanded();
  }

  function clearLanded() {
    FACES.forEach(function (f) { faceEls[f.id].classList.remove("lit", "landed"); });
  }

  function showResult(f) {
    stopPacer();
    if (isRetired(f)) {
      result.innerHTML =
        "<h3>Your call</h3>" +
        '<p class="for">This face was ' + f.name.toLowerCase() + ". It retired after day " + f.retires + ".</p>" +
        "<p>The die doesn't decide this one. You do. Notice what you choose.</p>";
      pacer.hidden = true;
      return;
    }
    result.innerHTML =
      "<h3>" + f.name + "</h3>" +
      '<p class="for">For: ' + f.for.toLowerCase() + "</p>" +
      "<p>" + f.text + "</p>";
    pacer.hidden = f.id !== "f1";
    if (f.id === "f1") { pacerLabel.textContent = "Ready"; pacerBtn.textContent = "Start breathing"; }
  }

  function toss() {
    clearLanded();
    var pick = FACES[Math.floor(Math.random() * FACES.length)];

    if (reduceMotion) {
      faceEls[pick.id].classList.add("landed");
      showResult(pick);
      return;
    }

    tossBtn.disabled = true;
    var steps = 9;
    var i = 0;
    var last = null;
    var timer = setInterval(function () {
      if (last) faceEls[last].classList.remove("lit");
      if (i >= steps) {
        clearInterval(timer);
        faceEls[pick.id].classList.add("landed");
        showResult(pick);
        tossBtn.disabled = false;
        tossBtn.textContent = "Toss again";
        return;
      }
      var f = FACES[Math.floor(Math.random() * FACES.length)];
      faceEls[f.id].classList.add("lit");
      last = f.id;
      i++;
    }, 85);
  }

  // Breathing pacer: in for 4s, out for 6s, five rounds.
  var pacerTimeouts = [];
  var pacing = false;

  function stopPacer() {
    pacerTimeouts.forEach(clearTimeout);
    pacerTimeouts = [];
    pacing = false;
    pacerDot.style.transitionDuration = "0ms";
    pacerDot.style.transform = "scale(1)";
    pacerBtn.textContent = "Start breathing";
  }

  function startPacer() {
    if (pacing) { stopPacer(); pacerLabel.textContent = "Stopped"; return; }
    pacing = true;
    pacerBtn.textContent = "Stop";
    var ROUNDS = 5, IN = 4000, OUT = 6000;
    var t = 0;
    for (var r = 1; r <= ROUNDS; r++) {
      (function (round, start) {
        pacerTimeouts.push(setTimeout(function () {
          pacerLabel.textContent = "Breathe in. Round " + round + " of " + ROUNDS;
          pacerDot.style.transitionDuration = IN + "ms";
          pacerDot.style.transform = "scale(2.8)";
        }, start));
        pacerTimeouts.push(setTimeout(function () {
          pacerLabel.textContent = "Breathe out. Round " + round + " of " + ROUNDS;
          pacerDot.style.transitionDuration = OUT + "ms";
          pacerDot.style.transform = "scale(1)";
        }, start + IN));
      })(r, t);
      t += IN + OUT;
    }
    pacerTimeouts.push(setTimeout(function () {
      pacing = false;
      pacerLabel.textContent = "Done. How's the urge now?";
      pacerBtn.textContent = "Breathe again";
    }, t));
  }

  daySlider.addEventListener("input", function () { stopPacer(); pacer.hidden = true; result.innerHTML = '<p class="result-empty">Toss to get an instruction.</p>'; tossBtn.textContent = "Toss the die"; renderDay(); });
  tossBtn.addEventListener("click", toss);
  pacerBtn.addEventListener("click", startPacer);

  renderDay();
})();

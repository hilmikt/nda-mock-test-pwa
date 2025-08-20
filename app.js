const APP = {
  qbank: [],
  bySubject: {},
  state: {},
  settingsKey: "nda_settings_v1",
  resultsKey: "nda_results_v1",
  usageKey: "nda_usage_v1",
};
const Subjects = () =>
  Object.keys(APP.bySubject).length
    ? Object.keys(APP.bySubject)
    : ["Math", "English", "GS", "Physics", "Chemistry", "Biology"];

const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, children = []) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on") && typeof v === "function")
      e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  }
  return e;
};
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sampleN = (arr, n) => shuffle(arr).slice(0, n);
const fmtTime = (s) => {
  s = Math.max(0, Math.floor(s));
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
};
const loadJSON = (k, def) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
};
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

async function loadQuestions() {
  try {
    const res = await fetch("data/questions.latest.json", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    APP.qbank = data.map(normalizeQuestion);
  } catch (e) {
    console.error(
      "Failed to load questions.latest.json, falling back to sample.",
      e
    );
    const res = await fetch("data/questions.sample.json");
    APP.qbank = (await res.json()).map(normalizeQuestion);
  }
  APP.bySubject = {};
  for (const q of APP.qbank) (APP.bySubject[q.subject] ||= []).push(q);
}

const SUBJECT_ALIASES = {
  Mathematics: "Math",
  "General Studies": "GS",
  "G.S.": "GS",
  Phy: "Physics",
  Chem: "Chemistry",
  Bio: "Biology",
};

function normalizeQuestion(q) {
  const copy = {
    id: String(q.id || cryptoId()),
    subject: q.subject || "General",
    topic: q.topic || "",
    difficulty: Number(q.difficulty || 2),
    question: String(q.question || "").trim(),
    options:
      q.options && q.options.length
        ? q.options.map(String)
        : [q.optionA, q.optionB, q.optionC, q.optionD]
            .filter(Boolean)
            .map(String),
    answerIndex: Number(q.answerIndex ?? -1),
    explanation: String(q.explanation || ""),
    source: q.source || "unknown",
  };

  // Normalize subject label AFTER building the object
  copy.subject = SUBJECT_ALIASES[copy.subject] || copy.subject;

  // Safety guards
  if (!Array.isArray(copy.options) || copy.options.length < 2)
    copy.options = ["—", "—"];
  if (!(copy.answerIndex >= 0 && copy.answerIndex < copy.options.length))
    copy.answerIndex = 0;

  return copy;
}
function cryptoId() {
  return "q_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function route(view, params = {}) {
  const app = $("#app");
  app.innerHTML = "";
  if (view === "home") return viewHome();
  if (view === "setup") return viewSetup(params.mode || "subject");
  if (view === "test") return viewTest();
  if (view === "results") return viewResults(params);
  if (view === "history") return viewHistory();
  if (view === "about") return viewAbout();
  return viewHome();
}

function viewHome() {
  const cards = [
    el("div", { class: "card" }, [
      el("h3", {}, ["Subject Tests"]),
      el("p", {}, [
        "Practice one subject at a time with full control over question count, timer, and marking.",
      ]),
      el("div", { class: "actions" }, [
        el(
          "button",
          {
            class: "primary",
            onClick: () => route("setup", { mode: "subject" }),
          },
          ["Start Subject Test"]
        ),
      ]),
    ]),
    el("div", { class: "card" }, [
      el("h3", {}, ["All-Rounder Test"]),
      el("p", {}, [
        "Mixed questions from all subjects. Simulates real exam composition.",
      ]),
      el("div", { class: "actions" }, [
        el(
          "button",
          { class: "primary", onClick: () => route("setup", { mode: "all" }) },
          ["Start All-Rounder"]
        ),
      ]),
    ]),
    el("div", { class: "card" }, [
      el("h3", {}, ["History & Analytics"]),
      el("p", {}, [
        "Review your past scores, accuracy, and time. Export your data anytime.",
      ]),
      el("div", { class: "actions" }, [
        el("button", { class: "secondary", onClick: () => route("history") }, [
          "Open History",
        ]),
      ]),
    ]),
  ];

  // Render only the three cards (no Daily Tip)
  $("#app").appendChild(el("div", { class: "grid" }, cards));
}

function viewSetup(mode) {
  const subjects = Subjects();
  const s = loadJSON(APP.settingsKey, {
    subject: subjects[0],
    count: 10,
    timerOn: true,
    timeMinutes: 60,
    negCorrect: 1,
    negWrong: -0.33,
  });

  const subjectRow =
    mode === "subject"
      ? el("div", {}, [
          el("label", {}, ["Subject"]),
          (function () {
            const sel = el("select", { id: "subjectSel" });
            for (const sub of subjects)
              sel.appendChild(el("option", { value: sub }, [sub]));
            sel.value = s.subject;
            return sel;
          })(),
        ])
      : el("div", { class: "notice" }, [
          "All-Rounder will randomly mix subjects from the question bank.",
        ]);

  const panel = el("div", { class: "card" }, [
    el("h3", {}, [
      mode === "subject" ? "Subject Test Setup" : "All-Rounder Setup",
    ]),
    subjectRow,
    el("label", {}, ["Number of Questions"]),
    el("input", {
      id: "count",
      class: "input",
      type: "number",
      min: "5",
      max: "150",
      step: "1",
      value: s.count,
    }),
    el("div", { class: "grid", style: "margin-top:6px" }, [
      el("div", { class: "card" }, [
        el("h3", {}, ["Timer"]),
        el("label", {}, [
          el("input", {
            id: "timerOn",
            type: "checkbox",
            checked: s.timerOn ? true : undefined,
          }),
          " Enable Timer",
        ]),
        el("label", {}, ["Time (minutes)"]),
        el("input", {
          id: "timeM",
          class: "input",
          type: "number",
          min: "5",
          max: "180",
          step: "5",
          value: s.timeMinutes,
        }),
      ]),
      el("div", { class: "card" }, [
        el("h3", {}, ["Marking"]),
        el("label", {}, ["Marks for Correct (e.g., 1)"]),
        el("input", {
          id: "mCorrect",
          class: "input",
          type: "number",
          step: "0.25",
          value: s.negCorrect,
        }),
        el("label", {}, ["Penalty for Wrong (e.g., -0.33)"]),
        el("input", {
          id: "mWrong",
          class: "input",
          type: "number",
          step: "0.01",
          value: s.negWrong,
        }),
      ]),
    ]),
    el("div", { class: "actions" }, [
      el("button", { class: "secondary", onClick: () => route("home") }, [
        "Cancel",
      ]),
      el(
        "button",
        {
          class: "primary",
          onClick: () => {
            const settings = {
              mode,
              subject: mode === "subject" ? $("#subjectSel").value : null,
              count: clamp(parseInt($("#count").value || "10", 10), 5, 150),
              timerOn: $("#timerOn").checked,
              timeMinutes: clamp(
                parseInt($("#timeM").value || "60", 10),
                5,
                180
              ),
              negCorrect: Number($("#mCorrect").value || 1),
              negWrong: Number($("#mWrong").value || -0.33),
            };
            saveJSON(APP.settingsKey, settings);
            startTest(settings);
          },
        },
        ["Start Test"]
      ),
    ]),
  ]);

  $("#app").appendChild(panel);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function startTest(settings) {
  let pool = [];
  if (settings.mode === "subject") {
    pool = (APP.bySubject[settings.subject] || []).slice();
  } else {
    const subjects = Subjects();
    const per = Math.max(1, Math.floor(settings.count / subjects.length));
    for (const sub of subjects)
      pool = pool.concat(sampleN(APP.bySubject[sub] || [], per));
    if (pool.length < settings.count)
      pool = pool.concat(sampleN(APP.qbank, settings.count - pool.length));
  }
  pool = shuffle(pool).slice(0, settings.count);

  APP.state = {
    settings,
    startedAt: Date.now(),
    timeLimit: settings.timerOn ? settings.timeMinutes * 60 : null,
    remaining: settings.timerOn ? settings.timeMinutes * 60 : null,
    index: 0,
    items: pool.map((q) => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      options: shuffle(q.options.slice()),
      answerIndex: null,
      correctIndex: q.answerIndex,
      explanation: q.explanation,
      source: q.source,
      marked: false,
    })),
  };
  APP.state.items.forEach((item) => {
    const original =
      (APP.qbank.find((x) => x.id === item.id) || {}).options || item.options;
    const trueText =
      original[
        (APP.qbank.find((x) => x.id === item.id) || { answerIndex: 0 })
          .answerIndex
      ];
    item.correctIndex = item.options.findIndex((t) => t === trueText);
    if (item.correctIndex < 0) item.correctIndex = 0;
  });
  route("test");
}

let timerInterval = null;

function viewTest() {
  const s = APP.state;
  if (!s || !s.items || !s.items.length) return route("home");
  const top = el("div", { class: "topbar" }, [
    el("span", { class: "badge" }, [`Q ${s.index + 1} / ${s.items.length}`]),
    el("div", {}, [
      el("span", { class: "badge" }, [
        s.settings.mode === "subject" ? s.settings.subject : "All-Rounder",
      ]),
      s.settings.timerOn
        ? el(
            "span",
            { id: "timer", class: "badge ok", style: "margin-left:6px" },
            [fmtTime(s.remaining)]
          )
        : null,
    ]),
    el("div", { class: "actions" }, [
      el(
        "button",
        {
          class: "ghost",
          onClick: () => {
            s.items[s.index].marked = !s.items[s.index].marked;
            renderQuestion();
          },
        },
        ["Mark (R)"]
      ),
      el("button", { class: "secondary", onClick: () => prev() }, ["Prev (P)"]),
      el("button", { class: "primary", onClick: () => next() }, ["Next (N)"]),
    ]),
  ]);
  const qWrap = el("div", { class: "card" });
  const sumWrap = el("div", { class: "card" }, [
    el("h3", {}, ["Summary"]),
    el("div", { class: "summary-grid", id: "sumGrid" }),
  ]);
  $("#app").appendChild(top);
  $("#app").appendChild(qWrap);
  $("#app").appendChild(sumWrap);

  function renderSummary() {
    const grid = $("#sumGrid");
    grid.innerHTML = "";
    s.items.forEach((it, idx) => {
      const b = el(
        "button",
        {
          onClick: () => {
            s.index = idx;
            renderQuestion();
          },
        },
        [String(idx + 1)]
      );
      if (it.answerIndex != null) b.classList.add("answered");
      if (it.marked) b.classList.add("marked");
      grid.appendChild(b);
    });
  }

  function renderQuestion() {
    const it = s.items[s.index];
    qWrap.innerHTML = "";
    qWrap.appendChild(el("div", { class: "qtext" }, [it.question]));
    it.options.forEach((opt, i) => {
      const node = el(
        "label",
        {
          class: "option" + (it.answerIndex === i ? " selected" : ""),
          onClick: (ev) => {
            ev.preventDefault(); // eat default label → radio plumbing
            it.answerIndex = i;
            renderSummary();
            renderQuestion();
          },
        },
        [
          el("input", {
            type: "radio",
            name: "opt" + s.index, // unique per question
            checked: it.answerIndex === i,
            onChange: () => {
              // still handle keyboard/focus change
              it.answerIndex = i;
              renderSummary();
              renderQuestion();
            },
          }),
          el("div", {}, [opt]),
        ]
      );
      qWrap.appendChild(node);
    });

    qWrap.appendChild(
      el("div", { class: "actions" }, [
        el(
          "button",
          {
            class: "secondary",
            onClick: () => {
              s.items[s.index].marked = !s.items[s.index].marked;
              renderSummary();
              renderQuestion();
            },
          },
          [s.items[s.index].marked ? "Unmark" : "Mark for Review"]
        ),
        el("button", { class: "ghost", onClick: () => prev() }, ["Prev (P)"]),
        el("button", { class: "primary", onClick: () => next() }, ["Next (N)"]),
      ])
    );
    qWrap.appendChild(el("hr", { class: "div" }));
    qWrap.appendChild(
      el("div", { class: "kb" }, [
        "Shortcuts: 1–6 choose, N next, P prev, R mark, S submit",
      ])
    );
  }

  function next() {
    if (s.index < s.items.length - 1) {
      s.index++;
      renderQuestion();
    }
  }
  function prev() {
    if (s.index > 0) {
      s.index--;
      renderQuestion();
    }
  }

  document.onkeydown = (ev) => {
    const k = ev.key.toLowerCase();
    if (k >= "1" && k <= "6") {
      const i = Number(k) - 1;
      const it = s.items[s.index];
      if (i < it.options.length) {
        it.answerIndex = i;
        renderSummary();
        renderQuestion();
      }
    } else if (k === "n") next();
    else if (k === "p") prev();
    else if (k === "r") {
      s.items[s.index].marked = !s.items[s.index].marked;
      renderSummary();
      renderQuestion();
    } else if (k === "s") {
      submitConfirm();
    }
  };

  const submitPanel = el("div", { class: "card" }, [
    el("div", { class: "actions" }, [
      el("button", { class: "secondary", onClick: () => route("home") }, [
        "Exit",
      ]),
      el("button", { class: "primary", onClick: () => submitConfirm() }, [
        "Submit (S)",
      ]),
    ]),
  ]);
  $("#app").appendChild(submitPanel);

  function submitConfirm() {
    const unanswered = s.items.filter((it) => it.answerIndex == null).length;
    if (!confirm(`Submit now? ${unanswered} unanswered.`)) return;
    endTest();
  }

  function endTest() {
    if (timerInterval) clearInterval(timerInterval);
    const correct = s.items.filter(
      (it) => it.answerIndex === it.correctIndex
    ).length;
    const wrong = s.items.filter(
      (it) => it.answerIndex != null && it.answerIndex !== it.correctIndex
    ).length;
    const skipped = s.items.length - correct - wrong;
    const score = correct * s.settings.negCorrect + wrong * s.settings.negWrong;
    const bySub = {};
    s.items.forEach((it) => {
      const isC = it.answerIndex === it.correctIndex ? 1 : 0;
      const isW =
        it.answerIndex != null && it.answerIndex !== it.correctIndex ? 1 : 0;
      bySub[it.subject] ||= { total: 0, correct: 0, wrong: 0, skipped: 0 };
      bySub[it.subject].total++;
      bySub[it.subject].correct += isC;
      bySub[it.subject].wrong += isW;
    });
    for (const sub in bySub)
      bySub[sub].skipped =
        bySub[sub].total - bySub[sub].correct - bySub[sub].wrong;
    const result = {
      id: "r_" + Date.now(),
      startedAt: s.startedAt,
      finishedAt: Date.now(),
      settings: s.settings,
      score,
      correct,
      wrong,
      skipped,
      total: s.items.length,
      bySubject: bySub,
      items: s.items.map((it, idx) => ({
        idx,
        id: it.id,
        subject: it.subject,
        question: it.question,
        options: it.options,
        answerIndex: it.answerIndex,
        correctIndex: it.correctIndex,
        explanation: it.explanation,
      })),
    };
    const all = loadJSON(APP.resultsKey, []);
    all.unshift(result);
    saveJSON(APP.resultsKey, all);
    route("results", { resultId: result.id });
  }

  function tick() {
    if (!s.settings.timerOn) return;
    s.remaining -= 1;
    const t = $("#timer");
    if (t) t.textContent = fmtTime(s.remaining);
    if (s.remaining <= 0) {
      alert("Time up. Submitting…");
      endTest();
    }
  }
  if (s.settings.timerOn) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(tick, 1000);
  }

  renderSummary();
  renderQuestion();
}

function viewResults(params) {
  const all = loadJSON(APP.resultsKey, []);
  const res = all.find((r) => r.id === params.resultId) || all[0];
  if (!res) return route("home");

  const head = el("div", { class: "card" }, [
    el("h3", {}, ["Results"]),
    el("div", { class: "topbar" }, [
      el("span", { class: "badge" }, [`Score ${res.score.toFixed(2)}`]),
      el("span", { class: "badge" }, [`Correct ${res.correct}`]),
      el("span", { class: "badge" }, [`Wrong ${res.wrong}`]),
      el("span", { class: "badge" }, [`Skipped ${res.skipped}`]),
    ]),
    el("div", { class: "small" }, [
      `Duration: ${Math.round(
        (res.finishedAt - res.startedAt) / 1000
      )}s · Mode: ${res.settings.mode}`,
    ]),
  ]);

  const breakdownTable = el("table", { class: "table" }, [
    el("tr", {}, [
      el("th", {}, ["Subject"]),
      el("th", {}, ["Total"]),
      el("th", {}, ["Correct"]),
      el("th", {}, ["Wrong"]),
      el("th", {}, ["Skipped"]),
    ]),
  ]);
  Object.keys(res.bySubject).forEach((sub) => {
    const b = res.bySubject[sub];
    breakdownTable.appendChild(
      el("tr", {}, [
        el("td", {}, [sub]),
        el("td", {}, [String(b.total)]),
        el("td", {}, [String(b.correct)]),
        el("td", {}, [String(b.wrong)]),
        el("td", {}, [String(b.skipped)]),
      ])
    );
  });

  const listWrong = el("div", { class: "card" }, [
    el("h3", {}, ["Review Wrong/Skipped"]),
  ]);
  res.items.forEach((item) => {
    if (item.answerIndex === item.correctIndex) return;
    const row = el("div", { class: "card", style: "margin-top:8px" }, [
      el("div", { class: "qtext" }, [`Q${item.idx + 1}. ${item.question}`]),
      el("div", {}, [
        el("span", { class: "badge ok" }, ["Correct: "]),
        " ",
        item.options[item.correctIndex],
      ]),
      el("div", {}, [
        el("span", { class: "badge warn", style: "margin-top:6px" }, [
          "Your answer: ",
        ]),
        " ",
        item.answerIndex == null ? "—" : item.options[item.answerIndex],
      ]),
      item.explanation
        ? el("div", { class: "small", style: "margin-top:6px" }, [
            "Why: ",
            item.explanation,
          ])
        : null,
    ]);
    listWrong.appendChild(row);
  });

  $("#app").appendChild(head);
  $("#app").appendChild(
    el("div", { class: "card" }, [
      el("h3", {}, ["Breakdown by Subject"]),
      breakdownTable,
    ])
  );
  $("#app").appendChild(listWrong);
  $("#app").appendChild(
    el("div", { class: "card" }, [
      el("div", { class: "actions" }, [
        el("button", { class: "primary", onClick: () => route("home") }, [
          "Done",
        ]),
        el(
          "button",
          {
            class: "secondary",
            onClick: () => route("setup", { mode: res.settings.mode }),
          },
          ["Retake Similar"]
        ),
      ]),
    ])
  );
}

function viewHistory() {
  const all = loadJSON(APP.resultsKey, []);
  const wrap = el("div", { class: "card" }, [
    el("h3", {}, ["History"]),
    el("p", { class: "small" }, ["Saved locally in this browser only."]),
  ]);
  const table = el("table", { class: "table" }, [
    el("tr", {}, [
      el("th", {}, ["Date"]),
      el("th", {}, ["Mode"]),
      el("th", {}, ["Score"]),
      el("th", {}, ["C/W/S"]),
      el("th", {}, ["Actions"]),
    ]),
  ]);
  all.forEach((r) => {
    const d = new Date(r.finishedAt);
    table.appendChild(
      el("tr", {}, [
        el("td", {}, [d.toLocaleString()]),
        el("td", {}, [r.settings.mode]),
        el("td", {}, [r.score.toFixed(2)]),
        el("td", {}, [`${r.correct}/${r.wrong}/${r.skipped}`]),
        el("td", {}, [
          (function () {
            return el(
              "button",
              {
                class: "secondary",
                onClick: () => route("results", { resultId: r.id }),
              },
              ["View"]
            );
          })(),
        ]),
      ])
    );
  });
  const exportBtn = el(
    "button",
    {
      class: "secondary",
      onClick: () => {
        const blob = new Blob([JSON.stringify(all, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = el("a", { href: url, download: "nda-results.json" });
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
    },
    ["Export JSON"]
  );

  $("#app").appendChild(wrap);
  $("#app").appendChild(table);
  $("#app").appendChild(
    el("div", { class: "actions" }, [
      exportBtn,
      el(
        "button",
        {
          class: "ghost",
          onClick: () => {
            if (confirm("Clear all results?")) {
              saveJSON(APP.resultsKey, []);
              route("history");
            }
          },
        },
        ["Clear All"]
      ),
    ])
  );
}

function viewAbout() {
  $("#app").appendChild(
    el("div", { class: "card" }, [
      el("h3", {}, ["About"]),
      el("p", {}, [
        "Distraction-free mock test app. Works offline. Results never leave your device.",
      ]),
      el("p", { class: "small" }, [
        "Weekly update: replace data/questions.latest.json with your new batch. Subjects supported: Math, English, GS, Physics, Chemistry, Biology.",
      ]),
    ])
  );
}

window.addEventListener("DOMContentLoaded", () => {
  $("#navHome").addEventListener("click", () => route("home"));
  $("#navHistory").addEventListener("click", () => route("history"));
  $("#navAbout").addEventListener("click", () => route("about"));
  route("home");
  loadQuestions()
    .then(() => console.log("Question bank ready:", APP.qbank.length))
    .catch(console.error);
});

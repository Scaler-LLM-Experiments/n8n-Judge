/* ============================================================
   Scaler AI LMS — Module List
   Calm model: loads at top · natural order · completed modules
   collapsed & quiet · current module is the expanded hero.
   ============================================================ */

/* ---------- shared icon markup ---------- */
const ICON = {
  chev: `<svg class="chev" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
  cal:  `<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M208 32h-24v-8a8 8 0 0 0-16 0v8H88v-8a8 8 0 0 0-16 0v8H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zm0 176H48V64h160zM128 132a12 12 0 1 1-12-12 12 12 0 0 1 12 12z"/></svg>`,
  code: `<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M69.12 94.15L28.5 128l40.62 33.85a8 8 0 1 1-10.24 12.29l-48-40a8 8 0 0 1 0-12.29l48-40a8 8 0 0 1 10.24 12.3zm176 27.7l-48-40a8 8 0 1 0-10.24 12.3L227.5 128l-40.62 33.85a8 8 0 1 0 10.24 12.29l48-40a8 8 0 0 0 0-12.29zM162.73 32.48a8 8 0 0 0-10.25 4.79l-64 176a8 8 0 0 0 4.79 10.26 8 8 0 0 0 10.26-4.8l64-176a8 8 0 0 0-4.8-10.25z"/></svg>`,
  seal: `<svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="m225.86 102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28 23.51 138.44 16 128 16s-18.27 7.51-25.18 14.14c-3.94 3.77-8 7.67-11.57 9.14-3.25 1.36-8.69 1.44-13.94 1.52-9.76.15-20.82.31-28.51 8s-7.8 18.75-8 28.51c-.08 5.25-.16 10.67-1.52 13.94-1.47 3.56-5.37 7.63-9.14 11.57C23.51 109.72 16 117.56 16 128s7.51 18.27 14.14 25.18c3.77 3.94 7.67 8 9.14 11.57 1.36 3.27 1.44 8.69 1.52 13.94.15 9.76.31 20.82 8 28.51s18.75 7.85 28.51 8c5.25.08 10.67.16 13.94 1.52 3.56 1.47 7.63 5.37 11.57 9.14C109.72 232.49 117.56 240 128 240s18.27-7.51 25.18-14.14c3.94-3.77 8-7.67 11.57-9.14 3.27-1.36 8.69-1.44 13.94-1.52 9.76-.15 20.82-.31 28.51-8s7.85-18.75 8-28.51c.08-5.25.16-10.67 1.52-13.94 1.47-3.56 5.37-7.63 9.14-11.57C232.49 146.28 240 138.44 240 128s-7.51-18.27-14.14-25.18zm-52.2 6.84-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32z"/></svg>`,
  lock: `<svg class="lock" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  chevSm: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
  checkCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.3 14.3-4-4 1.4-1.42 2.6 2.6 5.6-5.6 1.42 1.42-7.02 7z"/></svg>`,
  lockSm: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  // category icons for the class stat columns (label shown on hover)
  catLive:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.2 3a1 1 0 0 0 1.5-.9V8.9a1 1 0 0 0-1.5-.9L16 11"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>`,
  catAssign:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>`,
  catPractice: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>`,
  catProjects: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  // ---- Daily Plan ----
  tcUser:  `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>`,
  tcBook:  `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>`,
  tcLock:  `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  arrowUR: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`,
  tagDoc:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>`,
  tagClock:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  tagQuiz: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  hdrPath: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="3"/><circle cx="19" cy="18" r="3"/><path d="M8 6h7a4 4 0 0 1 4 4v5"/></svg>`,
  hdrList: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>`,
  today:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/><circle cx="12" cy="15" r="2.2"/></svg>`,
};

const metaAttendance = `
  <span class="module__meta">
    <span class="meta-item">${ICON.cal}Attedance: 60%</span>
    <span class="meta-sep"></span>
    <span class="meta-item">${ICON.code}PSP: 60%</span>
  </span>`;
const metaUpcoming = `
  <span class="module__meta">
    <span class="module__status-pill">${ICON.lockSm}Upcoming</span>
  </span>`;

/* ---------- realistic curriculum data ---------- */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

// 20 modules — a realistic DSA → CS-fundamentals track
const MODULE_TITLES = [
  "Programming Foundations", "Time & Space Complexity", "Arrays & Strings", "Searching & Binary Search",
  "Sorting Algorithms", "Recursion & Backtracking", "Linked Lists", "Stacks & Queues",
  "Hashing", "Two Pointers & Sliding Window", "Trees & BST", "Heaps & Priority Queues",
  "Greedy Algorithms", "Dynamic Programming", "Graphs", "Advanced Graph Algorithms",
  "Tries & Strings", "Segment Trees & Fenwick", "Object-Oriented Design", "Databases & SQL",
];

// class-title fragments, combined per class for variety
const CLASS_POOL = [
  "Introduction & Setup", "Big-O Notation", "Array Fundamentals", "Prefix & Suffix Sums",
  "Subarray Problems", "Two Pointers", "Sliding Window", "String Manipulation",
  "Pattern Matching", "Binary Search Basics", "Search-Space Reduction", "Merge Sort",
  "Quick Sort", "Counting & Radix Sort", "Recursion Fundamentals", "Backtracking",
  "Subsets & Permutations", "Linked List Basics", "Fast & Slow Pointers", "Reversing a List",
  "Stack Applications", "Monotonic Stack", "Queues & Deques", "Hashing Fundamentals",
  "Hash Maps in Practice", "Collision Handling", "Tree Traversals", "BST Operations",
  "Balanced Trees", "Heaps & Priority Queues", "Top-K Problems", "Greedy Techniques",
  "Interval Scheduling", "DP: 1-D Problems", "DP: Grids", "Knapsack Variants",
  "DP on Subsequences", "Graphs: BFS", "Graphs: DFS", "Dijkstra's Algorithm",
  "Union–Find", "Topological Sort", "Tries", "Segment Trees",
  "Bit Manipulation", "System Design Primer", "SQL Joins", "Indexing & Query Plans",
];
// class types — combined with the module title for topic-relevant names
const CLASS_KINDS = [
  "Introduction", "Fundamentals", "Core Patterns", "Implementation", "Worked Examples",
  "Common Pitfalls", "Practice Problems", "Hard Problems", "Interview Prep",
  "Optimization Tricks", "Live Problem Solving", "Recap & Quiz",
];

const LIVE_VALS   = ["100%", "98%", "95%", "92%", "90%", "88%", "85%", "80%"];
const ASSIGN_VALS = ["10/10", "9/10", "8/10", "12/12", "7/8", "6/7", "5/5", "9/9"];
const THIRD_VALS  = ["6/6", "8/8", "9/9", "10/10", "3/5", "7/8", "4/6", "5/7"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_UP = MONTHS.map((m) => m.toUpperCase());
const DAYS_IN = [31,28,31,30,31,30,31,31,30,31,30,31];
const dateCursor = { m: 6, day: 4 };           // running date across all classes (starts ~Jul 4)
function nextDate(step){
  dateCursor.day += step;
  while (dateCursor.day > DAYS_IN[dateCursor.m]){ dateCursor.day -= DAYS_IN[dateCursor.m]; dateCursor.m = (dateCursor.m + 1) % 12; }
  return { mon: MONTHS_UP[dateCursor.m], day: dateCursor.day };
}

/* Generate one module's classes. mode: "done" | "current" | "upcoming".
   For the current module, the class at `activeAt` is the upcoming one. */
function makeClasses(moduleTitle, count, mode){
  const out = [];
  const activeAt = mode === "current" ? rint(4, Math.max(5, Math.floor(count * 0.55))) : -1;
  for (let j = 0; j < count; j++){
    const d = nextDate(rint(1, 2));
    const kind = CLASS_KINDS[j % CLASS_KINDS.length];
    const part = j >= CLASS_KINDS.length ? ` (Part ${Math.floor(j / CLASS_KINDS.length) + 1})` : "";
    const done = mode === "done" ? true : mode === "upcoming" ? false : j < activeAt;
    out.push({
      mon: d.mon, day: d.day,
      title: `${j + 1}. ${moduleTitle}: ${kind}${part}`,
      live: pick(LIVE_VALS), assign: pick(ASSIGN_VALS),
      third: { label: j % 4 === 3 ? "Projects" : "Practice", val: pick(THIRD_VALS) },
      lock: true, done,
      active: j === activeAt,
    });
  }
  return out;
}

// completed class → green value (no check icon); upcoming/future class → muted "—"
function statValue(l, v){
  return l.done
    ? `<span class="stat-col__value">${v}</span>`
    : `<span class="stat-col__value stat-col__value--todo">—</span>`;
}

// one stat column: category icon by default, full label on row hover
function statCol(icon, label, lesson, value, lock){
  return `
    <div class="stat-col">
      <span class="stat-col__head">
        <span class="stat-col__icon">${icon}</span>
        <span class="stat-col__label">${label}${lock ? ICON.lock : ""}</span>
      </span>
      ${statValue(lesson, value)}
    </div>`;
}

function lessonRow(l){
  return `
    <div class="lesson ${l.active ? "lesson--active" : ""}">
      <div class="lesson__date">
        <span class="mon">${l.mon}</span>
        <span class="day">${l.day}</span>
      </div>
      <div class="lesson__title">
        <span class="lesson__name">${l.title}</span>
        ${l.active ? `<span class="lesson__timer"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/></svg>Starts in <span class="lesson__count" data-countdown>25:00</span></span>` : ""}
      </div>
      <div class="lesson__stats">
        ${statCol(ICON.catLive, "Live Class", l, l.live, false)}
        ${statCol(ICON.catAssign, "Assignments", l, l.assign, false)}
        ${statCol(l.third.label === "Projects" ? ICON.catProjects : ICON.catPractice, l.third.label, l, l.third.val, l.lock)}
      </div>
      <span class="lesson__chev">${ICON.chevSm}</span>
    </div>`;
}

const CERT_HTML = `
  <div class="certification">
    <div class="certification__head">
      <h2>Module Certification</h2>
      <p>Completing the manadatory items is important to unlock your jobs</p>
    </div>
    <div class="cert-card">
      <div class="cert-card__icon cert-card__icon--upcoming">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0055ff" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="3 3"><circle cx="12" cy="12" r="9"/></svg>
      </div>
      <div class="cert-card__main">
        <div class="cert-card__title">
          Databases &amp; SQL Mandatory Skill Test
          <span class="cert-status cert-status--upcoming">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/></svg>
            UPCOMING
          </span>
        </div>
        <div class="cert-tags">
          <span class="tag"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>Skill Test</span>
          <span class="tag"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/></svg>120 Mins</span>
        </div>
      </div>
      <button class="btn-primary cert-card__cta">
        Start Test
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
      </button>
    </div>
    <div class="cert-card cert-card--locked">
      <div class="cert-card__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94979e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div class="cert-card__main">
        <div class="cert-card__title">
          Data Structures &amp; Algorithm
          <span class="cert-status cert-status--locked">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            LOCKED
          </span>
        </div>
        <div class="cert-tags">
          <span class="tag"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>Mock Interview</span>
          <span class="tag"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/></svg>120 Mins</span>
          <span class="tag tag--companion"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0055ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>Taken by Companion</span>
        </div>
      </div>
    </div>
  </div>`;

/* ---------- module renderer ---------- */
// classes for collapsed modules are rendered lazily (on first open) to keep
// the initial DOM light even with ~450 classes across 20 modules.
const moduleLessons = [];
function moduleBlock(m){
  const open = m.status === "current";
  const cls = ["module",
    open ? "is-open" : "",
    m.status === "done" ? "module--done" : "",
    m.status === "upcoming" ? "module--upcoming" : "",
  ].filter(Boolean).join(" ");

  const meta  = m.status === "upcoming" ? metaUpcoming : metaAttendance;
  const idx   = moduleLessons.push(m.lessons) - 1;
  const rows  = open ? m.lessons.map(lessonRow).join("") : "";   // others fill on open
  const cert  = m.cert ? CERT_HTML : "";

  return `
    <section class="${cls}" data-module>
      <button class="module__header" data-toggle>
        <span class="module__title">${ICON.chev}<span class="module__name">Module ${m.n}: ${m.title}</span></span>
        ${meta}
      </button>
      <div class="module__body" data-body>
        <div class="lessons" data-lessons="${idx}"${open ? ' data-filled="1"' : ''}>${rows}</div>
        ${cert}
      </div>
    </section>`;
}

// render a module's classes the first time it's opened
function fillLessons(module){
  const el = module.querySelector(".lessons");
  if (!el || el.dataset.filled || el.dataset.lessons === undefined) return;
  el.innerHTML = moduleLessons[+el.dataset.lessons].map(lessonRow).join("");
  el.dataset.filled = "1";
}

/* ---------- 20 modules, ~20-26 classes each, in natural order ---------- */
const CURRENT_MODULE = 12;   // 1-based: which module the learner is on now
const modules = MODULE_TITLES.map((title, i) => {
  const n = i + 1;
  const status = n < CURRENT_MODULE ? "done" : n === CURRENT_MODULE ? "current" : "upcoming";
  return {
    n, title, status,
    cert: status === "current",
    lessons: makeClasses(title, rint(20, 26), status),
  };
});

// Completed modules render into the past zone (above the fold);
// the current + upcoming modules render below the salutation.
const pastList = modules.filter((m) => m.status === "done");
const mainList = modules.filter((m) => m.status !== "done");
const pastWrap = document.getElementById("pastModules");
const modulesWrap = document.getElementById("modules");
if (pastWrap) pastWrap.innerHTML = pastList.map(moduleBlock).join("");
if (modulesWrap) modulesWrap.innerHTML = mainList.map(moduleBlock).join("");


/* ============================================================
   DELIGHTFUL ROTATING SALUTATION
   Two-line prompts · changes every refresh · time-of-day aware.
   Each prompt is { top, bottom }; the name is woven in (no fixed "Hi").
   {name} is replaced with the learner's name.
   ============================================================ */
const LEARNER = "Aarav";

const WELCOME_PROMPTS = [
  { top:"Welcome back,",          bottom:"{name}" },
  { top:"Good to see you,",       bottom:"{name}" },
  { top:"There you are,",         bottom:"{name}" },
  { top:"Look who's back —",      bottom:"hey {name}" },
  { top:"{name},",                bottom:"let's get to it" },
  { top:"{name},",                bottom:"let's build something" },
  { top:"Ready, {name}?",         bottom:"Let's dive in" },
  { top:"Back in action,",        bottom:"{name}" },
  { top:"{name},",                bottom:"today counts" },
  { top:"Let's make today count,",bottom:"{name}" },
  { top:"{name},",                bottom:"time to level up" },
  { top:"Momentum starts now,",   bottom:"{name}" },
  { top:"{name},",                bottom:"learning begins" },
  { top:"Curiosity loading…",     bottom:"welcome, {name}" },
  { top:"{name},",                bottom:"let's ship it" },
  { top:"Push to main,",          bottom:"{name}" },
  { top:"{name},",                bottom:"commit to today" },
  { top:"No bugs today,",         bottom:"{name}" },
  { top:"{name},",                bottom:"keep shipping" },
  { top:"Refactor your future,",  bottom:"{name}" },
  { top:"{name},",                bottom:"debug the day" },
  { top:"Compile your dreams,",   bottom:"{name}" },
  { top:"{name},",                bottom:"let's crack it" },
  { top:"New day, new logic,",    bottom:"{name}" },
  { top:"{name},",                bottom:"think in loops" },
  { top:"Trust the process,",     bottom:"{name}" },
  { top:"Show up, level up,",     bottom:"{name}" },
  { top:"{name},",                bottom:"let's go" },
  { top:"Sharpen the mind,",      bottom:"{name}" },
  { top:"{name},",                bottom:"stay curious" },
  { top:"Big things ahead,",      bottom:"{name}" },
  { top:"{name},",                bottom:"get more done today" },
  { top:"One step closer,",       bottom:"{name}" },
  { top:"{name},",                bottom:"chase mastery" },
  { top:"Practice makes progress,",bottom:"{name}" },
  { top:"{name},",                bottom:"code your way up" },
  { top:"Eyes on the goal,",      bottom:"{name}" },
  { top:"{name},",                bottom:"own today" },
  { top:"Let's crush it,",        bottom:"{name}" },
  { top:"Streak alive —",         bottom:"nice work, {name}" },
  { top:"{name},",                bottom:"another skill awaits" },
  { top:"Learn. Build. Repeat.",  bottom:"let's go, {name}" },
  { top:"{name},",                bottom:"earn your edge" },
  { top:"Mind in motion,",        bottom:"{name}" },
  { top:"{name},",                bottom:"let's get smarter" },
  { top:"Start strong,",          bottom:"{name}" },
  { top:"{name},",                bottom:"make it count" },
  { top:"Today's the day,",       bottom:"{name}" },
  { top:"{name},",                bottom:"deep work awaits" },
  { top:"Focus mode: on,",        bottom:"{name}" },
  { top:"{name},",                bottom:"keep climbing" },
  { top:"Onward and upward,",     bottom:"{name}" },
  { top:"{name},",                bottom:"beat yesterday" },
  { top:"Better than yesterday,", bottom:"{name}" },
  { top:"{name},",                bottom:"compound your skills" },
  { top:"Every rep matters,",     bottom:"{name}" },
  { top:"{name},",                bottom:"make future-you proud" },
  { top:"Your potential is calling,",bottom:"{name}" },
  { top:"{name},",                bottom:"unlock your day" },
  { top:"Learn boldly,",          bottom:"{name}" },
  { top:"{name},",                bottom:"version up" },
  { top:"Upgrade in progress,",   bottom:"{name} 2.0" },
  { top:"{name},",                bottom:"one percent better" },
  { top:"Small steps, big wins,", bottom:"{name}" },
  { top:"{name},",                bottom:"the work is the way" },
  { top:"Fresh page,",            bottom:"full focus, {name}" },
  { top:"{name},",                bottom:"let's solve hard things" },
  { top:"Connect the dots,",      bottom:"{name}" },
  { top:"{name},",                bottom:"light the spark" },
  { top:"Master the basics,",     bottom:"{name}" },
  { top:"{name},",                bottom:"consistency wins" },
  { top:"Aha moments ahead,",     bottom:"{name}" },
  { top:"{name},",                bottom:"you're closer than you think" },
  { top:"Keep going,",            bottom:"{name}" },
  { top:"{name},",                bottom:"main character energy" },
  { top:"Bet on yourself,",       bottom:"{name}" },
  { top:"{name},",                bottom:"do the reps" },
  { top:"Less doubt, more code,", bottom:"{name}" },
  { top:"{name},",                bottom:"stay in the game" },
  { top:"Built different —",      bottom:"get building, {name}" },
  { top:"{name},",                bottom:"future-proof yourself" },
];

const TIME_PROMPTS = {
  morning: [
    { top:"Good morning,",   bottom:"{name}" },
    { top:"Rise and grind,", bottom:"{name}" },
    { top:"{name},",         bottom:"seize the morning" },
    { top:"Coffee + code —", bottom:"let's go, {name}" },
    { top:"Early bird,",     bottom:"big gains, {name}" },
    { top:"Morning momentum,",bottom:"{name}" },
  ],
  afternoon: [
    { top:"Good afternoon,", bottom:"{name}" },
    { top:"{name},",         bottom:"midday momentum" },
    { top:"Beat the slump,", bottom:"{name}" },
    { top:"Afternoon focus,",bottom:"{name}" },
    { top:"{name},",         bottom:"keep the pace" },
    { top:"Post-lunch push,",bottom:"{name}" },
  ],
  evening: [
    { top:"Good evening,",       bottom:"{name}" },
    { top:"{name},",             bottom:"golden hour grind" },
    { top:"Wind down with wins,",bottom:"{name}" },
    { top:"Evening focus,",      bottom:"{name}" },
    { top:"{name},",             bottom:"end the day strong" },
    { top:"Sunset session —",    bottom:"let's go, {name}" },
  ],
  night: [
    { top:"Burning the midnight oil,",bottom:"{name}" },
    { top:"Night owl mode,",          bottom:"{name}" },
    { top:"{name},",                  bottom:"late-night logic" },
    { top:"Quiet hours,",             bottom:"deep work, {name}" },
    { top:"{name},",                  bottom:"the night is young" },
    { top:"After-hours hustle,",      bottom:"{name}" },
  ],
};

function timeBucket(){
  const h = new Date().getHours();
  return h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
}

function pickGreeting(){
  const bucket = timeBucket();
  const pool = WELCOME_PROMPTS.concat(TIME_PROMPTS[bucket]);
  const p = pool[Math.floor(Math.random() * pool.length)];
  return { top: p.top.replace(/\{name\}/g, LEARNER), bottom: p.bottom.replace(/\{name\}/g, LEARNER) };
}

const greetingHiEl    = document.querySelector(".greeting__hi");
const greetingTitleEl = document.querySelector(".greeting__title");
const greetingPrompt  = pickGreeting();
if (greetingHiEl)    greetingHiEl.textContent    = greetingPrompt.top;
if (greetingTitleEl) greetingTitleEl.textContent = greetingPrompt.bottom;

// daily view gets its own rotating salutation
// same salutation across both views (shared phrase, picked once)
const dailyGreetingEl = document.getElementById("greetingDaily");
if (dailyGreetingEl){
  dailyGreetingEl.querySelector(".greeting__hi").textContent = greetingPrompt.top;
  dailyGreetingEl.querySelector(".greeting__title").textContent = greetingPrompt.bottom;
}


/* ============================================================
   DAILY PLAN — timeline of dated to-do cards
   ============================================================ */
const READ_DESC = "Covers the core concepts with worked examples and a short practice set at the end.";
const QUIZ_DESC = "A quick check to personalise your plan and surface where to focus next.";
const READ_TAGS = [
  { icon: ICON.tagDoc,  label: "10 Min Read" },
  { icon: ICON.tagQuiz, label: "6 Quizes" },
  { author: true },
];
const QUIZ_TAGS = [
  { icon: ICON.tagDoc,   label: "5 Questions" },
  { icon: ICON.tagClock, label: "2 mins" },
  { author: true },
];
const DAY_SCHEDULE = [
  { t:"09:00", a:"AM" }, { t:"11:00", a:"AM" }, { t:"01:00", a:"PM" },
  { t:"03:00", a:"PM" }, { t:"05:00", a:"PM" }, { t:"07:00", a:"PM" },
];

let daySeed = 2;
function buildDay(label, count, mode, lockLast){
  const tasks = [];
  for (let j = 0; j < count; j++){
    const sch = DAY_SCHEDULE[j % DAY_SCHEDULE.length];
    const topic = CLASS_POOL[(daySeed * 5 + j * 3) % CLASS_POOL.length];
    const isCurrent = mode === "current" && j === 0;
    const locked = !!lockLast && j === count - 1;
    tasks.push({
      time: sch.t, ampm: sch.a,
      kind: isCurrent ? "quiz" : "read",
      current: isCurrent,
      badge: isCurrent ? "Pre-Read" : null,
      locked,
      title: locked ? "Select your Mentor" : topic,
      desc: locked ? "Your mentor will be helping you throughout your scaler journey" : (isCurrent ? QUIZ_DESC : READ_DESC),
      tags: isCurrent ? QUIZ_TAGS : READ_TAGS,
      cta: locked ? "Select your Mentor" : isCurrent ? "Start Quiz" : mode === "done" ? "Review" : "Start Reading",
    });
  }
  daySeed++;
  return { date: label, tag: "Onboarding", count, mode, tasks };
}

// Previous days (above the fold) → today → upcoming days.
const dailyPastSections = [
  buildDay("27th Apr", rint(3, 5), "done"),
  buildDay("28th Apr", rint(3, 5), "done"),
  buildDay("29th Apr", rint(3, 5), "done"),
  buildDay("30th Apr", rint(3, 5), "done"),
  buildDay("2nd May",  rint(3, 5), "done"),
  buildDay("3rd May",  rint(3, 5), "done"),
];
const dailySections = [
  buildDay("4th May", rint(4, 5), "current"),
  buildDay("5th May", rint(4, 6), "future", true),   // ends with the locked "Select your Mentor"
  buildDay("6th May", rint(3, 5), "future"),
  buildDay("7th May", rint(3, 5), "future"),
];

function dailyTags(tags){
  return tags.map((t) => t.author
    ? `<span class="tc-tag"><img class="tc-ava" src="https://i.pravatar.cc/40?img=15" alt=""/>By Anshuman Singh</span>`
    : `<span class="tc-tag">${t.icon}${t.label}</span>`).join("");
}

function taskCard(t){
  const thumb = t.locked ? ICON.tcLock : (t.kind === "quiz" ? ICON.tcUser : ICON.tcBook);
  const badge = t.badge ? `<span class="tc-badge">${t.badge}</span>` : "";
  const ctaCls = t.current ? "btn-primary" : "btn-outline";
  const cta = `<button class="${ctaCls} tc-cta"${t.locked ? " disabled" : ""}>${t.cta}${ICON.arrowUR}</button>`;
  return `
    <article class="task-card ${t.current ? "is-current" : ""} ${t.locked ? "is-locked" : ""}" data-task>
      <div class="tc-thumb ${t.current ? "tc-thumb--current" : ""} ${t.locked ? "tc-thumb--locked" : ""}">
        ${thumb}${badge}
      </div>
      <div class="tc-main">
        <div class="tc-text">
          <h3 class="tc-title">${t.title}</h3>
          <p class="tc-desc">${t.desc}</p>
        </div>
        <div class="tc-tags">${dailyTags(t.tags)}</div>
      </div>
      <div class="tc-actions">${cta}</div>
    </article>`;
}

// clock time → minutes of day (for positioning the live "Now" marker)
function toMin(time, ampm){
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function taskRow(t){
  return `
    <div class="tl-row ${t.current ? "is-current" : ""}" data-min="${toMin(t.time, t.ampm)}">
      <div class="tl-time">${t.time}<span>${t.ampm}</span></div>
      <div class="tl-rail"><span class="tl-dot ${t.current ? "tl-dot--current" : ""}"></span></div>
      <div class="tl-body">
        ${taskCard(t)}
      </div>
    </div>`;
}

function todoSection(s){
  const headerCls = s.mode === "future" ? "todo__header--dark" : s.mode === "done" ? "todo__header--done" : "";
  return `
    <section class="todo">
      <div class="todo__header ${headerCls}">
        <span class="todo__title">To-Dos for <strong>${s.date}</strong></span>
        <span class="todo__meta">
          <span class="meta-item">${ICON.hdrPath}${s.tag}</span>
          <span class="meta-sep"></span>
          <span class="meta-item">${ICON.hdrList}${s.count} Tasks</span>
        </span>
      </div>
      <div class="todo__timeline">${s.tasks.map(taskRow).join("")}</div>
    </section>`;
}

const dailyPastWrap = document.getElementById("dailyPast");
if (dailyPastWrap) dailyPastWrap.innerHTML = dailyPastSections.map(todoSection).join("");
const dailyWrap = document.getElementById("daily");
if (dailyWrap){
  dailyWrap.innerHTML = dailySections.map(todoSection).join("")
    + `<div class="load-more-wrap"><button class="load-more" id="loadMoreDaily">Load more days`
    + `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button></div>`;
}

/* ---- "Load more" → append more upcoming days at the bottom ---- */
const ordinal = (d) => { const v = d % 100; return d + (v >= 11 && v <= 13 ? "th" : (["th","st","nd","rd"][d % 10] || "th")); };
const futureCursor = { m: 4, day: 7 };   // last shown future day is 7th May
function nextFutureLabel(){
  futureCursor.day++;
  if (futureCursor.day > DAYS_IN[futureCursor.m]){ futureCursor.day = 1; futureCursor.m = (futureCursor.m + 1) % 12; }
  return ordinal(futureCursor.day) + " " + MONTHS[futureCursor.m];
}
function loadMoreDaily(){
  const btn = document.getElementById("loadMoreDaily");
  if (!btn) return;
  const frag = document.createElement("div");
  frag.innerHTML = Array.from({ length: 2 }, () => todoSection(buildDay(nextFutureLabel(), rint(3, 5), "future"))).join("");
  const added = [...frag.children];
  added.forEach((s) => btn.parentElement.parentElement.insertBefore(s, btn.parentElement));
  if (ANIMATE){
    added.forEach((s) => gsap.from(s, { opacity:0, y:18, duration:.5, ease:"power2.out", clearProps:"transform" }));
  }
  if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
}
document.getElementById("loadMoreDaily")?.addEventListener("click", loadMoreDaily);


/* ============================================================
   MOTION  (land on salutation · completed sit above the fold)
   ============================================================ */
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ANIMATE = typeof gsap !== "undefined" && !REDUCED;
/* ---------- greeting mascot (Rive · time-of-day via state-machine input) ----------
   One .riv file, one state machine. Time-of-day and interactions are driven through
   named inputs rather than swapping files. Built/authored via the Rive MCP. */
const MASCOT_FILE          = "assets/mascot/mascot.riv";
const MASCOT_STATE_MACHINE = "State Machine 1";
const MASCOT_TIME_INPUT    = "timeOfDay";                       // number input on the state machine
const TIME_OF_DAY_VALUE    = { morning: 0, afternoon: 1, evening: 2, night: 3 };

function mountMascot(){
  const mount = document.getElementById("mascotMount");
  if (!mount || typeof rive === "undefined") return null;       // fail silently, greeting stays intact

  // Rive renders into a <canvas>; create one that fills the greeting glyph box.
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  mount.appendChild(canvas);

  const r = new rive.Rive({
    src: MASCOT_FILE,
    canvas,
    autoplay: !REDUCED,                                         // reduced-motion → hold a static frame
    stateMachines: MASCOT_STATE_MACHINE,
    onLoad: () => {
      r.resizeDrawingSurfaceToCanvas();
      // drive the time-of-day state via a state-machine input
      const inputs = r.stateMachineInputs(MASCOT_STATE_MACHINE) || [];
      const tod = inputs.find((i) => i.name === MASCOT_TIME_INPUT);
      if (tod) tod.value = TIME_OF_DAY_VALUE[timeBucket()];
      if (REDUCED) r.pause();
      window.addEventListener("resize", () => r.resizeDrawingSurfaceToCanvas());
    },
    onLoadError: () => { mount.innerHTML = ""; },               // missing/broken .riv → leave greeting intact
  });
  return r;
}
mountMascot();
const TOPBAR  = 56;
const SALU_H  = 60;  // slim sticky greeting bar
const HEADER_H = 56; // current module header

const greeting       = document.getElementById("greeting");
const gGlyph         = greeting ? greeting.querySelector(".greeting__glyph") : null;
const gHi            = greeting ? greeting.querySelector(".greeting__hi") : null;
const gTitle         = greeting ? greeting.querySelector(".greeting__title") : null;
const upcomingEls    = document.querySelectorAll("#modules .module:not(.is-open)");
const pastModuleEls  = document.querySelectorAll("#pastModules .module");
const current        = document.querySelector("#modules .module.is-open");
const currentHeader  = current ? current.querySelector(".module__header") : null;
const currentLessonEls = current ? current.querySelectorAll(".lesson") : [];
const currentCert    = current ? current.querySelector(".certification") : null;

// We choose where to land — don't let the browser restore an old position.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

/* Land on the active class so the current + upcoming lessons fill the first
   screen (critical on short Windows-laptop viewports). The slim greeting bar
   stays pinned at top, so the welcome is still visible. Completed work sits
   above (scroll up). Uses layout offsets (transform-immune). */
function landOnSalutation(behavior){
  // Land on the class just BEFORE the upcoming one, so the previous class is
  // visible for context with the upcoming class right below it.
  const active = document.querySelector(".lesson--active");
  const prev = active && active.previousElementSibling && active.previousElementSibling.classList.contains("lesson")
    ? active.previousElementSibling : null;
  const target = prev || active || current || greeting;
  if (!target) return;
  let el = target, y = 0;
  while (el){ y += el.offsetTop; el = el.offsetParent; }
  const chrome = TOPBAR + SALU_H + HEADER_H + 12; // pinned bars above the lesson
  window.scrollTo({ top: Math.max(0, Math.round(y - chrome)), behavior: behavior || "auto" });
}

/* Salutation collapses to the slim bar once it pins over the current module,
   and grows back to full size when scrolled up into earlier classes.
   Uses a sentinel + IntersectionObserver — robust, no layout math. */
/* Calm live countdown on the upcoming (active) class — MM:SS, ticks once a second. */
function startCountdown(){
  const el = document.querySelector("[data-countdown]");
  if (!el) return;
  const pad = (n) => String(n).padStart(2, "0");
  const totalMs = 25 * 60 * 1000;              // class starts in 25 minutes
  const t0 = performance.now();
  const render = () => {
    const ms = Math.max(0, totalMs - (performance.now() - t0));
    el.textContent = pad(Math.floor(ms / 60000)) + ":" + pad(Math.floor((ms % 60000) / 1000));
    if (ms <= 0) clearInterval(id);
  };
  const id = setInterval(render, 1000);
  render();
}

function initGreetingCollapse(g){
  g = g || greeting;
  if (!g || g.dataset.collapseInit || typeof IntersectionObserver === "undefined") return;
  g.dataset.collapseInit = "1";
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "height:1px;width:100%;margin:0;padding:0;pointer-events:none;";
  g.parentNode.insertBefore(sentinel, g);
  new IntersectionObserver((entries) => {
    g.classList.toggle("is-slim", !entries[0].isIntersecting);
  }, { rootMargin: "-" + TOPBAR + "px 0px 0px 0px", threshold: 0 }).observe(sentinel);
}

/* Recurring ring pulse (2 pulses every 10s, stops on click) — reused by both views. */
function pulseRing(el){
  if (!el || !ANIMATE) return;
  const PULSE = { boxShadow:"0 0 0 9px rgba(0,85,255,0)", duration:0.9, ease:"power2.out" };
  const FROM  = { boxShadow:"0 0 0 0 rgba(0,85,255,.5)" };
  const tl = gsap.timeline({ repeat:-1, repeatDelay:8, delay:1 });
  tl.fromTo(el, FROM, PULSE).fromTo(el, FROM, PULSE, "+=0.2");
  el.addEventListener("click", () => { tl.kill(); gsap.set(el, { clearProps:"boxShadow" }); }, { once:true });
}

/* Daily Plan view: entrance + active-card pulse + collapsing greeting. */
let dailyInited = false;
function initDaily(){
  // Setup only — the view's slide-in (in activateView) is the entrance.
  const view = document.getElementById("view-daily");
  const g    = document.getElementById("greetingDaily");
  initGreetingCollapse(g);

  if (typeof gsap === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  if (ANIMATE){
    // later sections reveal on scroll
    view.querySelectorAll(".todo:not(:first-child)").forEach((el) => {
      gsap.from(el, { opacity:0, y:18, duration:.5, ease:"power2.out", clearProps:"transform",
        scrollTrigger:{ trigger:el, start:"top 92%", toggleActions:"play none none none" } });
    });
    pulseRing(view.querySelector(".task-card.is-current"));
  }
  setupNowIndicator();
  ScrollTrigger.refresh();
}

/* Live "Now" flag that tracks the real clock and glides along the timeline. */
function fmtNow(d){
  let h = d.getHours(); const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + String(d.getMinutes()).padStart(2, "0") + " " + ap;
}
function updateNowIndicator(){
  const curRow = document.querySelector("#view-daily .tl-row.is-current");
  if (!curRow) return;
  const tl = curRow.closest(".todo__timeline");
  const ind = tl.querySelector(".now-indicator");
  if (!ind) return;

  const now = new Date();
  ind.querySelector(".now-time").textContent = fmtNow(now);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const pts = [...tl.querySelectorAll(".tl-row")].map((r) => ({
    min: +r.dataset.min,
    y: r.offsetTop + r.offsetHeight / 2,
  }));
  let y;
  if (nowMin <= pts[0].min) y = pts[0].y;
  else if (nowMin >= pts[pts.length - 1].min) y = pts[pts.length - 1].y;
  else {
    for (let i = 0; i < pts.length - 1; i++){
      if (nowMin >= pts[i].min && nowMin <= pts[i + 1].min){
        const f = (nowMin - pts[i].min) / (pts[i + 1].min - pts[i].min);
        y = pts[i].y + f * (pts[i + 1].y - pts[i].y);
        break;
      }
    }
  }
  ind.style.top = Math.round(y) + "px";
}
let nowTimer = null;
function setupNowIndicator(){
  const curRow = document.querySelector("#view-daily .tl-row.is-current");
  if (!curRow) return;
  const tl = curRow.closest(".todo__timeline");
  if (!tl.querySelector(".now-indicator")){
    const ind = document.createElement("div");
    ind.className = "now-indicator";
    ind.innerHTML =
      `<div class="now-flag"><span class="now-lbl">Now</span><span class="now-time">--:--</span></div>` +
      `<span class="now-line"></span><span class="now-dot"></span>`;
    tl.appendChild(ind);
  }
  updateNowIndicator();
  if (!nowTimer) nowTimer = setInterval(updateNowIndicator, 30000);  // glide as time passes
}

/* Land on today's current task → previous days end up above the fold. */
function landOnDaily(behavior){
  const target = document.querySelector("#view-daily .tl-row.is-current")
    || document.querySelector("#view-daily .task-card.is-current")
    || document.getElementById("greetingDaily");
  if (!target) return;
  let el = target, y = 0; while (el){ y += el.offsetTop; el = el.offsetParent; }
  const chrome = TOPBAR + SALU_H + 52 + 16; // top bar + slim greeting + day header + gap
  window.scrollTo({ top: Math.max(0, Math.round(y - chrome)), behavior: behavior || "auto" });
  const dg = document.getElementById("greetingDaily");
  if (dg && window.scrollY > 0) dg.classList.add("is-slim");
}

/* Abstract circuit-trace divider into the past — light gray, static, and
   procedurally generated so it differs on every refresh. Purely decorative. */
function buildCircuitSVG(){
  const W = 900, H = 120;
  const stroke = "rgba(18,18,18,.10)";   // very light gray traces
  const node   = "rgba(18,18,18,.16)";   // slightly darker vias / pads
  const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const lanes = [ rint(20, 32), rint(46, 58), rint(72, 84), rint(96, 108) ];
  const pick = (arr) => arr[rint(0, arr.length - 1)];
  const p = [];

  // horizontal traces (each lane spans most of the width with random insets)
  lanes.forEach((y) => p.push(`<path d="M${rint(8,70)} ${y}H${rint(830,892)}" stroke="${stroke}" stroke-width="1.5"/>`));

  // vertical connectors between random lanes
  for (let i = 0; i < rint(4, 7); i++){
    const x = rint(70, 830), a = pick(lanes), b = pick(lanes);
    if (a !== b) p.push(`<path d="M${x} ${Math.min(a,b)}V${Math.max(a,b)}" stroke="${stroke}" stroke-width="1.5"/>`);
  }

  // right-angle branch stubs ending in a small pad
  for (let i = 0; i < rint(4, 7); i++){
    const y = pick(lanes), x = rint(70, 830), dir = Math.random() < .5 ? -1 : 1, len = rint(10, 18);
    const ex = x + (Math.random() < .5 ? -1 : 1) * rint(22, 46);
    p.push(`<path d="M${x} ${y}V${y + dir*len}H${ex}" stroke="${stroke}" stroke-width="1.5"/>`);
    p.push(`<rect x="${ex-3}" y="${y + dir*len - 3}" width="6" height="6" fill="${node}"/>`);
  }

  // vias (dots) scattered along the traces
  for (let i = 0; i < rint(7, 12); i++){
    p.push(`<circle cx="${rint(40,860)}" cy="${pick(lanes)}" r="${rint(2,3)}" fill="${node}"/>`);
  }

  return `<svg class="rewind-divider__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" fill="none">${p.join("")}</svg>`;
}

function initRewindDividers(){
  document.querySelectorAll("[data-rewind]").forEach((d) => {
    if (d.dataset.rewindInit) return;
    d.dataset.rewindInit = "1";
    d.innerHTML = buildCircuitSVG();   // fresh pattern per divider, per refresh
  });
}
initRewindDividers();

/* Pre-paint: hide entrance targets + land immediately (no flash, no jump). */
if (ANIMATE){
  gsap.set([gHi, gTitle],   { opacity:0, y:16 });
  gsap.set(gGlyph,          { opacity:0, scale:.55, transformOrigin:"50% 50%" });
  if (currentHeader) gsap.set(currentHeader, { opacity:0, y:14 });
  gsap.set(currentLessonEls,{ opacity:0, y:10 });
  if (currentCert) gsap.set(currentCert, { opacity:0, y:10 });
}
landOnSalutation();
if (greeting && window.scrollY > 0) greeting.classList.add("is-slim"); // pre-paint: we land deep

function initModules(){
  landOnSalutation();
  initGreetingCollapse();
  startCountdown();

  if (typeof gsap === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  // Sticky-header elevation when the hero header pins under the top bar.
  if (currentHeader){
    ScrollTrigger.create({
      trigger: current,
      start: "top " + (TOPBAR + SALU_H + 1),
      end: "bottom " + (TOPBAR + SALU_H + 60),
      onToggle: (self) => currentHeader.classList.toggle("is-stuck", self.isActive),
    });
  }

  // Completed modules (above the fold) and upcoming modules (below) reveal
  // gently when scrolled into view — NOT during the entrance.
  if (ANIMATE){
    pastModuleEls.forEach((el) => {
      gsap.from(el, {
        opacity:0, y:-16, duration:.5, ease:"power2.out", clearProps:"transform",
        scrollTrigger:{ trigger:el, start:"top 96%", toggleActions:"play none none none" },
      });
    });
    upcomingEls.forEach((el) => {
      gsap.from(el, {
        opacity:0, y:18, duration:.5, ease:"power2.out", clearProps:"transform",
        scrollTrigger:{ trigger:el, start:"top 95%", toggleActions:"play none none none" },
      });
    });
  }

  if (!ANIMATE){ ScrollTrigger.refresh(); return; }

  // Entrance: salutation → current module header → its classes → certification.
  // (Upcoming modules are handled by scroll reveal above, so they never beat
  //  the current module's classes onto the screen.)
  const tl = gsap.timeline({ defaults:{ ease:"power2.out" } });
  tl.to(gGlyph,         { opacity:1, scale:1, duration:.55, ease:"power3.out", clearProps:"transform" })
    .to(gHi,            { opacity:1, y:0, duration:.4, clearProps:"transform" }, "-=0.32")
    .to(gTitle,         { opacity:1, y:0, duration:.55, clearProps:"transform" }, "-=0.30")
    .to(currentHeader,  { opacity:1, y:0, duration:.45, clearProps:"transform" }, "-=0.22")
    .to(currentLessonEls, { opacity:1, y:0, duration:.45, stagger:0.05, clearProps:"transform" }, "-=0.12");
  if (currentCert) tl.to(currentCert, { opacity:1, y:0, duration:.4, clearProps:"transform" }, "-=0.1");

  // Recurring ring pulse on the upcoming class: 2 pulses, every 10s.
  // Non-transform, so hover/press still work. Clicking the class stops it.
  const activeLesson = document.querySelector(".lesson--active");
  if (activeLesson){
    const PULSE = { boxShadow:"0 0 0 9px rgba(0,85,255,0)", duration:0.9, ease:"power2.out" };
    const FROM  = { boxShadow:"0 0 0 0 rgba(0,85,255,.5)" };

    // burst of 2 pulses (~2s) then 8s rest = a 10s cycle, looping
    const pulseTl = gsap.timeline({ repeat:-1, repeatDelay:8, delay:1 });
    pulseTl
      .fromTo(activeLesson, FROM, PULSE)
      .fromTo(activeLesson, FROM, PULSE, "+=0.2");

    // stop for good once the learner engages with the class
    activeLesson.addEventListener("click", () => {
      pulseTl.kill();
      gsap.set(activeLesson, { clearProps:"boxShadow" });
    }, { once:true });
  }

  ScrollTrigger.refresh();
  landOnSalutation();
}

/* Persist the active tab across refreshes. */
function getView(){ try { return localStorage.getItem("scaler.view"); } catch (e) { return null; } }
function setView(v){ try { localStorage.setItem("scaler.view", v); } catch (e) {} }

function boot(){
  if (getView() === "daily" && document.getElementById("view-daily")){
    // restore Daily Plan — set it active before modules can paint
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-active", v.dataset.view === "daily"));
    document.querySelectorAll(".ftab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === "daily"));
    initModules();          // set modules up in the background so it's ready when switched to
    dailyInited = true;
    initDaily();
    landOnDaily();
  } else {
    initModules();
  }
}
// Run on load — but if the document already finished loading before this script
// attached (common when embedded), boot immediately so the entrance still plays
// and pre-hidden (opacity:0) elements get revealed.
if (document.readyState === "complete") boot();
else window.addEventListener("load", boot);

// Safety net: gsap.set is synchronous (doesn't need requestAnimationFrame), so
// even if the entrance timeline never advances (e.g. the tab was never visible
// and rAF stayed parked), reveal the pre-hidden greeting + current module after
// the entrance window so nothing is ever stuck at opacity 0. When the entrance
// did play, these are already visible and clearProps is a harmless no-op.
if (ANIMATE){
  setTimeout(() => {
    const reveal = (el) => { if (el && getComputedStyle(el).opacity === "0") gsap.set(el, { clearProps: "opacity,transform" }); };
    [gHi, gTitle, gGlyph, currentHeader, currentCert].forEach(reveal);
    if (currentLessonEls) currentLessonEls.forEach(reveal);
  }, 2600);
}


/* ============================================================
   SCROLL-UP HINT  +  CENTER FLOATING UI ON THE CONTENT COLUMN
   ============================================================ */
(function () {
  const hint    = document.getElementById("scrollHint");
  const tabs    = document.querySelector(".floating-tabs");
  const content = document.querySelector(".content");
  let dismissed = false;

  // Center the floating pill + hint on the content column (not the viewport).
  function centerOnContent(){
    if (!content) return;
    const r = content.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2);
    if (tabs) tabs.style.left = cx + "px";
    if (hint) hint.style.left = cx + "px";
  }
  centerOnContent();
  window.addEventListener("resize", centerOnContent);
  window.addEventListener("load", centerOnContent);

  function showHint(){
    if (!hint) return;
    hint.classList.add("is-visible");
    if (ANIMATE) gsap.fromTo(hint, { opacity:0, y:-8 }, { opacity:1, y:0, duration:.45, ease:"power2.out" });
  }
  function hideHint(){
    if (!hint) return;
    if (ANIMATE){
      gsap.to(hint, { opacity:0, y:-8, duration:.35, ease:"power2.in",
        onComplete:() => hint.classList.remove("is-visible") });
    } else {
      hint.classList.remove("is-visible");
    }
  }

  // Only surface the hint after 12s — regardless of any scrolling — then ease it out.
  setTimeout(() => {
    showHint();
    setTimeout(hideHint, 6000);
  }, 12000);
})();


/* ============================================================
   ACCORDION  (any module expands / collapses) — event delegation
   Height is GSAP-animated; overflow opens to `visible` once expanded so
   hover-grow on the cards is never clipped.
   ============================================================ */
function setOpen(module, open){
  const body = module.querySelector(".module__body");
  if (!body) return;
  const refresh = () => { if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(); };

  if (typeof gsap !== "undefined") gsap.killTweensOf(body);

  if (open){
    fillLessons(module);            // lazily render this module's classes on first open
    module.classList.add("is-open");
    if (ANIMATE){
      gsap.set(body, { overflow:"hidden", height:0 });
      gsap.to(body, { height: body.scrollHeight, duration:.4, ease:"power2.out",
        onComplete: () => { body.style.height = "auto"; body.style.overflow = ""; refresh(); } });
      const rows = module.querySelectorAll(".lesson");
      if (rows.length){
        gsap.fromTo(rows, { opacity:0, y:12 },
          { opacity:1, y:0, duration:.4, stagger:0.035, ease:"power2.out", delay:.05, clearProps:"transform" });
      }
    } else {
      body.style.height = "auto"; body.style.overflow = "";
      refresh();
    }
  } else {
    if (ANIMATE){
      gsap.set(body, { overflow:"hidden", height: body.scrollHeight });
      gsap.to(body, { height:0, duration:.32, ease:"power2.in",
        onComplete: () => { module.classList.remove("is-open"); body.style.height = ""; body.style.overflow = ""; refresh(); } });
    } else {
      module.classList.remove("is-open"); body.style.height = ""; body.style.overflow = "";
      refresh();
    }
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-toggle]");
  if (!btn) return;

  const module = btn.closest("[data-module]");
  const willOpen = !module.classList.contains("is-open");

  // single-open accordion: collapse others
  document.querySelectorAll(".module.is-open").forEach((m) => {
    if (m !== module) setOpen(m, false);
  });
  setOpen(module, willOpen);
});

/* ============================================================
   VIEW SWITCHING (tabs) + GO TO TODAY
   ============================================================ */
// position the active view at its on-load spot (lands on "today")
function placeView(name){
  if (name === "daily"){
    if (!dailyInited){ dailyInited = true; initDaily(); }
    landOnDaily();
  } else {
    landOnSalutation();
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  }
}

function activateView(name){
  const next = document.querySelector(`.view[data-view="${name}"]`);
  const cur  = document.querySelector(".view.is-active");
  if (!next || next === cur) return;

  setView(name);   // remember the tab for next refresh
  document.querySelectorAll(".ftab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === name));

  if (!ANIMATE || !cur){
    if (cur) cur.classList.remove("is-active");
    next.classList.add("is-active");
    placeView(name);
    return;
  }

  // gradual cross-slide — but the salutation stays put (same on both views),
  // so we animate everything EXCEPT the .greeting.
  const body = (v) => [...v.children].filter((c) => !c.classList.contains("greeting"));
  const toLeft = name === "daily";        // Daily Plan is the left tab
  const outX = toLeft ? 30 : -30;
  const inX  = toLeft ? -30 : 30;
  gsap.to(body(cur), { opacity:0, x:outX, duration:.2, ease:"power2.in", onComplete:() => {
    cur.classList.remove("is-active");
    gsap.set(body(cur), { clearProps:"opacity,transform" });
    next.classList.add("is-active");
    placeView(name);                       // reposition while hidden (no visible jump)
    gsap.fromTo(body(next), { opacity:0, x:inX },
      { opacity:1, x:0, duration:.32, ease:"power2.out", clearProps:"opacity,transform" });
  }});
}

document.querySelectorAll(".ftab").forEach((tab) => {
  tab.addEventListener("click", () => activateView(tab.dataset.view));
});

// Go to today → smoothly return to the active view's on-load position
const goToday = document.getElementById("goToday");
if (goToday){
  goToday.addEventListener("click", () => {
    const active = document.querySelector(".view.is-active");
    if (active && active.dataset.view === "daily") landOnDaily("smooth");
    else landOnSalutation("smooth");
  });
}

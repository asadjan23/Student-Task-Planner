// Single-file Student Task Planner (clean, no duplicates)

(function () {
  // DOM refs
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const addButton = document.getElementById("add-button");
  const taskList = document.getElementById("task-list");
  const progressFill = document.querySelector(".progress-fill");
  const progressText = document.getElementById("progress-text");
  const streakEl = document.getElementById("streak-count");
  const quoteEl = document.getElementById("quote");
  const bgContainer = document.getElementById("interactive-bg");
  const copyQuoteBtn = document.getElementById("copy-quote");
  const streakCard = document.querySelector(".streak-card");

  // keys
  const TASKS_KEY = "student-planner-tasks";
  const STREAK_KEY = "student-planner-streak";
  const SETTINGS_KEY = "student-planner-settings";

  const todayKey = () => new Date().toISOString().slice(0, 10);
  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++)
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return h;
  }

  // Create task DOM
  function createTaskItem(data) {
    const text = typeof data === "string" ? data : (data && data.text) || "";
    const completed = data && !!data.completed;
    const completedDate =
      data && data.completedDate ? data.completedDate : null;

    const li = document.createElement("li");
    li.className = "task-item";
    const left = document.createElement("div");
    left.className = "task-left";
    const chk = document.createElement("button");
    chk.className = "task-checkbox";
    chk.setAttribute("aria-label", "Mark task complete");
    chk.textContent = completed ? "✓" : "";
    const span = document.createElement("span");
    span.className = "task-text";
    span.contentEditable = true;
    span.setAttribute("role", "textbox");
    span.setAttribute("tabindex", "0");
    span.textContent = text;
    left.appendChild(chk);
    left.appendChild(span);
    const actions = document.createElement("div");
    actions.className = "task-actions";
    const del = document.createElement("button");
    del.className = "delete";
    del.setAttribute("aria-label", "Delete task");
    del.textContent = "🗑️";
    actions.appendChild(del);
    li.appendChild(left);
    li.appendChild(actions);

    if (completed) {
      span.classList.add("completed");
      if (completedDate) li.dataset.completedDate = completedDate;
    }

    function updateBadge() {
      const badge = li.querySelector(".badge-today");
      if (li.dataset.completedDate === todayKey()) {
        if (!badge) {
          const b = document.createElement("span");
          b.className = "badge-today";
          b.textContent = "Done today";
          left.appendChild(b);
        }
      } else if (badge) badge.remove();
    }
    updateBadge();

    chk.addEventListener("click", () => {
      const was = span.classList.contains("completed");
      span.classList.toggle("completed");
      if (!was && span.classList.contains("completed")) {
        chk.textContent = "✓";
        li.dataset.completedDate = todayKey();
      } else {
        chk.textContent = "";
        delete li.dataset.completedDate;
      }
      updateBadge();
      saveTasks();
      updateProgress();
      checkStreak();
    });

    del.addEventListener("click", () => {
      li.remove();
      saveTasks();
      updateProgress();
    });
    span.addEventListener("input", () => saveTasks());
    span.addEventListener("blur", () => {
      if (!span.textContent.trim()) {
        li.remove();
        saveTasks();
        updateProgress();
        return;
      }
      saveTasks();
    });

    return li;
  }

  // Add task handler
  addButton &&
    addButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (!taskInput) return;
      const v = taskInput.value.trim();
      if (!v) return;
      const li = createTaskItem({ text: v });
      taskList.appendChild(li);
      taskInput.value = "";
      taskInput.focus();
      saveTasks();
      updateProgress();
    });

  // Persistence
  function saveTasks() {
    const items = Array.from(taskList.querySelectorAll(".task-item")).map(
      (li) => ({
        text: li.querySelector(".task-text").textContent,
        completed: li
          .querySelector(".task-text")
          .classList.contains("completed"),
        completedDate: li.dataset.completedDate || null,
      })
    );
    localStorage.setItem(TASKS_KEY, JSON.stringify(items));
  }
  function loadTasks() {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (!raw) return;
      const items = JSON.parse(raw);
      items.forEach((it) => taskList.appendChild(createTaskItem(it)));
      updateProgress();
    } catch (e) {
      console.error(e);
    }
  }

  // Progress
  function updateProgress() {
    const items = Array.from(taskList.querySelectorAll(".task-item"));
    if (!items.length) {
      setProgress(0);
      return;
    }
    const done = items.filter((li) =>
      li.querySelector(".task-text").classList.contains("completed")
    ).length;
    const pct = Math.round((done / items.length) * 100);
    setProgress(pct);
  }
  function setProgress(pct) {
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressText) progressText.textContent = pct + "% complete";
    const bar = document.getElementById("progress");
    if (bar) bar.setAttribute("aria-valuenow", String(pct));
  }

  // Streak
  function checkStreak() {
    const raw = localStorage.getItem(STREAK_KEY);
    const now = new Date();
    const today = todayKey();
    let streak = { count: 0, lastDate: null };
    try {
      if (raw) streak = JSON.parse(raw);
    } catch (e) {}
    const hasToday = Array.from(taskList.querySelectorAll(".task-item")).some(
      (li) =>
        li.querySelector(".task-text").classList.contains("completed") &&
        li.dataset.completedDate === today
    );
    if (!hasToday) return;
    if (streak.lastDate === today) return;
    if (streak.lastDate) {
      const last = new Date(streak.lastDate);
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      if (last.toISOString().slice(0, 10) === y.toISOString().slice(0, 10))
        streak.count = (streak.count || 0) + 1;
      else streak.count = 1;
    } else streak.count = 1;
    streak.lastDate = today;
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    updateStreakUI();
    fireConfetti();
  }
  function updateStreakUI() {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (!streakEl) return;
      if (!raw) {
        streakEl.textContent = "0";
        streakEl.dataset.value = "0";
        return;
      }
      const s = JSON.parse(raw);
      const newCount = Number(s.count || 0);
      const prevCount = Number(streakEl.dataset.value || 0);
      streakEl.textContent = String(newCount);
      streakEl.dataset.value = String(newCount);
      // animate when streak increments and user hasn't requested reduced motion
      try {
        const settings = loadSettings();
        const reduced = settings && settings.reducedMotion;
        if (streakCard && newCount > prevCount && !reduced) {
          streakCard.classList.add("streak-up");
          setTimeout(() => streakCard.classList.remove("streak-up"), 900);
        }
      } catch (e) {
        /* ignore */
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Quotes
  const QUOTES = [
    "Small progress each day adds up to big results.",
    "You don't have to be perfect to be amazing.",
    "Focus on progress, not perfection.",
    "Stay curious. Keep learning.",
    "One step at a time—today counts.",
    "Your future self will thank you for what you do today.",
    "Make it simple, but significant.",
  ];
  function showQuote() {
    if (!quoteEl) return;
    const today = todayKey();
    const key = "student-planner-quote-" + today;
    let q = localStorage.getItem(key);
    if (!q) {
      const idx = Math.abs(hashCode(today)) % QUOTES.length;
      q = QUOTES[idx];
      localStorage.setItem(key, q);
    }
    quoteEl.textContent = '"' + q + '"';
    if (copyQuoteBtn)
      copyQuoteBtn.setAttribute("aria-label", "Copy quote: " + q.slice(0, 60));
  }

  // Confetti
  function ensureCanvas() {
    let c = document.getElementById("confetti-canvas");
    if (c) return c;
    c = document.createElement("canvas");
    c.id = "confetti-canvas";
    document.body.appendChild(c);
    c.width = innerWidth;
    c.height = innerHeight;
    window.addEventListener("resize", () => {
      c.width = innerWidth;
      c.height = innerHeight;
    });
    return c;
  }
  function fireConfetti() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const canvas = ensureCanvas();
    const ctx = canvas.getContext("2d");
    const parts = [];
    const colors = ["#5b6cff", "#7b88ff", "#34c759", "#ff8a00", "#ff6fb5"];
    for (let i = 0; i < 90; i++)
      parts.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 6 + 2,
        size: Math.random() * 8 + 4,
        color: colors[i % colors.length],
        rot: Math.random() * 360,
      });
    let t0 = performance.now();
    function draw(now) {
      const dt = (now - t0) / 1000;
      t0 = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * (Math.PI / 180));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      for (let i = parts.length - 1; i >= 0; i--)
        if (parts[i].y > canvas.height + 50) parts.splice(i, 1);
      if (parts.length) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(draw);
  }

  // Parallax
  const bgIcons = bgContainer
    ? Array.from(bgContainer.querySelectorAll(".bg-icon"))
    : [];
  function applyParallax(eX, eY) {
    const w = innerWidth,
      h = innerHeight,
      cx = eX / w - 0.5,
      cy = eY / h - 0.5;
    bgIcons.forEach((el) => {
      const d = parseFloat(el.dataset.depth) || 0.06;
      el.style.transform = `translate3d(${cx * d * 120}px, ${
        cy * d * 80
      }px, 0)`;
    });
  }
  if (bgIcons.length) {
    window.addEventListener(
      "mousemove",
      (ev) => applyParallax(ev.clientX, ev.clientY),
      { passive: true }
    );
    window.addEventListener(
      "touchmove",
      (ev) => {
        if (!ev.touches || !ev.touches[0]) return;
        applyParallax(ev.touches[0].clientX, ev.touches[0].clientY);
      },
      { passive: true }
    );
    window.addEventListener("mouseleave", () =>
      bgIcons.forEach((el) => (el.style.transform = "translate3d(0,0,0)"))
    );
  }

  // Settings wiring
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const bgModeRadios = Array.from(
    document.querySelectorAll('input[name="bg-mode"]')
  );
  const reducedMotionCheckbox = document.getElementById("reduced-motion");
  const accentSwatches = Array.from(
    document.querySelectorAll(".accent-swatch")
  );
  const settingsReset = document.getElementById("settings-reset");
  const settingsResetDay = document.getElementById("settings-reset-day");

  function loadSettings() {
    try {
      const r = localStorage.getItem(SETTINGS_KEY);
      return r ? JSON.parse(r) : {};
    } catch (e) {
      return {};
    }
  }
  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }
  function applySettings(s) {
    if (s.bgMode === "solid") document.body.classList.add("theme-solid");
    else document.body.classList.remove("theme-solid");
    if (s.reducedMotion)
      document.documentElement.style.setProperty("scroll-behavior", "auto");
    else document.documentElement.style.removeProperty("scroll-behavior");
    document.documentElement.classList.remove(
      "accent-blue",
      "accent-green",
      "accent-orange",
      "accent-pink"
    );
    if (s.accent) document.documentElement.classList.add("accent-" + s.accent);
    bgModeRadios.forEach(
      (r) => (r.checked = r.value === (s.bgMode || "image"))
    );
    if (reducedMotionCheckbox)
      reducedMotionCheckbox.checked = !!s.reducedMotion;
  }
  const initialSettings = Object.assign(
    { bgMode: "image", reducedMotion: false, accent: "blue" },
    loadSettings()
  );
  applySettings(initialSettings);
  settingsBtn &&
    settingsBtn.addEventListener("click", () => {
      const expanded = settingsBtn.getAttribute("aria-expanded") === "true";
      settingsBtn.setAttribute("aria-expanded", String(!expanded));
      settingsPanel.setAttribute("aria-hidden", String(expanded));
    });
  bgModeRadios.forEach((r) =>
    r.addEventListener("change", (e) => {
      const s = loadSettings();
      s.bgMode = e.target.value;
      saveSettings(s);
      applySettings(s);
    })
  );
  reducedMotionCheckbox &&
    reducedMotionCheckbox.addEventListener("change", (e) => {
      const s = loadSettings();
      s.reducedMotion = e.target.checked;
      saveSettings(s);
      if (e.target.checked)
        document.documentElement.style.setProperty(
          "animation-duration",
          "0.001ms"
        );
      else document.documentElement.style.removeProperty("animation-duration");
      applySettings(s);
    });
  accentSwatches.forEach((b) =>
    b.addEventListener("click", () => {
      const s = loadSettings();
      s.accent = b.dataset.accent;
      saveSettings(s);
      applySettings(s);
    })
  );
  settingsReset &&
    settingsReset.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem(SETTINGS_KEY);
      const s = { bgMode: "image", reducedMotion: false, accent: "blue" };
      applySettings(s);
      saveSettings(s);
    });
  settingsResetDay &&
    settingsResetDay.addEventListener("click", (e) => {
      e.preventDefault();
      const today = todayKey();
      Array.from(taskList.querySelectorAll(".task-item")).forEach((li) => {
        if (li.dataset.completedDate === today) {
          li.querySelector(".task-text").classList.remove("completed");
          li.querySelector(".task-checkbox").textContent = "";
          delete li.dataset.completedDate;
          const badge = li.querySelector(".badge-today");
          if (badge) badge.remove();
        }
      });
      saveTasks();
      updateProgress();
    });

  // init
  loadTasks();
  updateStreakUI();
  showQuote();
  // copy quote button handler
  if (copyQuoteBtn) {
    copyQuoteBtn.addEventListener("click", async () => {
      const raw = quoteEl ? quoteEl.textContent || "" : "";
      const txt = raw.replace(/^"|"$/g, "").trim();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(txt);
        } else {
          const ta = document.createElement("textarea");
          ta.value = txt;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        const prev = copyQuoteBtn.textContent;
        copyQuoteBtn.textContent = "Copied!";
        setTimeout(() => (copyQuoteBtn.textContent = prev || "Copy"), 1200);
      } catch (err) {
        console.error("copy failed", err);
      }
    });
  }
})();

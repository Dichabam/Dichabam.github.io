export class Biometrics {
  constructor() {
    this.mouseSpeed = 0;
    this.moodScore = 0; // 0.0 = calm, 1.0 = frantic
    this.smoothedMood = 0; // lerped version for smooth transitions

    this.lastMouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      time: Date.now(),
    };

    // Colour stops: [calm colour (blue/purple)] → [frantic colour (orange/red)]
    this.CALM_HUE = 200; // cyan-blue
    this.FRANTIC_HUE = 15; // orange-red
    this.CALM_SAT = 80;
    this.FRANTIC_SAT = 100;
    this.CALM_LIT = 45;
    this.FRANTIC_LIT = 55;

    this.moodEl = null;
    this.moodDot = null;
    this.moodText = null;
    this.moodBarFill = null;

    this.prevMoodLabel = "";

    this.init();
  }

  init() {
    this.createMoodUI();

    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("scroll", this.onScroll.bind(this), {
      passive: true,
    });

    this.loop();
  }

  createMoodUI() {
    // Inject the mood indicator HTML (styled in themes.css)
    const el = document.createElement("div");
    el.id = "mood-indicator";
    el.innerHTML = `
      <div class="mood-dot"></div>
      <div id="mood-bar-track"><div id="mood-bar-fill"></div></div>
      <span class="mood-text" id="mood-text-label">CALM</span>
    `;
    document.body.appendChild(el);

    this.moodEl = el;
    this.moodDot = el.querySelector(".mood-dot");
    this.moodText = el.querySelector("#mood-text-label");
    this.moodBarFill = el.querySelector("#mood-bar-fill");
  }

  onMouseMove(e) {
    const now = Date.now();
    const dt = Math.max(1, now - this.lastMouse.time);
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.mouseSpeed = dist / dt; // px/ms
    this.lastMouse = { x: e.clientX, y: e.clientY, time: now };

    if (this.mouseSpeed > 1.5) {
      this.moodScore = Math.min(1.0, this.moodScore + this.mouseSpeed * 0.006);
    }
  }

  onScroll() {
    this.moodScore = Math.min(1.0, this.moodScore + 0.04);
  }

  // Lerp between two numbers
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Convert mood 0–1 to a CSS HSL colour string
  moodToHSL(mood) {
    const h = this.lerp(this.CALM_HUE, this.FRANTIC_HUE, mood);
    const s = this.lerp(this.CALM_SAT, this.FRANTIC_SAT, mood);
    const l = this.lerp(this.CALM_LIT, this.FRANTIC_LIT, mood);
    return {
      h,
      s,
      l,
      css: `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`,
    };
  }

  loop() {
    // Slowly decay back toward calm
    this.moodScore = Math.max(0, this.moodScore - 0.003);

    // Smooth the raw value so colours transition gracefully
    this.smoothedMood += (this.moodScore - this.smoothedMood) * 0.04;

    const mood = this.smoothedMood;
    const colour = this.moodToHSL(mood);

    // ── 1. Update CSS custom property (3D particles read this) ─────────────
    document.documentElement.style.setProperty("--mood-score", mood.toFixed(3));
    document.documentElement.style.setProperty("--mood-h", colour.h.toFixed(0));
    document.documentElement.style.setProperty(
      "--mood-s",
      colour.s.toFixed(0) + "%",
    );
    document.documentElement.style.setProperty(
      "--mood-l",
      colour.l.toFixed(0) + "%",
    );
    document.documentElement.style.setProperty("--mood-color", colour.css);

    // ── 2. Drive the Neural Swarm canvas colour ────────────────────────────
    const swarmCanvas = document.getElementById("neural-canvas");
    if (swarmCanvas) {
      swarmCanvas.style.setProperty("--swarm-hue", colour.h.toFixed(0));
    }

    // ── 3. Update the particle system accent via a dispatched event ─────────
    window.dispatchEvent(
      new CustomEvent("biometricUpdate", {
        detail: {
          mood,
          colour: colour.css,
          h: colour.h,
          s: colour.s,
          l: colour.l,
          speed: this.mouseSpeed,
        },
      }),
    );

    // ── 4. Update mood indicator widget ───────────────────────────────────
    if (this.moodEl) {
      // Show the indicator once the user has actually moved
      if (mood > 0.02 && !this.moodEl.classList.contains("visible")) {
        this.moodEl.classList.add("visible");
      }

      // Colour the dot and bar
      if (this.moodDot) {
        this.moodDot.style.background = colour.css;
        this.moodDot.style.boxShadow = `0 0 6px ${colour.css}`;
      }
      if (this.moodBarFill) {
        this.moodBarFill.style.width = `${(mood * 100).toFixed(1)}%`;
        this.moodBarFill.style.background = colour.css;
      }

      // Label
      let label = "CALM";
      if (mood > 0.7) label = "FRANTIC";
      else if (mood > 0.45) label = "ACTIVE";
      else if (mood > 0.2) label = "ENGAGED";

      if (this.moodText && label !== this.prevMoodLabel) {
        this.moodText.textContent = label;
        this.moodText.style.color = colour.css;
        this.prevMoodLabel = label;
      }
    }

    // ── 5. Apply impatient body class for dramatic CSS side-effects ─────────
    document.body.classList.toggle("mood-impatient", mood > 0.65);

    requestAnimationFrame(this.loop.bind(this));
  }
}

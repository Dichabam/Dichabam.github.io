import { state } from "../core/state.js";
import { debounce } from "../core/utils.js"; // Optimization import

export class TouchRipple {
  constructor() {
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.ripples = [];
    this.touches = [];
    this.animationId = null;
    this.isRunning = false;

    this.colors = ["#03b3c3", "#ff0055", "#00ff88"];

    if (this.isTouchDevice()) {
      this.init();
    }
  }

  isTouchDevice() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  init() {
    this.createToggleButton();
    this.setupCanvas();
    this.bindEvents();

    const clue = document.getElementById("touch-clue");
    if (clue) {
      clue.style.display = "inline";
    }
  }

  createToggleButton() {
    const btn = document.createElement("button");
    btn.id = "touch-toggle-btn";
    btn.className = "touch-toggle-btn glass-surface";
    btn.innerHTML = '<i class="fas fa-fingerprint"></i>';
    btn.setAttribute("aria-label", "Toggle Quantum Touch");
    document.body.appendChild(btn);

    btn.addEventListener("click", () => this.toggle());
  }

  setupCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "quantum-touch-canvas";
    this.canvas.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 9997; pointer-events: none; opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    // OPTIMIZATION: Debounce resize
    window.addEventListener(
      "resize",
      debounce(() => this.resize(), 200)
    );

    window.addEventListener("touchstart", (e) => this.handleTouch(e), {
      passive: true,
    });
    window.addEventListener("touchmove", (e) => this.handleTouch(e), {
      passive: true,
    });
    window.addEventListener("touchend", (e) => this.handleTouch(e));
    window.addEventListener("touchcancel", (e) => this.handleTouch(e));
  }

  toggle() {
    this.isActive = !this.isActive;
    const btn = document.getElementById("touch-toggle-btn");
    const clue = document.getElementById("touch-clue");

    if (this.isActive) {
      this.canvas.style.opacity = "1";
      btn.classList.add("active");
      btn.innerHTML = '<i class="fas fa-bolt"></i>';
      this.startLoop();
      this.showFeedback("Quantum Touch Online");

      if (clue) {
        clue.innerText = " :: [Q]uantum: active";
        clue.style.color = "var(--accent)";
      }
    } else {
      this.canvas.style.opacity = "0";
      btn.classList.remove("active");
      btn.innerHTML = '<i class="fas fa-fingerprint"></i>';

      setTimeout(() => {
        if (!this.isActive) this.touches = [];
      }, 500);
      this.showFeedback("Systems Normal");

      if (clue) {
        clue.innerText = " :: [Q]uantum: offline";
        clue.style.color = "var(--danger)";
      }
    }
  }

  handleTouch(e) {
    if (!this.isActive) return;

    this.touches = Array.from(e.touches).map((t) => ({
      x: t.clientX,
      y: t.clientY,
      id: t.identifier,
    }));

    if (e.type === "touchstart" || e.type === "touchmove") {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];

        if (e.type === "touchstart") {
          this.ripples.push({
            x: t.clientX,
            y: t.clientY,
            r: 0,
            alpha: 1,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
          });
        }

        this.spawnParticles(t.clientX, t.clientY);
      }
    }
  }

  spawnParticles(x, y) {
    if (Math.random() > 0.5) return;

    const count = 2;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        size: Math.random() * 3 + 1,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        char: Math.random() > 0.5 ? "1" : "0",
      });
    }
  }

  startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  animate() {
    if (
      !this.isActive &&
      this.particles.length === 0 &&
      this.ripples.length === 0
    ) {
      this.isRunning = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.touches.length > 1) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      this.ctx.lineWidth = 1;

      for (let i = 0; i < this.touches.length; i++) {
        for (let j = i + 1; j < this.touches.length; j++) {
          this.ctx.moveTo(this.touches[i].x, this.touches[i].y);
          this.ctx.lineTo(this.touches[j].x, this.touches[j].y);
        }
      }
      this.ctx.stroke();

      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = "#03b3c3";
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];

      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      this.ctx.strokeStyle = r.color;
      this.ctx.globalAlpha = r.alpha;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(r.x + 5, r.y + 5, r.r * 0.9, 0, Math.PI * 2);
      this.ctx.strokeStyle = "rgba(255,0,0,0.5)";
      this.ctx.stroke();

      r.r += 5;
      r.alpha -= 0.03;

      if (r.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }

    this.ctx.globalAlpha = 1;
    this.ctx.font = "10px monospace";

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;

      if (Math.random() > 0.5) {
        this.ctx.fillText(p.char, p.x, p.y);
      } else {
        this.ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.ctx.globalAlpha = 1;
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  showFeedback(text) {
    const popup = document.querySelector(".feature-popup");
    if (!popup) {
      const div = document.createElement("div");
      div.className = "feature-popup active";
      div.innerHTML = `<h3>${text}</h3>`;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2000);
    } else {
      popup.innerHTML = `<h3>${text}</h3>`;
      popup.classList.add("active");
      setTimeout(() => popup.classList.remove("active"), 2000);
    }
  }
}

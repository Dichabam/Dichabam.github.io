import { state } from "../core/state.js";
import { debounce } from "../core/utils.js";

export class NeonSling {
  constructor() {
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.animationId = null;

    this.projectiles = [];
    this.particles = [];
    this.dragStart = null;
    this.dragCurrent = null;

    // New properties for scroll vs sling detection
    this.isSlinging = false;
    this.slingTimer = null;

    this.tapCount = 0;
    this.tapTimer = null;
    this.clueElement = null;
    this.closeBtn = null;

    this.colors = ["#ff00ff", "#00ffff", "#ffff00", "#ff0055"];
    this.friction = 0.99;
    this.gravity = 0.2;
    this.bounceDamping = 0.7;

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
    this.canvas = document.createElement("canvas");
    this.canvas.id = "sling-canvas";
    // Changed touch-action from none to pan-y to allow browser vertical scrolling
    this.canvas.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 9998; pointer-events: none; opacity: 0;
        transition: opacity 0.5s ease;
        touch-action: pan-y; 
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    this.createCloseButton();

    setTimeout(() => this.setupClue(), 1000);

    // OPTIMIZATION: Debounce resize
    window.addEventListener(
      "resize",
      debounce(() => this.resize(), 200)
    );

    // Passive: false is required so we can conditionally call preventDefault()
    window.addEventListener("touchstart", (e) => this.handleStart(e), {
      passive: false,
    });
    window.addEventListener("touchmove", (e) => this.handleMove(e), {
      passive: false,
    });
    window.addEventListener("touchend", (e) => this.handleEnd(e));

    this.resize();
  }

  createCloseButton() {
    this.closeBtn = document.createElement("button");
    this.closeBtn.innerHTML = "&times;";
    this.closeBtn.ariaLabel = "Close Slingshot Mode";
    this.closeBtn.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        width: 44px; height: 44px;
        background: rgba(0, 0, 0, 0.6); 
        border: 1px solid #00ff88;
        color: #00ff88; 
        font-size: 28px; 
        line-height: 1;
        border-radius: 50%; 
        z-index: 10000; /* Above the canvas */
        display: none; 
        justify-content: center; 
        align-items: center;
        cursor: pointer; 
        backdrop-filter: blur(5px);
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
    `;

    const closeAction = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    };

    this.closeBtn.addEventListener("click", closeAction);
    this.closeBtn.addEventListener("touchstart", closeAction, {
      passive: false,
    });

    document.body.appendChild(this.closeBtn);
  }

  setupClue() {
    this.clueElement = document.getElementById("sling-clue");
    if (this.clueElement) {
      this.clueElement.style.position = "relative";
      this.clueElement.style.zIndex = "9999";

      this.clueElement.addEventListener("click", (e) => {
        this.chargeSystem();
      });
      this.clueElement.addEventListener(
        "touchstart",
        (e) => {
          // e.preventDefault(); // removed to allow scrolling interactions
          this.chargeSystem();
        },
        { passive: true }
      );
    }
  }

  chargeSystem() {
    this.tapCount++;
    const pct = Math.min(100, this.tapCount * 20);
    this.clueElement.innerText = ` :: [K]inetic: ${pct}%`;
    this.clueElement.style.color = `rgb(${255}, ${255 - pct * 2.5}, ${
      255 - pct * 2.5
    })`;

    // FEATURE: Haptic click on charge
    if (navigator.vibrate) navigator.vibrate(5);

    if (this.tapTimer) clearTimeout(this.tapTimer);

    this.tapTimer = setTimeout(() => {
      if (!this.isActive) {
        this.tapCount = 0;
        this.clueElement.innerText = ` :: [K]inetic: 0%`;
        this.clueElement.style.color = "";
      }
    }, 800);

    if (this.tapCount >= 5) {
      this.toggle();
      this.tapCount = 0;
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  }

  toggle() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      this.canvas.style.opacity = "1";
      this.canvas.style.pointerEvents = "auto";
      this.closeBtn.style.display = "flex";
      this.startLoop();
      // Updated feedback to explain the new interaction
      this.showFeedback("SLINGSHOT READY: HOLD & DRAG");

      if (this.clueElement) {
        this.clueElement.innerText = " :: [K]inetic: ACTIVE";
        this.clueElement.style.color = "#00ff88";
        this.clueElement.style.textShadow = "0 0 10px #00ff88";
      }
    } else {
      this.canvas.style.opacity = "0";
      this.canvas.style.pointerEvents = "none";
      this.closeBtn.style.display = "none";
      this.showFeedback("SYSTEM DISENGAGED");

      if (this.clueElement) {
        this.clueElement.innerText = " :: [K]inetic: 0%";
        this.clueElement.style.color = "";
        this.clueElement.style.textShadow = "";
      }
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  handleStart(e) {
    if (!this.isActive) return;
    if (e.target === this.closeBtn || this.closeBtn.contains(e.target)) return;
    if (e.target === this.clueElement) return;

    // Do NOT preventDefault immediately. We need to see if user wants to scroll or sling.
    // e.preventDefault();

    const t = e.changedTouches[0];
    this.dragStart = { x: t.clientX, y: t.clientY };
    this.dragCurrent = { x: t.clientX, y: t.clientY };

    this.isSlinging = false;

    // Start a timer. If user holds without moving significantly, we assume Sling Intent.
    // If they move quickly before timer, we assume Scroll Intent.
    this.slingTimer = setTimeout(() => {
      this.isSlinging = true;
      // Optional: Trigger a small visual feedback here to indicate "Locked"
      if (navigator.vibrate) navigator.vibrate(20);
    }, 150);
  }

  handleMove(e) {
    if (!this.isActive || !this.dragStart) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - this.dragStart.x;
    const dy = t.clientY - this.dragStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If "Sling Mode" is locked in, we capture the event and prevent scroll
    if (this.isSlinging) {
      if (e.cancelable) e.preventDefault();
      this.dragCurrent = { x: t.clientX, y: t.clientY };
    } else {
      // If we haven't locked yet, check if the user is moving (Scrolling)
      if (dist > 10) {
        // User moved > 10px before the timer fired. Assume Scroll.
        if (this.slingTimer) {
          clearTimeout(this.slingTimer);
          this.slingTimer = null;
        }
        // We do NOT update dragCurrent, effectively cancelling the sling visual
        // We do NOT preventDefault, letting browser handle scroll
      }
    }
  }

  handleEnd(e) {
    if (!this.isActive || !this.dragStart) return;

    // Clear timer if it's still pending
    if (this.slingTimer) {
      clearTimeout(this.slingTimer);
      this.slingTimer = null;
    }

    // Only fire if we were in "Sling Mode"
    if (this.isSlinging && this.dragCurrent) {
      const dx = this.dragStart.x - this.dragCurrent.x;
      const dy = this.dragStart.y - this.dragCurrent.y;

      const power = Math.sqrt(dx * dx + dy * dy);
      if (power > 30) {
        this.fireProjectile(
          this.dragStart.x,
          this.dragStart.y,
          dx * 0.15,
          dy * 0.15
        );
        // FEATURE: Haptic recoil
        if (navigator.vibrate) navigator.vibrate(40);
      }
    }

    this.dragStart = null;
    this.dragCurrent = null;
    this.isSlinging = false;
  }

  fireProjectile(x, y, vx, vy) {
    this.projectiles.push({
      x,
      y,
      vx,
      vy,
      radius: 8,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      life: 1.0,
      trail: [],
    });
  }

  spawnExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: color,
        gravity: 0.1,
      });
    }
  }

  startLoop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animate();
  }

  animate() {
    if (
      !this.isActive &&
      this.projectiles.length === 0 &&
      this.particles.length === 0
    ) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Only draw the drag line if we are actively slinging
    if (this.isSlinging && this.dragStart && this.dragCurrent) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.dragStart.x, this.dragStart.y);
      this.ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.setLineDash([5, 5]);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      this.ctx.beginPath();
      this.ctx.arc(this.dragStart.x, this.dragStart.y, 10, 0, Math.PI * 2);
      this.ctx.fillStyle = "#fff";
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(this.dragCurrent.x, this.dragCurrent.y, 20, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#00ff88";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 10) p.trail.shift();

      p.vy += this.gravity;
      p.x += p.vx;
      p.y += p.vy;

      let hit = false;
      if (p.x < 0 || p.x > this.width) {
        p.vx *= -this.bounceDamping;
        p.x = p.x < 0 ? 0 : this.width;
        hit = true;
      }
      if (p.y < 0 || p.y > this.height) {
        p.vy *= -this.bounceDamping;
        p.y = p.y < 0 ? 0 : this.height;
        if (Math.abs(p.vy) > 2) hit = true;
      }

      if (hit) {
        this.spawnExplosion(p.x, p.y, p.color, 15);
        p.life -= 0.1;
      }

      p.life -= 0.005;

      this.ctx.beginPath();
      if (p.trail.length > 0) {
        this.ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let t of p.trail) this.ctx.lineTo(t.x, t.y);
      }
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "#fff";
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      if (p.life <= 0) {
        this.spawnExplosion(p.x, p.y, p.color, 40);
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.vy += part.gravity;
      part.life -= 0.02;

      this.ctx.globalAlpha = part.life;
      this.ctx.fillStyle = part.color;
      this.ctx.fillRect(part.x, part.y, 3, 3);
      this.ctx.globalAlpha = 1;

      if (part.life <= 0) this.particles.splice(i, 1);
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  showFeedback(text) {
    const popup = document.querySelector(".feature-popup");
    if (!popup) {
      const div = document.createElement("div");
      div.className = "feature-popup active";
      div.innerHTML = `<h3>${text}</h3>`;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2500);
    } else {
      popup.innerHTML = `<h3>${text}</h3>`;
      popup.classList.add("active");
      setTimeout(() => popup.classList.remove("active"), 2500);
    }
  }
}

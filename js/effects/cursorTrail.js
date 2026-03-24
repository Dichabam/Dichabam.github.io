import { state } from "../core/state.js";

export class CursorTrail {
  constructor() {
    this.isTouch =
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches;

    if (this.isTouch) return;

    this.canvas = null;
    this.ctx = null;
    this.points = [];
    this.mouse = { x: -200, y: -200 };
    this.animId = null;
    this.isRunning = false;

    // Trail configuration
    this.MAX_POINTS = 28;
    this.TRAIL_WIDTH_START = 4;
    this.TRAIL_COLOR = "3, 179, 195"; // RGB of --accent

    this.init();
  }

  init() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "cursor-trail-canvas";
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 99997;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.resize();

    window.addEventListener("resize", () => this.resize());
    document.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (!this.isRunning) this.start();
    });

    // React to clicks with a burst
    document.addEventListener("mousedown", () => this.burst());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  animate() {
    if (!state.effectsEnabled) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.animId = requestAnimationFrame(() => this.animate());
      return;
    }

    // Add current mouse position to history
    this.points.push({ x: this.mouse.x, y: this.mouse.y, age: 0 });

    // Age all points
    this.points.forEach((p) => p.age++);

    // Remove old points
    while (this.points.length > this.MAX_POINTS) {
      this.points.shift();
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawTrail();

    this.animId = requestAnimationFrame(() => this.animate());
  }

  drawTrail() {
    if (this.points.length < 2) return;

    const len = this.points.length;

    for (let i = 1; i < len; i++) {
      const prev = this.points[i - 1];
      const curr = this.points[i];

      const progress = i / len; // 0 = oldest, 1 = newest
      const alpha = progress * 0.55; // Fade in towards cursor
      const width = progress * this.TRAIL_WIDTH_START;

      this.ctx.beginPath();
      this.ctx.moveTo(prev.x, prev.y);
      this.ctx.lineTo(curr.x, curr.y);

      this.ctx.strokeStyle = `rgba(${this.TRAIL_COLOR}, ${alpha})`;
      this.ctx.lineWidth = width;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.stroke();
    }

    // Glow dot at cursor tip
    if (len > 0) {
      const tip = this.points[len - 1];
      const grd = this.ctx.createRadialGradient(
        tip.x,
        tip.y,
        0,
        tip.x,
        tip.y,
        8,
      );
      grd.addColorStop(0, `rgba(${this.TRAIL_COLOR}, 0.3)`);
      grd.addColorStop(1, `rgba(${this.TRAIL_COLOR}, 0)`);
      this.ctx.beginPath();
      this.ctx.arc(tip.x, tip.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = grd;
      this.ctx.fill();
    }
  }

  burst() {
    if (!state.effectsEnabled) return;
    // Spawn radial particles on click
    const x = this.mouse.x;
    const y = this.mouse.y;
    const count = 8;
    const particles = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * (1.5 + Math.random() * 2),
        vy: Math.sin(angle) * (1.5 + Math.random() * 2),
        life: 1,
        size: 2 + Math.random() * 2,
      });
    }

    const animateBurst = () => {
      if (particles.every((p) => p.life <= 0)) return;

      particles.forEach((p) => {
        if (p.life <= 0) return;

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.life -= 0.045;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${this.TRAIL_COLOR}, ${p.life * 0.6})`;
        this.ctx.fill();
      });

      requestAnimationFrame(animateBurst);
    };

    requestAnimationFrame(animateBurst);
  }
}

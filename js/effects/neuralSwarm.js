import { state } from "../core/state.js";
import { debounce } from "../core/utils.js"; // Optimization

export class NeuralSwarm {
  constructor() {
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;

    this.particleCount = 60;
    this.connectionDistance = 100;
    this.mouse = { x: 0, y: 0, isActive: false };

    this.trigger = document.getElementById("neural-trigger");

    this.init();
  }

  init() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "neural-canvas";
    this.canvas.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 9996; pointer-events: none; opacity: 0;
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    // OPTIMIZATION: Debounce resize
    window.addEventListener(
      "resize",
      debounce(() => this.resize(), 200)
    );

    window.addEventListener("mousemove", (e) =>
      this.updateInput(e.clientX, e.clientY)
    );
    window.addEventListener(
      "touchstart",
      (e) => {
        this.mouse.isActive = true;
        this.updateInput(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );
    window.addEventListener(
      "touchmove",
      (e) => {
        this.updateInput(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );
    window.addEventListener("touchend", () => {
      this.mouse.isActive = false;
    });

    if (this.trigger) {
      this.trigger.addEventListener("dblclick", () => this.toggle());
    }

    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2 + 1,
        energy: Math.random(),
      });
    }
  }

  toggle() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      this.canvas.style.opacity = "1";
      this.createParticles();
      this.animate();
      this.showNotification(true);

      this.trigger.style.color = "#00ff88";
      this.trigger.style.textShadow = "0 0 10px #00ff88";
    } else {
      this.canvas.style.opacity = "0";
      cancelAnimationFrame(this.animationId);
      this.showNotification(false);

      this.trigger.style.color = "";
      this.trigger.style.textShadow = "";
    }
  }

  updateInput(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.isActive = true;

    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.mouse.isActive = false;
    }, 2000);
  }

  animate() {
    if (!this.isActive) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      if (this.mouse.isActive) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300) {
          p.vx += dx * 0.0005;
          p.vy += dy * 0.0005;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(3, 179, 195, ${
        0.5 + Math.sin(Date.now() * 0.005 + p.energy) * 0.3
      })`;
      this.ctx.fill();

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.connectionDistance) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(3, 179, 195, ${
            1 - dist / this.connectionDistance
          })`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  showNotification(isActive) {
    const popup = document.querySelector(".feature-popup");
    if (!popup && isActive) {
      const div = document.createElement("div");
      div.className = "feature-popup active";
      div.innerHTML = `<h3>Neural Nexus</h3><p>System Connected.</p>`;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 3000);
    } else if (isActive) {
      popup.innerHTML = `<h3>Neural Nexus</h3><p>Swarm Intelligence Online.</p>`;
      popup.classList.add("active");
      setTimeout(() => popup.classList.remove("active"), 3000);
    }
  }
}

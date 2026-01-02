export class MatrixEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.fontSize = 14;
    this.columns = 0;
    this.drops = [];
    this.chars = "01DICHABAQUANTS";
    this.animationId = null;
    this.isRunning = false;

    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;

    this.columns = Math.floor(this.canvas.width / this.fontSize);
    this.drops = new Array(this.columns).fill(1);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  animate() {
    if (!this.isRunning) return;

   
    this.ctx.fillStyle = "rgba(10, 15, 20, 0.1)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#00ff88";
    this.ctx.font = `${this.fontSize}px 'JetBrains Mono'`;

    for (let i = 0; i < this.drops.length; i++) {
      const text = this.chars[Math.floor(Math.random() * this.chars.length)];
      this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

      if (
        this.drops[i] * this.fontSize > this.canvas.height &&
        Math.random() > 0.975
      ) {
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

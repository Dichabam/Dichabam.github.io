export class ScrollProgress {
  constructor() {
    this.bar = null;
    this.progress = 0;
    this.target = 0;
    this.isScrolling = false;
    this.scrollTimeout = null;

    this.init();
    this.loop();
  }

  init() {
    this.bar = document.createElement("div");
    this.bar.id = "scroll-progress-bar";

    const style = document.createElement("style");
    style.textContent = `
      #scroll-progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        width: 100%;
        transform: scaleX(0);
        transform-origin: left;
        background: linear-gradient(90deg, var(--accent), #fff, var(--accent));
        background-size: 200% 100%;
        z-index: 99999;
        pointer-events: none;
        will-change: transform;
        box-shadow: 0 0 10px var(--accent), 0 0 4px rgba(255,255,255,0.8);
      }

      #scroll-progress-bar.scrolling {
        animation: scrollBarShimmer 1.5s linear infinite;
      }

      #scroll-progress-bar::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 6px var(--accent);
      }

      @keyframes scrollBarShimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.bar);

    window.addEventListener("scroll", () => this.onScroll(), { passive: true });
    window.addEventListener("resize", () => this.updateTarget());

    this.updateTarget();
  }

  onScroll() {
    this.updateTarget();

    // Activate shimmer only while scrolling
    this.isScrolling = true;
    this.bar.classList.add("scrolling");

    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.bar.classList.remove("scrolling");
    }, 120);
  }

  updateTarget() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    this.target = docHeight > 0 ? scrollTop / docHeight : 0;
  }

  loop() {
    // Smooth interpolation (lerp)
    this.progress += (this.target - this.progress) * 0.12;

    this.bar.style.transform = `scaleX(${this.progress})`;

    requestAnimationFrame(() => this.loop());
  }
}

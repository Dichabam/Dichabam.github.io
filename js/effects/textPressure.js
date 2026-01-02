import { state } from "../core/state.js";

export class TextPressure {
  constructor(containerId, text) {
    this.container = document.getElementById(containerId);
    this.text = text;
    this.spans = [];
    this.mouse = { x: 0, y: 0 };
    this.cursor = { x: 0, y: 0 };
    this.isActive = false;
    this.isHovering = false;

    if (this.container) {
      document.fonts.ready.then(() => {
        this.init();
      });
    }
  }

  init() {
    this.container.innerHTML = "";
    const h2 = document.createElement("h2");
    h2.className = "text-pressure-title";

    this.text.split("").forEach((char) => {
      const span = document.createElement("span");
      span.className = "text-pressure-span";
      span.textContent = char;

  
      span.dataset.targetWdth = "5";
      span.dataset.targetWght = "100";
      span.dataset.currentWdth = "5";
      span.dataset.currentWght = "100";

      span.style.fontVariationSettings = "'wght' 100, 'wdth' 5";

      if (char === " ") {
        span.style.minWidth = "20px";
        span.style.display = "inline-block"; 
      }

      h2.appendChild(span);
      this.spans.push(span);
    });

    this.container.appendChild(h2);

    this.container.addEventListener("mouseenter", () => {
      this.isHovering = true;
      if (!this.isActive) {
        this.isActive = true;
        this.animate();
      }
    });

    this.container.addEventListener("mouseleave", () => {
      this.isHovering = false;
    });

    window.addEventListener("mousemove", (e) => {
      this.cursor.x = e.clientX;
      this.cursor.y = e.clientY;
    });

    this.container.addEventListener(
      "touchstart",
      (e) => {
        this.isHovering = true;
        if (!this.isActive) {
          this.isActive = true;
          this.animate();
        }
        if (e.touches.length > 0) {
          this.cursor.x = e.touches[0].clientX;
          this.cursor.y = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    this.container.addEventListener("touchend", () => {
      this.isHovering = false;
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 0) {
          this.cursor.x = e.touches[0].clientX;
          this.cursor.y = e.touches[0].clientY;
        }
      },
      { passive: true }
    );
  }

  dist(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getAttr(distance, maxDist, minVal, maxVal) {
 
    if (distance > maxDist) return minVal;

    const factor = 1 - distance / maxDist;

 
    const val = minVal + factor * (maxVal - minVal);
    return val;
  }

  lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
  }

  animate() {
    if (!this.isHovering) {
      let allReset = true;
      this.spans.forEach((span) => {
        const currentWdth = parseFloat(span.dataset.currentWdth);
        if (Math.abs(currentWdth - 5) > 0.5) allReset = false;
      });
      if (allReset) {
        this.isActive = false;
     
        this.spans.forEach((span) => {
          span.style.fontVariationSettings = "'wght' 100, 'wdth' 5";
        });
        return;
      }
    }

    if (!state.effectsEnabled && !this.isActive) return;

    this.mouse.x += (this.cursor.x - this.mouse.x) / 10; 
    this.mouse.y += (this.cursor.y - this.mouse.y) / 10;

    const rect = this.container.getBoundingClientRect();
 
    const maxDist = rect.width / 1.2;

    this.spans.forEach((span) => {
      let targetWdth = 5;
      let targetWght = 100;

      if (this.isHovering) {
        const spanRect = span.getBoundingClientRect();
        const charCenter = {
          x: spanRect.left + spanRect.width / 2,
          y: spanRect.top + spanRect.height / 2,
        };

        const d = this.dist(this.mouse, charCenter);

        targetWdth = this.getAttr(d, maxDist, 5, 200);
        targetWght = this.getAttr(d, maxDist, 100, 900);
      }

      let currentWdth = parseFloat(span.dataset.currentWdth);
      let currentWght = parseFloat(span.dataset.currentWght);

      currentWdth = this.lerp(currentWdth, targetWdth, 0.1);
      currentWght = this.lerp(currentWght, targetWght, 0.1);

      span.dataset.currentWdth = currentWdth;
      span.dataset.currentWght = currentWght;

      span.style.fontVariationSettings = `'wght' ${Math.floor(
        currentWght
      )}, 'wdth' ${Math.floor(currentWdth)}`;
    });

    requestAnimationFrame(() => this.animate());
  }
}

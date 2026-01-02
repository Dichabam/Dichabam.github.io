import { Config } from "../core/config.js";

export class MagneticButton {
  constructor(element) {
    this.element = element;
    this.strength = 0.3;
    this.boundingBox = this.element.getBoundingClientRect();
    this.init();
  }

  init() {

    this.element.addEventListener("mouseenter", () => {
      this.boundingBox = this.element.getBoundingClientRect();
    });

    this.element.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.element.addEventListener("mouseleave", (e) => this.onMouseLeave(e));

    window.addEventListener("resize", () => {
      this.boundingBox = this.element.getBoundingClientRect();
    });
    window.addEventListener(
      "scroll",
      () => {
        this.boundingBox = this.element.getBoundingClientRect();
      },
      { passive: true }
    );
  }

  onMouseMove(e) {
    const rect = this.boundingBox;

    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    gsap.to(this.element, {
      x: x * this.strength,
      y: y * this.strength,
      duration: 0.3,
      ease: "power2.out",
    });

    const child = this.element.querySelector("span, i");
    if (child) {
      gsap.to(child, {
        x: x * (this.strength * 0.5),
        y: y * (this.strength * 0.5),
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }

  onMouseLeave(e) {
    gsap.to(this.element, {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.3)",
    });

    const child = this.element.querySelector("span, i");
    if (child) {
      gsap.to(child, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)",
      });
    }
  }
}

export function initMagneticButtons() {
  const buttons = document.querySelectorAll(
    ".btn, .pill-link, .game-action-btn, .close-game-btn"
  );

  const isTouch =
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches;
  if (isTouch) return;

  buttons.forEach((btn) => {
    new MagneticButton(btn);
  });
}

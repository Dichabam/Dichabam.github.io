import { state } from "../core/state.js";
import { Config } from "../core/config.js";

export class DecryptedText {
  constructor(element) {
    this.element = element;
    this.originalText = element.getAttribute("data-text") || element.innerText;
    this.chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";
    this.interval = null;
    this.isAnimating = false;

    this.element.addEventListener("mouseenter", () => this.start());
    this.element.addEventListener("mouseleave", () => this.stop());

    this.start();
  }

  start() {
    if (!state.effectsEnabled || this.isAnimating) return;
    this.isAnimating = true;
    let revealedCount = 0;

    clearInterval(this.interval);
    this.interval = setInterval(() => {
      let output = "";
      for (let i = 0; i < this.originalText.length; i++) {
        if (i < revealedCount) {
          output += `<span class="decrypted-char">${this.originalText[i]}</span>`;
        } else {
          output += `<span class="encrypted-char">${
            this.chars[Math.floor(Math.random() * this.chars.length)]
          }</span>`;
        }
      }
      this.element.innerHTML = output;
      revealedCount += 1 / 3;

      if (revealedCount >= this.originalText.length) {
        this.element.innerHTML = this.originalText;
        this.isAnimating = false;
        clearInterval(this.interval);
      }
    }, Config.TEXT_SPEED);
  }

  stop() {
    clearInterval(this.interval);
    this.element.innerHTML = this.originalText;
    this.isAnimating = false;
  }
}

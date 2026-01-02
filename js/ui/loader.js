export class Loader {
  constructor() {
    this.loader = document.getElementById("app-loader");
    this.progressFill = document.querySelector(".loader-progress-fill");
    this.text = document.querySelector(".loader-text");
    this.init();
  }

  init() {
    if (!this.loader) return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress > 100) progress = 100;

      if (this.progressFill) {
        this.progressFill.style.width = `${progress}%`;
      }

      if (progress === 100) {
        clearInterval(interval);
        this.finishLoad();
      }
    }, 50); 
  }

  finishLoad() {
    setTimeout(() => {
      if (this.text) this.text.innerText = "ACCESS GRANTED";

      const tl = gsap.timeline();

      tl.to(".loader-content", {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        ease: "power2.in",
      })
        .to(this.loader, {
          yPercent: -100, 
          duration: 0.8,
          ease: "power4.inOut",
          onComplete: () => {
            document.body.classList.add("loaded");
            this.loader.style.display = "none";
            this.triggerHeroAnimations();
          },
        });
    }, 300);
  }

  triggerHeroAnimations() {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }
}

export class ConfettiButton {
  constructor() {
    this.buttons = document.querySelectorAll(
      '.btn-group a[href*="github.com"], .btn-group a[href*="linkedin.com"]'
    );
    this.colors = ["#03b3c3", "#ffffff", "#362cad", "#ae00ff"];
    this.init();
  }

  /**
   * Plan 
   * 1. we want to prevent double initialization. only initialise after confetti animation is over
   * 2. Allow particles to fly ouside the button
   * 3. ensure button creates a stacking context but not trap children if we want them to pop out
   *    however for z-index relative to children to work, we just need relative positioning
   * */ 
  init() {
    this.buttons.forEach((btn) => {
    
      if (btn.dataset.confettiInit) return;
      btn.dataset.confettiInit = "true";
      btn.style.overflow = "visible";
      btn.style.position = "relative";
      let particleIconClass = "fas fa-circle"; // Default 
      if (btn.href.includes("github.com")) {
        particleIconClass = "fab fa-github";
      } else if (btn.href.includes("linkedin.com")) {
        particleIconClass = "fab fa-linkedin";
      }

      const icon = btn.querySelector("i");

      let textNode = null;
      btn.childNodes.forEach((node) => {
        if (node.nodeType === 3 && node.textContent.trim().length > 0) {
          textNode = node;
        }
      });

      if (icon && textNode) {
        const textContent = textNode.textContent.trim();
        textNode.remove(); 

       
        const iconWrapper = document.createElement("span");
        iconWrapper.className = "btn-icon-wrapper";
        iconWrapper.style.display = "inline-block";
        iconWrapper.style.transition =
          "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        iconWrapper.style.position = "relative";
        iconWrapper.style.zIndex = "2";
        iconWrapper.appendChild(icon);

        const textWrapper = document.createElement("span");
        textWrapper.className = "btn-text-wrapper";
        textWrapper.textContent = textContent;
        textWrapper.style.display = "inline-block";
        textWrapper.style.transition =
          "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        textWrapper.style.position = "relative";
        textWrapper.style.zIndex = "2"; 

        btn.innerHTML = "";
        btn.appendChild(iconWrapper);
        btn.appendChild(textWrapper);

        btn.addEventListener("mouseenter", () => {
          this.openUp(iconWrapper, textWrapper);
          this.shootConfetti(btn, particleIconClass);
        });

        btn.addEventListener("mouseleave", () => {
          this.closeUp(iconWrapper, textWrapper);
        });
      }
    });
  }

  openUp(iconWrapper, textWrapper) {
    iconWrapper.style.transform = "translateX(-12px)";
    textWrapper.style.transform = "translateX(12px)";
  }

  closeUp(iconWrapper, textWrapper) {
    iconWrapper.style.transform = "translateX(0)";
    textWrapper.style.transform = "translateX(0)";
  }

  shootConfetti(btn, iconClass) {
    if (!window.gsap) return;

    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement("i");
      p.className = iconClass;

      const size = Math.random() * 14 + 10;
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];

      p.style.position = "absolute";
      p.style.fontSize = `${size}px`;
      p.style.color = color;
      p.style.pointerEvents = "none";
      p.style.zIndex = "1";
      p.style.opacity = "0";

      p.style.left = "50%";
      p.style.top = "50%";

      btn.appendChild(p);

      /**
       * Jet physics
       *
       * 1. Delay each particle slightly to create a continuous "hose" effect
       * 2. -90 is straight up. We vary slightly (-105 to -75) for a focused jet
       * 3. high initial speed to shoot up
       */

      const delay = i * 0.015;

      const angle = -90 + (Math.random() * 30 - 15);
      const rad = angle * (Math.PI / 180);

      const velocity = Math.random() * 100 + 120; 
      const duration = 1.0 + Math.random() * 0.5; 

      const endX = Math.cos(rad) * velocity;
      const endY = Math.sin(rad) * velocity;

      const rotationAmount = (Math.random() - 0.5) * 360;

      gsap.set(p, {
        xPercent: -50,
        yPercent: -50,
        scale: 0,
      });


      const tl = gsap.timeline({
        delay: delay,
        onComplete: () => {
          if (p.parentNode) p.remove();
        },
      });

      tl.to(
        p,
        {
          x: endX,
          y: endY,
          rotation: rotationAmount,
          scale: 1,
          opacity: 1,
          duration: duration * 0.6, 
          ease: "power2.out", 
        },
        0,
      );


      tl.to(
        p,
        {
          opacity: 0,
          scale: 0.5, 
          duration: duration * 0.4,
          ease: "power1.in",
        },
        ">-0.4",
      ); 
    }
  }
}

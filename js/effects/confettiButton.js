export class ConfettiButton {
  constructor() {
    this.buttons = document.querySelectorAll(
      '.btn-group a[href*="github.com"], .btn-group a[href*="linkedin.com"]'
    );
    // You can customize colors here.
    this.colors = ["#03b3c3", "#ffffff", "#ff0055", "#00ff88"];
    this.init();
  }

  init() {
    this.buttons.forEach((btn) => {
      // Prevent double initialization
      if (btn.dataset.confettiInit) return;
      btn.dataset.confettiInit = "true";

      // Allow particles to fly outside the button
      btn.style.overflow = "visible";
      btn.style.position = "relative";
      // Ensure button creates a stacking context, but doesn't trap children if we want them to pop out
      // However, for z-index relative to children to work, we just need relative positioning.

      // Determine which logo to shoot based on the link
      let particleIconClass = "fas fa-circle"; // Default fallback
      if (btn.href.includes("github.com")) {
        particleIconClass = "fab fa-github";
      } else if (btn.href.includes("linkedin.com")) {
        particleIconClass = "fab fa-linkedin";
      }

      // 1. Restructure Content
      // We need to wrap the icon and text in separate spans to animate them apart
      const icon = btn.querySelector("i");

      // Find the text node (usually the last child)
      let textNode = null;
      btn.childNodes.forEach((node) => {
        if (node.nodeType === 3 && node.textContent.trim().length > 0) {
          textNode = node;
        }
      });

      if (icon && textNode) {
        const textContent = textNode.textContent.trim();
        textNode.remove(); // Remove raw text

        // Create Wrappers with High Z-Index so they sit ON TOP of particles
        const iconWrapper = document.createElement("span");
        iconWrapper.className = "btn-icon-wrapper";
        iconWrapper.style.display = "inline-block";
        iconWrapper.style.transition =
          "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        iconWrapper.style.position = "relative";
        iconWrapper.style.zIndex = "2"; // Sit above particles
        iconWrapper.appendChild(icon);

        const textWrapper = document.createElement("span");
        textWrapper.className = "btn-text-wrapper";
        textWrapper.textContent = textContent;
        textWrapper.style.display = "inline-block";
        textWrapper.style.transition =
          "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        textWrapper.style.position = "relative";
        textWrapper.style.zIndex = "2"; // Sit above particles

        // Reassemble Button
        btn.innerHTML = "";
        btn.appendChild(iconWrapper);
        btn.appendChild(textWrapper);

        // 2. Add Event Listeners
        btn.addEventListener("mouseenter", () => {
          this.openUp(iconWrapper, textWrapper);
          // Pass the specific icon class for this button
          this.shootConfetti(btn, particleIconClass);
        });

        btn.addEventListener("mouseleave", () => {
          this.closeUp(iconWrapper, textWrapper);
        });
      }
    });
  }

  openUp(iconWrapper, textWrapper) {
    // Move icon left and text right
    iconWrapper.style.transform = "translateX(-12px)";
    textWrapper.style.transform = "translateX(12px)";
  }

  closeUp(iconWrapper, textWrapper) {
    // Reset positions
    iconWrapper.style.transform = "translateX(0)";
    textWrapper.style.transform = "translateX(0)";
  }

  shootConfetti(btn, iconClass) {
    if (!window.gsap) return;

    // Increased particle count for a dense stream
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      // Create an Icon element
      const p = document.createElement("i");
      p.className = iconClass;

      // Random visual properties
      // Varied sizes for depth
      const size = Math.random() * 14 + 10;
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];

      p.style.position = "absolute";
      p.style.fontSize = `${size}px`;
      p.style.color = color;
      p.style.pointerEvents = "none";
      p.style.zIndex = "1"; // SIT BEHIND THE TEXT/ICON (Wrappers are 2)
      p.style.opacity = "0"; // Start invisible

      // Start EXACTLY at center
      p.style.left = "50%";
      p.style.top = "50%";

      btn.appendChild(p);

      // --- JET PHYSICS ---

      // 1. Stream Effect (Stagger):
      // Delay each particle slightly to create a continuous "hose" effect
      const delay = i * 0.015; // 15ms gap between particles

      // 2. Direction (Narrow Cone):
      // -90 is straight up. We vary slightly (-105 to -75) for a focused jet.
      const angle = -90 + (Math.random() * 30 - 15);
      const rad = angle * (Math.PI / 180);

      // 3. Velocity
      // High initial speed to shoot up
      const velocity = Math.random() * 100 + 120; // 120-220 distance
      const duration = 1.0 + Math.random() * 0.5; // 1s - 1.5s life

      const endX = Math.cos(rad) * velocity;
      const endY = Math.sin(rad) * velocity;

      const rotationAmount = (Math.random() - 0.5) * 360;

      // Initial Setup
      gsap.set(p, {
        xPercent: -50,
        yPercent: -50,
        scale: 0,
      });

      // Main Motion Timeline
      const tl = gsap.timeline({
        delay: delay,
        onComplete: () => {
          if (p.parentNode) p.remove();
        },
      });

      // A. Pop In & Shoot Up
      tl.to(
        p,
        {
          x: endX,
          y: endY,
          rotation: rotationAmount,
          scale: 1,
          opacity: 1,
          duration: duration * 0.6, // Reach mostly full distance/opacity in first 60%
          ease: "power2.out", // Fast start, decelerate like fluid friction
        },
        0
      );

      // B. Fade Away smoothly at the end
      // We start fading out after the particle has traveled a bit
      tl.to(
        p,
        {
          opacity: 0,
          scale: 0.5, // Shrink slightly as it dissolves
          duration: duration * 0.4,
          ease: "power1.in",
        },
        ">-0.4"
      ); // Overlap slightly with the end of the movement
    }
  }
}

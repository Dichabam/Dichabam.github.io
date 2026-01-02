export class Loader {
  constructor() {
    this.loader = document.getElementById("app-loader");
    this.progressFill = document.querySelector(".loader-progress-fill");
    this.text = document.querySelector(".loader-text");
    this.navLogo = document.getElementById("nav-logo"); // Target destination

    // Setup: Hide the real nav logo initially so we can fly the clone into place
    if (this.navLogo) {
      gsap.set(this.navLogo, { opacity: 0 });
    }

    this.init();
  }

  init() {
    if (!this.loader) return;
    let progress = 0;

    // Simulate loading progress
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
    }, 40);
  }

  finishLoad() {
    // Small buffer to ensure visual 100% completion
    setTimeout(() => {
      if (this.text) this.text.innerText = "ACCESS GRANTED";
      this.runTransition();
    }, 300);
  }

  runTransition() {
    const loaderLogo = document.querySelector(".loader-logo-wrapper");

    // Guard: If elements are missing, fallback to simple fade
    if (!loaderLogo || !this.navLogo) {
      this.fallbackFade();
      return;
    }

    // --- The FLIP Calculation ---
    // 1. Get Start Position (Loader)
    const rectStart = loaderLogo.getBoundingClientRect();
    // 2. Get End Position (Nav)
    const rectEnd = this.navLogo.getBoundingClientRect();

    // 3. Calculate Deltas (Distance to travel)
    const deltaX =
      rectEnd.left - rectStart.left + (rectEnd.width / 2 - rectStart.width / 2);
    const deltaY =
      rectEnd.top - rectStart.top + (rectEnd.height / 2 - rectStart.height / 2);

    // 4. Calculate Scale (How much to shrink)
    // We use the width ratio. Assuming square logos.
    const scale = rectEnd.width / rectStart.width;

    // --- GSAP Timeline ---
    const tl = gsap.timeline({
      onComplete: () => {
        // 1. Reveal the actual nav logo
        gsap.set(this.navLogo, { opacity: 1, clearProps: "transform" });

        // 2. Remove the loader DOM
        if (this.loader) this.loader.remove();

        // 3. Signal app is ready
        document.body.classList.add("loaded");
        this.triggerHeroAnimations();

        // 4. Dispatch event for other listeners (like audio intros)
        window.dispatchEvent(new CustomEvent("introAnimationComplete"));
      },
    });

    // Step 1: Collapse the text and progress bar downward
    tl.to([".loader-text-wrapper", ".loader-progress-bar"], {
      y: 30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "back.in(1.7)",
    });

    // Step 2: Fade out the black background to reveal the site
    // We do this concurrently with the flight
    tl.to(
      this.loader,
      {
        backgroundColor: "transparent",
        duration: 1.0,
        ease: "power2.inOut",
      },
      "-=0.2"
    );

    // Step 3: Fly the Logo (The "Disney Castle" move)
    tl.fromTo(
      loaderLogo,
      {
        x: 0,
        y: 0,
        scale: 1,
        filter: "drop-shadow(0 0 0px rgba(3, 179, 195, 0))",
      },
      {
        x: deltaX,
        y: deltaY,
        scale: scale,
        duration: 1.2,
        ease: "power3.inOut", // Smooth acceleration/deceleration
        // Add trailing glow effect during flight
        filter: "drop-shadow(0 0 20px rgba(3, 179, 195, 0.8))",
      },
      "<" // Start at same time as background fade
    );

    // Step 4: Fade out the spinning rings during flight
    // So only the "D" icon lands in the nav
    tl.to(
      [".loader-ring", ".loader-ring-2"],
      {
        opacity: 0,
        scale: 0.5,
        duration: 0.5,
      },
      "<"
    );

    // Step 5: Clean landing (remove glow right at the end)
    tl.to(
      loaderLogo,
      {
        filter: "drop-shadow(0 0 0px rgba(3, 179, 195, 0))",
        duration: 0.2,
      },
      "-=0.2"
    );
  }

  fallbackFade() {
    const tl = gsap.timeline();
    tl.to(".loader-content", {
      opacity: 0,
      scale: 0.8,
      duration: 0.5,
      ease: "power2.in",
    }).to(this.loader, {
      yPercent: -100,
      duration: 0.8,
      ease: "power4.inOut",
      onComplete: () => {
        document.body.classList.add("loaded");
        this.loader.style.display = "none";
        if (this.navLogo) gsap.set(this.navLogo, { opacity: 1 });
        this.triggerHeroAnimations();
      },
    });
  }

  triggerHeroAnimations() {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }
}

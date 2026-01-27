export class Loader {
  constructor() {
    this.loader = document.getElementById("app-loader");
    this.progressFill = document.querySelector(".loader-progress-fill");
    this.text = document.querySelector(".loader-text");
    this.navLogo = document.getElementById("nav-logo"); 

    if (this.navLogo) {
      gsap.set(this.navLogo, { opacity: 0 });
    }

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
    }, 40);
  }

  finishLoad() {
 
    setTimeout(() => {
      if (this.text) this.text.innerText = "ACCESS GRANTED";
      this.runTransition();
    }, 300);
  }

  runTransition() {
    const loaderLogo = document.querySelector(".loader-logo-wrapper");

 
    if (!loaderLogo || !this.navLogo) {
      this.fallbackFade();
      return;
    }

  
    const rectStart = loaderLogo.getBoundingClientRect();
   
    const rectEnd = this.navLogo.getBoundingClientRect();

    const deltaX =
      rectEnd.left - rectStart.left + (rectEnd.width / 2 - rectStart.width / 2);
    const deltaY =
      rectEnd.top - rectStart.top + (rectEnd.height / 2 - rectStart.height / 2);

  
    const scale = rectEnd.width / rectStart.width;

 
    const tl = gsap.timeline({
      onComplete: () => {
      
        gsap.set(this.navLogo, { opacity: 1, clearProps: "transform" });

      
        if (this.loader) this.loader.remove();

      
        document.body.classList.add("loaded");
        this.triggerHeroAnimations();

    
        window.dispatchEvent(new CustomEvent("introAnimationComplete"));
      },
    });

   
    tl.to([".loader-text-wrapper", ".loader-progress-bar"], {
      y: 30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "back.in(1.7)",
    });


    tl.to(
      this.loader,
      {
        backgroundColor: "transparent",
        duration: 1.0,
        ease: "power2.inOut",
      },
      "-=0.2"
    );

  
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
        ease: "power3.inOut", 
        filter: "drop-shadow(0 0 20px rgba(3, 179, 195, 0.8))",
      },
      "<" 
    );


    tl.to(
      [".loader-ring", ".loader-ring-2"],
      {
        opacity: 0,
        scale: 0.5,
        duration: 0.5,
      },
      "<"
    );

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

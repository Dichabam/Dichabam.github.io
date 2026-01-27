export function initNav() {
  const navLinks = document.querySelectorAll(".pill-link");
  const navContainer = document.getElementById("main-nav");
  const navWrapper = document.querySelector(".nav-wrapper");

  navLinks.forEach((link) => {

    let circle = link.querySelector(".hover-circle");
    if (!circle) {
      circle = document.createElement("span");
      circle.classList.add("hover-circle");
      link.appendChild(circle);
    }

    gsap.set(circle, {
      autoAlpha: 0, 
      scale: 0.5,
      xPercent: -50,
      yPercent: -50,
      left: "50%",
      top: "50%",
    });


    link.addEventListener("mouseenter", () => {
      gsap.to(circle, {
        autoAlpha: 1, 
        scale: 1,
        duration: 0.4,
        ease: "elastic.out(1, 0.5)",
        overwrite: true, 
      });
      gsap.to(link, {
        color: "#fff",
        duration: 0.2,
        overwrite: true,
      });
    });

   
    link.addEventListener("mouseleave", () => {
      gsap.to(circle, {
        autoAlpha: 0,
        scale: 0.5,
        duration: 0.2,
        ease: "power2.in",
        overwrite: true,
      });
      gsap.to(link, {
        color: "var(--text-muted)",
        duration: 0.2,
        overwrite: true,
      });
    });

  
    link.addEventListener("mousedown", () => {
      gsap.to(link, { scale: 0.95, duration: 0.1, overwrite: true });
    });

    link.addEventListener("mouseup", () => {
      gsap.to(link, { scale: 1, duration: 0.1, overwrite: true });
    });
  });


  const SCROLL_THRESHOLD = 20;

  const handleScroll = () => {
    const scrollY = window.scrollY;

    if (scrollY > SCROLL_THRESHOLD) {
      navContainer.classList.add("scrolled");
      if (navWrapper) navWrapper.classList.add("scrolled-wrapper");
    } else {
      navContainer.classList.remove("scrolled");
      if (navWrapper) navWrapper.classList.remove("scrolled-wrapper");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });


  handleScroll();


  const logo = document.getElementById("nav-logo");
  if (logo) {
    logo.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

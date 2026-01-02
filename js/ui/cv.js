export function initCV() {
  const heroBtn = document.getElementById("hero-cv-btn");
  const closeBtn = document.getElementById("close-cv-btn");

  if (closeBtn) {
    closeBtn.style.display = "none";
  }

  if (heroBtn) heroBtn.addEventListener("click", toggleCV);
  if (closeBtn) closeBtn.addEventListener("click", toggleCV);

  const navCvBtn = document.querySelector('button[onclick="toggleCV()"]');
  if (navCvBtn)
    navCvBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCV();
    });
}


export function toggleCV() {
  const overlay = document.getElementById("cv-overlay");
  const closeBtn = document.getElementById("close-cv-btn");

  if (!overlay) return;

  if (overlay.classList.contains("active")) {
  
    document.body.style.overflow = ""; 

   
    window.dispatchEvent(
      new CustomEvent("pause-background", { detail: false })
    );

   
    if (closeBtn) closeBtn.style.display = "none";

   
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        overlay.classList.remove("active");
      },
    });
  } else {
    
    document.body.style.overflow = "hidden"; 

  
    window.dispatchEvent(new CustomEvent("pause-background", { detail: true }));

  
    overlay.classList.add("active");
    if (closeBtn) closeBtn.style.display = "flex";

  
    gsap.fromTo(
      overlay,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
    gsap.from(".cv-section", {
      y: 30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      delay: 0.2,
      ease: "power2.out",
    });
  }
}
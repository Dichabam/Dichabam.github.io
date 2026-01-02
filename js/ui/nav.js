export function initNav() {
  const navLinks = document.querySelectorAll(".pill-link");
  navLinks.forEach((link) => {
    const circle = document.createElement("span");
    circle.classList.add("hover-circle");
    link.appendChild(circle);

  
    gsap.set(circle, { scale: 0, x: 0, y: 0 });

    link.addEventListener("mouseenter", () => {
      
      gsap.killTweensOf(circle);
      gsap.set(circle, { scale: 0, x: 0, y: 0 });
      gsap.to(circle, { scale: 1, duration: 0.3, ease: "back.out(1.7)" });
      gsap.to(link, { color: "#000", duration: 0.2 });
    });

    link.addEventListener("mouseleave", () => {
      gsap.killTweensOf(circle);
      gsap.to(circle, {
        scale: 0,
        duration: 0.2,
        ease: "power2.in",
        overwrite: true, 
      });
      gsap.to(link, { color: "#e2e8f0", duration: 0.2 });
    });
  });

  const logo = document.getElementById("nav-logo");
  logo.addEventListener("click", toggleNavConnection);
}

function toggleNavConnection() {
  const nav = document.getElementById("main-nav");
  nav.classList.toggle("disconnected");
}

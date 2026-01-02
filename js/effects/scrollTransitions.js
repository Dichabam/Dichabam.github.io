export class ScrollTransitions {
  constructor() {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      this.init();
    } else {
      console.warn("GSAP ScrollTrigger not loaded.");
    }
  }

  init() {

    let proxy = { skew: 0 };
    let skewSetter = gsap.quickSetter(".skew-on-scroll", "skewY", "deg");
    let clamp = gsap.utils.clamp(-10, 10); 

    ScrollTrigger.create({
      onUpdate: (self) => {
        let skew = clamp(self.getVelocity() / -200);
        if (Math.abs(skew) > 0.1) {
          gsap.to(proxy, {
            skew: skew,
            duration: 0.5,
            ease: "power3",
            overwrite: true,
            onUpdate: () => skewSetter(proxy.skew),
          });
        }
      },
    });

    const sections = document.querySelectorAll("[data-scroll-section]");

    sections.forEach((section) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%", 
          end: "bottom 20%",
          toggleActions: "play reverse play reverse",
        },
      });

      const reveals = section.querySelectorAll(".scroll-reveal");
      if (reveals.length > 0) {
        tl.fromTo(
          reveals,
          {
            y: 100, 
            opacity: 0,
            filter: "blur(20px)", 
            skewY: 5, 
            transformOrigin: "left top",
          },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            skewY: 0,
            duration: 1,
            stagger: 0.1, 
            ease: "power4.out", 
          },
          0
        );
      }

      const staggers = section.querySelectorAll(
        ".scroll-reveal-stagger > *, .scroll-reveal-stagger"
      );
      if (staggers.length > 0) {
        tl.fromTo(
          staggers,
          { y: 60, opacity: 0, scale: 0.8 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: "back.out(1.7)", 
          },
          0.2
        );
      }

      const lefts = section.querySelectorAll(".scroll-reveal-left");
      if (lefts.length > 0) {
        tl.fromTo(
          lefts,
          {
            x: -200,
            opacity: 0,
            rotationY: 45, 
            rotationZ: -5,
            transformOrigin: "left center",
            filter: "blur(5px)",
          },
          {
            x: 0,
            opacity: 1,
            rotationY: 0,
            rotationZ: 0,
            filter: "blur(0px)",
            duration: 1.5,
            ease: "elastic.out(1, 0.75)",
          },
          0
        );
      }

  
      const zooms = section.querySelectorAll(".scroll-reveal-zoom");
      if (zooms.length > 0) {
        tl.fromTo(
          zooms,
          { scale: 0.2, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
          },
          0.3
        );
      }

      const shapes = section.querySelectorAll(".scroll-shape");
      shapes.forEach((shape, i) => {
        const speed = (i + 1) * 100; 
        gsap.to(shape, {
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5, 
          },
          y: `${speed}px`, 
          rotation: i % 2 === 0 ? 180 : -180, 
          ease: "none",
        });
      });
    });


    const grids = document.querySelectorAll(".projects-grid, .research-grid");
    grids.forEach((grid) => {
      gsap.set(grid, { perspective: 2000 });

      ScrollTrigger.batch(grid.children, {
        start: "top 90%",
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            {
              opacity: 0,
              y: 150,
              rotationX: 30, 
              z: -100, 
              scale: 0.9,
            },
            {
              opacity: 1,
              y: 0,
              rotationX: 0,
              z: 0,
              scale: 1,
              stagger: 0.15,
              duration: 1.2,
              ease: "power3.out",
              overwrite: true,
            }
          ),
        onLeave: (batch) =>
          gsap.to(batch, { opacity: 0, y: -50, overwrite: true }),
        onEnterBack: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            rotationX: 0,
            scale: 1,
            stagger: 0.15,
            overwrite: true,
          }),
        onLeaveBack: (batch) =>
          gsap.to(batch, { opacity: 0, y: 150, overwrite: true }),
      });
    });
  }
}

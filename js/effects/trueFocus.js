    import { gsap } from "gsap"; // Assumed global via script tag, but good for linting

    export class TrueFocus {
      constructor(element, options = {}) {
        this.container =
          typeof element === "string"
            ? document.querySelector(element)
            : element;

        // Default options based on your request, but using theme accent color
        this.options = Object.assign(
          {
            manualMode: false,
            blurAmount: 5,
            borderColor: "var(--accent)", // Using theme variable instead of hardcoded 'red'
            animationDuration: 0.5,
            pauseBetweenAnimations: 1,
          },
          options
        );

        if (!this.container) return;

        this.originalText = this.container.innerText;
        this.words = this.originalText.split(" ");
        this.wordElements = [];
        this.currentIndex = 0;
        this.lastActiveIndex = null;
        this.interval = null;
        this.isHovering = false;

        this.init();
      }

      init() {
        this.container.classList.add("focus-container");
        this.container.innerText = ""; // Clear existing text

        // Create Word Spans
        this.words.forEach((word, index) => {
          const span = document.createElement("span");
          span.textContent = word;
          span.className = "focus-word";
          span.dataset.index = index;

          // Apply initial blur styles (will be managed by updateVisuals mostly)
          span.style.transition = `filter ${this.options.animationDuration}s ease, color 0.3s ease`;

          this.container.appendChild(span);
          this.wordElements.push(span);

          // Event Listeners for Manual Interaction
          span.addEventListener("mouseenter", () =>
            this.handleMouseEnter(index)
          );
        });

        this.container.addEventListener("mouseleave", () =>
          this.handleMouseLeave()
        );

        // Create Focus Frame
        this.frame = document.createElement("div");
        this.frame.className = "focus-frame";
        this.frame.innerHTML = `
        <span class="corner top-left"></span>
        <span class="corner top-right"></span>
        <span class="corner bottom-left"></span>
        <span class="corner bottom-right"></span>
    `;
        this.frame.style.setProperty(
          "--border-color",
          this.options.borderColor
        );
        this.container.appendChild(this.frame);

        // Initial Render
        // We use a slight delay to ensure DOM layout is settled for getBoundingClientRect
        setTimeout(() => {
          this.updateVisuals();
          if (!this.options.manualMode) {
            this.startLoop();
          }
        }, 100);

        // Handle Resize
        window.addEventListener("resize", () => {
          this.updateVisuals();
        });
      }

      startLoop() {
        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(() => {
          if (!this.isHovering) {
            this.currentIndex = (this.currentIndex + 1) % this.words.length;
            this.updateVisuals();
          }
        }, (this.options.animationDuration + this.options.pauseBetweenAnimations) * 1000);
      }

      handleMouseEnter(index) {
        if (this.options.manualMode) {
          this.isHovering = true;
          this.lastActiveIndex = this.currentIndex;
          this.currentIndex = index;
          this.updateVisuals();
        }
      }

      handleMouseLeave() {
        if (this.options.manualMode) {
          this.isHovering = false;
          if (this.lastActiveIndex !== null) {
            this.currentIndex = this.lastActiveIndex;
            this.updateVisuals();
          }
        }
      }

      updateVisuals() {
        if (!this.container || this.currentIndex === -1) return;

        const activeWord = this.wordElements[this.currentIndex];
        if (!activeWord) return;

        // 1. Update Words Blur/Focus
        this.wordElements.forEach((word, index) => {
          const isActive = index === this.currentIndex;

          if (isActive) {
            word.classList.add("active");
            word.style.filter = "blur(0px)";
          } else {
            word.classList.remove("active");
            word.style.filter = `blur(${this.options.blurAmount}px)`;
          }
        });

        // 2. Move Frame (using GSAP to mimic motion/react)
        const parentRect = this.container.getBoundingClientRect();
        const activeRect = activeWord.getBoundingClientRect();

        const targetX = activeRect.left - parentRect.left;
        const targetY = activeRect.top - parentRect.top;

        gsap.to(this.frame, {
          x: targetX,
          y: targetY,
          width: activeRect.width,
          height: activeRect.height,
          opacity: 1,
          duration: this.options.animationDuration,
          ease: "power2.out",
        });
      }
    }
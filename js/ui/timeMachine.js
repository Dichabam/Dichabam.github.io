export class TimeMachine {
  constructor() {
    this.slider = document.getElementById("time-slider");
    this.yearDisplay = document.getElementById("current-era-label");
    this.init();
  }

  init() {
    if (!this.slider) {
      console.warn("Time Machine UI not found in the DOM.");
      return;
    }

    // Force sync on initialization
    this.updateTheme(parseInt(this.slider.value, 10));

    const handleSliderChange = (e) => {
      const level = parseInt(e.target.value, 10);
      this.updateTheme(level);
    };

    // Bind to both input (while dragging) and change (when released)
    this.slider.addEventListener("input", handleSliderChange);
    this.slider.addEventListener("change", handleSliderChange);

    // Ensure dragging isn't intercepted by other scripts
    this.slider.addEventListener("mousedown", (e) => e.stopPropagation());
    this.slider.addEventListener("touchstart", (e) => e.stopPropagation(), {
      passive: true,
    });
  }

  updateTheme(level) {
    const root = document.documentElement; // Targets the <html> tag

    if (level === 1) {
      root.setAttribute("data-theme", "1998");
      if (this.yearDisplay) this.yearDisplay.textContent = "1998";
    } else if (level === 2) {
      root.setAttribute("data-theme", "2010");
      if (this.yearDisplay) this.yearDisplay.textContent = "2010";
    } else {
      // Level 3 is your default "2024" layout
      root.removeAttribute("data-theme");
      if (this.yearDisplay) this.yearDisplay.textContent = "2024";
    }
  }
}

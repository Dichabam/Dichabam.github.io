export class VariableProximity {
  constructor(
    elementId,
    {
      radius = 100,
      falloff = "linear",
      fromSettings = "'wght' 400, 'opsz' 9",
      toSettings = "'wght' 1000, 'opsz' 40",
    } = {}
  ) {
    this.container = document.getElementById(elementId);
    if (!this.container) return;

    this.radius = radius;
    this.falloff = falloff;
    this.fromSettings = this.parseSettings(fromSettings);
    this.toSettings = this.parseSettings(toSettings);

    this.letterElements = [];
    this.mouse = { x: -1000, y: -1000 };
    this.isRunning = false;

    this.init();
  }

  init() {
    const text = this.container.innerText;
    this.container.innerHTML = "";
    this.container.style.display = "inline-block";
    this.container.classList.add("variable-proximity-active");

    // Split text into spans
    text.split("").forEach((char) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.display = "inline-block";
      // Initialize with base settings
      span.style.fontVariationSettings = this.formatSettings(this.fromSettings);
      span.style.willChange = "font-variation-settings";
      span.style.transition = "font-variation-settings 0.1s ease-out"; // Smooth out movements

      if (char === " ") {
        span.style.minWidth = "0.3em";
        span.style.display = "inline";
      }

      this.container.appendChild(span);
      this.letterElements.push(span);
    });

    // Bind Events
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (!this.isRunning) this.start();
    });

    // Handle touch
    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 0) {
          this.mouse.x = e.touches[0].clientX;
          this.mouse.y = e.touches[0].clientY;
          if (!this.isRunning) this.start();
        }
      },
      { passive: true }
    );

    this.start();
  }

  parseSettings(settingsStr) {
    // Basic parser for "'axis' val, 'axis' val"
    return settingsStr.split(",").reduce((acc, part) => {
      const [key, val] = part.trim().split(" ");
      const axis = key.replace(/['"]/g, "");
      acc[axis] = parseFloat(val);
      return acc;
    }, {});
  }

  formatSettings(settingsObj) {
    return Object.entries(settingsObj)
      .map(([axis, val]) => `'${axis}' ${val}`)
      .join(", ");
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;

    this.letterElements.forEach((span) => {
      const rect = span.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dist = Math.sqrt(
        Math.pow(this.mouse.x - cx, 2) + Math.pow(this.mouse.y - cy, 2)
      );

      let currentSettings = {};

      // Interpolate
      for (const [axis, fromVal] of Object.entries(this.fromSettings)) {
        const toVal =
          this.toSettings[axis] !== undefined ? this.toSettings[axis] : fromVal;

        let val = fromVal;
        if (dist < this.radius) {
          const norm = Math.max(0, 1 - dist / this.radius);

          // Falloff Logic
          let t = norm;
          if (this.falloff === "exponential") t = norm * norm;
          if (this.falloff === "gaussian")
            t = Math.exp(-((dist / (this.radius / 2)) ** 2) / 2);

          val = fromVal + (toVal - fromVal) * t;
        }

        currentSettings[axis] = val;
      }

      span.style.fontVariationSettings = this.formatSettings(currentSettings);
    });

    requestAnimationFrame(() => this.loop());
  }
}

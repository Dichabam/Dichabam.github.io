export class Biometrics {
  constructor() {
    this.mouseSpeed = 0;
    this.moodScore = 0; // Ranges from 0.0 (Calm) to 1.0 (Impatient)
    this.lastMouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      time: Date.now(),
    };
    this.init();
  }

  init() {
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("scroll", this.onScroll.bind(this));

    // Start the calculation loop
    this.loop();
  }

  onMouseMove(e) {
    const now = Date.now();
    const dt = Math.max(1, now - this.lastMouse.time);
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.mouseSpeed = dist / dt;
    this.lastMouse = { x: e.clientX, y: e.clientY, time: now };

    // If mouse is moving very fast, increase the stress/mood score
    if (this.mouseSpeed > 2.5) {
      this.addStress(this.mouseSpeed * 0.005);
    }
  }

  onScroll() {
    // Scrolling quickly adds to the stress score
    this.addStress(0.02);
  }

  addStress(amount) {
    this.moodScore = Math.min(1.0, this.moodScore + amount);
  }

  loop() {
    // Slowly decay the mood score back to 0 (Calm) over time
    this.moodScore = Math.max(0, this.moodScore - 0.002);

    // Expose the mood score globally to CSS variables
    document.documentElement.style.setProperty("--mood-score", this.moodScore);

    // Apply an impatient class for severe CSS overrides
    if (this.moodScore > 0.6) {
      document.body.classList.add("mood-impatient");
    } else {
      document.body.classList.remove("mood-impatient");
    }

    // Dispatch a custom event in case Canvas/WebGL effects want to listen to it
    window.dispatchEvent(
      new CustomEvent("biometricUpdate", { detail: this.moodScore }),
    );

    requestAnimationFrame(this.loop.bind(this));
  }
}

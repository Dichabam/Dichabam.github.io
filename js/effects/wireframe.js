import { updateHoverTriggers } from "../ui/cursor.js";

export class WireframeMode {
  constructor() {

    this.sequence = ["d", "i", "c", "h", "a", "b", "a"];
    this.history = [];
    this.popup = null;
    this.helpBtn = null;
    this.helpModal = null;
    this.init();
  }

  init() {

    const isMobile =
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    window.addEventListener("keydown", (e) => this.checkInput(e));
  }

  checkInput(e) {
  
    if (
      document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA" ||
      document.activeElement.isContentEditable
    ) {
      return;
    }

 
    if (e.key.length === 1) {
      this.history.push(e.key.toLowerCase());

  
      if (this.history.length > this.sequence.length) {
        this.history.shift();
      }

     
      if (JSON.stringify(this.history) === JSON.stringify(this.sequence)) {
        this.toggle();
        this.history = []; 
      }
    }
  }

  toggle() {
    document.body.classList.toggle("debug-mode");
    const isActive = document.body.classList.contains("debug-mode");

  
    let leftMark = document.getElementById("debug-watermark-left");
    let rightMark = document.getElementById("debug-watermark-right");

    if (!leftMark) {
      leftMark = document.createElement("div");
      leftMark.id = "debug-watermark-left";
      leftMark.className = "debug-watermark-corner";
      leftMark.innerText = "SYSTEM OVERRIDE";
      document.body.appendChild(leftMark);
    }

    if (!rightMark) {
      rightMark = document.createElement("div");
      rightMark.id = "debug-watermark-right";
      rightMark.className = "debug-watermark-corner";
      rightMark.innerText = "SYSTEM OVERRIDE";
      document.body.appendChild(rightMark);
    }

    const displayVal = isActive ? "block" : "none";
    leftMark.style.display = displayVal;
    rightMark.style.display = displayVal;

   
    if (isActive) {
      this.createHelpButton();
  
      this.showPopup(true);
      console.log(
        "%c SYSTEM OVERRIDE INITIATED ",
        "background: #000; color: #00ff88; font-size: 20px"
      );
    } else {
      this.removeHelpButton();
      this.showPopup(false);
      if (this.helpModal) this.helpModal.remove();
    }
  }

  createHelpButton() {
    if (this.helpBtn) return;

    this.helpBtn = document.createElement("button");
    this.helpBtn.className = "wireframe-help-btn";
    this.helpBtn.innerHTML = "?";
    this.helpBtn.title = "What is this?";
    this.helpBtn.addEventListener("click", () => this.showHelpModal());
    document.body.appendChild(this.helpBtn);
  }

  removeHelpButton() {
    if (this.helpBtn) {
      this.helpBtn.remove();
      this.helpBtn = null;
    }
  }

  showHelpModal() {
   
    if (this.helpModal) {
      this.helpModal.remove();
      this.helpModal = null;
      return;
    }

    this.helpModal = document.createElement("div");
    this.helpModal.className = "wireframe-modal";

    this.helpModal.innerHTML = `
      <div class="wireframe-modal-content">
        <h3>SYSTEM OVERRIDE ACTIVE</h3>
        <p>You have entered the Wireframe Debug Protocol.</p>
        <p>This mode strips all cosmetic styling (colors, shadows, blurs) to reveal the skeletal structure of the DOM.</p>
        <div class="wireframe-code">
          To Disable:<br>
          Type the access code: <strong>dichaba</strong>
        </div>
        <button id="wf-close-modal" class="hover-trigger">ACKNOWLEDGE</button>
      </div>
    `;
    document.body.appendChild(this.helpModal);


    updateHoverTriggers();

    document.getElementById("wf-close-modal").addEventListener("click", () => {
      this.helpModal.remove();
      this.helpModal = null;
    });
  }

  showPopup(show) {
    if (!this.popup) {
      this.popup = document.createElement("div");
      this.popup.className = "feature-popup";
      this.popup.innerHTML = `
        <h3>System Override</h3>
        <p>Wireframe Protocol Initiated. CSS stripped to skeleton.</p>
        <p style="margin-top:5px; font-size: 0.75rem;">Type <span class="key-badge">dichaba</span> again to deactivate.</p>
      `;
      document.body.appendChild(this.popup);
    }

    if (show) {
      setTimeout(() => this.popup.classList.add("active"), 10);

      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        this.popup.classList.remove("active");
      }, 5000);
    } else {
      this.popup.classList.remove("active");
    }
  }
}

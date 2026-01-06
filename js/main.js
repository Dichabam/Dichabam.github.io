import { initCursor, updateHoverTriggers } from "./ui/cursor.js";
import { initNav } from "./ui/nav.js";
import {
  initModals,
  openProjectModal,
  closeProjectModal,
} from "./ui/modals.js";
import { initCV, toggleCV } from "./ui/cv.js";
import { initSettings } from "./ui/settings.js";
import { initBackground } from "./effects/background3D.js";
import { TextPressure } from "./effects/textPressure.js";
import { internalProjectData } from "./data/projects.js";
import { optimizeWillChange } from "./core/utils.js";
import { initGame } from "./game/engine.js";
import { initProfileCard } from "./ui/profileCard.js";
import { initMagneticButtons } from "./ui/magnetic.js";
import { Flashlight } from "./effects/flashlight.js";
import { WireframeMode } from "./effects/wireframe.js";
import { NeuralSwarm } from "./effects/neuralSwarm.js";
import { ScrollTransitions } from "./effects/scrollTransitions.js";
import { Loader } from "./ui/loader.js";
import { TouchRipple } from "./effects/touchRipple.js";
import { ConfettiButton } from "./effects/confettiButton.js";
import { DecryptedText } from "./effects/decryptedText.js";
import { VariableProximity } from "./effects/variableProximity.js"; // New Import

// Make global for inline HTML calls (like the close buttons)
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.toggleCV = toggleCV;

document.addEventListener("DOMContentLoaded", () => {
  try {
    new Loader();

    initCursor();
    initNav();
    initModals();
    initCV();
    initSettings();
    initProfileCard();
    initMagneticButtons();

    new Flashlight();
    new WireframeMode();
    new NeuralSwarm();
    new TouchRipple();
   
    new ConfettiButton();

    setTimeout(() => {
      new ScrollTransitions();
    }, 100);

    if (typeof initGame === "function") {
      initGame();
    }

    initBackground();

    const decryptedTriggers = document.querySelectorAll(
      ".decrypted-text-trigger"
    );
    decryptedTriggers.forEach((el) => {
      new DecryptedText(el);
    });

    const tpContainer = document.getElementById("tp-container");
    if (tpContainer) {
      new TextPressure("tp-container", "Let's Connect");
    }

    // Init Variable Proximity
    const proximityEl = document.getElementById("proximity-text");
    if (proximityEl) {
      new VariableProximity("proximity-text", {
        radius: 120,
        falloff: "linear",
        fromSettings: "'wght' 400, 'opsz' 9",
        toSettings: "'wght' 1000, 'opsz' 40",
      });
    }

    loadWork();

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    });
  } catch (err) {
    console.error("Initialization Error:", err);
  }
});

async function loadWork() {
  const projContainer = document.getElementById("projects-container");
  const resContainer = document.getElementById("research-container");

  if (!projContainer || !resContainer) return;

  const data = internalProjectData;

  projContainer.innerHTML = "";
  resContainer.innerHTML = "";

  data.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add("hover-trigger");
    optimizeWillChange(card);

    if (item.type === "project") {
      // Simplified Project Card Structure
      card.classList.add("project-card"); // Changed from folder-card

      let iconHtml = item.icon
        ? `<img src="${item.icon}" alt="${item.title}" loading="lazy" class="project-icon-img">`
        : `<i class="fas fa-code project-icon-i"></i>`;

      card.innerHTML = `
          <div class="project-icon-wrapper">${iconHtml}</div>
          <div class="project-content">
            <h4 class="project-title">${item.title}</h4>
            <div class="project-arrow"><i class="fas fa-arrow-right"></i></div>
          </div>
          <div class="project-glow"></div>
      `;
      projContainer.appendChild(card);
    } else {
      card.classList.add("research-card");
      card.innerHTML = `
          <div class="research-icon-box"><i class="fas fa-file-alt"></i></div>
          <h4 class="research-title">${item.title}</h4>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: auto;">Read Paper <i class="fas fa-arrow-right" style="font-size: 0.7em;"></i></div>
      `;
      resContainer.appendChild(card);
    }

    card.addEventListener("click", () => window.openProjectModal(item));
  });

  updateHoverTriggers();
  initMagneticButtons();

  if (window.ScrollTrigger) ScrollTrigger.refresh();
}

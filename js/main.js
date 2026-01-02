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
import { DecryptedText } from "./effects/decryptedText.js";
import { TextPressure } from "./effects/textPressure.js";
import { internalProjectData } from "./data/projects.js";
import { optimizeWillChange } from "./core/utils.js";
import { initGame } from "./game/engine.js";
import { initProfileCard } from "./ui/profileCard.js";
import { Terminal } from "./ui/terminal.js";
import { initMagneticButtons } from "./ui/magnetic.js";
// import { StatusTicker } from "./ui/statusTicker.js"; // REMOVED as per request
import { Flashlight } from "./effects/flashlight.js";
import { WireframeMode } from "./effects/wireframe.js";
import { NeuralSwarm } from "./effects/neuralSwarm.js";
import { ScrollTransitions } from "./effects/scrollTransitions.js";
import { Loader } from "./ui/loader.js";
import { initThemeBackgrounds } from "./effects/themeBackgrounds.js";
import { TouchRipple } from "./effects/touchRipple.js";
import { NeonSling } from "./effects/neonSling.js";
import { ConfettiButton } from "./effects/confettiButton.js";

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
    new Terminal();
    initMagneticButtons();
    // new StatusTicker(); // REMOVED

    new Flashlight();
    new WireframeMode();
    new NeuralSwarm();
    initThemeBackgrounds();
    new TouchRipple();
    new NeonSling();
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
      card.classList.add("folder-card");
      // PERF: Lazy load dynamic images
      let iconHtml = item.icon
        ? `<img src="${item.icon}" alt="${item.title}" loading="lazy" width="80" height="80">`
        : `<i class="fas fa-folder"></i>`;

      card.innerHTML = `
          <div class="folder-tab"></div>
          <div class="folder-cover">${iconHtml}</div>
          <div class="folder-info"><h4 class="folder-title">${item.title}</h4></div>
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

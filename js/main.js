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
import { ConfettiButton } from "./effects/confettiButton.js";
import { DecryptedText } from "./effects/decryptedText.js";
import { VariableProximity } from "./effects/variableProximity.js";

// ── New features ─────────────────────────────────────────────────────────────
import { ScrollProgress } from "./ui/scrollProgress.js";
import { CommandPalette } from "./ui/commandPalette.js";
import { SkillTooltips } from "./ui/skillTooltips.js";
import { initContactForm } from "./ui/contactForm.js";
import { CursorTrail } from "./effects/cursorTrail.js";
//import { initScrollProgress } from "./ui/scrollProgress.js";
// (Importing the new modules)
import { Biometrics } from "./effects/biometrics.js";

// Expose globals needed by inline HTML onclick attributes
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.toggleCV = toggleCV;

// ── Smooth anchor scroll ──────────────────────────────────────────────────────
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// ── Card click handler ────────────────────────────────────────────────────────
function createCardClickHandler(item) {
  return function () {
    window.openProjectModal(item);
  };
}

// ── Render a single project / research card ───────────────────────────────────
function renderCard(item, projContainer, resContainer) {
  const card = document.createElement("div");
  card.classList.add("hover-trigger");
  optimizeWillChange(card);

  if (item.type === "project") {
    card.classList.add("project-card");

    const iconHTML = item.icon
      ? `<img src="${item.icon}" alt="${item.title}" loading="lazy" class="project-icon-img">`
      : `<i class="fas fa-code project-icon-i"></i>`;

    card.innerHTML = `
        <div class="project-icon-wrapper">
          ${iconHTML}
        </div>
        <div class="project-content">
          <h4 class="project-title">${item.title}</h4>
          <div class="project-arrow"><i class="fas fa-arrow-right"></i></div>
        </div>
        <div class="project-glow"></div>
      `;

    projContainer.appendChild(card);
  } else {
    // research card
    card.classList.add("research-card");
    card.innerHTML = `
        <div class="research-icon-box"><i class="fas fa-file-alt"></i></div>
        <h4 class="research-title">${item.title}</h4>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: auto;">Read Paper <i class="fas fa-arrow-right" style="font-size: 0.7em;"></i></div>
      `;

    resContainer.appendChild(card);
  }

  card.addEventListener("click", createCardClickHandler(item));
}

// ── Load work section (projects + research) ───────────────────────────────────
export async function loadWork() {
  const projContainer = document.getElementById("projects-container");
  const resContainer = document.getElementById("research-container");

  if (!projContainer || !resContainer) return;

  projContainer.innerHTML = "";
  resContainer.innerHTML = "";

  internalProjectData.forEach((item) => {
    renderCard(item, projContainer, resContainer);
  });

  updateHoverTriggers();
  initMagneticButtons();

  if (window.ScrollTrigger) {
    window.ScrollTrigger.refresh();
  }
}

// ── Main initialisation ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Core UI
    new Loader();
    initCursor();
    initNav();
    initModals();
    initCV();
    initSettings();
    initProfileCard();
    initMagneticButtons();

    // Easter-egg / advanced effects
    new Flashlight();
    new WireframeMode();
    new NeuralSwarm();
    new ConfettiButton();

    // Deferred slightly so DOM is fully painted
    setTimeout(() => {
      initGame();
    }, 100);

    // 3-D background
    if (typeof THREE !== "undefined") {
      initBackground();
    }

    // Scroll animations
    new ScrollTransitions();

    // Decrypted text triggers
    const decryptedTriggers = document.querySelectorAll(
      ".decrypted-text-trigger",
    );
    decryptedTriggers.forEach((el) => {
      new DecryptedText(el);
    });

    // Text pressure contact heading
    const tpContainer = document.getElementById("tp-container");
    if (tpContainer) {
      new TextPressure("tp-container", "Let's Connect");
    }

    // Variable proximity element (if present)
    const proximityEl = document.getElementById("proximity-text");
    if (proximityEl) {
      new VariableProximity("proximity-text", {
        radius: 120,
        falloff: "linear",
        fromSettings: "'wght' 400, 'opsz' 9",
        toSettings: "'wght' 1000, 'opsz' 40",
      });
    }

    // Work section
    loadWork();

    // Smooth anchor links
    initSmoothAnchors();

    // ── New features ────────────────────────────────────────────────────────
    new ScrollProgress();
    new CursorTrail();
    new CommandPalette();
    new SkillTooltips();
    initContactForm();
    // Init your existing UI components
    //initScrollProgress();

    // Initialize New Features
    const userBiometrics = new Biometrics();

    // (Optional) Make biometrics globally available so your 3D scripts can read it if needed
    window.userBiometrics = userBiometrics;
  } catch (err) {
    console.error("Initialization Error:", err);
  }
});

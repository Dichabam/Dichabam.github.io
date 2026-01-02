import { state } from "../core/state.js";

function updateSettingsUI() {
  const btn = document.getElementById("settings-btn");
  if (!btn) return;
  const icon = btn.querySelector("i");

  if (state.effectsEnabled) {
    icon.className = "fas fa-cog";
    btn.style.color = "var(--text-muted)";
    document.body.classList.remove("reduce-motion");
  } else {
    icon.className = "fas fa-battery-quarter";
    btn.style.color = "var(--accent)";
    document.body.classList.add("reduce-motion");
  }

  window.dispatchEvent(
    new CustomEvent("toggle-effects", { detail: state.effectsEnabled })
  );
}

function checkSettingsHint() {
  const hasSeen = localStorage.getItem("settingsHintSeen");
  const hint = document.getElementById("settings-hint");

  if (!hasSeen && hint) {
    gsap.set(hint, { y: 10, opacity: 0, display: "block" });
    gsap.to(hint, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      delay: 2,
      ease: "back.out(1.7)",
    });

    setTimeout(dismissHint, 10000);
  }
}

function dismissHint() {
  const hint = document.getElementById("settings-hint");
  if (!hint) return;

  localStorage.setItem("settingsHintSeen", "true");

  gsap.to(hint, {
    y: 10,
    opacity: 0,
    duration: 0.2,
    onComplete: () => {
      hint.style.display = "none";
    },
  });
}

export function initSettings() {
  const btn = document.getElementById("settings-btn");
  if (!btn) return;

  updateSettingsUI();

  btn.addEventListener("click", () => {
    state.effectsEnabled = !state.effectsEnabled;
    updateSettingsUI();
    dismissHint();
  });

  checkSettingsHint();
}

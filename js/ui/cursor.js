import { state } from "../core/state.js";
import { Config } from "../core/config.js";

let mouseX = 0,
  mouseY = 0;
let cursorX = 0,
  cursorY = 0;
let cursor;
let isTouch = false;

export function initCursor() {
  cursor = document.getElementById("cursor");
  if (!cursor) return;

  isTouch =
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches;

  if (isTouch) {
    cursor.style.display = "none";
    document.body.classList.add("default-cursor");
    return;
  }

  if (state.effectsEnabled) {
    cursor.style.display = "block";
  }

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // FEATURE: Reactive Click Animation
  document.addEventListener("mousedown", () => {
    if (cursor) cursor.classList.add("clicked");
  });

  document.addEventListener("mouseup", () => {
    if (cursor) cursor.classList.remove("clicked");
  });

  updateHoverTriggers();
  animateCursor();
}

function animateCursor() {
  if (isTouch) return;
  const shouldShow = state.effectsEnabled;

  if (!shouldShow) {
    if (cursor && cursor.style.display !== "none") {
      cursor.style.display = "none";
      document.body.classList.add("default-cursor");
    }
    requestAnimationFrame(animateCursor);
    return;
  }

  if (cursor && cursor.style.display === "none") {
    cursor.style.display = "block";
    document.body.classList.remove("default-cursor");
  }

  // lerp
  cursorX += (mouseX - cursorX) * Config.CURSOR_LERP;
  cursorY += (mouseY - cursorY) * Config.CURSOR_LERP;

  if (cursor) {
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
  }

  requestAnimationFrame(animateCursor);
}

export function updateHoverTriggers() {
  if (isTouch) return;

  const triggers = document.querySelectorAll(
    ".hover-trigger, a, button, .settings-btn"
  );
  triggers.forEach((el) => {
    el.removeEventListener("mouseenter", onEnter);
    el.removeEventListener("mouseleave", onLeave);

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
  });
}

function onEnter() {
  const cursor = document.getElementById("cursor");
  if (cursor) cursor.classList.add("hovered");
}
function onLeave() {
  const cursor = document.getElementById("cursor");
  if (cursor) cursor.classList.remove("hovered");
}

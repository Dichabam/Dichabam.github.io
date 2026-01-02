import { GameState } from "./state.js";

export function handleInput(e) {
  const overlay = document.getElementById("game-overlay");
  if (!overlay || !overlay.classList.contains("active")) return;

  if (
    (e.type === "mousedown" || e.type === "touchstart") &&
    (e.target.tagName === "BUTTON" || e.target.closest("button"))
  )
    return;

  let isAction = false;
  if (e.type === "keydown") {
    if (
      e.code === "Space" ||
      e.key === " " ||
      e.keyCode === 32 ||
      e.code === "ArrowUp"
    ) {
      isAction = true;
      e.preventDefault();
    }
  } else if (e.type === "touchstart" || e.type === "mousedown") {
    isAction = true;
    if (e.type === "touchstart") e.preventDefault();
  }
  if (isAction) jump();
}

function jump() {
  const { player, isGameRunning } = GameState;
  if (isGameRunning && player.grounded) {
    player.vy = -player.jumpForce;
    player.grounded = false;

    // FEATURE: Mobile Haptic feedback on jump
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
}

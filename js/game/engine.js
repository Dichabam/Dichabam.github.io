import { GameState } from "./state.js";
import { drawGrid, drawPlayer, Obstacle } from "./renderer.js";
import { updateUI, showGameOver, finishInstructions } from "./ui.js";
import { handleInput } from "./input.js";
import { PixelBlastEffect } from "./pixelBlastEffect.js";

export function resizeGame() {
  const canvas = GameState.canvas;
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (!parent) return;

  GameState.gameW = canvas.width = parent.clientWidth;
  GameState.gameH = canvas.height = parent.clientHeight;

  if (GameState.gameH === 0) return;

  GameState.scaleFactor = GameState.gameH / 600;
  GameState.groundY = GameState.gameH * 0.9;

  GameState.player.size = 25 * GameState.scaleFactor;
  GameState.player.x = GameState.gameW * 0.1;
  GameState.player.gravity = 0.6 * GameState.scaleFactor;
  GameState.player.jumpForce = 14 * GameState.scaleFactor;

  if (!GameState.isGameRunning) {
    GameState.player.y = GameState.groundY - GameState.player.size / 2;
  }
}

function update() {
  if (!GameState.isGameRunning) return;

  drawGrid();

  const { player, groundY, gameSpeed } = GameState;

  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y + player.size / 2 >= groundY) {
    player.y = groundY - player.size / 2;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  drawPlayer();

  let spawnRate = Math.floor(100 / (gameSpeed / 5));
  if (spawnRate < 40) spawnRate = 40;

  if (GameState.gameFrame % spawnRate === 0) {
    GameState.obstacles.push(new Obstacle());
  }

  for (let i = GameState.obstacles.length - 1; i >= 0; i--) {
    let obs = GameState.obstacles[i];
    obs.update();
    obs.draw(GameState.ctx);

    if (
      player.x + player.size / 2 > obs.x &&
      player.x - player.size / 2 < obs.x + obs.w &&
      player.y + player.size / 2 > obs.y
    ) {
      if (obs.type === "red") {
        gameOver();
      }
    }

    if (obs.x + obs.w < 0) {
      GameState.obstacles.splice(i, 1);
      GameState.score++;
      updateUI();
      if (GameState.score % 5 === 0) {
        GameState.gameSpeed += 0.3 * GameState.scaleFactor;
      }
    }
  }

  GameState.gameFrame++;
  GameState.animationId = requestAnimationFrame(update);
}

export function startGame() {
  const hasSeen = localStorage.getItem("hasSeenQuantumInstructions");
  if (!hasSeen) {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("instructionScreen").style.display = "flex";
    return;
  }

  if (GameState.isGameRunning) return;

  if (GameState.pixelBlastApp)
    document.getElementById("pixel-blast-container").style.display = "none";

  resizeGame();
  GameState.isGameRunning = true;
  GameState.score = 0;
  GameState.gameSpeed = 6 * GameState.scaleFactor;
  GameState.gameFrame = 0;
  GameState.obstacles = [];
  GameState.player.vy = 0;
  GameState.player.trail = [];
  GameState.player.y = GameState.groundY - GameState.player.size / 2;
  GameState.player.grounded = true;

  document.getElementById("startScreen").style.display = "none";
  document.getElementById("gameOverScreen").style.display = "none";
  document.getElementById("instructionScreen").style.display = "none";
  updateUI();
  update();
}

function gameOver() {
  GameState.isGameRunning = false;
  cancelAnimationFrame(GameState.animationId);
  showGameOver();
}

export function openGame() {
  const termOverlay = document.getElementById("terminal-overlay");
  if (termOverlay && termOverlay.classList.contains("active")) {
    termOverlay.classList.remove("active");
  }

  const overlay = document.getElementById("game-overlay");
  overlay.classList.add("active");

  document.body.classList.add("game-active");

  const win = overlay.querySelector(".game-window");
  if (win) win.focus();

  if (!GameState.pixelBlastApp) {
    GameState.pixelBlastApp = new PixelBlastEffect("pixel-blast-container");
  }
  document.getElementById("pixel-blast-container").style.display = "block";

  setTimeout(() => {
    resizeGame();
    drawGrid();
    if (!GameState.isGameRunning) {
      GameState.player.y = GameState.groundY - GameState.player.size / 2;
      drawPlayer();
    }
  }, 50);

  document.getElementById("startScreen").style.display = "flex";
  document.getElementById("gameOverScreen").style.display = "none";
  document.getElementById("instructionScreen").style.display = "none";
}

export function closeGame() {
  GameState.isGameRunning = false;
  cancelAnimationFrame(GameState.animationId);
  document.getElementById("game-overlay").classList.remove("active");
  document.body.classList.remove("game-active");
}

export function initGame() {
  GameState.canvas = document.getElementById("gameCanvas");
  GameState.ctx = GameState.canvas.getContext("2d", { alpha: false });

  let highScore = localStorage.getItem("quantRunHighScore") || 0;
  document.getElementById("highScoreVal").innerText = `+${highScore}%`;

  window.addEventListener("resize", resizeGame);

  document.getElementById("btn-init-game").addEventListener("click", startGame);
  document
    .getElementById("btn-start-trading")
    .addEventListener("click", finishInstructions);
  document.getElementById("btn-reboot").addEventListener("click", startGame);

  const trigger = document.getElementById("nav-game-btn");
  if (trigger) trigger.addEventListener("click", openGame);

  document
    .querySelector(".close-game-btn")
    .addEventListener("click", closeGame);

  window.addEventListener("keydown", handleInput);
  window.addEventListener("touchstart", handleInput, { passive: false });
  window.addEventListener("mousedown", handleInput);
}

import { initCursor, updateHoverTriggers } from "./ui/cursor.js";
import { optimizeWillChange } from "./core/utils.js";

// Game Config
const CONFIG = {
  cols: 25,
  rows: 15,
  speed: 185,
  colors: {
    bg: "#050505",
    snake: "#03b3c3", // var(--accent)
    head: "#fff",
    food: "#00ff88", // Green data packet
    grid: "rgba(255, 255, 255, 0.03)",
  },
};

let canvas, ctx;
let gameLoopId;
let score = 0;
let snake = [];
let food = null;
let direction = "RIGHT"; // UP, DOWN, LEFT, RIGHT
let nextDirection = "RIGHT";
let isPlaying = false;
let cellSize = 20;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Init Core UI effects from main project
  try {
    initCursor();
    updateHoverTriggers(); // For buttons
  } catch (e) {
    console.warn("Effects init failed:", e);
  }

  // 2. Init Game
  initGame();
});

function initGame() {
  canvas = document.getElementById("snakeCanvas");
  ctx = canvas.getContext("2d");

  // Set fixed internal resolution for pixel look, scale via CSS
  canvas.width = CONFIG.cols * cellSize;
  canvas.height = CONFIG.rows * cellSize;

  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", startGame);

  window.addEventListener("keydown", handleInput);

  // Touch controls for mobile (Simple tap sides)
  canvas.addEventListener("touchstart", handleTouch, { passive: false });

  drawGame(); // Draw initial static frame
}

function startGame() {
  document.getElementById("game-overlay").classList.add("hidden");

  // Reset State
  snake = [
    { x: 5, y: 7 },
    { x: 4, y: 7 },
    { x: 3, y: 7 },
  ];
  score = 0;
  direction = "RIGHT";
  nextDirection = "RIGHT";
  updateScore();
  spawnFood();
  isPlaying = true;

  if (gameLoopId) clearInterval(gameLoopId);
  gameLoopId = setInterval(gameLoop, CONFIG.speed);
}

function gameOver() {
  isPlaying = false;
  clearInterval(gameLoopId);

  const overlay = document.getElementById("game-overlay");
  const title = overlay.querySelector("h3");
  const p = overlay.querySelector("p");
  const btn = overlay.querySelector("button");

  title.innerText = "CONNECTION LOST";
  title.style.color = "var(--danger)";
  p.innerText = `Data Recovered: ${score} Bytes`;
  btn.innerText = "RETRY PROTOCOL";

  overlay.classList.remove("hidden");
}

function gameLoop() {
  direction = nextDirection;

  // Calculate new head
  const head = { ...snake[0] };

  switch (direction) {
    case "UP":
      head.y--;
      break;
    case "DOWN":
      head.y++;
      break;
    case "LEFT":
      head.x--;
      break;
    case "RIGHT":
      head.x++;
      break;
  }

  // Wrap Logic (Through Walls)
  if (head.x < 0) head.x = CONFIG.cols - 1;
  else if (head.x >= CONFIG.cols) head.x = 0;

  if (head.y < 0) head.y = CONFIG.rows - 1;
  else if (head.y >= CONFIG.rows) head.y = 0;

  // Check collisions (Self only now)
  for (let part of snake) {
    if (head.x === part.x && head.y === part.y) {
      gameOver();
      return;
    }
  }

  snake.unshift(head); // Add new head

  // Check Food
  if (head.x === food.x && head.y === food.y) {
    score += 64; // 64 bytes
    updateScore();
    spawnFood();
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(20);
  } else {
    snake.pop(); // Remove tail if not eating
  }

  drawGame();
}

function spawnFood() {
  // Random position not on snake
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * CONFIG.cols),
      y: Math.floor(Math.random() * CONFIG.rows),
    };
    valid = !snake.some((part) => part.x === food.x && part.y === food.y);
  }
}

function drawGame() {
  // Clear
  ctx.fillStyle = CONFIG.colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid (Optional, for tech feel)
  ctx.strokeStyle = CONFIG.colors.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += cellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();

  // Snake
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? CONFIG.colors.head : CONFIG.colors.snake;

    // Glitch effect for snake body
    if (index > 0 && Math.random() > 0.95) ctx.fillStyle = "#fff";

    ctx.fillRect(
      part.x * cellSize + 1,
      part.y * cellSize + 1,
      cellSize - 2,
      cellSize - 2
    );
  });

  // Food
  if (food) {
    ctx.fillStyle = CONFIG.colors.food;
    ctx.shadowColor = CONFIG.colors.food;
    ctx.shadowBlur = 10;
    ctx.fillRect(
      food.x * cellSize + 2,
      food.y * cellSize + 2,
      cellSize - 4,
      cellSize - 4
    );
    ctx.shadowBlur = 0;
  }
}

function updateScore() {
  document.getElementById("score").innerText = score;
}

function handleInput(e) {
  if (!isPlaying) return;

  const key = e.key;
  if ((key === "ArrowUp" || key === "w") && direction !== "DOWN")
    nextDirection = "UP";
  else if ((key === "ArrowDown" || key === "s") && direction !== "UP")
    nextDirection = "DOWN";
  else if ((key === "ArrowLeft" || key === "a") && direction !== "RIGHT")
    nextDirection = "LEFT";
  else if ((key === "ArrowRight" || key === "d") && direction !== "LEFT")
    nextDirection = "RIGHT";
}

function handleTouch(e) {
  if (!isPlaying) return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Simple 4-way touch controller logic relative to center
  const dx = x - centerX;
  const dy = y - centerY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal
    if (dx > 0 && direction !== "LEFT") nextDirection = "RIGHT";
    if (dx < 0 && direction !== "RIGHT") nextDirection = "LEFT";
  } else {
    // Vertical
    if (dy > 0 && direction !== "UP") nextDirection = "DOWN";
    if (dy < 0 && direction !== "DOWN") nextDirection = "UP";
  }
}

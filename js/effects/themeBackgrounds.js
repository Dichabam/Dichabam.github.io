import { state } from "../core/state.js";
import { MatrixEffect } from "./matrixEffect.js"; 


let canvas, ctx;
let animationId;
let width, height;


let matrixInstance = null;

let mouse = {
  x: -1000,
  y: -1000,
  lx: 0,
  ly: 0,
  sx: 0,
  sy: 0,
  v: 0,
  vs: 0,
  a: 0,
  set: false,
};

let cyberParticles = [];
let cyberNodes = [];

export function initThemeBackgrounds() {
  canvas = document.createElement("canvas");
  canvas.id = "theme-bg-canvas";
  canvas.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: -2; pointer-events: none; opacity: 0;
        transition: opacity 1s ease;
    `;
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");

  matrixInstance = new MatrixEffect(canvas);

  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("touchmove", onTouchMove, { passive: false });

  window.addEventListener("theme-change", (e) => {
    state.theme = e.detail;

    if (state.theme === "retro") {

      if (!matrixInstance.isRunning) {
        matrixInstance.start();
      }
    } else {

      if (matrixInstance.isRunning) {
        matrixInstance.stop();
      }
    }

    resize();
  });

  animate();
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  if (state.theme === "retro" && matrixInstance) {
    matrixInstance.resize();
  }

  initCyber();
}

function onMouseMove(e) {
  updateMouse(e.clientX, e.clientY);
}

function onTouchMove(e) {
  const touch = e.touches[0];
  updateMouse(touch.clientX, touch.clientY);
}

function updateMouse(x, y) {
  mouse.x = x;
  mouse.y = y;
  if (!mouse.set) {
    mouse.sx = mouse.x;
    mouse.sy = mouse.y;
    mouse.lx = mouse.x;
    mouse.ly = mouse.y;
    mouse.set = true;
  }
}


function initCyber() {
  cyberParticles = [];
  cyberNodes = [];
  const gridSize = 60;
  const cols = Math.ceil(width / gridSize);
  const rows = Math.ceil(height / gridSize);

  for (let i = 0; i < 15; i++) {
    let nx = Math.floor(Math.random() * (cols - 2) + 1) * gridSize;
    let ny = Math.floor(Math.random() * (rows - 2) + 1) * gridSize;
    cyberNodes.push({ x: nx, y: ny, size: gridSize * 0.4 });
  }

  for (let i = 0; i < 30; i++) {
    cyberParticles.push({
      x: Math.floor(Math.random() * cols) * gridSize,
      y: Math.floor(Math.random() * rows) * gridSize,
      vx: Math.random() > 0.5 ? 2 : 0,
      vy: 0,
      color: "#ff0055",
    });
    let p = cyberParticles[i];
    if (p.vx === 0) p.vy = Math.random() > 0.5 ? 2 : -2;
    else p.vx = Math.random() > 0.5 ? 2 : -2;
  }
}



function animate() {
  if (!state.effectsEnabled) {
    canvas.style.opacity = "0";
    ctx.clearRect(0, 0, width, height);
    animationId = requestAnimationFrame(animate);
    return;
  }

  if (state.theme === "retro") {
    canvas.style.opacity = "1";

    animationId = requestAnimationFrame(animate);
    return;
  }

  if (mouse.set) {
    mouse.sx += (mouse.x - mouse.sx) * 0.1;
    mouse.sy += (mouse.y - mouse.sy) * 0.1;
    const dx = mouse.x - mouse.lx;
    const dy = mouse.y - mouse.ly;
    const d = Math.hypot(dx, dy);
    mouse.v = d;
    mouse.vs += (d - mouse.vs) * 0.1;
    mouse.vs = Math.min(100, mouse.vs);
    mouse.lx = mouse.x;
    mouse.ly = mouse.y;
    mouse.a = Math.atan2(dy, dx);
  }

  if (state.theme === "cyber") {
    canvas.style.opacity = "1";
    drawCyber();
  } else {
    canvas.style.opacity = "0";
    ctx.clearRect(0, 0, width, height);
  }

  animationId = requestAnimationFrame(animate);
}


function drawCyber() {
  ctx.fillStyle = "rgba(5, 5, 5, 0.15)";
  ctx.fillRect(0, 0, width, height);

  const gridSize = 60;

  ctx.strokeStyle = "rgba(0, 243, 255, 0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();

  ctx.fillStyle = "rgba(0, 243, 255, 0.1)";
  for (let n of cyberNodes) {
    ctx.fillRect(n.x - n.size / 2, n.y - n.size / 2, n.size, n.size);
    ctx.strokeRect(n.x - n.size / 2, n.y - n.size / 2, n.size, n.size);
  }

  for (let x = 0; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  cyberParticles.forEach((p) => {
    p.x += p.vx * 2;
    p.y += p.vy * 2;

    if (p.x % gridSize === 0 && p.y % gridSize === 0) {
      if (Math.random() < 0.3) {
        if (p.vx !== 0) {
          p.vx = 0;
          p.vy = Math.random() > 0.5 ? 2 : -2;
        } else {
          p.vy = 0;
          p.vx = Math.random() > 0.5 ? 2 : -2;
        }
      }
    }

    if (p.x > width) p.x = 0;
    else if (p.x < 0) p.x = width;
    if (p.y > height) p.y = 0;
    else if (p.y < 0) p.y = height;

    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff0055";
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    ctx.shadowBlur = 0;
  });
}

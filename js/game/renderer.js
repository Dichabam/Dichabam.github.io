import { GameState } from "./state.js";

export function drawGrid() {
  const { ctx, gameW, gameH, scaleFactor, gameSpeed, groundY } = GameState;
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, gameW, gameH);

  ctx.strokeStyle = "rgba(3, 179, 195, 0.1)";
  ctx.lineWidth = 1;

  const spacing = 50 * scaleFactor;
  GameState.gridOffset = (GameState.gridOffset - (gameSpeed || 2)) % spacing;

  ctx.beginPath();
  for (let x = GameState.gridOffset; x < gameW; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gameH);
  }
  for (let y = 0; y < gameH; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(gameW, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "var(--accent)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(gameW, groundY);
  ctx.stroke();
}

export function drawPlayer() {
  const { ctx, player, gameFrame, isGameRunning } = GameState;

  ctx.fillStyle = "rgba(3, 179, 195, 0.2)";
  player.trail.forEach((pos, i) => {
    const age = player.trail.length - i;
    const size = player.size * (1 - age / 10);
    ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
  });

  if (isGameRunning && gameFrame % 3 === 0) {
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 10) player.trail.shift();
  }

  ctx.save();
  ctx.translate(player.x, player.y);

  if (!player.grounded) player.rotation += 0.1;
  else player.rotation = 0;

  ctx.rotate(player.rotation + Math.PI / 4);

  // Simplified Glow (ShadowBlur is expensive, used sparingly)
  // ctx.shadowColor = '#03b3c3';
  // ctx.shadowBlur = 20;
  ctx.fillStyle = "#03b3c3";
  ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);

  ctx.fillStyle = "#fff";
  ctx.fillRect(
    -player.size / 4,
    -player.size / 4,
    player.size / 2,
    player.size / 2
  );

  ctx.restore();
}

export class Obstacle {
  constructor() {
    const { scaleFactor, gameW, groundY } = GameState;
    this.w = (Math.random() * 30 + 20) * scaleFactor;
    this.h = (Math.random() * 80 + 40) * scaleFactor;
    this.x = gameW;
    this.y = groundY - this.h;
    this.type = Math.random() > 0.8 ? "green" : "red";
  }
  update() {
    this.x -= GameState.gameSpeed;
  }
  draw(ctx) {
    if (this.type === "red") {
      ctx.fillStyle = "#ff0055";
      ctx.fillRect(this.x + this.w / 2 - 1, this.y - 10, 2, this.h + 20);
    } else {
      ctx.fillStyle = "#00ff88";
    }
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

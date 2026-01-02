import { GameState } from "./state.js";
import { startGame } from "./engine.js";

export function updateUI() {
  document.getElementById("scoreVal").innerText = `+${GameState.score * 10}%`;
}

export function finishInstructions() {
  localStorage.setItem("hasSeenQuantumInstructions", "true");
  document.getElementById("instructionScreen").style.display = "none";
  startGame();
}

export function showGameOver() {
  const finalPnl = GameState.score * 10;
  if (finalPnl > GameState.highScore) {
    GameState.highScore = finalPnl;
    localStorage.setItem("quantRunHighScore", GameState.highScore);
    document.getElementById(
      "highScoreVal"
    ).innerText = `+${GameState.highScore}%`;
  }
  document.getElementById(
    "finalScoreMsg"
  ).innerText = `Total Return: +${finalPnl}%`;
  document.getElementById("gameOverScreen").style.display = "flex";
}

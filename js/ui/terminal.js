import { toggleCV } from "./cv.js";
import { openGame } from "../game/engine.js";
import { updateHoverTriggers } from "./cursor.js";
import { MatrixEffect } from "../effects/matrixEffect.js";
import { state } from "../core/state.js";

export class Terminal {
  constructor() {
    this.overlay = document.getElementById("terminal-overlay");
    this.body = document.getElementById("terminal-body");
    this.input = document.getElementById("terminal-input");
    this.closeBtn = document.querySelector(".terminal-close");
    this.outputNode = document.querySelector(".terminal-output");
    this.isOpen = false;

    this.history = [];
    this.historyIndex = -1;
    this.matrixApp = null;

    this.commands = {
      help: { desc: "List all available commands", fn: () => this.printHelp() },
      clear: { desc: "Clear terminal output", fn: () => this.clear() },
      home: {
        desc: "Navigate to Home section",
        fn: () => this.navigate("#hero"),
      },
      about: {
        desc: "Navigate to About section",
        fn: () => this.navigate("#about"),
      },
      work: {
        desc: "Navigate to Work section",
        fn: () => this.navigate("#work"),
      },
      contact: {
        desc: "Navigate to Contact section",
        fn: () => this.navigate("#contact"),
      },
      game: {
        desc: "Launch Algo Trader simulation",
        fn: () => {
          this.log("Launching simulation...", "success");
          this.close();
          openGame();
        },
      },
      cv: {
        desc: "Open Curriculum Vitae",
        fn: () => {
          this.log("Opening CV...", "success");
          this.close();
          toggleCV();
        },
      },
      socials: { desc: "List social links", fn: () => this.listSocials() },
      reboot: {
        desc: "Reload the website",
        fn: () => window.location.reload(),
      },
      date: {
        desc: "Show current system time",
        fn: () => this.log(new Date().toString(), "info"),
      },
      matrix: {
        desc: "Toggle Matrix rain effect (Local)",
        fn: () => this.toggleMatrix(),
      },
      zen: {
        desc: "Toggle Zen Mode (Performance)",
        fn: () => this.toggleZen(),
      },
      theme: {
        desc: "Change theme [retro|cyber|default]",
        fn: (args) => this.setTheme(args),
      },
      exit: {
        desc: "Close terminal",
        fn: () => {
          this.log("Closing terminal ...", "success");
          this.close();
          this.clear_close();
        },
      },
    };

    this.init();
  }

  init() {
    if (!this.overlay) return;

    const canvas = document.createElement("canvas");
    canvas.id = "terminal-matrix";

    this.overlay.querySelector(".terminal-window").prepend(canvas);
    this.matrixApp = new MatrixEffect(canvas);

    updateHoverTriggers();

    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "`") {
        this.toggle();
      }
      if (this.isOpen) {
        if (e.key === "ArrowUp") this.navigateHistory("up", e);
        if (e.key === "ArrowDown") this.navigateHistory("down", e);
        // FEATURE: Tab Autocomplete
        if (e.key === "Tab") this.handleAutocomplete(e);
      }
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.close());
    }

    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = this.input.value.trim();
        if (val) {
          this.execute(val);
          this.history.push(val);
          this.historyIndex = this.history.length;
          this.input.value = "";

          // FEATURE: Haptic feedback on command execute
          if (navigator.vibrate) navigator.vibrate(10);
        }
      }
    });
  }

  handleAutocomplete(e) {
    e.preventDefault();
    const val = this.input.value.toLowerCase();
    if (!val) return;

    const matches = Object.keys(this.commands).filter((cmd) =>
      cmd.startsWith(val)
    );

    if (matches.length === 1) {
      this.input.value = matches[0];
    } else if (matches.length > 1) {
      this.log(`Suggestions: ${matches.join(", ")}`, "info");
    }
  }

  open() {
    this.isOpen = true;
    this.overlay.classList.add("active");
    setTimeout(() => this.input.focus(), 100);
    if (this.matrixApp) this.matrixApp.resize();
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.remove("active");

    if (this.matrixApp) this.matrixApp.stop();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  execute(cmdStr) {
    const cmdLine = document.createElement("div");
    cmdLine.innerHTML = `<span class="prompt">➜ ~</span> ${cmdStr}`;
    cmdLine.style.opacity = "0.7";
    this.outputNode.appendChild(cmdLine);

    const parts = cmdStr.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (this.commands[cmd]) {
      this.commands[cmd].fn(args);
    } else {
      this.log(`Command not found: ${cmd}. Type 'help' for list.`, "error");
      // FEATURE: Error vibration
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }

    this.body.scrollTop = this.body.scrollHeight;
  }

  log(msg, type = "text") {
    const div = document.createElement("div");
    div.className = `term-msg ${type}`;
    div.textContent = msg;
    this.outputNode.appendChild(div);
    this.body.scrollTop = this.body.scrollHeight;
  }

  clear() {
    this.outputNode.innerHTML = "";
    this.log("Terminal cleared.", "info");
  }
  clear_close() {
    this.outputNode.innerHTML = "";
  }

  printHelp() {
    let html =
      "<div style='display:grid; grid-template-columns: 100px 1fr; gap: 5px; margin-top:5px;'>";
    for (const [key, val] of Object.entries(this.commands)) {
      html += `<span style="color:var(--accent)">${key}</span><span style="color:var(--text-muted)">${val.desc}</span>`;
    }
    html += "</div>";

    const div = document.createElement("div");
    div.innerHTML = html;
    this.outputNode.appendChild(div);
  }

  navigate(hash) {
    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      this.log(`Navigating to ${hash}...`, "success");
      setTimeout(() => this.close(), 500);
    } else {
      this.log(`Section ${hash} not found.`, "error");
    }
  }

  listSocials() {
    this.log("GitHub: github.com/Dichabam", "link");
    this.log("LinkedIn: linkedin.com/in/dichaba-mofokeng", "link");
  }

  navigateHistory(dir, e) {
    e.preventDefault();
    if (this.history.length === 0) return;

    if (dir === "up") {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.input.value = this.history[this.historyIndex];
      }
    } else {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.input.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.input.value = "";
      }
    }
  }

  toggleMatrix() {
    if (!this.matrixApp) return;
    if (this.matrixApp.isRunning) {
      this.matrixApp.stop();
      this.log("Matrix effect disabled.", "info");
    } else {
      this.matrixApp.start();
      this.log("Matrix effect enabled. Follow the white rabbit.", "success");
    }
  }

  toggleZen() {
    document.body.classList.toggle("zen-mode");
    const isZen = document.body.classList.contains("zen-mode");

    state.effectsEnabled = !isZen;

    if (isZen) {
      this.log("Zen Mode ON. Distractions removed.", "success");
      window.dispatchEvent(
        new CustomEvent("pause-background", { detail: true })
      );
    } else {
      this.log("Zen Mode OFF.", "info");
      window.dispatchEvent(
        new CustomEvent("pause-background", { detail: false })
      );
    }

    window.dispatchEvent(
      new CustomEvent("toggle-effects", { detail: state.effectsEnabled })
    );
  }

  setTheme(args) {
    if (!args || args.length === 0) {
      this.log("Usage: theme [retro|cyber|default]", "error");
      return;
    }

    const theme = args[0].toLowerCase();
    const root = document.documentElement;

    window.dispatchEvent(new CustomEvent("theme-change", { detail: theme }));

    switch (theme) {
      case "retro":
        root.style.setProperty("--accent", "#00ff88");
        root.style.setProperty("--primary", "#00cc6a");
        root.style.setProperty("--dark", "#0a0a0a");
        root.style.setProperty("--text", "#00ff88");
        root.style.setProperty("--text-muted", "#008f4c");
        this.log("Theme set to Retro. Matrix Loaded.", "success");
        break;
      case "cyber":
        root.style.setProperty("--accent", "#ff00ff");
        root.style.setProperty("--primary", "#bd00ff");
        root.style.setProperty("--dark", "#1a001a");
        root.style.setProperty("--text", "#ffccff");
        root.style.setProperty("--text-muted", "#d966d9");
        this.log("Theme set to Cyberpunk. Grid online.", "success");
        break;
      case "default":
        root.style.setProperty("--accent", "#03b3c3");
        root.style.setProperty("--primary", "#5469d4");
        root.style.setProperty("--dark", "#050505");
        root.style.setProperty("--text", "#e2e8f0");
        root.style.setProperty("--text-muted", "#cbd5e1");
        this.log("Theme reset to Default. Hyperspeed engaged.", "info");
        break;
      default:
        this.log(
          `Unknown theme: ${theme}. Try 'retro', 'cyber', or 'default'.`,
          "error"
        );
    }
  }
}

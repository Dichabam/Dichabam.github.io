import { updateHoverTriggers } from "./cursor.js";

const COMMANDS = [
  { id: "home",     label: "Go to Home",    icon: "fa-house",        section: "#hero",    category: "Navigate" },
  { id: "about",    label: "Go to About",   icon: "fa-user",         section: "#about",   category: "Navigate" },
  { id: "work",     label: "Go to Work",    icon: "fa-briefcase",    section: "#work",    category: "Navigate" },
  { id: "contact",  label: "Go to Contact", icon: "fa-envelope",     section: "#contact", category: "Navigate" },
  { id: "cv",       label: "View CV",       icon: "fa-file-alt",     action: "toggleCV",  category: "Actions"  },
  { id: "github",   label: "Open GitHub",   icon: "fa-brands fa-github", url: "https://github.com/Dichabam", category: "Links" },
  { id: "linkedin", label: "Open LinkedIn", icon: "fa-brands fa-linkedin", url: "https://www.linkedin.com/in/dichaba-mofokeng-913788327", category: "Links" },
  { id: "effects",  label: "Toggle/Disable Effects","icon": "fa-wand-magic-sparkles", action: "toggleEffects", category: "Actions" },
  { id: "audio",    label: "Toggle Audio",  icon: "fa-volume-low",   action: "toggleAudio", category: "Actions" },
];

export class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.query = "";
    this.selectedIndex = 0;
    this.filtered = [...COMMANDS];
    this.overlay = null;
    this.input = null;
    this.list = null;

    this.init();
  }

  init() {
    this.injectStyles();
    this.buildDOM();
    this.bindEvents();
  }

  injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #cmd-palette-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 99998;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 15vh;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      #cmd-palette-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }
      #cmd-palette {
        width: 100%;
        max-width: 560px;
        background: rgba(8, 8, 8, 0.95);
        border: 1px solid rgba(3, 179, 195, 0.3);
        border-radius: 12px;
        overflow: hidden;
        box-shadow:
          0 0 0 1px rgba(3, 179, 195, 0.1),
          0 25px 60px rgba(0, 0, 0, 0.8),
          0 0 40px rgba(3, 179, 195, 0.05);
        transform: translateY(-20px) scale(0.97);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #cmd-palette-overlay.open #cmd-palette {
        transform: translateY(0) scale(1);
      }
      #cmd-palette-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      #cmd-palette-header i {
        color: var(--accent);
        font-size: 0.95rem;
        opacity: 0.8;
      }
      #cmd-input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: #fff;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        letter-spacing: 0.3px;
      }
      #cmd-input::placeholder {
        color: rgba(255,255,255,0.25);
        font-weight: 400;
      }
      #cmd-kbd-hint {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        color: rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 4px;
        padding: 2px 6px;
        white-space: nowrap;
      }
      #cmd-results {
        max-height: 380px;
        overflow-y: auto;
        padding: 6px;
      }
      #cmd-results::-webkit-scrollbar { width: 4px; }
      #cmd-results::-webkit-scrollbar-track { background: transparent; }
      #cmd-results::-webkit-scrollbar-thumb { background: rgba(3,179,195,0.3); border-radius: 2px; }
      .cmd-category-label {
        padding: 8px 12px 4px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: rgba(255,255,255,0.2);
        text-transform: uppercase;
      }
      .cmd-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: none;
        transition: background 0.1s, border-color 0.1s;
        border: 1px solid transparent;
        margin: 1px 0;
      }
      .cmd-item:hover,
      .cmd-item.selected {
        background: rgba(3, 179, 195, 0.08);
        border-color: rgba(3, 179, 195, 0.2);
      }
      .cmd-item-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: rgba(3, 179, 195, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent);
        font-size: 0.75rem;
        flex-shrink: 0;
      }
      .cmd-item.selected .cmd-item-icon {
        background: rgba(3, 179, 195, 0.2);
      }
      .cmd-item-label {
        flex: 1;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(255,255,255,0.85);
      }
      .cmd-item-enter {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.65rem;
        color: rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 3px;
        padding: 2px 5px;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .cmd-item.selected .cmd-item-enter { opacity: 1; color: var(--accent); }
      #cmd-empty {
        padding: 30px;
        text-align: center;
        color: rgba(255,255,255,0.2);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
      }
      #cmd-footer {
        padding: 8px 16px;
        border-top: 1px solid rgba(255,255,255,0.05);
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .cmd-footer-hint {
        display: flex;
        align-items: center;
        gap: 5px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.65rem;
        color: rgba(255,255,255,0.2);
      }
      .cmd-footer-hint kbd {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 3px;
        padding: 1px 4px;
        font-size: 0.6rem;
      }
      @media (max-width: 600px) {
        #cmd-palette { margin: 0 12px; max-width: 100%; }
        #cmd-palette-overlay { padding-top: 8vh; }
      }
    `;
    document.head.appendChild(style);
  }

  buildDOM() {
    this.overlay = document.createElement("div");
    this.overlay.id = "cmd-palette-overlay";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-label", "Command Palette");

    this.overlay.innerHTML = `
      <div id="cmd-palette">
        <div id="cmd-palette-header">
          <i class="fas fa-terminal"></i>
          <input id="cmd-input" type="text" placeholder="Search commands, sections…" autocomplete="off" spellcheck="false" />
          <span id="cmd-kbd-hint">ESC to close</span>
        </div>
        <div id="cmd-results" role="listbox"></div>
        <div id="cmd-footer">
          <span class="cmd-footer-hint"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span class="cmd-footer-hint"><kbd>↵</kbd> execute</span>
          <span class="cmd-footer-hint"><kbd>ESC</kbd> close</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.input = this.overlay.querySelector("#cmd-input");
    this.list = this.overlay.querySelector("#cmd-results");

    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  bindEvents() {
    window.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === "k") {
        e.preventDefault();
        this.isOpen ? this.close() : this.open();
        return;
      }

      if (!this.isOpen) return;

      if (e.key === "Escape") { this.close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); this.moveSelection(1); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); this.moveSelection(-1); return; }
      if (e.key === "Enter")     { e.preventDefault(); this.executeSelected(); return; }
    });

    this.input.addEventListener("input", (e) => {
      this.query = e.target.value;
      this.selectedIndex = 0;
      this.filterAndRender();
    });
  }

  open() {
    this.isOpen = true;
    this.query = "";
    this.selectedIndex = 0;
    this.input.value = "";
    this.filterAndRender();
    this.overlay.classList.add("open");
    requestAnimationFrame(() => this.input.focus());
    updateHoverTriggers();
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.remove("open");
    this.input.blur();
  }

  filterAndRender() {
    const q = this.query.toLowerCase().trim();
    this.filtered = q
      ? COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      : [...COMMANDS];

    this.render();
  }

  render() {
    this.list.innerHTML = "";

    if (this.filtered.length === 0) {
      this.list.innerHTML = `<div id="cmd-empty">No commands found for "<strong>${this.query}</strong>"</div>`;
      return;
    }

    // Group by category
    const groups = {};
    this.filtered.forEach((cmd, idx) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push({ cmd, idx });
    });

    Object.entries(groups).forEach(([cat, items]) => {
      const label = document.createElement("div");
      label.className = "cmd-category-label";
      label.textContent = cat;
      this.list.appendChild(label);

      items.forEach(({ cmd, idx }) => {
        const item = document.createElement("div");
        item.className = "cmd-item" + (idx === this.selectedIndex ? " selected" : "");
        item.setAttribute("role", "option");
        item.innerHTML = `
          <div class="cmd-item-icon"><i class="fas ${cmd.icon}"></i></div>
          <span class="cmd-item-label">${cmd.label}</span>
          <span class="cmd-item-enter">↵</span>
        `;
        item.addEventListener("click", () => {
          this.selectedIndex = idx;
          this.executeSelected();
        });
        this.list.appendChild(item);
      });
    });

    // Scroll selected into view
    const selectedEl = this.list.querySelector(".selected");
    if (selectedEl) selectedEl.scrollIntoView({ block: "nearest" });
  }

  moveSelection(delta) {
    this.selectedIndex = Math.max(0, Math.min(this.filtered.length - 1, this.selectedIndex + delta));
    this.render();
  }

  executeSelected() {
    const cmd = this.filtered[this.selectedIndex];
    if (!cmd) return;
    this.close();

    if (cmd.section) {
      const el = document.querySelector(cmd.section);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (cmd.url) {
      window.open(cmd.url, "_blank", "noopener");
      return;
    }
    if (cmd.action === "toggleCV") {
      if (typeof window.toggleCV === "function") window.toggleCV();
      return;
    }
    if (cmd.action === "toggleEffects") {
      const btn = document.getElementById("settings-btn");
      if (btn) btn.click();
      return;
    }
    if (cmd.action === "toggleAudio") {
      const btn = document.getElementById("audio-toggle-btn");
      if (btn) btn.click();
      return;
    }
  }
}
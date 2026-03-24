const SKILL_DATA = {
  Python: {
    level: 75,
    label: "Proficient",
    note: "ML, data analysis, scripting",
  },
  "C#": { level: 72, label: "Proficient", note: ".NET, Windows Forms" },
  Scala: {
    level: 60,
    label: "Intermediate",
    note: "Functional programming",
  },
  Java: {
    level: 75,
    label: "Proficient",
    note: "OOP, Parallel Computing",
  },
  JavaScript: { level: 80, label: "Advanced", note: "Frontend, Node, ES6+" },
  R: {
    level: 65,
    label: "Intermediate",
    note: "Statistical Inference",
  },
  SQL: {
    level: 70,
    label: "Proficient",
    note: "Relational DBs, queries, joins",
  },
};

const LEVEL_COLORS = {
  Advanced: "var(--accent)",
  Proficient: "#00e896",
  Intermediate: "#f59e0b",
};

export class SkillTooltips {
  constructor() {
    this.tooltip = null;
    this.init();
  }

  init() {
    this.injectStyles();
    this.createTooltip();
    this.attachToSkillTags();
  }

  injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #skill-tooltip {
        position: fixed;
        z-index: 9999;
        background: rgba(5, 5, 5, 0.95);
        border: 1px solid rgba(3, 179, 195, 0.3);
        border-radius: 8px;
        padding: 12px 14px;
        min-width: 180px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(3,179,195,0.05);
        pointer-events: none;
        opacity: 0;
        transform: translateY(6px) scale(0.96);
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      #skill-tooltip.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .tooltip-skill-name {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .tooltip-level-badge {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.6rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 3px;
        letter-spacing: 0.5px;
      }
      .tooltip-bar-track {
        width: 100%;
        height: 3px;
        background: rgba(255,255,255,0.08);
        border-radius: 2px;
        margin-bottom: 7px;
        overflow: hidden;
      }
      .tooltip-bar-fill {
        height: 100%;
        border-radius: 2px;
        width: 0%;
        transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
        box-shadow: 0 0 6px currentColor;
      }
      .tooltip-note {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.72rem;
        color: rgba(255,255,255,0.4);
        line-height: 1.4;
      }
      .tooltip-percent {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.65rem;
        color: rgba(255,255,255,0.3);
        text-align: right;
        margin-bottom: 4px;
      }

      /* Enhanced skill tag hover state */
      .skill-tag[data-skill] {
        position: relative;
      }
      .skill-tag[data-skill]:hover {
        border-color: var(--accent) !important;
      }

      @media (hover: none) and (pointer: coarse) {
        #skill-tooltip { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  createTooltip() {
    this.tooltip = document.createElement("div");
    this.tooltip.id = "skill-tooltip";
    this.tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-skill-name" id="tt-name"></span>
        <span class="tooltip-level-badge" id="tt-badge"></span>
      </div>
      <div class="tooltip-bar-track">
        <div class="tooltip-bar-fill" id="tt-bar"></div>
      </div>
      <div class="tooltip-percent" id="tt-percent"></div>
      <div class="tooltip-note" id="tt-note"></div>
    `;
    document.body.appendChild(this.tooltip);
  }

  attachToSkillTags() {
    // Run on initial load and re-run if new tags are added
    this.applyToExisting();

    // Watch for dynamic additions
    const observer = new MutationObserver(() => this.applyToExisting());
    const target =
      document.getElementById("projects-container") || document.body;
    observer.observe(target, { childList: true, subtree: true });
  }

  applyToExisting() {
    document
      .querySelectorAll(".skill-tag:not([data-tooltip-bound])")
      .forEach((tag) => {
        // Determine skill name from tag text
        const text = tag.textContent.trim();
        const skillKey = Object.keys(SKILL_DATA).find((k) =>
          text.toLowerCase().includes(k.toLowerCase()),
        );

        if (!skillKey) return;

        tag.setAttribute("data-skill", skillKey);
        tag.setAttribute("data-tooltip-bound", "true");

        tag.addEventListener("mouseenter", (e) => this.show(e, skillKey));
        tag.addEventListener("mousemove", (e) => this.position(e));
        tag.addEventListener("mouseleave", () => this.hide());
      });
  }

  show(e, skillKey) {
    const data = SKILL_DATA[skillKey];
    if (!data) return;

    const color = LEVEL_COLORS[data.label] || "var(--accent)";

    this.tooltip.querySelector("#tt-name").textContent = skillKey;

    const badge = this.tooltip.querySelector("#tt-badge");
    badge.textContent = data.label;
    badge.style.background = color + "22";
    badge.style.color = color;
    badge.style.border = `1px solid ${color}44`;

    const bar = this.tooltip.querySelector("#tt-bar");
    bar.style.color = color;
    bar.style.background = color;
    bar.style.width = "0%";

    this.tooltip.querySelector("#tt-percent").textContent =
      `${data.level}% proficiency`;
    this.tooltip.querySelector("#tt-note").textContent = data.note;

    this.position(e);
    this.tooltip.classList.add("visible");

    // Animate bar after visibility
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.width = `${data.level}%`;
      });
    });
  }

  hide() {
    this.tooltip.classList.remove("visible");
    const bar = this.tooltip.querySelector("#tt-bar");
    if (bar) bar.style.width = "0%";
  }

  position(e) {
    const x = e.clientX;
    const y = e.clientY;
    const ttW = this.tooltip.offsetWidth || 200;
    const ttH = this.tooltip.offsetHeight || 100;
    const margin = 14;

    let left = x + margin;
    let top = y - ttH / 2;

    if (left + ttW > window.innerWidth - 10) left = x - ttW - margin;
    if (top < 10) top = 10;
    if (top + ttH > window.innerHeight - 10)
      top = window.innerHeight - ttH - 10;

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }
}

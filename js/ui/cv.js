const CV_URL = "data/cv.json";

// Small DOM helper. Content is always set via textContent so CV data is
// never parsed as HTML, which matters once it comes from an editable source.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderSection(section) {
  const wrap = el("div", "cv-section");
  wrap.appendChild(el("h2", "cv-section-title", section.title));

  if (section.type === "text") {
    wrap.appendChild(el("p", "cv-text", section.text));
  } else if (section.type === "timeline") {
    (section.items || []).forEach((item) => {
      const row = el("div", "cv-item");
      row.appendChild(el("div", "cv-date", item.date));
      const detail = el("div", "cv-detail");
      detail.appendChild(el("h3", null, item.heading));
      if (item.subheading) detail.appendChild(el("h4", null, item.subheading));
      const list = el("ul");
      (item.bullets || []).forEach((b) => list.appendChild(el("li", null, b)));
      detail.appendChild(list);
      row.appendChild(detail);
      wrap.appendChild(row);
    });
  } else if (section.type === "skills") {
    const grid = el("div", "cv-skills-grid");
    (section.groups || []).forEach((g) => {
      const cell = el("div");
      cell.appendChild(el("div", "cv-skill-category", g.category));
      cell.appendChild(el("p", "cv-skill-text", g.text));
      grid.appendChild(cell);
    });
    wrap.appendChild(grid);
  }
  return wrap;
}

function renderCV(container, cv) {
  const header = el("header", "cv-header");
  const who = el("div");
  who.appendChild(el("h1", "cv-name", cv.name));
  who.appendChild(el("p", "cv-role", cv.role));
  const contact = el("div", "cv-contact");
  (cv.contact || []).forEach((line) => contact.appendChild(el("p", null, line)));
  header.append(who, contact);

  const nodes = [header, ...(cv.sections || []).map(renderSection)];
  if (cv.note) {
    const note = el("div", "cv-section");
    note.appendChild(el("p", "cv-note", cv.note));
    nodes.push(note);
  }
  container.replaceChildren(...nodes);
}

async function loadCV() {
  const container = document.getElementById("cv-content");
  if (!container) return;
  try {
    const res = await fetch(CV_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    renderCV(container, await res.json());
  } catch (err) {
    console.error("Failed to load CV:", err);
    container.replaceChildren(
      el("p", "cv-text", "The CV couldn't be loaded right now. Please try again later."),
    );
  }
}

export function initCV() {
  loadCV();

  const heroBtn = document.getElementById("hero-cv-btn");
  const closeBtn = document.getElementById("close-cv-btn");

  if (closeBtn) {
    closeBtn.style.display = "none";
  }

  if (heroBtn) heroBtn.addEventListener("click", toggleCV);
  if (closeBtn) closeBtn.addEventListener("click", toggleCV);
}


export function toggleCV() {
  const overlay = document.getElementById("cv-overlay");
  const closeBtn = document.getElementById("close-cv-btn");

  if (!overlay) return;

  if (overlay.classList.contains("active")) {
  
    document.body.style.overflow = ""; 

   
    window.dispatchEvent(
      new CustomEvent("pause-background", { detail: false })
    );

   
    if (closeBtn) closeBtn.style.display = "none";

   
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        overlay.classList.remove("active");
      },
    });
  } else {
    
    document.body.style.overflow = "hidden"; 

  
    window.dispatchEvent(new CustomEvent("pause-background", { detail: true }));

  
    overlay.classList.add("active");
    if (closeBtn) closeBtn.style.display = "flex";

  
    gsap.fromTo(
      overlay,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
    gsap.from(".cv-section", {
      y: 30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      delay: 0.2,
      ease: "power2.out",
    });
  }
}
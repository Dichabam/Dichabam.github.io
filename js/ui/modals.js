import { updateHoverTriggers } from "./cursor.js";

export function initModals() {
  
  document.getElementById("project-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("project-modal"))
      closeProjectModal();
  });

  document
    .querySelector(".modal-close")
    .addEventListener("click", closeProjectModal);
}

export function openProjectModal(item) {
  window.dispatchEvent(new CustomEvent("pause-background", { detail: true }));

  const modal = document.getElementById("project-modal");
  const title = document.getElementById("modal-title");
  const desc = document.getElementById("modal-desc");
  const links = document.getElementById("modal-links");
  const type = document.getElementById("modal-type");

  title.innerText = item.title;
  desc.innerText = item.description;
  type.innerText = item.type.toUpperCase();

  links.innerHTML = "";

  if (item.github) {
    links.innerHTML += `
            <a href="${item.github}" target="_blank" class="btn btn-outline hover-trigger">
                <i class="fab fa-github"></i> GitHub
            </a>
        `;
  }
  if (item.preview) {
    links.innerHTML += `
            <a href="${item.preview}" target="_blank" class="btn btn-primary hover-trigger">
                <i class="fas fa-external-link-alt"></i> View 
            </a>
        `;
  }

  modal.classList.add("active");
  updateHoverTriggers();
}

export function closeProjectModal() {
  document.getElementById("project-modal").classList.remove("active");
 
  window.dispatchEvent(new CustomEvent("pause-background", { detail: false }));
}

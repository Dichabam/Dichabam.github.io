import { updateHoverTriggers } from "./cursor.js";
export function initContactForm() {
  injectStyles();
  injectFormIntoContactSection();
}

function injectStyles() {
  if (document.getElementById("contact-form-styles")) return;
  const style = document.createElement("style");
  style.id = "contact-form-styles";
  style.textContent = `
    /* ── Pointer-events fix ─────────────────────────────────────────────────
       background3D.js sets pointer-events:none on every <section>.
       This override restores full interactivity for the contact form.       */
    #contact .contact-form-wrapper,
    #contact .contact-form-wrapper *,
    #contact-form,
    #contact-form * {
      pointer-events: auto !important;
    }

    .contact-form-wrapper {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      text-align: left;
    }

    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .cf-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .cf-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      padding-bottom: 20px;
    }

    .cf-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      transition: color 0.2s;
    }

    .cf-field:focus-within .cf-label {
      color: var(--accent);
    }

    .cf-input,
    .cf-textarea {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 12px 14px;
      color: #fff;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      resize: vertical;
      width: 100%;
      box-sizing: border-box;
      pointer-events: auto !important;
      cursor: text !important;
      -webkit-user-select: text !important;
      user-select: text !important;
      caret-color: var(--accent);
    }

    .cf-input:focus,
    .cf-textarea:focus {
      border-color: rgba(3, 179, 195, 0.5);
      background: rgba(3, 179, 195, 0.04);
      box-shadow: 0 0 0 3px rgba(3, 179, 195, 0.08);
    }

    .cf-input.error,
    .cf-textarea.error {
      border-color: rgba(255, 0, 85, 0.5);
      box-shadow: 0 0 0 3px rgba(255, 0, 85, 0.08);
    }

    .cf-input::placeholder,
    .cf-textarea::placeholder {
      color: rgba(255,255,255,0.2);
    }

    .cf-textarea {
      min-height: 120px;
      max-height: 260px;
    }

    .cf-error-msg {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.68rem;
      color: var(--danger);
      position: absolute;
      bottom: 2px;
      left: 0;
      opacity: 0;
      transform: translateY(-2px);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    }

    .cf-error-msg.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .cf-submit-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 4px;
    }

    .cf-submit-btn {
      flex: 1;
      padding: 13px 24px;
      border-radius: 999px;
      background: rgba(3, 179, 195, 0.1);
      border: 1px solid rgba(3, 179, 195, 0.3);
      color: var(--accent);
      font-family: 'Montserrat', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: none;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      position: relative;
      overflow: hidden;
      pointer-events: auto !important;
    }

    .cf-submit-btn:hover {
      background: rgba(3, 179, 195, 0.2);
      border-color: var(--accent);
      box-shadow: 0 0 20px rgba(3, 179, 195, 0.2);
      transform: translateY(-2px);
    }

    .cf-submit-btn:disabled {
      opacity: 0.5;
      pointer-events: none !important;
      transform: none;
    }

    .cf-btn-text {
      display: flex;
      align-items: center;
      gap: 8px;
      transition: opacity 0.2s;
    }

    .cf-submit-btn.loading .cf-btn-text  { opacity: 0; }
    .cf-submit-btn.loading .cf-btn-spinner { opacity: 1; }

    .cf-btn-spinner {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(3,179,195,0.3);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: cfSpin 0.8s linear infinite;
      opacity: 0;
      transition: opacity 0.2s;
    }

    @keyframes cfSpin {
      to { transform: rotate(360deg); }
    }

    .cf-status {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.82rem;
      padding: 11px 14px;
      border-radius: 6px;
      display: none;
      align-items: center;
      gap: 10px;
      margin-top: -4px;
    }

    .cf-status.success {
      display: flex;
      background: rgba(0, 255, 136, 0.08);
      border: 1px solid rgba(0, 255, 136, 0.25);
      color: #00ff88;
    }

    .cf-status.error-state {
      display: flex;
      background: rgba(255, 0, 85, 0.08);
      border: 1px solid rgba(255, 0, 85, 0.25);
      color: var(--danger);
    }

    .cf-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 16px 0 8px;
    }

    .cf-divider-line {
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.06);
    }

    .cf-divider-text {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.62rem;
      color: rgba(255,255,255,0.2);
      letter-spacing: 1px;
      white-space: nowrap;
    }

    @media (max-width: 480px) {
      .cf-row { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

function injectFormIntoContactSection() {
  const contactSection = document.getElementById("contact");
  if (!contactSection) return;

  const container = contactSection.querySelector(".container");
  if (!container) return;

  // Prevent double-injection
  if (document.getElementById("contact-form")) return;

  const emailBtn = container.querySelector('a[href^="mailto"]');

  const wrapper = document.createElement("div");
  wrapper.className = "contact-form-wrapper scroll-reveal";
  wrapper.innerHTML = `
    <form id="contact-form" class="contact-form" novalidate autocomplete="on">
      <div class="cf-row">
        <div class="cf-field">
          <label class="cf-label" for="cf-name">Name</label>
          <input
            class="cf-input"
            id="cf-name"
            name="name"
            type="text"
            placeholder="Your name"
            autocomplete="name"
            tabindex="0"
          />
          <span class="cf-error-msg" id="cf-name-err">Please enter your name</span>
        </div>
        <div class="cf-field">
          <label class="cf-label" for="cf-email">Email</label>
          <input
            class="cf-input"
            id="cf-email"
            name="email"
            type="email"
            placeholder="your@email.com"
            autocomplete="email"
            tabindex="0"
          />
          <span class="cf-error-msg" id="cf-email-err">Please enter a valid email</span>
        </div>
      </div>
      <div class="cf-field">
        <label class="cf-label" for="cf-subject">Subject</label>
        <input
          class="cf-input"
          id="cf-subject"
          name="subject"
          type="text"
          placeholder="What's this about?"
          autocomplete="off"
          tabindex="0"
        />
        <span class="cf-error-msg" id="cf-subject-err">Please enter a subject</span>
      </div>
      <div class="cf-field">
        <label class="cf-label" for="cf-message">Message</label>
        <textarea
          class="cf-textarea"
          id="cf-message"
          name="message"
          placeholder="Your message…"
          tabindex="0"
        ></textarea>
        <span class="cf-error-msg" id="cf-message-err">Please write a message</span>
      </div>
      <div id="cf-status" class="cf-status" role="alert" aria-live="polite"></div>
      <div class="cf-submit-row">
        <button
          type="submit"
          class="cf-submit-btn btn hover-trigger"
          id="cf-submit"
          tabindex="0"
        >
          <span class="cf-btn-text">
            <i class="fas fa-paper-plane"></i> Send Message
          </span>
          <div class="cf-btn-spinner" aria-hidden="true"></div>
        </button>
      </div>
    </form>

    <div class="cf-divider">
      <div class="cf-divider-line"></div>
      <span class="cf-divider-text">OR REACH OUT DIRECTLY</span>
      <div class="cf-divider-line"></div>
    </div>
  `;

  if (emailBtn) {
    container.insertBefore(wrapper, emailBtn);
  } else {
    container.appendChild(wrapper);
  }

  // 1. Tell the cursor script that new buttons exist so they get the hover effect
  updateHoverTriggers();

  // 2. Protect only the inputs from the 3D background (do NOT block mousemove)
  const inputs = wrapper.querySelectorAll(".cf-input, .cf-textarea");
  const stopDrag = (e) => e.stopPropagation();

  inputs.forEach((input) => {
    // Only stop events that trigger a 3D rotation click/drag
    ["mousedown", "touchstart", "pointerdown"].forEach((evt) => {
      input.addEventListener(evt, stopDrag);
    });
  });

  bindFormEvents();
}

// ── Formspree endpoint ───────────────────────────────────────────────────────
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xykvwbzl";

function bindFormEvents() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  // Stop input clicks/drags from bubbling up to document.body,
  // preventing OrbitControls from stealing focus and breaking text selection.
 

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const btn = document.getElementById("cf-submit");
    const status = document.getElementById("cf-status");

    btn.classList.add("loading");
    btn.disabled = true;
    status.className = "cf-status";
    status.textContent = "";
    status.style.display = "none";

    // Pass the actual form element to the sender
    const success = await sendToFormspree(form);

    btn.classList.remove("loading");
    btn.disabled = false;

    if (success) {
      status.className = "cf-status success";
      status.innerHTML = `<i class="fas fa-circle-check"></i> Message sent! I'll get back to you soon.`;
      status.style.display = "flex";
      form.reset();
      clearAllErrors();
      setTimeout(() => {
        status.style.display = "none";
      }, 7000);
    } else {
      status.className = "cf-status error-state";
      status.innerHTML = `<i class="fas fa-triangle-exclamation"></i> Something went wrong — please try emailing me directly.`;
      status.style.display = "flex";
      setTimeout(() => {
        status.style.display = "none";
      }, 8000);
    }
  });

  // Per-field validation on blur
  ["cf-name", "cf-email", "cf-subject", "cf-message"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("blur", () => validateField(id));
  });
}

// ── Formspree fetch ──────────────────────────────────────────────────────────
async function sendToFormspree(formElement) {
  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: new FormData(formElement),
      headers: {
        // Required by Formspree to return JSON instead of a redirect
        Accept: "application/json",
      },
    });

    if (res.ok) return true;

    const json = await res.json().catch(() => ({}));
    console.error("Formspree rejected submission:", json);
    return false;
  } catch (err) {
    console.error("Network error while submitting form:", err);
    return false;
  }
}

// ── Validation helpers ───────────────────────────────────────────────────────
function validateField(id) {
  const el = document.getElementById(id);
  const errEl = document.getElementById(id + "-err");
  if (!el) return true;

  const valid =
    id === "cf-email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())
      : el.value.trim().length > 0;

  el.classList.toggle("error", !valid);
  if (errEl) errEl.classList.toggle("visible", !valid);

  return valid;
}

function validateForm() {
  // Validate all fields; don't short-circuit so every error shows at once
  return ["cf-name", "cf-email", "cf-subject", "cf-message"]
    .map(validateField)
    .every(Boolean);
}

function clearAllErrors() {
  document
    .querySelectorAll("#contact-form .cf-input, #contact-form .cf-textarea")
    .forEach((el) => el.classList.remove("error"));
  document
    .querySelectorAll("#contact-form .cf-error-msg")
    .forEach((el) => el.classList.remove("visible"));
}

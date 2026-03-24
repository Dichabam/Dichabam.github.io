export function initContactForm() {
  injectStyles();
  injectFormIntoContactSection();
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .contact-form-wrapper {
      width: 100%;
      max-width: 520px;
      margin: 0 auto 0;
    }

    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
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
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      padding: 11px 14px;
      color: #fff;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      resize: none;
      width: 100%;
      box-sizing: border-box;
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
      color: rgba(255,255,255,0.18);
    }

    .cf-textarea {
      min-height: 110px;
      max-height: 250px;
    }

    .cf-error-msg {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.68rem;
      color: var(--danger);
      position: absolute;
      bottom: -18px;
      left: 0;
      opacity: 0;
      transform: translateY(-4px);
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
    }

    .cf-submit-btn:hover {
      background: rgba(3, 179, 195, 0.2);
      border-color: var(--accent);
      box-shadow: 0 0 20px rgba(3, 179, 195, 0.2);
      transform: translateY(-2px);
    }

    .cf-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .cf-submit-btn.loading .cf-btn-text { opacity: 0; }
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
    }

    @keyframes cfSpin {
      to { transform: rotate(360deg); }
    }

    .cf-status {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      padding: 10px 14px;
      border-radius: 6px;
      display: none;
      align-items: center;
      gap: 8px;
    }

    .cf-status.success {
      display: flex;
      background: rgba(0, 255, 136, 0.08);
      border: 1px solid rgba(0, 255, 136, 0.25);
      color: #00ff88;
    }

    .cf-status.error {
      display: flex;
      background: rgba(255, 0, 85, 0.08);
      border: 1px solid rgba(255, 0, 85, 0.25);
      color: var(--danger);
    }

    .cf-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 10px 0 6px;
    }

    .cf-divider-line {
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.06);
    }

    .cf-divider-text {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.65rem;
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

  // Find the existing email button
  const emailBtn = container.querySelector('a[href^="mailto"]');

  const wrapper = document.createElement("div");
  wrapper.className = "contact-form-wrapper scroll-reveal";
  wrapper.innerHTML = `
    <form id="contact-form" class="contact-form" novalidate>
      <div class="cf-row">
        <div class="cf-field">
          <label class="cf-label" for="cf-name">Name</label>
          <input class="cf-input" id="cf-name" name="name" type="text" placeholder="Your name" autocomplete="name" />
          <span class="cf-error-msg" id="cf-name-err">Please enter your name</span>
        </div>
        <div class="cf-field">
          <label class="cf-label" for="cf-email">Email</label>
          <input class="cf-input" id="cf-email" name="email" type="email" placeholder="your@email.com" autocomplete="email" />
          <span class="cf-error-msg" id="cf-email-err">Please enter a valid email</span>
        </div>
      </div>
      <div class="cf-field">
        <label class="cf-label" for="cf-subject">Subject</label>
        <input class="cf-input" id="cf-subject" name="subject" type="text" placeholder="What's this about?" />
        <span class="cf-error-msg" id="cf-subject-err">Please enter a subject</span>
      </div>
      <div class="cf-field">
        <label class="cf-label" for="cf-message">Message</label>
        <textarea class="cf-textarea" id="cf-message" name="message" placeholder="Your message…"></textarea>
        <span class="cf-error-msg" id="cf-message-err">Please enter a message</span>
      </div>
      <div id="cf-status" class="cf-status"></div>
      <div class="cf-submit-row">
        <button type="submit" class="cf-submit-btn btn hover-trigger" id="cf-submit">
          <span class="cf-btn-text"><i class="fas fa-paper-plane"></i> Send Message</span>
          <div class="cf-btn-spinner"></div>
        </button>
      </div>
    </form>

    <div class="cf-divider">
      <div class="cf-divider-line"></div>
      <span class="cf-divider-text">OR REACH OUT DIRECTLY</span>
      <div class="cf-divider-line"></div>
    </div>
  `;

  // Insert before the email button's parent or before emailBtn
  if (emailBtn) {
    container.insertBefore(wrapper, emailBtn);
  } else {
    container.appendChild(wrapper);
  }

  bindFormEvents();
}

function bindFormEvents() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const btn = document.getElementById("cf-submit");
    const status = document.getElementById("cf-status");

    btn.classList.add("loading");
    btn.disabled = true;
    status.className = "cf-status";
    status.style.display = "none";

    // Simulate send (replace with actual fetch to your endpoint / Formspree / EmailJS)
    await simulateSend();

    btn.classList.remove("loading");
    btn.disabled = false;

    // On success:
    status.className = "cf-status success";
    status.innerHTML = `<i class="fas fa-circle-check"></i> Message sent! I'll get back to you soon.`;
    status.style.display = "flex";
    form.reset();

    // Auto-hide after 6s
    setTimeout(() => {
      status.style.display = "none";
    }, 6000);
  });

  // Real-time validation on blur
  ["cf-name", "cf-email", "cf-subject", "cf-message"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("blur", () => validateField(id));
  });
}

function validateField(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const errEl = document.getElementById(id + "-err");
  let valid = true;

  if (id === "cf-email") {
    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
  } else {
    valid = el.value.trim().length > 0;
  }

  if (valid) {
    el.classList.remove("error");
    if (errEl) errEl.classList.remove("visible");
  } else {
    el.classList.add("error");
    if (errEl) errEl.classList.add("visible");
  }
  return valid;
}

function validateForm() {
  const fields = ["cf-name", "cf-email", "cf-subject", "cf-message"];
  return fields.map((id) => validateField(id)).every(Boolean);
}

function simulateSend() {
  // Replace this with your actual email service integration
  // e.g., fetch("https://formspree.io/f/YOUR_ID", { method: "POST", ... })
  return new Promise((resolve) => setTimeout(resolve, 1400));
}

import { state } from "../core/state.js";

export class AmbientAudio {
  constructor() {
    this.isEnabled = false;
    this.audioCtx = null;
    this.masterGain = null;
    this.nodes = [];
    this.button = null;

    // Interaction reactivity
    this.targetResonance = 0;
    this.currentResonance = 0;
    this.animId = null;

    this.init();
  }

  init() {
    this.createToggleButton();
    this.bindInteractionEvents();
  }

  createToggleButton() {
    this.button = document.createElement("button");
    this.button.id = "audio-toggle-btn";
    this.button.className = "audio-toggle-btn";
    this.button.setAttribute("aria-label", "Toggle Ambient Audio");
    this.button.innerHTML = `
      <i class="fas fa-volume-xmark"></i>
      <span class="audio-btn-label">AUDIO</span>
    `;

    // Inject styles
    const style = document.createElement("style");
    style.textContent = `
      .audio-toggle-btn {
        position: fixed;
        bottom: 70px;
        right: 20px;
        z-index: 900;
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(5, 5, 5, 0.8);
        border: 1px solid var(--glass-border);
        color: var(--text-muted);
        padding: 6px 10px;
        border-radius: 4px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 1px;
        cursor: none;
        opacity: 0.4;
        transition: opacity 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }
      .audio-toggle-btn:hover {
        opacity: 1;
      }
      .audio-toggle-btn.active {
        color: var(--accent);
        border-color: var(--accent);
        opacity: 0.9;
        box-shadow: 0 0 10px rgba(3, 179, 195, 0.2);
      }
      .audio-toggle-btn.active .audio-visualizer-dots {
        opacity: 1;
      }
      .audio-visualizer-dots {
        display: flex;
        align-items: center;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .audio-dot {
        width: 2px;
        background: var(--accent);
        border-radius: 1px;
        animation: audioDotPulse 1s ease-in-out infinite;
      }
      .audio-dot:nth-child(1) { height: 4px; animation-delay: 0s; }
      .audio-dot:nth-child(2) { height: 7px; animation-delay: 0.15s; }
      .audio-dot:nth-child(3) { height: 5px; animation-delay: 0.3s; }
      .audio-dot:nth-child(4) { height: 8px; animation-delay: 0.1s; }
      @keyframes audioDotPulse {
        0%, 100% { transform: scaleY(0.5); }
        50% { transform: scaleY(1.3); }
      }
      @media (hover: none) and (pointer: coarse) {
        .audio-toggle-btn { display: none; }
      }
    `;
    document.head.appendChild(style);

    // Add visualizer dots
    const dots = document.createElement("div");
    dots.className = "audio-visualizer-dots";
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement("div");
      dot.className = "audio-dot";
      dots.appendChild(dot);
    }
    this.button.appendChild(dots);

    document.body.appendChild(this.button);
    this.button.addEventListener("click", () => this.toggle());
  }

  async toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      await this.enable();
    }
  }

  async enable() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
      this.buildAudioGraph();
    }

    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.masterGain.gain.setValueAtTime(
      this.masterGain.gain.value,
      this.audioCtx.currentTime,
    );
    this.masterGain.gain.linearRampToValueAtTime(
      0.08,
      this.audioCtx.currentTime + 2,
    );

    this.isEnabled = true;
    this.button.classList.add("active");
    this.button.querySelector("i").className = "fas fa-volume-low";
    this.startResonanceLoop();
  }

  disable() {
    if (!this.audioCtx) return;
    this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.masterGain.gain.setValueAtTime(
      this.masterGain.gain.value,
      this.audioCtx.currentTime,
    );
    this.masterGain.gain.linearRampToValueAtTime(
      0,
      this.audioCtx.currentTime + 1.5,
    );

    this.isEnabled = false;
    this.button.classList.remove("active");
    this.button.querySelector("i").className = "fas fa-volume-xmark";
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  buildAudioGraph() {
    const ctx = this.audioCtx;

    // Layer 1: Deep drone — two detuned oscillators
    const droneFreqs = [55, 55.15]; // A1 slightly detuned
    droneFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.4;
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.nodes.push({ osc, gain, baseFreq: freq, type: "drone" });
    });

    // Layer 2: Mid shimmer — filtered noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 800;
    bpf.Q.value = 8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.015;

    noise.connect(bpf);
    bpf.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
    this.nodes.push({
      source: noise,
      filter: bpf,
      gain: noiseGain,
      type: "shimmer",
    });

    // Layer 3: Sub pulse — very low sine with LFO
    const subOsc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const subGain = ctx.createGain();

    subOsc.type = "sine";
    subOsc.frequency.value = 27.5; // A0
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 3;
    subGain.gain.value = 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(subOsc.frequency);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    lfo.start();
    subOsc.start();
    this.nodes.push({ osc: subOsc, lfo, gain: subGain, type: "sub" });
  }

  bindInteractionEvents() {
    // Mouse movement increases resonance
    document.addEventListener("mousemove", () => {
      if (!this.isEnabled) return;
      this.targetResonance = Math.min(1, this.targetResonance + 0.04);
    });

    // Scroll pulses
    window.addEventListener(
      "scroll",
      () => {
        if (!this.isEnabled) return;
        this.targetResonance = Math.min(1, this.targetResonance + 0.12);
      },
      { passive: true },
    );

    // Click creates a brief resonance spike
    document.addEventListener("click", () => {
      if (!this.isEnabled) return;
      this.targetResonance = Math.min(1, this.targetResonance + 0.4);
    });
  }

  startResonanceLoop() {
    const tick = () => {
      if (!this.isEnabled) return;

      // Decay resonance
      this.targetResonance *= 0.95;
      this.currentResonance +=
        (this.targetResonance - this.currentResonance) * 0.05;

      const res = this.currentResonance;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Modulate audio nodes based on resonance
      this.nodes.forEach((node) => {
        if (node.type === "drone") {
          const detune = res * 12;
          node.osc.detune.setTargetAtTime(detune, now, 0.1);
        }
        if (node.type === "shimmer") {
          const freq = 800 + res * 1200;
          node.filter.frequency.setTargetAtTime(freq, now, 0.1);
          node.gain.gain.setTargetAtTime(0.015 + res * 0.04, now, 0.1);
        }
      });

      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }
}

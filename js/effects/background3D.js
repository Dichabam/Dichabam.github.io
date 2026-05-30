import { state } from "../core/state.js";
import { debounce } from "../core/utils.js";

let scene, camera, renderer, controls;
let particles, model;
let animationId;
let isPaused = false;

// ── Biometric state ────────────────────────────────────────────────────────
let _moodTargetH = 186; // hue of #03b3c3
let _moodTargetS = 97;
let _moodTargetL = 39;
let _moodCurrentH = 186;
let _moodCurrentS = 97;
let _moodCurrentL = 39;
let _speedMult = 1.0;
let _targetSpeed = 1.0;

export function initBackground() {
  const container = document.getElementById("lights");
  if (!container) return;

  if (typeof THREE === "undefined") {
    console.error("Three.js is not loaded.");
    return;
  }

  const hasExtras = THREE.GLTFLoader && THREE.OrbitControls;

  injectPointerEventsCSS();

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.008);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    3000,
  );
  camera.position.z = 500;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  renderer.domElement.style.position = "fixed";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.zIndex = "-1";
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(200, 500, 300);
  scene.add(dirLight);

  createParticles();
  if (hasExtras) {
    loadModel();
    setupControls();
  }

  window.addEventListener("resize", debounce(onWindowResize, 200), false);

  window.addEventListener("toggle-effects", (e) => {
    container.style.display = e.detail ? "block" : "none";
  });

  window.addEventListener("pause-background", (e) => {
    isPaused = e.detail;
  });

  window.addEventListener("theme-change", (e) => {
    const theme = e.detail;
    if (theme === "default" || !theme) {
      if (typeof gsap !== "undefined") {
        gsap.to(container, { opacity: 1, duration: 0.5 });
      } else {
        container.style.opacity = "1";
      }
      isPaused = false;
    } else {
      if (typeof gsap !== "undefined") {
        gsap.to(container, { opacity: 0, duration: 0.5 });
      } else {
        container.style.opacity = "0";
      }
      isPaused = true;
    }
  });

  // ── Wire up biometric updates ──────────────────────────────────────────
  window.addEventListener("biometricUpdate", (e) => {
    const { h, s, l, mood } = e.detail;
    _moodTargetH = h;
    _moodTargetS = s;
    _moodTargetL = l;
    // speed: calm = 0.4×, frantic = 2.8×
    _targetSpeed = 0.4 + mood * 2.4;
  });

  animate();
}

function injectPointerEventsCSS() {
  const styleId = "interactive-bg-style";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    #settings-btn {
      pointer-events: auto;
      z-index: 1000;
    }
  `;
  document.head.appendChild(style);
}

function setupControls() {
  if (window.innerWidth < 768) return;
  controls = new THREE.OrbitControls(camera, document.body);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
}

function loadModel() {
  const loader = new THREE.GLTFLoader();
  loader.load(
    "./assets/models/Un.glb",
    (gltf) => {
      model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.scale.setScalar(105);
      scene.add(model);
    },
    undefined,
    (error) => console.error("Model error:", error),
  );
}

function createParticles() {
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 2500 : 7000;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const randomness = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);

  const colorInside = new THREE.Color("#03b3c3");
  const colorOutside = new THREE.Color("#024c54");

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = Math.random() * 500 + 10;
    const angle = i * 0.1 + Math.random() * Math.PI * 2;
    const depth = (Math.random() - 0.5) * 1500;

    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius;
    positions[i3 + 2] = depth;

    randomness[i3] = Math.random();
    randomness[i3 + 1] = Math.random();
    randomness[i3 + 2] = Math.random();

    sizes[i] = Math.random();

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / 1500);
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randomness, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uMoodColor: { value: new THREE.Color("#03b3c3") }, // ← biometric colour
      uSpeedMult: { value: 1.0 }, // ← biometric speed
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uSpeedMult;

      attribute vec3 aRandom;
      attribute float aSize;
      attribute vec3 color;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec3 pos = position;

        float t = uTime * 0.1 * uSpeedMult;
        float angle = t + (pos.z * 0.001);
        float s = sin(angle);
        float c = cos(angle);
        float x = pos.x * c - pos.y * s;
        float y = pos.x * s + pos.y * c;
        pos.x = x;
        pos.y = y;

        pos += normalize(pos) * sin(uTime * 0.5 * uSpeedMult + aRandom.x * 10.0) * 10.0;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        gl_PointSize = (1200.0 * aSize * uPixelRatio) / -mvPosition.z;

        float dist = length(mvPosition.xyz);
        vAlpha = 1.0 - smoothstep(1000.0, 2500.0, dist);
        vColor = color;
      }
    `,
    fragmentShader: `
      uniform vec3 uMoodColor;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float glow = 1.0 - (d * 2.0);
        glow = pow(glow, 2.0);

        // Blend base particle colour toward the mood colour
        vec3 finalColor = mix(vColor, uMoodColor, 0.45);

        gl_FragColor = vec4(finalColor, vAlpha * glow);
      }
    `,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (particles && particles.material.uniforms.uPixelRatio) {
    particles.material.uniforms.uPixelRatio.value = Math.min(
      window.devicePixelRatio,
      2,
    );
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);

  if (!state.effectsEnabled || isPaused) return;

  const time = performance.now() * 0.0005;

  if (particles) {
    // ── Smoothly lerp the biometric colour into the shader uniform ─────────
    _moodCurrentH += (_moodTargetH - _moodCurrentH) * 0.02;
    _moodCurrentS += (_moodTargetS - _moodCurrentS) * 0.02;
    _moodCurrentL += (_moodTargetL - _moodCurrentL) * 0.02;
    _speedMult += (_targetSpeed - _speedMult) * 0.025;

    // Convert HSL to THREE.Color (THREE accepts CSS strings)
    const moodCSS = `hsl(${_moodCurrentH.toFixed(0)}, ${_moodCurrentS.toFixed(0)}%, ${_moodCurrentL.toFixed(0)}%)`;
    particles.material.uniforms.uMoodColor.value.setStyle(moodCSS);
    particles.material.uniforms.uSpeedMult.value = _speedMult;
    particles.material.uniforms.uTime.value = time;
  }

  if (controls) {
    // Also speed up orbit rotation with mood
    controls.autoRotateSpeed = 0.5 * _speedMult;
    controls.update();
  } else if (model) {
    model.rotation.y += 0.002 * _speedMult;
  }

  renderer.render(scene, camera);
}

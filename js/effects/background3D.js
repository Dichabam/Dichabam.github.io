import { state } from "../core/state.js";
import { debounce } from "../core/utils.js";

// Global variables
let scene, camera, renderer, controls;
let particles, model;
let animationId;
let isPaused = false;

export function initBackground() {
  const container = document.getElementById("lights");
  if (!container) return;

  if (typeof THREE === "undefined") {
    console.error("Three.js is not loaded.");
    return;
  }

  const hasExtras = THREE.GLTFLoader && THREE.OrbitControls;
  if (!hasExtras) {
    console.warn(
      "GLTFLoader or OrbitControls missing. Model interaction limited."
    );
  }

  // 1. Setup Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.009);

  // 2. Setup Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    3000
  );
  camera.position.z = 500;

  // 3. Setup Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // 4. Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(200, 500, 300);
  scene.add(dirLight);

  // 5. Create Elements
  createParticles();
  if (hasExtras) {
    loadModel();
    setupControls();
  }

  // 6. Event Listeners
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
      gsap.to(container, { opacity: 1, duration: 0.5 });
      isPaused = false;
    } else {
      gsap.to(container, { opacity: 0, duration: 0.5 });
      isPaused = true;
    }
  });

  animate();
}

function setupControls() {
  // FIX: Disable controls on mobile (< 768px) to allow page scrolling
  if (window.innerWidth < 768) {
    return;
  }

  // On Desktop, listen to body so we can click "through" the content
  controls = new THREE.OrbitControls(camera, document.body);

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Interaction Settings: Rotate ONLY
  controls.enableZoom = false;
  controls.enablePan = false;

  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
}

function loadModel() {
  const loader = new THREE.GLTFLoader();
  loader.load(
    "./assets/models/model.glb",
    (gltf) => {
      model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      model.scale.setScalar(450);

      scene.add(model);
      console.log("Model loaded.");
    },
    undefined,
    (error) => console.error("Model error:", error)
  );
}

function createParticles() {
  // Standard Vortex Logic
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 1500 : 4000;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const randomness = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);

  const colorInside = new THREE.Color("#03b3c3");
  const colorOutside = new THREE.Color("#024c54");

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = Math.random() * Math.random() * 400 + 50;
    const angle = i * 0.1 + Math.random() * Math.PI * 2;
    const depth = (Math.random() - 0.5) * 1000;

    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius;
    positions[i3 + 2] = depth;

    randomness[i3] = Math.random();
    randomness[i3 + 1] = Math.random();
    randomness[i3 + 2] = Math.random();

    sizes[i] = Math.random();

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / 400);

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
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      
      attribute vec3 aRandom;
      attribute float aSize;
      attribute vec3 color;
      
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        
        // Rotation
        float angle = uTime * 0.1 + (pos.z * 0.001);
        float s = sin(angle);
        float c = cos(angle);
        float x = pos.x * c - pos.y * s;
        float y = pos.x * s + pos.y * c;
        pos.x = x;
        pos.y = y;

        // Pulse
        pos += normalize(pos) * sin(uTime * 0.5 + aRandom.x * 10.0) * 10.0;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        gl_PointSize = (1200.0 * aSize * uPixelRatio) / -mvPosition.z;
        
        float dist = length(mvPosition.xyz);
        vAlpha = 1.0 - smoothstep(400.0, 900.0, dist);
        vColor = color;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float glow = 1.0 - (d * 2.0);
        glow = pow(glow, 2.0);
        gl_FragColor = vec4(vColor, vAlpha * glow);
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
      2
    );
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);

  if (!state.effectsEnabled || isPaused) return;

  const time = performance.now() * 0.0005;

  if (particles) {
    particles.material.uniforms.uTime.value = time;
  }

  // UPDATED: Handle controls OR manual fallback
  if (controls) {
    controls.update();
  } else if (model) {
    // Mobile Fallback: Manually rotate the model since OrbitControls are disabled
    model.rotation.y += 0.002;
  }

  renderer.render(scene, camera);
}

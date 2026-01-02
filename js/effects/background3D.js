import { state } from "../core/state.js";
import { debounce } from "../core/utils.js"; // Import debounce

// NOTE: No import of THREE here to avoid module resolution errors.
// We rely on the global 'THREE' object loaded via the <script> tag in index.html.

let scene, camera, renderer;
let starMesh, gridHelper;
let animationId;
let isPaused = false;

export function initBackground() {
  const container = document.getElementById("lights");
  if (!container) return;

  if (typeof THREE === "undefined") {
    console.error("Three.js is not loaded.");
    return;
  }

  // 1. Setup Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.02);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1, 5);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // 2. Stars
  // OPTIMIZATION: Reduce star count significantly on mobile devices
  const isMobile = window.innerWidth < 768;
  const starsCount = isMobile ? 200 : 700;

  const positions = new Float32Array(starsCount * 3);
  const speeds = new Float32Array(starsCount);

  for (let i = 0; i < starsCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 60;
    positions[i + 1] = (Math.random() - 0.5) * 60;
    positions[i + 2] = (Math.random() - 0.5) * 200;
    speeds[i / 3] = Math.random() * 0.5 + 0.1;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

  const starMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      color: { value: new THREE.Color(0x03b3c3) },
    },
    transparent: true,
    vertexShader: `
        uniform float uTime; 
        attribute float aSpeed; 
        varying float vAlpha;
        void main() {
            vec3 pos = position;
            pos.z = mod(position.z + uTime * 60.0 * aSpeed, 200.0) - 150.0;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = (250.0 / -mvPosition.z) * aSpeed;
            gl_Position = projectionMatrix * mvPosition;
            vAlpha = smoothstep(150.0, 90.0, abs(pos.z)); 
        }
    `,
    fragmentShader: `
        uniform vec3 color; 
        varying float vAlpha;
        void main() {
            if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
            gl_FragColor = vec4(color, vAlpha * 0.9);
        }
    `,
  });

  starMesh = new THREE.Points(starGeo, starMat);
  scene.add(starMesh);

  // 3. Grid
  gridHelper = new THREE.GridHelper(200, 40, 0x5469d4, 0x222222);
  gridHelper.position.set(0, -2, -50);
  gridHelper.scale.set(1, 1, 5);
  scene.add(gridHelper);

  // OPTIMIZATION: Debounce resize event
  window.addEventListener("resize", debounce(onWindowResize, 200), false);

  window.addEventListener("toggle-effects", (e) => {
    container.style.display = e.detail ? "block" : "none";
  });
  window.addEventListener("pause-background", (e) => {
    isPaused = e.detail;
  });

  window.addEventListener("theme-change", (e) => {
    const theme = e.detail;
    if (theme === "default") {
      container.style.opacity = "1";
      isPaused = false;
    } else {
      container.style.opacity = "0";
      isPaused = true;
    }
  });

  animate();
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();

function animate() {
  animationId = requestAnimationFrame(animate);

  if (!state.effectsEnabled || isPaused) return;

  const time = clock.getElapsedTime();

  if (starMesh) {
    starMesh.material.uniforms.uTime.value = time;
  }

  if (gridHelper) {
    gridHelper.position.z = ((time * 15) % 10) - 50;
  }

  renderer.render(scene, camera);
}

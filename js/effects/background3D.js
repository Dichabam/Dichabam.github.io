import { state } from "../core/state.js";
import { debounce } from "../core/utils.js";

// NOTE: We rely on the global 'THREE' object loaded via the <script> tag in index.html.

let scene, camera, renderer;
let particles;
let animationId;
let isPaused = false;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

export function initBackground() {
  const container = document.getElementById("lights");
  if (!container) return;

  if (typeof THREE === "undefined") {
    console.error("Three.js is not loaded.");
    return;
  }

  // 1. Setup Scene
  scene = new THREE.Scene();
  // Deep fog for the "void" effect
  scene.fog = new THREE.FogExp2(0x000000, 0.001);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  // Camera position
  camera.position.z = 500;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // 2. Create the Vortex
  createParticles();

  // 3. Event Listeners
  window.addEventListener("resize", debounce(onWindowResize, 200), false);
  document.addEventListener("mousemove", onMouseMove, false);

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

function createParticles() {
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 1500 : 4000;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const randomness = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);

  const colorInside = new THREE.Color("#03b3c3"); // Cyan
  const colorOutside = new THREE.Color("#024c54"); // Darker Teal

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // SPIRAL / VORTEX GENERATION
    // We position particles in a cylindrical spiral
    const radius = Math.random() * Math.random() * 400 + 50; // Bias towards center
    const angle = i * 0.1 + Math.random() * Math.PI * 2;
    const depth = (Math.random() - 0.5) * 1000; // Deep tunnel

    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius;
    positions[i3 + 2] = depth;

    // Random noise for organic movement
    randomness[i3] = Math.random();
    randomness[i3 + 1] = Math.random();
    randomness[i3 + 2] = Math.random();

    sizes[i] = Math.random();

    // Color mixing based on radius (inner is brighter)
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

  // Advanced Shader for Vortex Movement
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      uniform vec2 uMouse;
      
      attribute vec3 aRandom;
      attribute float aSize;
      attribute vec3 color;
      
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        
        // 1. ROTATION: Rotate entire structure around Z axis over time
        float angle = uTime * 0.1 + (pos.z * 0.001); // Twist effect
        float s = sin(angle);
        float c = cos(angle);
        
        // Apply rotation
        float x = pos.x * c - pos.y * s;
        float y = pos.x * s + pos.y * c;
        pos.x = x;
        pos.y = y;

        // 2. MOUSE PARALLAX (Tilting)
        // Rotate world based on mouse position
        float mx = uMouse.x * 0.5;
        float my = uMouse.y * 0.5;
        
        // Tilt X
        float cz = cos(mx);
        float sz = sin(mx);
        pos.x = pos.x * cz - pos.z * sz;
        pos.z = pos.x * sz + pos.z * cz;
        
        // Tilt Y
        float cx = cos(my);
        float sx = sin(my);
        pos.y = pos.y * cx - pos.z * sx;
        pos.z = pos.y * sx + pos.z * cx;

        // 3. PULSE
        // Gentle expansion/contraction
        pos += normalize(pos) * sin(uTime * 0.5 + aRandom.x * 10.0) * 10.0;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // 4. SIZE ATTENUATION
        // INCREASED SIZE HERE: 1200.0 (was 300.0)
        gl_PointSize = (1200.0 * aSize * uPixelRatio) / -mvPosition.z;
        
        // 5. DEPTH FADE
        // Fade out if too close or too far
        float dist = length(mvPosition.xyz);
        vAlpha = 1.0 - smoothstep(400.0, 900.0, dist);
        vColor = color;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        // Draw a soft circle with a hard center (Tech/Star look)
        float d = distance(gl_PointCoord, vec2(0.5));
        
        // Discard corners to make a circle
        if (d > 0.5) discard;
        
        // Glow gradient
        float glow = 1.0 - (d * 2.0);
        glow = pow(glow, 2.0); // Sharpen the glow
        
        gl_FragColor = vec4(vColor, vAlpha * glow);
      }
    `,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
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

  const time = performance.now() * 0.0005; // Slower time scale

  if (particles) {
    particles.material.uniforms.uTime.value = time;

    // Smooth camera/mouse transition
    targetRotationX += (mouseX - targetRotationX) * 0.03;
    targetRotationY += (mouseY - targetRotationY) * 0.03;

    particles.material.uniforms.uMouse.value.set(
      targetRotationX,
      targetRotationY
    );
  }

  renderer.render(scene, camera);
}

// import { state } from "../core/state.js";
// import { debounce } from "../core/utils.js"; // Import debounce

// // NOTE: No import of THREE here to avoid module resolution errors.
// // We rely on the global 'THREE' object loaded via the <script> tag in index.html.

// let scene, camera, renderer;
// let starMesh; // Removed gridHelper
// let animationId;
// let isPaused = false;

// export function initBackground() {
//   const container = document.getElementById("lights");
//   if (!container) return;

//   if (typeof THREE === "undefined") {
//     console.error("Three.js is not loaded.");
//     return;
//   }

//   // 1. Setup Scene
//   scene = new THREE.Scene();
//   scene.fog = new THREE.FogExp2(0x050505, 0.02);

//   camera = new THREE.PerspectiveCamera(
//     75,
//     window.innerWidth / window.innerHeight,
//     0.1,
//     1000
//   );
//   camera.position.set(0, 1, 5);

//   renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//   container.appendChild(renderer.domElement);

//   // 2. Stars
//   // OPTIMIZATION: Reduce star count significantly on mobile devices
//   const isMobile = window.innerWidth < 768;
//   const starsCount = isMobile ? 200 : 1500;

//   const positions = new Float32Array(starsCount * 3);
//   const speeds = new Float32Array(starsCount);

//   for (let i = 0; i < starsCount * 3; i += 3) {
//     positions[i] = (Math.random() - 0.5) * 60;
//     positions[i + 1] = (Math.random() - 0.5) * 60;
//     positions[i + 2] = (Math.random() - 0.5) * 200;
//     speeds[i / 3] = Math.random() * 0.5 + 0.1;
//   }

//   const starGeo = new THREE.BufferGeometry();
//   starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
//   starGeo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

//   const starMat = new THREE.ShaderMaterial({
//     uniforms: {
//       uTime: { value: 0 },
//       color: { value: new THREE.Color(0x03b3c3) },
//     },
//     transparent: true,
//     vertexShader: `
//         uniform float uTime;
//         attribute float aSpeed;
//         varying float vAlpha;
//         void main() {
//             vec3 pos = position;
//             pos.z = mod(position.z + uTime * 60.0 * aSpeed, 200.0) - 150.0;
//             vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
//             gl_PointSize = (250.0 / -mvPosition.z) * aSpeed;
//             gl_Position = projectionMatrix * mvPosition;
//             vAlpha = smoothstep(150.0, 90.0, abs(pos.z));
//         }
//     `,
//     fragmentShader: `
//         uniform vec3 color;
//         varying float vAlpha;
//         void main() {
//             if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
//             gl_FragColor = vec4(color, vAlpha * 0.9);
//         }
//     `,
//   });

//   starMesh = new THREE.Points(starGeo, starMat);
//   scene.add(starMesh);

//   // 3. Grid REMOVED

//   // OPTIMIZATION: Debounce resize event
//   window.addEventListener("resize", debounce(onWindowResize, 200), false);

//   window.addEventListener("toggle-effects", (e) => {
//     container.style.display = e.detail ? "block" : "none";
//   });
//   window.addEventListener("pause-background", (e) => {
//     isPaused = e.detail;
//   });

//   window.addEventListener("theme-change", (e) => {
//     const theme = e.detail;
//     if (theme === "default") {
//       container.style.opacity = "1";
//       isPaused = false;
//     } else {
//       container.style.opacity = "0";
//       isPaused = true;
//     }
//   });

//   animate();
// }

// function onWindowResize() {
//   if (!camera || !renderer) return;
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }

// const clock = new THREE.Clock();

// function animate() {
//   animationId = requestAnimationFrame(animate);

//   if (!state.effectsEnabled || isPaused) return;

//   const time = clock.getElapsedTime();

//   if (starMesh) {
//     starMesh.material.uniforms.uTime.value = time;
//   }

//   // Grid animation removed

//   renderer.render(scene, camera);
// }

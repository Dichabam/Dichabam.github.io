export class PixelBlastEffect {
  constructor(containerId) {
    if (typeof THREE === "undefined") return;
    this.container = document.getElementById(containerId);
    this.clickIndex = 0; 
    this.init();
  }

  init() {
    const canvas = document.createElement("canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(1);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.uniforms = {
      uResolution: {
        value: new THREE.Vector2(
          this.container.clientWidth,
          this.container.clientHeight
        ),
      },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#B19EEF") },
      uClickPos: {
        value: Array.from({ length: 10 }, () => new THREE.Vector2(-1000, -1000)),
      },
      uClickTimes: { value: new Float32Array(10) },
      uShapeType: { value: 2 },
      uPixelSize: { value: 6 },
      uScale: { value: 1 },
      uDensity: { value: 0.7 },
      uPixelJitter: { value: 0.5 },
      uEnableRipples: { value: 1 },
      uRippleSpeed: { value: 0.4 },
      uRippleThickness: { value: 0.08 },
      uRippleIntensity: { value: 0.8 },
      uEdgeFade: { value: 0.25 },
    };

    const fragmentShader = `
            precision highp float;
            uniform vec3 uColor; uniform vec2 uResolution; uniform float uTime;
            uniform float uPixelSize; uniform float uScale; uniform float uDensity;
            uniform float uPixelJitter; uniform int uEnableRipples;
            uniform float uRippleSpeed; uniform float uRippleThickness; uniform float uRippleIntensity;
            uniform float uEdgeFade;
            const int MAX_CLICKS = 10;
            uniform vec2 uClickPos[MAX_CLICKS]; uniform float uClickTimes[MAX_CLICKS];

            float hash11(float n){ return fract(sin(n)*43758.5453); }
            float vnoise(vec3 p){
                vec3 ip = floor(p); vec3 fp = fract(p);
                float n000 = hash11(dot(ip, vec3(1.0,57.0,113.0)));
                float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
                float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
                float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
                vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
                return mix(mix(n000,n100,w.x), mix(n010,n001,w.y), w.z) * 2.0 - 1.0; 
            }
            float fbm2(vec2 uv, float t){
                vec3 p = vec3(uv * uScale, t);
                float amp = 1.0; float freq = 1.0; float sum = 0.0;
                for(int i=0; i<3; ++i){ sum += amp * vnoise(p * freq); freq *= 1.25; amp *= 1.0; }
                return sum * 0.5 + 0.5;
            }
            float Bayer2(vec2 a) { a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); }
            #define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))

            void main(){
                vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
                float aspectRatio = uResolution.x / uResolution.y;
                vec2 pixelUV = fract(fragCoord / uPixelSize);
                vec2 cellId = floor(fragCoord / (8.0 * uPixelSize));
                vec2 cellCoord = cellId * (8.0 * uPixelSize);
                vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

                float base = fbm2(uv, uTime * 0.05);
                float feed = (base * 0.5 - 0.65) + (uDensity - 0.5) * 0.3;

                if(uEnableRipples == 1){
                    for(int i=0; i<MAX_CLICKS; ++i){
                        vec2 pos = uClickPos[i];
                        if(pos.x < -500.0) continue; // Skip unused
                        
                        // Calculate distance from this click
                        // Pos is in pixels (centered 0,0)
                        vec2 clickVec = (pos - uResolution * 0.5); 
                        
                        // Distance in UV space logic (matching original shader structure)
                        // Note: The original shader logic was slightly complex with UVs. 
                        // Simplified: distance in pixels, then normalized.
                        
                        float d = distance(fragCoord, clickVec);
                        
                        float t = max(uTime - uClickTimes[i], 0.0);
                        float radius = uRippleSpeed * t * (min(uResolution.x, uResolution.y)); 
                        
                        // Gaussian ripple
                        float wave = exp(-pow((d - radius) / (uRippleThickness * 500.0), 2.0));
                        feed = max(feed, wave * uRippleIntensity);
                    }
                }

                float bayer = Bayer4(fragCoord / uPixelSize) - 0.5;
                float bw = step(0.5, feed + bayer);
                float h = fract(sin(dot(floor(fragCoord/uPixelSize), vec2(127.1,311.7)))*43758.5453);
                float coverage = bw * (1.0 + (h - 0.5) * uPixelJitter);
                gl_FragColor = vec4(uColor, coverage);
            }
        `;

    const material = new THREE.ShaderMaterial({
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
    });

    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    this.clock = new THREE.Clock();

    this.onResize = this.onResize.bind(this);
    this.onInput = this.onInput.bind(this);
    
    window.addEventListener("resize", this.onResize);
    this.container.addEventListener("mousedown", this.onInput);
    this.container.addEventListener("touchstart", this.onInput, { passive: false });

    this.animate();
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.uniforms.uResolution.value.set(w, h);
  }

  onInput(e) {
    if (e.type === 'touchstart') e.preventDefault();
    
    const rect = this.container.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.changedTouches) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const x = clientX - rect.left;

    const y = (rect.height - (clientY - rect.top)); 

    this.uniforms.uClickPos.value[this.clickIndex].set(x, y);
    this.uniforms.uClickTimes.value[this.clickIndex] = this.clock.getElapsedTime();
    
    this.clickIndex = (this.clickIndex + 1) % 10;
  }

  animate() {
    this.raf = requestAnimationFrame(this.animate.bind(this));
    if (this.container.offsetParent === null) return;
    this.uniforms.uTime.value = this.clock.getElapsedTime();
    this.renderer.render(this.scene, this.camera);
  }
}
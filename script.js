// ===== MOBILE DETECTION =====
function isMobileDevice() {
    const isSmallScreen = window.innerWidth < 1024;
    const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
    return isSmallScreen || isMobileUA;
}

const IS_MOBILE = isMobileDevice();

if (IS_MOBILE) {
    document.getElementById('mobile-view').style.display = 'flex';
    document.getElementById('loading-screen').classList.add('hidden');
    console.log('📱 Mobile mode - showing message');
} else {
    console.log('🖥️ Desktop mode - loading 3D scene');
}

// ===== THREE.JS SETUP =====
const canvas = document.getElementById('webgl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ===== FPS COUNTER =====
let frameCount = 0;
let lastTime = performance.now();
const fpsCounter = document.querySelector('.fps-counter');

function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        fpsCounter.textContent = `${fps} FPS`;
        fpsCounter.style.color = fps >= 55 ? '#ffffff' : fps >= 30 ? '#ffd700' : '#ff6b9d';
        frameCount = 0;
        lastTime = currentTime;
    }
}

// ===== SKY - DARK STARRY NIGHT =====
scene.background = new THREE.Color(0x0a1428);

const skyGeo = new THREE.SphereGeometry(500, 32, 32);
const skyMat = new THREE.ShaderMaterial({
    uniforms: {
        topColor: { value: new THREE.Color(0x0a1428) },      // Deep navy
        middleColor: { value: new THREE.Color(0x1a2a3f) },   // Space blue
        bottomColor: { value: new THREE.Color(0x0f1f35) }    // Dark blue
    },
    vertexShader: `
        varying float vY;
        void main() {
            vY = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 middleColor;
        uniform vec3 bottomColor;
        varying float vY;
        void main() {
            vec3 color;
            if (vY > 0.2) {
                color = mix(middleColor, topColor, (vY - 0.2) / 0.8);
            } else {
                color = mix(bottomColor, middleColor, (vY + 1.0) / 1.2);
            }
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// ===== LIGHTING =====
const ambient = new THREE.AmbientLight(0x2a3a5a, 0.4);
scene.add(ambient);

// Moonlight as key light
const moonLight = new THREE.DirectionalLight(0xb3d9ff, 1.8);
moonLight.position.set(40, 50, -30);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.far = 120;
scene.add(moonLight);

// Warm fill light from flowers
const fillLight = new THREE.PointLight(0xff88dd, 0.6, 60);
fillLight.position.set(0, 5, 10);
scene.add(fillLight);

// Blue rim light
const rimLight = new THREE.DirectionalLight(0x44ddff, 0.5);
rimLight.position.set(-30, 30, 20);
scene.add(rimLight);

// ===== CRESCENT MOON =====
const moonGroup = new THREE.Group();

// Moon sphere
const moonGeo = new THREE.SphereGeometry(3, 32, 32);
const moonMat = new THREE.MeshBasicMaterial({ 
    color: 0xfff9e6,
    transparent: true,
    opacity: 0.95
});
const moon = new THREE.Mesh(moonGeo, moonMat);
moonGroup.add(moon);

// Moon glow
const glowGeo = new THREE.SphereGeometry(3.5, 32, 32);
const glowMat = new THREE.MeshBasicMaterial({
    color: 0xfff4d6,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
});
const moonGlow = new THREE.Mesh(glowGeo, glowMat);
moonGroup.add(moonGlow);

// Outer glow
const outerGlowGeo = new THREE.SphereGeometry(5, 32, 32);
const outerGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffe9b3,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
});
const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
moonGroup.add(outerGlow);

moonGroup.position.set(45, 55, -80);
scene.add(moonGroup);

// ===== ROLLING HILL TERRAIN =====
const groundGeo = new THREE.PlaneGeometry(200, 200, 150, 150);

// Create vibrant flower texture
const flowerCanvas = document.createElement('canvas');
flowerCanvas.width = 1024;
flowerCanvas.height = 1024;
const ctx = flowerCanvas.getContext('2d');

// Darker base grass color for night
ctx.fillStyle = '#1a2d1f';
ctx.fillRect(0, 0, 1024, 1024);

// Draw darker grass texture
for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const len = Math.random() * 3 + 1;
    const greenVal = 25 + Math.random() * 20;
    ctx.strokeStyle = `rgba(${greenVal * 0.6}, ${greenVal}, ${greenVal * 0.7}, ${0.3 + Math.random() * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * len, y - len * 2);
    ctx.stroke();
}

// Draw VIBRANT varied flowers - oranges, pinks, purples, yellows, whites
const flowerColors = [
    { r: 255, g: 136, b: 68 },   // Vibrant orange
    { r: 255, g: 51, b: 136 },   // Hot pink
    { r: 255, g: 102, b: 204 },  // Pink
    { r: 170, g: 68, b: 255 },   // Purple
    { r: 204, g: 68, b: 255 },   // Light purple
    { r: 255, g: 204, b: 102 },  // Yellow-orange
    { r: 255, g: 255, b: 255 },  // White
    { r: 255, g: 238, b: 136 }   // Soft yellow
];

for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const size = Math.random() * 5 + 2;
    
    // Pick random vibrant color
    const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    const brightness = 0.7 + Math.random() * 0.3;
    
    ctx.fillStyle = `rgba(${color.r * brightness}, ${color.g * brightness}, ${color.b * brightness}, 0.9)`;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow for some flowers
    if (Math.random() > 0.7) {
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
        ctx.beginPath();
        ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

const flowerTexture = new THREE.CanvasTexture(flowerCanvas);
flowerTexture.wrapS = THREE.RepeatWrapping;
flowerTexture.wrapT = THREE.RepeatWrapping;
flowerTexture.repeat.set(15, 15);

const groundMat = new THREE.MeshStandardMaterial({
    map: flowerTexture,
    roughness: 0.85,
    metalness: 0,
    color: 0x2a3d2a
});

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
ground.receiveShadow = true;

// Create rolling hills with perlin-like noise
const pos = ground.geometry.attributes.position.array;
for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];
    const y = pos[i + 1];
    
    // Create rolling hills
    const wave1 = Math.sin(x * 0.03) * Math.cos(y * 0.04) * 4;
    const wave2 = Math.sin(x * 0.07) * Math.sin(y * 0.06) * 2;
    const random = (Math.random() - 0.5) * 0.8;
    
    pos[i + 2] = wave1 + wave2 + random;
}

ground.geometry.attributes.position.needsUpdate = true;
ground.geometry.computeVertexNormals();
scene.add(ground);

// ===== STARS =====
const starsGeo = new THREE.BufferGeometry();
const starVerts = [];
const starSizes = [];

for (let i = 0; i < 6000; i++) {
    starVerts.push(
        (Math.random() - 0.5) * 900,
        Math.random() * 450 + 50,
        (Math.random() - 0.5) * 900
    );
    starSizes.push(Math.random() * 2.5 + 0.5);
}

starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
starsGeo.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

// Brighter star texture for night sky
const starCanvas = document.createElement('canvas');
starCanvas.width = 32;
starCanvas.height = 32;
const starCtx = starCanvas.getContext('2d');
const starGrad = starCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
starGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
starGrad.addColorStop(0.2, 'rgba(230, 240, 255, 0.9)');
starGrad.addColorStop(1, 'rgba(200, 220, 255, 0)');
starCtx.fillStyle = starGrad;
starCtx.fillRect(0, 0, 32, 32);

const stars = new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({
        size: 3,
        map: new THREE.CanvasTexture(starCanvas),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    })
);
scene.add(stars);

// ===== FLOATING PETALS =====
const petalGeo = new THREE.BufferGeometry();
const petalVerts = [];
const petalSizes = [];

for (let i = 0; i < 150; i++) {
    petalVerts.push(
        (Math.random() - 0.5) * 60,
        Math.random() * 40 - 10,
        (Math.random() - 0.5) * 60
    );
    petalSizes.push(Math.random() * 0.8 + 0.3);
}

petalGeo.setAttribute('position', new THREE.Float32BufferAttribute(petalVerts, 3));
petalGeo.setAttribute('size', new THREE.Float32BufferAttribute(petalSizes, 1));

// Petal texture
const petalCanvas = document.createElement('canvas');
petalCanvas.width = 32;
petalCanvas.height = 32;
const petalCtx = petalCanvas.getContext('2d');
petalCtx.fillStyle = '#ffb3d9';
petalCtx.beginPath();
petalCtx.ellipse(16, 16, 12, 8, Math.PI / 4, 0, Math.PI * 2);
petalCtx.fill();

const petals = new THREE.Points(
    petalGeo,
    new THREE.PointsMaterial({
        size: 1.5,
        map: new THREE.CanvasTexture(petalCanvas),
        transparent: true,
        opacity: 0.7,
        blending: THREE.NormalBlending,
        sizeAttenuation: true
    })
);
scene.add(petals);

// ===== FOG =====
scene.fog = new THREE.FogExp2(0x0a1428, 0.01);

// ===== CAMERA POSITIONS =====
camera.position.set(0, 2, 18);
camera.lookAt(0, 0, 0);

const cameraPositions = [
    { pos: { x: 0, y: 2, z: 0 }, look: { x: 0, y: 0, z: 0 } },      // Home - wide view
    { pos: { x: -3, y: 1, z: 4 }, look: { x: 0, y: 1, z: 0 } },      // About - closer
    { pos: { x: 0, y: 8, z: 22 }, look: { x: 0, y: 0, z: 0 } },      // Work - elevated
    { pos: { x: 2, y: 0, z: 10 }, look: { x: 0, y: 1, z: 0 } }       // Contact - personal
];

// ===== CHARACTER MODEL =====
let avatar = null;
let mixer = null;

const loader = new THREE.GLTFLoader();
loader.load(
    'sachmodel.glb',
    (gltf) => {
        avatar = gltf.scene;
        avatar.scale.set(2, 2, 2);
        avatar.position.set(0, -5, 0);
        
        avatar.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatar);
            gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
            });
        }
        
        scene.add(avatar);
        console.log('✅ Character loaded');
        
        // Hide loading screen after model loads
        document.getElementById('loading-screen').classList.add('hidden');
    },
    (xhr) => console.log(`⏳ Loading: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`),
    (err) => {
        console.error('❌ Failed to load character:', err);
        // Hide loading screen even if model fails
        document.getElementById('loading-screen').classList.add('hidden');
    }
);

// ===== SECTION NAVIGATION =====
let currentSection = 0;
const sections = document.querySelectorAll('.section');
const totalSections = sections.length;
let isAnimating = false;

sections[0].classList.add('active');

function goToSection(index) {
    if (index < 0 || index >= totalSections || isAnimating) return;
    
    isAnimating = true;
    currentSection = index;
    
    sections.forEach((s, i) => s.classList.toggle('active', i === index));
    document.querySelector('.progress-bar').style.width = ((index + 1) / totalSections * 100) + '%';
    
    const pos = cameraPositions[index];
    
    gsap.to(camera.position, {
        x: pos.pos.x,
        y: pos.pos.y,
        z: pos.pos.z,
        duration: 2,
        ease: 'power3.inOut',
        onUpdate: () => camera.lookAt(pos.look.x, pos.look.y, pos.look.z),
        onComplete: () => { isAnimating = false; }
    });
}

// Scroll navigation
let scrollTimeout;
window.addEventListener('wheel', (e) => {
    if (isAnimating) return;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        if (e.deltaY > 0 && currentSection < totalSections - 1) {
            goToSection(currentSection + 1);
        } else if (e.deltaY < 0 && currentSection > 0) {
            goToSection(currentSection - 1);
        }
    }, 50);
}, { passive: true });

// Nav link clicks
document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        goToSection(parseInt(el.getAttribute('data-section')));
    });
});

// Keyboard navigation
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') goToSection(currentSection + 1);
    if (e.key === 'ArrowUp') goToSection(currentSection - 1);
});

// ===== ANIMATION LOOP =====
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = Date.now();
    
    // Update character animation if exists
    if (mixer) mixer.update(delta);
    
    // Gentle floating animation for character
    if (avatar) {
        avatar.position.y = -5 + Math.sin(time * 0.0003) * 0.02;
    }
    
    // Rotate moon group slowly
    moonGroup.rotation.z = Math.sin(time * 0.0001) * 0.05;
    
    // Pulsing moon glow
    if (moonGlow) {
        moonGlow.material.opacity = 0.3 + Math.sin(time * 0.002) * 0.1;
    }
    
    // Animate floating petals
    const petalPositions = petals.geometry.attributes.position.array;
    for (let i = 0; i < petalPositions.length; i += 3) {
        // Drift down and sideways
        petalPositions[i + 1] -= 0.008;
        petalPositions[i] += Math.sin(time * 0.001 + i) * 0.005;
        petalPositions[i + 2] += Math.cos(time * 0.001 + i) * 0.005;
        
        // Reset if fallen too low
        if (petalPositions[i + 1] < -15) {
            petalPositions[i + 1] = 30;
        }
    }
    petals.geometry.attributes.position.needsUpdate = true;
    
    // Twinkle stars
    stars.rotation.y += 0.00005;
    
    updateFPS();
    renderer.render(scene, camera);
}

animate();

// ===== WINDOW RESIZE =====
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('🌌 Cosmic Flower Portfolio Loaded');
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

// ===== SKY - DREAMY GRADIENT =====
scene.background = new THREE.Color(0x6ba3d4);

const skyGeo = new THREE.SphereGeometry(500, 32, 32);
const skyMat = new THREE.ShaderMaterial({
    uniforms: {
        topColor: { value: new THREE.Color(0x6ba3d4) },      // Sky blue
        middleColor: { value: new THREE.Color(0xb89dd6) },   // Purple
        bottomColor: { value: new THREE.Color(0xff9dc1) }    // Pink
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
            if (vY > 0.3) {
                color = mix(middleColor, topColor, (vY - 0.3) / 0.7);
            } else {
                color = mix(bottomColor, middleColor, (vY + 1.0) / 1.3);
            }
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// ===== LIGHTING =====
const ambient = new THREE.AmbientLight(0xffd4e5, 0.8);
scene.add(ambient);

// Soft key light (twilight sun)
const keyLight = new THREE.DirectionalLight(0xffb3d9, 1.2);
keyLight.position.set(-30, 40, 20);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.far = 100;
scene.add(keyLight);

// Moonlight rim
const moonLight = new THREE.DirectionalLight(0xb3d4ff, 0.6);
moonLight.position.set(40, 50, -30);
scene.add(moonLight);

// Fill light
const fillLight = new THREE.PointLight(0xffc4e1, 0.8, 50);
fillLight.position.set(0, 10, 15);
scene.add(fillLight);

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

// Create flower texture
const flowerCanvas = document.createElement('canvas');
flowerCanvas.width = 1024;
flowerCanvas.height = 1024;
const ctx = flowerCanvas.getContext('2d');

// Base grass color
ctx.fillStyle = '#4a6b3a';
ctx.fillRect(0, 0, 1024, 1024);

// Draw grass texture
for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const len = Math.random() * 3 + 1;
    const greenVal = 40 + Math.random() * 30;
    ctx.strokeStyle = `rgba(${greenVal * 0.7}, ${greenVal}, ${greenVal * 0.8}, ${0.4 + Math.random() * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * len, y - len * 2);
    ctx.stroke();
}

// Draw pink flowers
for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const size = Math.random() * 4 + 2;
    
    // Pink flowers
    ctx.fillStyle = Math.random() > 0.5 ? 
        `rgba(255, ${120 + Math.random() * 100}, ${180 + Math.random() * 60}, 0.8)` :
        `rgba(255, 255, 255, 0.7)`;  // White flowers
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}

const flowerTexture = new THREE.CanvasTexture(flowerCanvas);
flowerTexture.wrapS = THREE.RepeatWrapping;
flowerTexture.wrapT = THREE.RepeatWrapping;
flowerTexture.repeat.set(15, 15);

const groundMat = new THREE.MeshStandardMaterial({
    map: flowerTexture,
    roughness: 0.85,
    metalness: 0,
    color: 0x5a7b4a
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

for (let i = 0; i < 4000; i++) {
    starVerts.push(
        (Math.random() - 0.5) * 800,
        Math.random() * 400 + 50,
        (Math.random() - 0.5) * 800
    );
    starSizes.push(Math.random() * 2 + 0.5);
}

starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
starsGeo.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

// Star texture
const starCanvas = document.createElement('canvas');
starCanvas.width = 32;
starCanvas.height = 32;
const starCtx = starCanvas.getContext('2d');
const starGrad = starCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
starGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
starGrad.addColorStop(0.3, 'rgba(255, 245, 230, 0.8)');
starGrad.addColorStop(1, 'rgba(255, 220, 200, 0)');
starCtx.fillStyle = starGrad;
starCtx.fillRect(0, 0, 32, 32);

const stars = new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({
        size: 2.5,
        map: new THREE.CanvasTexture(starCanvas),
        transparent: true,
        opacity: 0.8,
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
scene.fog = new THREE.FogExp2(0x9d7fb5, 0.008);

// ===== CAMERA POSITIONS =====
camera.position.set(0, 2, 18);
camera.lookAt(0, 0, 0);

const cameraPositions = [
    { pos: { x: 0, y: 2, z: 18 }, look: { x: 0, y: 0, z: 0 } },      // Home - wide view
    { pos: { x: -3, y: 1, z: 4 }, look: { x: 0, y: 1, z: 0 } },      // About - closer
    { pos: { x: 0, y: 8, z: 22 }, look: { x: 0, y: 0, z: 0 } },      // Work - elevated
    { pos: { x: 2, y: 0, z: 10 }, look: { x: 0, y: 1, z: 0 } }       // Contact - personal
];

// ===== CHARACTER MODEL (OPTIONAL) =====
let avatar = null;
let mixer = null;

// If you have a character model, uncomment this:
/*
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
    },
    (xhr) => console.log(`⏳ Loading: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`),
    (err) => console.error('❌ Failed to load character:', err)
);
*/

// Hide loading screen after a short delay
setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
}, 1500);

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

console.log('🌸 Flower Hill Portfolio Loaded');

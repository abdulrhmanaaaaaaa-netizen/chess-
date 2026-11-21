import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = (id) => document.getElementById(id);
const ui = {
  menu: $('menuScreen'), garage: $('garageScreen'), pause: $('pauseScreen'), finish: $('finishScreen'), hud: $('hud'),
  status: $('statusText'), speed: $('speedText'), speedFill: $('speedFill'), gear: $('gearText'), distance: $('distanceText'), timer: $('timerText'),
  wheel: $('wheelVisual'), wheelControl: $('wheelControl'), toast: $('toast'), nitroFill: $('nitroFill'), carName: $('carName'), carPower: $('carPower'), carTop: $('carTop')
};

const carSpecs = [
  { name: 'SAQR X1', color: 0xe3343d, power: 1120, top: 360, accel: 1.04 },
  { name: 'SAQR X1 AZURE', color: 0x247bfa, power: 1080, top: 350, accel: 1.08 },
  { name: 'SAQR X1 VOLT', color: 0xf3b627, power: 1180, top: 375, accel: 1.00 },
  { name: 'SAQR X1 SHADOW', color: 0x242936, power: 1160, top: 368, accel: 1.02 }
];
let selectedCar = 0;
let gameState = 'menu';
let cameraMode = 0;
let speed = 0, distance = 0, elapsed = 0, maxSpeed = 0, nitro = 100;
let toastTimer = 0;
let soundEnabled = false;
let audioContext = null, engineOsc = null, engineGain = null;
const input = { steer: 0, gas: false, brake: false, nitro: false };
const touchInput = { steer: 0, gas: false, brake: false, nitro: false };
const keys = new Set();
const laneCenters = [-6, 0, 6];

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9eabb7, 95, 570);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = false;
$('scene-wrap').appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1100);
camera.position.set(0, 5.4, 11.5);
const clock = new THREE.Clock();

const hemi = new THREE.HemisphereLight(0xd9edff, 0x34404b, 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2c1, 2.2);
sun.position.set(-48, 95, -80);
scene.add(sun);
const fillLight = new THREE.DirectionalLight(0x62c9ff, 0.55);
fillLight.position.set(50, 25, 35);
scene.add(fillLight);

function makeSky() {
  const canvas = document.createElement('canvas'); canvas.width = 8; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#273f67'); g.addColorStop(.34, '#6f859b'); g.addColorStop(.66, '#c9a18d'); g.addColorStop(1, '#edc9a6');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 512);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 20), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }));
  scene.add(sky);
}
makeSky();

function asphaltTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#292e35'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 15500; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, a = Math.random() * .12;
    ctx.fillStyle = `rgba(${120 + Math.random()*70|0},${125 + Math.random()*70|0},${135 + Math.random()*70|0},${a})`;
    ctx.fillRect(x, y, Math.random()*2.2 + .3, Math.random()*1.3 + .2);
  }
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = `rgba(200,220,235,${Math.random()*.035})`; ctx.lineWidth = .6;
    ctx.beginPath(); ctx.moveTo(Math.random()*512, Math.random()*512); ctx.lineTo(Math.random()*512, Math.random()*512); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 38); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const roadTexture = asphaltTexture();
const road = new THREE.Mesh(new THREE.PlaneGeometry(19, 2400), new THREE.MeshStandardMaterial({ map: roadTexture, color: 0x838b95, roughness: .88, metalness: .08 }));
road.rotation.x = -Math.PI / 2; road.position.set(0, -.08, -1125); scene.add(road);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x28333a, roughness: 1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 2500), groundMat); ground.rotation.x = -Math.PI/2; ground.position.set(0, -.22, -1125); scene.add(ground);
const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x838d96, roughness: .95 });
for (const x of [-10.1, 10.1]) {
  const side = new THREE.Mesh(new THREE.BoxGeometry(2.2, .28, 2400), sidewalkMat); side.position.set(x, .02, -1125); scene.add(side);
  const curb = new THREE.Mesh(new THREE.BoxGeometry(.16, .37, 2400), new THREE.MeshStandardMaterial({ color: 0xc2c8cb, roughness: .8 })); curb.position.set(x + (x < 0 ? 1.05 : -1.05), .12, -1125); scene.add(curb);
}

const roadDetails = [];
function addRoadStrip(x, z, width, length, color, height = .025) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), new THREE.MeshBasicMaterial({ color }));
  mesh.position.set(x, .035, z); scene.add(mesh); roadDetails.push(mesh); return mesh;
}
addRoadStrip(-8.75, -1110, .14, 2350, 0xe4e7e7);
addRoadStrip(8.75, -1110, .14, 2350, 0xe4e7e7);
const laneDashes = [];
for (const x of [-3, 3]) {
  for (let i = 0; i < 80; i++) laneDashes.push(addRoadStrip(x, -i * 14, .105, 6.2, 0xe5e8e9, .018));
}
// Soft roadside reflective markers.
for (const side of [-1, 1]) {
  for (let i = 0; i < 48; i++) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(.28, .55, .6), new THREE.MeshStandardMaterial({ color: i%2 ? 0xf1bd5b : 0xe8edf0, emissive: i%2 ? 0x6a2b09 : 0x111a24, roughness: .7 }));
    marker.position.set(side * 9.05, .34, -i * 24 - 9); scene.add(marker); roadDetails.push(marker);
  }
}

const environment = [];
function createBuilding(side, z, index) {
  const group = new THREE.Group();
  const width = 6 + Math.random() * 7, height = 16 + Math.random() * 56, depth = 8 + Math.random() * 13;
  const palette = [0x26394b, 0x354655, 0x42515e, 0x293341, 0x52606b, 0x253e4f];
  const bodyMat = new THREE.MeshStandardMaterial({ color: palette[index % palette.length], roughness: .57, metalness: .28 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat); body.position.y = height/2 - .2; group.add(body);
  const faceX = side < 0 ? width/2 + .012 : -width/2 - .012;
  const rows = Math.max(3, Math.floor(height / 4.3));
  // One instanced batch per building keeps the city lightweight on mobile GPUs.
  const winMat = new THREE.MeshStandardMaterial({ color: Math.random() > .3 ? 0x82b7c8 : 0x526d7f, emissive: 0x24465a, emissiveIntensity: .42, roughness: .24, metalness: .55 });
  const winGeo = new THREE.BoxGeometry(.035, 1.5, Math.max(1, depth/5));
  const windows = new THREE.InstancedMesh(winGeo, winMat, rows * 3);
  const dummy = new THREE.Object3D(); let wi = 0;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < 3; col++) {
      dummy.position.set(faceX, 2.1 + r*3.6, (col-1)*depth*.29);
      dummy.updateMatrix(); windows.setMatrixAt(wi++, dummy.matrix);
    }
  }
  windows.instanceMatrix.needsUpdate = true; group.add(windows);
  const crown = new THREE.Mesh(new THREE.BoxGeometry(width*1.02, .5, depth*1.02), new THREE.MeshStandardMaterial({ color: 0x172735, metalness: .55, roughness: .35 })); crown.position.y = height + .05; group.add(crown);
  if (index % 5 === 0) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(.12, 3.2, 1.6), new THREE.MeshBasicMaterial({ color: index % 2 ? 0x28bde8 : 0xe4b85c })); sign.position.set(faceX*1.015, height*.55, 0); group.add(sign);
  }
  group.position.set(side * (12 + width/2 + Math.random()*9), 0, z); scene.add(group); environment.push({ object: group, z, reset: -Math.random()*240 - 530, type: 'building' });
}
for (let i = 0; i < 18; i++) { createBuilding(-1, -40 - i*52 - Math.random()*20, i); createBuilding(1, -65 - i*51 - Math.random()*20, i+18); }

const treeMat = new THREE.MeshStandardMaterial({ color: 0x5c4939, roughness: 1 });
const leafMats = [0x1a594c,0x276f5a,0x2f8064].map(c=>new THREE.MeshStandardMaterial({ color:c, roughness:.9 }));
function createPalm(side, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.22,.38,5.6,7),treeMat); trunk.position.y=2.8; trunk.rotation.z=side*.07; g.add(trunk);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const leaf=new THREE.Mesh(new THREE.ConeGeometry(.34,4.2,5),leafMats[i%leafMats.length]);
    leaf.position.set(Math.cos(a)*1.65,5.15+Math.sin(a)*.2,Math.sin(a)*1.65); leaf.rotation.z=-Math.cos(a)*.48; leaf.rotation.x=Math.sin(a)*.42; leaf.rotation.z += Math.PI/2; g.add(leaf);
  }
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.45,8,7),leafMats[1]); bulb.position.y=5.1; g.add(bulb);
  g.position.set(side*(11.4+Math.random()*1.7),0,z); scene.add(g); environment.push({object:g,z,reset:-Math.random()*250-480,type:'palm'});
}
for(let i=0;i<13;i++){createPalm(-1,-35-i*44);createPalm(1,-49-i*44);}

const lampMat = new THREE.MeshStandardMaterial({ color:0x253847, metalness:.8, roughness:.34 });
const lampGlow = new THREE.MeshBasicMaterial({ color:0xffe1a0 });
function createLamp(side,z){
  const g=new THREE.Group();
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,7.5,8),lampMat);post.position.y=3.75;g.add(post);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,2.8),lampMat);arm.position.set(-side*.0,7.35,-1.15);g.add(arm);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.75,.18,1.1),lampGlow);head.position.set(0,7.25,-2.25);g.add(head);
  const glow=new THREE.PointLight(0xffdda0,.5,13,2);glow.position.set(0,6.9,-2.2);g.add(glow);
  g.position.set(side*10.7,0,z);scene.add(g);environment.push({object:g,z,reset:-Math.random()*220-420,type:'lamp'});
}
for(let i=0;i<13;i++){createLamp(-1,-25-i*62);createLamp(1,-42-i*62);}

// A few overhead gantries and directional signs make the road feel like a real city route.
function createGantries() {
  for (const z of [-155,-430,-705]) {
    const g = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({color:0x344655,metalness:.72,roughness:.34});
    for (const x of [-8.3,8.3]) { const p=new THREE.Mesh(new THREE.BoxGeometry(.28,7,.3),postMat); p.position.set(x,3.5,0);g.add(p); }
    const beam=new THREE.Mesh(new THREE.BoxGeometry(17,.35,.45),postMat);beam.position.y=6.8;g.add(beam);
    const sign=new THREE.Mesh(new THREE.BoxGeometry(5.8,1.35,.16),new THREE.MeshStandardMaterial({color:0x135b53,roughness:.4,metalness:.1}));sign.position.set(0,5.65,-.05);g.add(sign);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(5.55,.08,.03),new THREE.MeshBasicMaterial({color:0x8ce9d7}));stripe.position.set(0,6.2,.05);g.add(stripe);
    g.position.z=z;scene.add(g);environment.push({object:g,z,reset:-z-620,type:'gantry'});
  }
}
createGantries();

function makeCar(colorHex, isPlayer=false) {
  const root = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({color:colorHex, metalness:.72, roughness:.23, clearcoat:.9, clearcoatRoughness:.12});
  const dark = new THREE.MeshStandardMaterial({color:0x111923, metalness:.55, roughness:.38});
  const glass = new THREE.MeshPhysicalMaterial({color:0x101f2b, metalness:.28, roughness:.1, transparent:true, opacity:.88, clearcoat:1});
  const rubber = new THREE.MeshStandardMaterial({color:0x090c11, roughness:.92});
  const rim = new THREE.MeshStandardMaterial({color:0x8797a2, metalness:.92, roughness:.22});
  const head = new THREE.MeshBasicMaterial({color:0xe6faff});
  const tail = new THREE.MeshBasicMaterial({color:0xff263d});
  function part(geo,mat,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);root.add(m);return m;}
  part(new THREE.BoxGeometry(2.05,.62,4.35),paint,0,.7,0);
  part(new THREE.BoxGeometry(1.8,.22,1.45),paint,0,.97,-1.38,1,1,.98);
  part(new THREE.BoxGeometry(1.62,.62,2.05),paint,0,1.18,.08,1,1,1);
  part(new THREE.BoxGeometry(1.52,.48,1.85),glass,0,1.2,.05,1,1,1);
  part(new THREE.BoxGeometry(1.78,.18,.56),paint,0,1.49,.68);
  part(new THREE.BoxGeometry(1.88,.22,.25),dark,0,.48,-2.14);
  part(new THREE.BoxGeometry(1.93,.24,.24),dark,0,.48,2.12);
  part(new THREE.BoxGeometry(1.72,.08,.2),tail,0,.88,2.13,1,1,1);
  part(new THREE.BoxGeometry(.55,.13,.13),head,-.64,.82,-2.17);
  part(new THREE.BoxGeometry(.55,.13,.13),head,.64,.82,-2.17);
  // Rear diffuser, mirrors, side blades and spoiler.
  part(new THREE.BoxGeometry(1.75,.16,.42),dark,0,.37,1.97);
  for(const side of [-1,1]){
    part(new THREE.BoxGeometry(.16,.15,.5),paint,side*1.02,1.05,-.55);
    part(new THREE.BoxGeometry(.12,.13,.48),dark,side*1.01,.53,0);
    const mirror=part(new THREE.BoxGeometry(.28,.13,.22),paint,side*1.02,1.23,-.58);mirror.rotation.z=side*.12;
  }
  const wing=part(new THREE.BoxGeometry(2.35,.12,.48),dark,0,1.58,1.65);
  for(const side of [-1,1]) part(new THREE.BoxGeometry(.09,.42,.12),dark,side*.78,1.42,1.65);
  const wheels=[];
  for(const x of [-.99,.99]) for(const z of [-1.42,1.42]){
    const wheel=new THREE.Group();
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.27,18),rubber);tire.rotation.z=Math.PI/2;wheel.add(tire);
    const wheelFace=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.285,12),rim);wheelFace.rotation.z=Math.PI/2;wheel.add(wheelFace);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.3,10),dark);hub.rotation.z=Math.PI/2;wheel.add(hub);
    wheel.position.set(x,.46,z);root.add(wheel);wheels.push(wheel);
  }
  // Subtle underbody glow, brighter on the selected player's car.
  if(isPlayer){
    const glow=new THREE.Mesh(new THREE.BoxGeometry(1.55,.035,2.4),new THREE.MeshBasicMaterial({color:0x1b9dff,transparent:true,opacity:.48}));glow.position.set(0,.29,0);root.add(glow);
    const rearLight=new THREE.PointLight(0xff263d,.7,7,2);rearLight.position.set(0,1.15,2.3);root.add(rearLight);
  }
  root.userData.wheels=wheels;
  return root;
}

// The uploaded SAQR X1 GLB is the real player vehicle. A procedural car remains
// as a safe fallback so the game can still start if the model file is unavailable.
let saqrTemplate = null;
const gltfLoader = new GLTFLoader();

function makeSaqrCar(colorHex) {
  const root = saqrTemplate.clone(true);
  root.name = 'SAQR_X1_Player';
  root.rotation.y = Math.PI; // The source model faces +Z; the track runs toward -Z.
  root.userData.wheels = [];
  root.userData.frontWheels = [];
  const materialClones = new Map();

  root.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = false;
      node.receiveShadow = false;
      const tintMaterial = (material) => {
        if (materialClones.has(material)) return materialClones.get(material);
        const copy = material.clone();
        if (copy.name === 'Paint_Crimson' || copy.name.toLowerCase().includes('paint_crimson')) {
          copy.color.setHex(colorHex);
          copy.metalness = 0.78;
          copy.roughness = 0.2;
          if ('clearcoat' in copy) copy.clearcoat = 0.95;
        }
        materialClones.set(material, copy);
        return copy;
      };
      node.material = Array.isArray(node.material)
        ? node.material.map(tintMaterial)
        : tintMaterial(node.material);
    }
    if (['Wheel_FL', 'Wheel_FR', 'Wheel_RL', 'Wheel_RR'].includes(node.name)) {
      root.userData.wheels.push(node);
      if (node.name === 'Wheel_FL' || node.name === 'Wheel_FR') root.userData.frontWheels.push(node);
    }
  });

  // Small underbody light gives the player's car a readable silhouette at night.
  const underglow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 3.35),
    new THREE.MeshBasicMaterial({ color: 0x168fff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  );
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.set(0, 0.045, 0);
  underglow.renderOrder = 1;
  root.add(underglow);
  return root;
}

function makePlayerCar(colorHex) {
  return saqrTemplate ? makeSaqrCar(colorHex) : makeCar(colorHex, true);
}

function playerBaseHeading() { return saqrTemplate ? Math.PI : 0; }

let player = makePlayerCar(carSpecs[selectedCar].color);
player.position.set(0,0,2.0); scene.add(player);

function loadSaqrModel() {
  setStatus('جارٍ تحميل مجسم SAQR X1...');
  const modelUrl = new URL('./assets/Saqr_X1.glb', import.meta.url).href;
  gltfLoader.load(modelUrl, (gltf) => {
    saqrTemplate = gltf.scene;
    // Replace the temporary vehicle without resetting the player's current place.
    const previousPosition = player.position.clone();
    scene.remove(player);
    player = makePlayerCar(carSpecs[selectedCar].color);
    player.position.copy(previousPosition);
    player.rotation.y = Math.PI + (gameState === 'playing' ? input.steer * 0.09 : 0);
    scene.add(player);
    ui.carName.textContent = carSpecs[selectedCar].name;
    setStatus('مجسم SAQR X1 جاهز');
    if (gameState === 'playing') showToast('تم تحميل مجسم السيارة الأصلي');
  }, undefined, (error) => {
    console.error('SAQR X1 GLB failed to load:', error);
    setStatus('تعذر تحميل SAQR X1 — تحقق من assets/Saqr_X1.glb');
  });
}
loadSaqrModel();

const traffic = [];
const trafficColors=[0x247bfa,0xf3b627,0xe6e9ed,0x20a68e,0xa34ad9,0xc64c30];
for(let i=0;i<6;i++){
  const car=makeCar(trafficColors[i%trafficColors.length],false);
  car.scale.setScalar(.94 + Math.random()*.07);
  car.position.set(laneCenters[(i+1)%laneCenters.length],0,-105-i*66);
  scene.add(car); traffic.push({car,z:car.position.z,lane:(i+1)%laneCenters.length,relative:.72+Math.random()*.22,phase:Math.random()*8});
}

// A faint racing route glow gives the player a readable line at speed.
const routeMat = new THREE.MeshBasicMaterial({color:0x41d7ff,transparent:true,opacity:.12});
for(let i=0;i<34;i++){
  const chevron=new THREE.Mesh(new THREE.BoxGeometry(.2,.03,3.1),routeMat);chevron.position.set(0,.06,-i*19-12);scene.add(chevron);roadDetails.push(chevron);
}

function selectCar(index){
  selectedCar=index; const spec=carSpecs[index];
  ui.carName.textContent=spec.name; ui.carPower.textContent=`${spec.power} HP`; ui.carTop.textContent=`${spec.top} KM/H`;
  document.querySelectorAll('.car-choice').forEach((el,i)=>el.classList.toggle('selected',i===index));
  const old=player; scene.remove(old); player=makePlayerCar(spec.color);player.position.set(0,0,2);player.rotation.y=playerBaseHeading();scene.add(player);
}
function showScreen(name){
  [ui.menu,ui.garage,ui.pause,ui.finish].forEach(el=>el.classList.remove('active'));
  if(name && ui[name])ui[name].classList.add('active');
  ui.hud.classList.toggle('hidden',name!=='playing');
}
function setStatus(text){ui.status.textContent=text;}
function showToast(text){ui.toast.textContent=text;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1600);}
function resetRace(){
  speed=0;distance=0;elapsed=0;maxSpeed=0;nitro=100;cameraMode=0;input.steer=0;input.gas=false;input.brake=false;input.nitro=false;touchInput.steer=0;touchInput.gas=false;touchInput.brake=false;touchInput.nitro=false;
  player.position.set(0,0,2);player.rotation.set(0,playerBaseHeading(),0);
  traffic.forEach((t,i)=>{t.lane=(i+1)%laneCenters.length;t.z=-120-i*72;t.relative=.72+Math.random()*.22;t.car.position.set(laneCenters[t.lane],0,t.z);});
  laneDashes.forEach((d,i)=>d.position.z=-(i%80)*14);
  ui.speed.textContent='0';ui.distance.textContent='0.0 KM';ui.timer.textContent='00:00';ui.gear.textContent='N';ui.speedFill.style.width='0%';ui.nitroFill.style.transform='scaleX(1)';
  ui.wheel.style.transform='rotate(0deg)';
}
function startGame(){resetRace();gameState='playing';showScreen('playing');setStatus('في قلب السباق');showToast('اضغط على دواسة التسارع');clock.getDelta();}
function pauseGame(){if(gameState!=='playing')return;gameState='paused';showScreen('pause');setStatus('متوقف مؤقتًا');}
function resumeGame(){if(gameState!=='paused')return;gameState='playing';showScreen('playing');setStatus('في قلب السباق');clock.getDelta();}
function goHome(){gameState='menu';showScreen('menu');setStatus('جاهز للانطلاق');speed=0;input.gas=false;input.brake=false;input.nitro=false;}

$('startBtn').addEventListener('click',startGame);
$('garageBtn').addEventListener('click',()=>{showScreen('garage');setStatus('اختر سيارتك');});
$('garageClose').addEventListener('click',()=>{showScreen('menu');setStatus('جاهز للانطلاق');});
$('garageStart').addEventListener('click',startGame);
document.querySelectorAll('.car-choice').forEach(btn=>btn.addEventListener('click',()=>selectCar(Number(btn.dataset.car))));
$('pauseBtn').addEventListener('click',pauseGame);
$('resumeBtn').addEventListener('click',resumeGame);
$('restartBtn').addEventListener('click',startGame);
$('homeBtn').addEventListener('click',goHome);
$('againBtn').addEventListener('click',startGame);
$('finishHomeBtn').addEventListener('click',goHome);
$('cameraBtn').addEventListener('click',()=>{cameraMode=(cameraMode+1)%2;showToast(cameraMode?'كاميرا المقدمة':'كاميرا المطاردة');});

function setHoldButton(id, property, activeClass=true){
  const el=$(id); if(!el)return;
  const down=(e)=>{e.preventDefault();touchInput[property]=true;if(activeClass)el.classList.add('active');try{el.setPointerCapture(e.pointerId);}catch{}};
  const up=(e)=>{e.preventDefault();touchInput[property]=false;if(activeClass)el.classList.remove('active');};
  el.addEventListener('pointerdown',down,{passive:false});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,up,{passive:false}));
}
setHoldButton('gasBtn','gas');setHoldButton('brakeBtn','brake');setHoldButton('nitroBtn','nitro');
function holdSteer(id, value){
  const el=$(id);let active=false;
  el.addEventListener('pointerdown',e=>{e.preventDefault();active=true;touchInput.steer=value;el.classList.add('active');try{el.setPointerCapture(e.pointerId);}catch{}});
  const stop=()=>{if(active){active=false;el.classList.remove('active');touchInput.steer=0;}};
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,stop));
}
holdSteer('leftBtn',-1);holdSteer('rightBtn',1);

// Drag the on-screen steering wheel. Horizontal motion is deliberately forgiving on small screens.
let wheelPointer=null, wheelStartX=0;
ui.wheelControl.addEventListener('pointerdown',e=>{e.preventDefault();wheelPointer=e.pointerId;wheelStartX=e.clientX;try{ui.wheelControl.setPointerCapture(e.pointerId);}catch{};});
ui.wheelControl.addEventListener('pointermove',e=>{if(wheelPointer!==e.pointerId)return;e.preventDefault();touchInput.steer=THREE.MathUtils.clamp((e.clientX-wheelStartX)/56,-1,1);});
function releaseWheel(){wheelPointer=null;touchInput.steer=0;}
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>ui.wheelControl.addEventListener(ev,releaseWheel));

window.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Shift'].includes(e.key))e.preventDefault();
  keys.add(e.key.toLowerCase());
  if(e.key.toLowerCase()==='c' && gameState==='playing')cameraMode=(cameraMode+1)%2;
  if(e.key==='Escape' && gameState==='playing')pauseGame(); else if(e.key==='Escape'&&gameState==='paused')resumeGame();
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();input.gas=false;input.brake=false;input.nitro=false;input.steer=0;touchInput.gas=false;touchInput.brake=false;touchInput.nitro=false;touchInput.steer=0;});

function syncKeyboard(){
  input.gas = touchInput.gas || keys.has('w') || keys.has('arrowup');
  input.brake = touchInput.brake || keys.has('s') || keys.has('arrowdown') || keys.has(' ');
  input.nitro = touchInput.nitro || keys.has('shift');
  const left=keys.has('a')||keys.has('arrowleft'), right=keys.has('d')||keys.has('arrowright');
  if(left&&!right)input.steer=-1;else if(right&&!left)input.steer=1;else input.steer=touchInput.steer;
}

function setupAudio(){
  if(audioContext)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  audioContext=new AC();engineOsc=audioContext.createOscillator();engineGain=audioContext.createGain();
  engineOsc.type='sawtooth';engineOsc.frequency.value=55;engineGain.gain.value=0;
  const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=360;
  engineOsc.connect(filter);filter.connect(engineGain);engineGain.connect(audioContext.destination);engineOsc.start();
}
$('soundBtn').addEventListener('click',()=>{
  soundEnabled=!soundEnabled;$('soundGlyph').textContent=soundEnabled?'◖))':'×';
  if(soundEnabled){setupAudio();if(audioContext?.state==='suspended')audioContext.resume();setStatus('صوت المحرك مفعّل');}
  else {if(engineGain&&audioContext)engineGain.gain.setTargetAtTime(0,audioContext.currentTime,.06);setStatus(gameState==='playing'?'في قلب السباق':'جاهز للانطلاق');}
});

function updateAudio(){
  if(!soundEnabled||!audioContext||!engineOsc||!engineGain)return;
  const now=audioContext.currentTime;
  engineOsc.frequency.setTargetAtTime(48+speed*.95+(input.gas?22:0),now,.08);
  engineGain.gain.setTargetAtTime(gameState==='playing' ? .016+speed/3200 : 0,now,.12);
}

function updateEnvironment(scroll){
  for(const item of environment){
    item.object.position.z += scroll;
    if(item.object.position.z>45){
      item.object.position.z = -Math.random()*180-500;
      if(item.type==='building')item.object.position.x = Math.sign(item.object.position.x)*(18+Math.random()*15);
    }
  }
  for(const d of roadDetails){
    if(d.geometry?.parameters?.depth && d.geometry.parameters.depth<10){d.position.z+=scroll;if(d.position.z>20)d.position.z-=1120;}
  }
}

function crash(){
  speed=Math.max(28,speed*.47);nitro=Math.max(0,nitro-12);showToast('انتبه! اصطدام بسيط');
  player.rotation.z=(Math.random()>.5?1:-1)*.16;
}

function updateTraffic(scroll,dt){
  for(const t of traffic){
    t.z+=scroll*t.relative;
    t.car.position.z=t.z;
    t.car.position.x=THREE.MathUtils.lerp(t.car.position.x,laneCenters[t.lane],Math.min(1,dt*1.2));
    t.car.rotation.y=Math.sin(elapsed*.6+t.phase)*.015;
    if(t.z>17){
      t.z=-300-Math.random()*360;t.lane=Math.floor(Math.random()*laneCenters.length);t.relative=.68+Math.random()*.27;t.car.position.x=laneCenters[t.lane];
    }
    if(Math.abs(t.z-player.position.z)<3.2 && Math.abs(t.car.position.x-player.position.x)<1.95 && speed>32){
      crash();t.z=-230-Math.random()*160;t.lane=(t.lane+1+Math.floor(Math.random()*2))%laneCenters.length;t.car.position.x=laneCenters[t.lane];
    }
    for(const wheel of t.car.userData.wheels)wheel.rotation.x+=scroll*.17;
  }
}

function updateHud(){
  const rounded=Math.round(speed);
  ui.speed.textContent=String(rounded);
  ui.speedFill.style.width=`${Math.min(100,speed/carSpecs[selectedCar].top*100)}%`;
  ui.gear.textContent=speed<2?'N':String(Math.min(7,Math.max(1,Math.floor(speed/48)+1)));
  ui.distance.textContent=`${distance.toFixed(1)} KM`;
  const mins=Math.floor(elapsed/60).toString().padStart(2,'0'),secs=Math.floor(elapsed%60).toString().padStart(2,'0');ui.timer.textContent=`${mins}:${secs}`;
  ui.nitroFill.style.transform=`scaleX(${nitro/100})`;
  ui.wheel.style.transform=`rotate(${input.steer*125}deg)`;
}

function updateGame(dt){
  syncKeyboard();
  if(gameState==='playing'){
    elapsed+=dt;
    const spec=carSpecs[selectedCar];
    const boost=input.nitro&&nitro>0;
    if(input.gas)speed+=104*spec.accel*dt;
    else speed-=18*dt;
    if(input.brake)speed-=170*dt;
    if(boost){speed+=68*dt;nitro=Math.max(0,nitro-24*dt);}else nitro=Math.min(100,nitro+4.2*dt);
    speed=THREE.MathUtils.clamp(speed,0,spec.top+(boost?45:0));
    maxSpeed=Math.max(maxSpeed,speed);
    const steerPower=4.2+speed*.018;
    player.position.x=THREE.MathUtils.clamp(player.position.x+input.steer*steerPower*dt,-7.5,7.5);
    player.rotation.z=THREE.MathUtils.lerp(player.rotation.z,-input.steer*.085,Math.min(1,dt*7));
    player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,playerBaseHeading()+input.steer*.09,Math.min(1,dt*5));
    const scroll=speed/3.6*.42*dt;
    distance+=scroll*.001;
    updateEnvironment(scroll);
    updateTraffic(scroll,dt);
    for(const wheel of player.userData.wheels)wheel.rotation.x+=scroll*.3;
    for(const wheel of (player.userData.frontWheels || []))wheel.rotation.y=input.steer*.28;
    if(Math.abs(player.position.x)>7.25&&speed>30){speed=Math.max(0,speed-26*dt);}
    const targetX=player.position.x*.42;
    const desiredPos=cameraMode===0?new THREE.Vector3(targetX,5.45,11.7):new THREE.Vector3(player.position.x,2.6,-.65);
    camera.position.lerp(desiredPos,Math.min(1,dt*3.6));
    const lookTarget=cameraMode===0?new THREE.Vector3(player.position.x*.2,.75,-19):new THREE.Vector3(player.position.x,1,-47);
    camera.lookAt(lookTarget);
    if(distance>=15){gameState='finish';showScreen('finish');$('finishDistance').textContent=`${distance.toFixed(1)} KM`;$('finishSpeed').textContent=`${Math.round(maxSpeed)} KM/H`;setStatus('اكتملت الجولة');}
    updateHud();
  }else{
    // A quiet showroom camera pan keeps the 3D world alive behind the menu.
    const t=clock.elapsedTime*.12;
    camera.position.lerp(new THREE.Vector3(Math.sin(t)*2.6,4.8,10.8),.015);
    camera.lookAt(0,.8,-13);
    player.rotation.y=playerBaseHeading()+Math.sin(clock.elapsedTime*.28)*.035;
  }
  updateAudio();
}

function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.045);updateGame(dt);renderer.render(scene,camera);}
animate();

window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));
});

// Initial garage metadata and lightweight startup state.
selectCar(0);resetRace();

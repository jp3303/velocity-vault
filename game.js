"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const canvas = $("#gameCanvas");
const ctx = canvas.getContext("2d");
const glCanvas = $("#glCanvas");

const storeKey = "velocityVaultProfilesV1";
const saveKey = "velocityVaultSavedRaceV1";
const raceDistanceMultiplier = 2.85;
const ageBands = {
  rookie: { label: "Rookie 5-8", help: "Wide lanes, bigger coin streaks, cheerful missions.", speed: 0.86, traffic: 0.72, rewards: 1.18 },
  prodigy: { label: "Prodigy 9-12", help: "Sharper goals, more traffic, better rewards.", speed: 1, traffic: 1, rewards: 1 },
  elite: { label: "Elite 13+", help: "Fast pace, tighter windows, premium rep bonuses.", speed: 1.17, traffic: 1.25, rewards: 1.15 },
  family: { label: "Family All", help: "Balanced settings made for pass-and-play.", speed: 0.96, traffic: 0.9, rewards: 1.05 }
};

const races = [
  { id: "neon", name: "Pacific Coast Highway Sprint", length: 3600, target: "Collect 18 coins", type: "coins", goal: 18, reward: 150, rep: 16, theme: ["#0c1a1b", "#46d9ff", "#bbf24a"], place: "coast", sign: "Pacific Coast", mood: "golden coast" },
  { id: "skyline", name: "Chicago Skyline Night Run", length: 4300, target: "Keep focus above 60", type: "focus", goal: 60, reward: 180, rep: 20, theme: ["#12151d", "#ffd166", "#46d9ff"], place: "city", sign: "Lakefront Loop", mood: "wet downtown" },
  { id: "canyon", name: "Sedona Red Rock Clash", length: 5000, target: "Dodge 30 rivals", type: "dodges", goal: 30, reward: 220, rep: 28, theme: ["#15110c", "#ff5b6b", "#ffd166"], place: "canyon", sign: "Sedona Route", mood: "desert chase" },
  { id: "vault", name: "Rocky Mountain Grand Prix", length: 6200, target: "Score 5000 points", type: "score", goal: 5000, reward: 320, rep: 42, theme: ["#09100f", "#bbf24a", "#46d9ff"], place: "alpine", sign: "Mountain Pass", mood: "storm pass" },
  { id: "harbor", name: "Miami Harbor Boat Rush", length: 4200, target: "Score 3500 points", type: "score", goal: 3500, reward: 240, rep: 30, theme: ["#07161b", "#46d9ff", "#ffd166"], place: "harbor", sign: "Harbor Run", mood: "water sprint" },
  { id: "snowfield", name: "Aspen Snowmobile Dash", length: 3900, target: "Keep focus above 55", type: "focus", goal: 55, reward: 210, rep: 26, theme: ["#0b1519", "#f4fbf8", "#46d9ff"], place: "snow", sign: "Snow Pass", mood: "ice grip" },
  { id: "airstrip", name: "Nevada Airfield Scramble", length: 5200, target: "Dodge 28 rivals", type: "dodges", goal: 28, reward: 280, rep: 36, theme: ["#11131a", "#ffd166", "#ff5b6b"], place: "airfield", sign: "Runway 4", mood: "air chase" },
  { id: "freight", name: "Texas Big Rig Freight Run", length: 5600, target: "Score 4200 points", type: "score", goal: 4200, reward: 270, rep: 34, theme: ["#10140f", "#ffd166", "#46d9ff"], place: "freight", sign: "Texas Freightway", mood: "big rig draft", unlock: 0 },
  { id: "farmrally", name: "Iowa Tractor Rally", length: 3300, target: "Collect 16 route markers", type: "coins", goal: 16, reward: 190, rep: 22, theme: ["#10180e", "#bbf24a", "#ffd166"], place: "farm", sign: "Iowa Backroads", mood: "field sprint", unlock: 0 },
  { id: "tokyo", name: "Tokyo Neon Expressway", length: 5700, target: "Keep focus above 62", type: "focus", goal: 62, reward: 310, rep: 40, theme: ["#100d1c", "#ff4fd8", "#46d9ff"], place: "tokyo", sign: "Tokyo Express", mood: "neon tunnel", unlock: 44 },
  { id: "sahara", name: "Sahara Desert Rally", length: 6100, target: "Dodge 34 rivals", type: "dodges", goal: 34, reward: 330, rep: 44, theme: ["#160f0a", "#ffb74a", "#f4fbf8"], place: "desert", sign: "Sahara Rally", mood: "sand storm", unlock: 66 },
  { id: "rainforest", name: "Amazon Rainforest Rush", length: 5400, target: "Score 4600 points", type: "score", goal: 4600, reward: 320, rep: 42, theme: ["#07130d", "#36d98a", "#ffd166"], place: "rainforest", sign: "Amazon Route", mood: "jungle rain", unlock: 88 },
  { id: "eurotour", name: "Swiss Alps Grand Tour", length: 6400, target: "Score 5600 points", type: "score", goal: 5600, reward: 360, rep: 48, theme: ["#091119", "#dce8ef", "#46d9ff"], place: "europe", sign: "Swiss Alps", mood: "euro pass", unlock: 110 }
];

const vehicleDefs = [
  { id: "street", name: "Street Supercar", type: "car", desc: "Fast all-around modern racing feel.", speed: 1, handling: 1, mass: 1, color: "#1bb7e8" },
  { id: "f1", name: "F1 Open-Wheel", type: "f1", desc: "Sharp steering and high top speed.", speed: 1.18, handling: 1.18, mass: 0.72, color: "#ff3348" },
  { id: "grandprix", name: "Grand Prix Prototype", type: "prototype", desc: "Stable, fast, low race body.", speed: 1.12, handling: 1.08, mass: 0.82, color: "#f4fbf8" },
  { id: "truck", name: "Performance Truck", type: "truck", desc: "Heavier, stable, strong contact resistance.", speed: 0.88, handling: 0.82, mass: 1.35, color: "#ffd166" },
  { id: "semi", name: "Semi Truck Racer", type: "semi", desc: "Huge highway pull, heavy drafting, upgrade into a freight rocket.", speed: 0.72, handling: 0.58, mass: 2.1, color: "#dce8ef" },
  { id: "tractor", name: "Racing Tractor", type: "tractor", desc: "Farm rally machine with tough grip and upgradeable agility.", speed: 0.62, handling: 0.7, mass: 1.65, color: "#36d98a" },
  { id: "monster", name: "Monster Truck", type: "monster", desc: "Huge stance, slower but tough.", speed: 0.76, handling: 0.7, mass: 1.75, color: "#bbf24a" },
  { id: "tank", name: "Armored Tank", type: "tank", desc: "Slow, heavy, almost unstoppable.", speed: 0.56, handling: 0.52, mass: 2.35, color: "#6d7667" },
  { id: "snowmobile", name: "Snowmobile", type: "snowmobile", desc: "Light and quick on snow routes.", speed: 0.94, handling: 1.15, mass: 0.58, color: "#f4fbf8" },
  { id: "boat", name: "Race Boat", type: "boat", desc: "Best fit for harbor water sprints.", speed: 1.05, handling: 0.86, mass: 0.92, color: "#46d9ff" },
  { id: "helicopter", name: "Pursuit Helicopter", type: "helicopter", desc: "Air-style handling with wide steering.", speed: 0.92, handling: 0.98, mass: 0.9, color: "#dce8ef" },
  { id: "airplane", name: "Sport Airplane", type: "airplane", desc: "Fast runway and airfield races.", speed: 1.22, handling: 0.78, mass: 0.74, color: "#ff5b6b" }
];

const opponentNames = ["Vega", "Knox", "Ryder", "Nova", "Sable"];

const upgradeDefs = [
  { id: "engine", name: "Ion Engine", desc: "Higher top speed and faster score flow.", base: 160 },
  { id: "tires", name: "Grip Tires", desc: "Quicker steering and smoother dodges.", base: 140 },
  { id: "shield", name: "Pulse Shield", desc: "Protects focus during collisions.", base: 180 },
  { id: "magnet", name: "Coin Magnet", desc: "Pulls coins from wider lanes.", base: 150 },
  { id: "boost", name: "Clean Boost", desc: "Longer boost bursts with less focus drain.", base: 170 }
];

const missionDefs = [
  { id: "first", text: "Finish your first race", reward: 90, test: (p) => p.stats.races >= 1 },
  { id: "collector", text: "Collect 75 total coins", reward: 130, test: (p) => p.stats.totalCoins >= 75 },
  { id: "steady", text: "Complete 3 races with focus above 50", reward: 190, test: (p) => p.stats.steadyRuns >= 3 },
  { id: "vault", text: "Earn 120 reputation", reward: 260, test: (p) => p.rep >= 120 }
];

const directorEvents = [
  { id: "coinrush", name: "AI Coin Rush", focus: "more coin gates", coinRate: 1.42, traffic: 0.92, reward: 1.12 },
  { id: "draftline", name: "AI Draft Line", focus: "speed and clean dodges", coinRate: 0.95, traffic: 1.1, reward: 1.18 },
  { id: "shieldlab", name: "AI Shield Lab", focus: "recovery after impacts", coinRate: 1.06, traffic: 0.86, reward: 1.08 },
  { id: "neonmix", name: "AI Neon Mix", focus: "balanced variety", coinRate: 1.14, traffic: 1, reward: 1.1 }
];

let profiles = loadProfiles();
let selectedAge = "rookie";
let activeProfile = null;
let selectedRace = races[0];
let view = "login";
let tab = "races";
let toastTimer = 0;
let deferredInstallPrompt = null;
let cameraMode = localStorage.getItem("velocityVaultCameraMode") || "chase";
let rendererMode = localStorage.getItem("velocityVaultRendererMode") || "webgl";
let touchDriveMode = localStorage.getItem("velocityVaultTouchDriveMode") === "toggle" ? "toggle" : "hold";
let touchControlSize = localStorage.getItem("velocityVaultTouchControlSize") === "full" ? "full" : "mini";
let webglRenderer = null;
let audioSystem = null;

const input = {
  left: false,
  right: false,
  gas: false,
  brake: false,
  boost: false,
  paused: false,
  gamepadSteer: 0,
  gamepadGas: false,
  gamepadBrake: false,
  gamepadBoost: false,
  gamepadPauseHeld: false,
  gamepadResetHeld: false
};

const controllerState = {
  connected: false,
  name: "",
  index: null
};

const mobileTouchState = {
  active: new Map(),
  usingTouchEvents: false,
  modeToggleAt: 0
};

const raceState = {
  active: false,
  distance: 0,
  speed: 0,
  focus: 100,
  score: 0,
  coins: 0,
  dodges: 0,
  combo: 1,
  lane: 0,
  x: 0,
  lateralVelocity: 0,
  steerAngle: 0,
  throttleLoad: 0,
  brakeHeat: 0,
  slip: 0,
  damage: 0,
  resetTimer: 0,
  resetReason: "",
  crashCooldown: 0,
  roadCurve: 0,
  roadOffset: 0,
  spawnClock: 0,
  coinClock: 0,
  rivals: [],
  police: [],
  opponents: [],
  coinsOnRoad: [],
  particles: [],
  elapsed: 0,
  heat: 0,
  heatClock: 0,
  chaseActive: false,
  cameraShake: 0,
  countdown: 0,
  finished: false,
  director: null
};

function loadProfiles() {
  try {
    const raw = localStorage.getItem(storeKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfiles() {
  localStorage.setItem(storeKey, JSON.stringify(profiles));
}

function selectedVehicle() {
  const id = activeProfile && activeProfile.selectedVehicle ? activeProfile.selectedVehicle : "street";
  return vehicleDefs.find((vehicle) => vehicle.id === id) || vehicleDefs[0];
}

function vehicleById(id) {
  return vehicleDefs.find((vehicle) => vehicle.id === id) || vehicleDefs[0];
}

function raceLength(race = selectedRace) {
  const baseLength = race && race.length ? race.length : races[0].length;
  return Math.round(baseLength * raceDistanceMultiplier);
}

function loadSavedRace() {
  try {
    const raw = localStorage.getItem(saveKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSavedRace() {
  localStorage.removeItem(saveKey);
}

function makeProfile(name, pin, age) {
  return {
    id: `${age}:${name.toLowerCase()}`,
    name,
    pinHash: pin ? hashPin(pin) : "",
    age,
    coins: 250,
    rep: 0,
    selectedVehicle: "street",
    upgrades: { engine: 0, tires: 0, shield: 0, magnet: 0, boost: 0 },
    completedMissions: [],
    stats: { races: 0, wins: 0, totalCoins: 0, steadyRuns: 0, bestScore: 0 }
  };
}

function hashPin(pin) {
  let hash = 2166136261;
  for (let i = 0; i < pin.length; i += 1) {
    hash ^= pin.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function sanitizeName(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "TurboAce";
}

function showView(next) {
  view = next;
  $$(".view").forEach((el) => el.classList.remove("active"));
  $(`#${next}View`).classList.add("active");
  document.body.classList.toggle("race-live", next === "race");
  if (next !== "race") clearTouchDriveInputs();
  setTouchDriveMode(touchDriveMode, true);
  syncViewportSize();
  fitCanvas();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function startAudio() {
  if (audioSystem || !window.AudioContext && !window.webkitAudioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  const ctxAudio = new AudioCtor();
  const master = ctxAudio.createGain();
  master.gain.value = 0.045;
  master.connect(ctxAudio.destination);

  const engine = ctxAudio.createOscillator();
  const engineGain = ctxAudio.createGain();
  engine.type = "sawtooth";
  engine.frequency.value = 72;
  engineGain.gain.value = 0.18;
  engine.connect(engineGain);
  engineGain.connect(master);
  engine.start();

  const siren = ctxAudio.createOscillator();
  const sirenGain = ctxAudio.createGain();
  siren.type = "triangle";
  siren.frequency.value = 620;
  sirenGain.gain.value = 0;
  siren.connect(sirenGain);
  sirenGain.connect(master);
  siren.start();

  audioSystem = { ctx: ctxAudio, master, engine, engineGain, siren, sirenGain };
}

function updateAudio() {
  if (!audioSystem) return;
  const now = audioSystem.ctx.currentTime;
  const speed = raceState.active ? raceState.speed : 0;
  const boostInput = input.boost || input.gamepadBoost;
  audioSystem.engine.frequency.setTargetAtTime(64 + speed * 0.62 + (boostInput ? 70 : 0), now, 0.045);
  audioSystem.engineGain.gain.setTargetAtTime(raceState.active ? 0.12 + Math.min(0.18, speed / 1200) : 0.035, now, 0.08);
  const sirenLevel = raceState.active && raceState.chaseActive ? 0.14 : 0;
  const sirenSweep = 620 + Math.sin(raceState.elapsed * 7.2) * 210;
  audioSystem.siren.frequency.setTargetAtTime(sirenSweep, now, 0.03);
  audioSystem.sirenGain.gain.setTargetAtTime(sirenLevel, now, 0.06);
}

function playHitSound(kind = "impact") {
  if (!audioSystem) return;
  const now = audioSystem.ctx.currentTime;
  const osc = audioSystem.ctx.createOscillator();
  const gain = audioSystem.ctx.createGain();
  osc.type = kind === "coin" ? "sine" : "square";
  osc.frequency.value = kind === "coin" ? 880 : kind === "police" ? 150 : 210;
  gain.gain.setValueAtTime(kind === "coin" ? 0.07 : 0.11, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (kind === "coin" ? 0.14 : 0.22));
  osc.connect(gain);
  gain.connect(audioSystem.master);
  osc.start(now);
  osc.stop(now + 0.24);
}

function profilePower(profile) {
  return Object.values(profile.upgrades).reduce((sum, level) => sum + level, 0);
}

function directorDay() {
  return Math.floor(Date.now() / 86400000);
}

function getDirector(profile) {
  const day = directorDay();
  const seed = profile.name.length * 17 + profile.rep * 3 + profile.stats.races * 11 + day;
  const event = directorEvents[Math.abs(seed) % directorEvents.length];
  const upgrades = profile.upgrades;
  let weakest = upgradeDefs[0];
  upgradeDefs.forEach((def) => {
    if (upgrades[def.id] < upgrades[weakest.id]) weakest = def;
  });
  const winRate = profile.stats.races ? profile.stats.wins / profile.stats.races : 0;
  const assist = winRate < 0.35 ? "extra reward support" : winRate > 0.7 ? "faster rival pacing" : "balanced variety";
  return {
    day,
    event,
    recommended: weakest,
    assist,
    reward: event.reward + (winRate < 0.35 ? 0.08 : 0),
    traffic: event.traffic + (winRate > 0.7 ? 0.08 : 0),
    coinRate: event.coinRate + (profile.stats.totalCoins < 40 ? 0.12 : 0)
  };
}

function renderDirector() {
  if (!activeProfile) return;
  const director = getDirector(activeProfile);
  const card = $("#directorCard");
  card.innerHTML = `
    <strong>${director.event.name}</strong>
    <span>Local agentic tuning is active for this driver. It studies only this profile's on-device race stats, then rotates events and upgrade nudges to keep the game fresh.</span>
    <ul>
      <li>Today's focus: ${director.event.focus}.</li>
      <li>Recommended upgrade: ${director.recommended.name}.</li>
      <li>Adaptive assist: ${director.assist}.</li>
      <li>Bonus rewards: ${Math.round((director.reward - 1) * 100)}%.</li>
    </ul>
  `;
}

function upgradeCost(profile, def) {
  const level = profile.upgrades[def.id];
  return Math.round(def.base * Math.pow(1.68, level));
}

function setActiveProfile(profile) {
  activeProfile = profile;
  selectedRace = races[Math.min(profile.stats.races, races.length - 1)];
  renderHub();
  updateHud();
  showView("garage");
  showToast(`Welcome, ${profile.name}. Garage unlocked.`);
}

function enterProfile(openRace = false) {
  const name = sanitizeName($("#driverName").value);
  const pin = $("#driverPin").value.replace(/\D/g, "").slice(0, 6);
  const id = `${selectedAge}:${name.toLowerCase()}`;
  const existing = profiles[id];
  if (existing && existing.pinHash && existing.pinHash !== hashPin(pin)) {
    showToast("PIN did not match this local profile.");
    return null;
  }
  const profile = existing || makeProfile(name, pin, selectedAge);
  profiles[profile.id] = profile;
  saveProfiles();
  setActiveProfile(profile);
  if (openRace) {
    selectedRace = races[Math.min(profile.stats.races, races.length - 1)];
    launchRace();
  }
  return profile;
}

function renderHub() {
  if (!activeProfile) return;
  $("#driverSummary").textContent = `${ageBands[activeProfile.age].label} | ${activeProfile.coins} coins | ${activeProfile.rep} rep | Power ${profilePower(activeProfile)}`;
  renderRaces();
  renderVehicles();
  renderUpgrades();
  renderMissions();
  renderDirector();
  renderSavedRaceButton();
}

function renderSavedRaceButton() {
  const btn = $("#resumeRace");
  const saved = loadSavedRace();
  const canResume = saved && activeProfile && saved.profileId === activeProfile.id;
  btn.disabled = !canResume;
  if (canResume) {
    const race = races.find((item) => item.id === saved.selectedRaceId);
    btn.textContent = `Resume ${race ? race.name : "Saved Race"}`;
  } else {
    btn.textContent = saved ? "Saved Race For Another Driver" : "No Saved Race";
  }
}

function renderRaces() {
  const list = $("#raceList");
  list.innerHTML = "";
  const director = getDirector(activeProfile);
  races.forEach((race, index) => {
    const requiredRep = race.unlock ?? index * 22;
    const locked = activeProfile.rep < requiredRep;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `race-card ${selectedRace.id === race.id ? "selected" : ""}`;
    card.disabled = locked;
    card.innerHTML = `
      <div class="card-top"><strong>${race.name}</strong><span class="badge">${locked ? `${requiredRep} rep` : `${Math.round(race.reward * director.reward)} coins`}</span></div>
      <div class="tiny">${race.target} | ${Math.round(race.length / 100)} sectors | ${director.event.name}</div>
    `;
    card.addEventListener("click", () => {
      if (locked) return;
      selectedRace = race;
      renderRaces();
    });
    list.appendChild(card);
  });
}

function renderVehicles() {
  const list = $("#vehicleList");
  if (!list) return;
  list.innerHTML = "";
  const current = selectedVehicle();
  vehicleDefs.forEach((vehicle) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `vehicle-card ${current.id === vehicle.id ? "selected" : ""}`;
    card.innerHTML = `
      <div class="vehicle-preview asset-preview" data-type="${vehicle.type}" style="--vehicle-color:${vehicle.color}">
        <canvas class="vehicle-preview-canvas" width="180" height="116" aria-hidden="true"></canvas>
      </div>
      <div class="card-top"><strong>${vehicle.name}</strong><span class="badge">${current.id === vehicle.id ? "Active" : `${Math.round(vehicle.speed * 100)} spd`}</span></div>
      <div class="tiny">${vehicle.desc} | Handling ${Math.round(vehicle.handling * 100)} | Mass ${Math.round(vehicle.mass * 100)}</div>
    `;
    drawVehiclePreview(card.querySelector(".vehicle-preview-canvas"), vehicle);
    card.addEventListener("click", () => {
      activeProfile.selectedVehicle = vehicle.id;
      profiles[activeProfile.id] = activeProfile;
      saveProfiles();
      renderHub();
      showToast(`${vehicle.name} selected.`);
    });
    list.appendChild(card);
  });
}

function drawVehiclePreview(canvasEl, vehicle) {
  if (!canvasEl || !vehicle) return;
  const previewCtx = canvasEl.getContext("2d");
  const w = canvasEl.width;
  const h = canvasEl.height;
  previewCtx.clearRect(0, 0, w, h);
  const road = previewCtx.createLinearGradient(0, 0, 0, h);
  road.addColorStop(0, "rgba(21,31,30,0.96)");
  road.addColorStop(0.58, "rgba(10,16,15,0.98)");
  road.addColorStop(1, "rgba(5,8,7,0.98)");
  previewCtx.fillStyle = road;
  previewCtx.fillRect(0, 0, w, h);
  previewCtx.strokeStyle = "rgba(244,251,248,0.12)";
  previewCtx.lineWidth = 2;
  previewCtx.beginPath();
  previewCtx.moveTo(w * 0.18, 0);
  previewCtx.lineTo(w * 0.08, h);
  previewCtx.moveTo(w * 0.82, 0);
  previewCtx.lineTo(w * 0.92, h);
  previewCtx.stroke();
  previewCtx.strokeStyle = "rgba(255,209,102,0.32)";
  previewCtx.setLineDash([12, 10]);
  previewCtx.beginPath();
  previewCtx.moveTo(w * 0.5, h * 0.08);
  previewCtx.lineTo(w * 0.5, h * 0.96);
  previewCtx.stroke();
  previewCtx.setLineDash([]);

  const assets = window.VelocityPhoneAssets;
  const sprite = assets && assets.ready && typeof assets.getVehicleSprite === "function"
    ? assets.getVehicleSprite(vehicle.type, vehicle.color, { damage: 0 })
    : null;
  const baseWidth = ["semi", "truck", "monster", "tank", "tractor"].includes(vehicle.type) ? 100 : 88;
  const spriteW = vehicle.type === "semi" ? 122 : baseWidth;
  const spriteH = vehicle.type === "semi" ? 104 : ["airplane", "helicopter"].includes(vehicle.type) ? 98 : 102;
  previewCtx.save();
  previewCtx.translate(w * 0.5, h * 0.56);
  drawPreviewGroundContact(previewCtx, spriteW, spriteH, vehicle.type);
  if (sprite) {
    previewCtx.imageSmoothingEnabled = true;
    previewCtx.drawImage(sprite, -spriteW / 2, -spriteH * 0.54, spriteW, spriteH);
  } else {
    previewCtx.fillStyle = vehicle.color;
    roundRect(-spriteW * 0.28, -spriteH * 0.42, spriteW * 0.56, spriteH * 0.8, 8);
    previewCtx.fill();
  }
  previewCtx.restore();
}

function drawPreviewGroundContact(previewCtx, w, h, vehicleType = "car") {
  previewCtx.save();
  const air = ["airplane", "helicopter"].includes(vehicleType);
  const water = vehicleType === "boat";
  const contactY = h * (air ? 0.46 : water ? 0.5 : 0.56);
  const shadow = previewCtx.createRadialGradient(0, contactY, w * 0.08, 0, contactY + h * 0.06, w * 0.64);
  shadow.addColorStop(0, air ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.62)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  previewCtx.fillStyle = shadow;
  previewCtx.beginPath();
  previewCtx.ellipse(0, contactY + h * 0.08, w * 0.62, h * 0.13, 0, 0, Math.PI * 2);
  previewCtx.fill();
  if (!air && !water) {
    previewCtx.fillStyle = "rgba(3,5,5,0.78)";
    previewCtx.beginPath();
    previewCtx.ellipse(-w * 0.28, h * 0.38, w * 0.14, h * 0.055, 0, 0, Math.PI * 2);
    previewCtx.ellipse(w * 0.28, h * 0.38, w * 0.14, h * 0.055, 0, 0, Math.PI * 2);
    previewCtx.ellipse(-w * 0.28, h * 0.65, w * 0.16, h * 0.07, 0, 0, Math.PI * 2);
    previewCtx.ellipse(w * 0.28, h * 0.65, w * 0.16, h * 0.07, 0, 0, Math.PI * 2);
    previewCtx.fill();
  }
  previewCtx.restore();
}

function renderUpgrades() {
  const list = $("#upgradeList");
  list.innerHTML = "";
  const director = getDirector(activeProfile);
  upgradeDefs.forEach((def) => {
    const level = activeProfile.upgrades[def.id];
    const cost = upgradeCost(activeProfile, def);
    const card = document.createElement("div");
    card.className = "upgrade-card";
    card.innerHTML = `
      <div class="card-top"><strong>${def.name}</strong><span class="badge">${director.recommended.id === def.id ? "AI Pick" : `Lv ${level}/5`}</span></div>
      <div class="tiny">${def.desc}</div>
      <div class="upgrade-action">
        <div class="bar"><i></i></div>
        <button type="button" ${level >= 5 || activeProfile.coins < cost ? "disabled" : ""}>${level >= 5 ? "MAX" : cost}</button>
      </div>
    `;
    card.querySelector(".bar i").style.width = `${(level / 5) * 100}%`;
    card.querySelector("button").addEventListener("click", () => buyUpgrade(def));
    list.appendChild(card);
  });
}

function renderMissions() {
  const list = $("#missionList");
  list.innerHTML = "";
  missionDefs.forEach((mission) => {
    const done = activeProfile.completedMissions.includes(mission.id);
    const ready = !done && mission.test(activeProfile);
    const card = document.createElement("div");
    card.className = "mission-card";
    card.innerHTML = `
      <div class="card-top"><strong>${mission.text}</strong><span class="badge">${done ? "Claimed" : `${mission.reward} coins`}</span></div>
      <div class="tiny">${ready ? "Ready to claim." : done ? "Nice work." : "Keep racing to unlock this reward."}</div>
      ${ready ? "<button class=\"primary\" type=\"button\">Claim Reward</button>" : ""}
    `;
    const claim = card.querySelector("button");
    if (claim) claim.addEventListener("click", () => claimMission(mission));
    list.appendChild(card);
  });
}

function buyUpgrade(def) {
  const level = activeProfile.upgrades[def.id];
  if (level >= 5) return;
  const cost = upgradeCost(activeProfile, def);
  if (activeProfile.coins < cost) return showToast("More coins needed.");
  activeProfile.coins -= cost;
  activeProfile.upgrades[def.id] += 1;
  profiles[activeProfile.id] = activeProfile;
  saveProfiles();
  renderHub();
  updateHud();
  showToast(`${def.name} upgraded.`);
}

function claimMission(mission) {
  activeProfile.completedMissions.push(mission.id);
  activeProfile.coins += mission.reward;
  activeProfile.rep += 8;
  profiles[activeProfile.id] = activeProfile;
  saveProfiles();
  renderHub();
  updateHud();
  showToast("Mission reward claimed.");
}

function launchRace() {
  startAudio();
  if (audioSystem && audioSystem.ctx.state === "suspended") audioSystem.ctx.resume();
  const age = ageBands[activeProfile.age];
  const director = getDirector(activeProfile);
  const vehicle = selectedVehicle();
  Object.assign(raceState, {
    active: true,
    distance: 0,
    speed: 0,
    focus: 100,
    score: 0,
    coins: 0,
    dodges: 0,
    combo: 1,
    lane: 0,
    x: 0,
    lateralVelocity: 0,
    steerAngle: 0,
    throttleLoad: 0,
    brakeHeat: 0,
    slip: 0,
    damage: 0,
    resetTimer: 0,
    resetReason: "",
    crashCooldown: 0,
    roadCurve: 0,
    roadOffset: 0,
    spawnClock: 0,
    coinClock: 0,
    rivals: [],
    police: [],
    opponents: makeOpponents(vehicle, age, director),
    coinsOnRoad: [],
    particles: [],
    elapsed: 0,
    heat: 0,
    heatClock: 1.7,
    chaseActive: false,
    cameraShake: 0,
    countdown: 0,
    finished: false,
    director
  });
  $("#raceTitle").textContent = selectedRace.name;
  $("#raceBrief").textContent = selectedRace.target;
  $("#modeChip").textContent = selectedRace.name;
  $("#missionChip").textContent = `${vehicle.name} | ${selectedRace.target}`;
  showView("race");
  showToast(`${vehicle.name} on grid. Race the pack to the finish.`);
}

function saveRace() {
  if (!activeProfile) return;
  if (!raceState.active) {
    saveProfiles();
    showToast("Garage progress saved on this device.");
    renderSavedRaceButton();
    return;
  }
  const snapshot = {
    version: 1,
    savedAt: Date.now(),
    profileId: activeProfile.id,
    selectedRaceId: selectedRace.id,
    cameraMode,
    inputPaused: input.paused,
    state: {
      active: true,
      distance: raceState.distance,
      speed: raceState.speed,
      focus: raceState.focus,
      score: raceState.score,
      coins: raceState.coins,
      dodges: raceState.dodges,
      combo: raceState.combo,
      lane: raceState.lane,
      x: raceState.x,
      lateralVelocity: raceState.lateralVelocity,
      steerAngle: raceState.steerAngle,
      throttleLoad: raceState.throttleLoad,
      brakeHeat: raceState.brakeHeat,
      slip: raceState.slip,
      damage: raceState.damage,
      resetTimer: raceState.resetTimer,
      resetReason: raceState.resetReason,
      crashCooldown: raceState.crashCooldown,
      roadCurve: raceState.roadCurve,
      roadOffset: raceState.roadOffset,
      spawnClock: raceState.spawnClock,
      coinClock: raceState.coinClock,
      rivals: raceState.rivals,
      police: raceState.police,
      opponents: raceState.opponents,
      coinsOnRoad: raceState.coinsOnRoad,
      elapsed: raceState.elapsed,
      heat: raceState.heat,
      heatClock: raceState.heatClock,
      chaseActive: raceState.chaseActive,
      cameraShake: 0,
      countdown: 0,
      finished: false
    }
  };
  localStorage.setItem(saveKey, JSON.stringify(snapshot));
  saveProfiles();
  renderSavedRaceButton();
  showToast("Race saved on this device.");
}

function resumeSavedRace() {
  const saved = loadSavedRace();
  if (!saved || !activeProfile || saved.profileId !== activeProfile.id) {
    showToast("No saved race for this driver.");
    renderSavedRaceButton();
    return;
  }
  const race = races.find((item) => item.id === saved.selectedRaceId) || races[0];
  selectedRace = race;
  setCameraMode(saved.cameraMode || cameraMode, true);
  const director = getDirector(activeProfile);
  Object.assign(raceState, saved.state, {
    active: true,
    particles: [],
    opponents: saved.state.opponents || makeOpponents(selectedVehicle(), ageBands[activeProfile.age], director),
    director,
    cameraShake: 0
  });
  raceState.lateralVelocity = Number(saved.state.lateralVelocity) || 0;
  raceState.steerAngle = Number(saved.state.steerAngle) || 0;
  raceState.throttleLoad = Number(saved.state.throttleLoad) || 0;
  raceState.brakeHeat = Number(saved.state.brakeHeat) || 0;
  raceState.slip = Number(saved.state.slip) || 0;
  raceState.damage = Math.max(0, Math.min(100, Number(saved.state.damage) || 0));
  raceState.resetTimer = Math.max(0, Number(saved.state.resetTimer) || 0);
  raceState.resetReason = saved.state.resetReason || "";
  raceState.crashCooldown = Math.max(0, Number(saved.state.crashCooldown) || 0);
  raceState.roadCurve = Number(saved.state.roadCurve) || 0;
  input.paused = Boolean(saved.inputPaused);
  $("#pauseBtn").textContent = input.paused ? "Play" : "Pause";
  $("#raceTitle").textContent = selectedRace.name;
  $("#raceBrief").textContent = selectedRace.target;
  $("#modeChip").textContent = selectedRace.name;
  $("#missionChip").textContent = raceState.chaseActive ? `Police heat ${Math.round(raceState.heat)}% | Escape clean` : `${selectedRace.target} | ${director.event.name}`;
  startAudio();
  if (audioSystem && audioSystem.ctx.state === "suspended") audioSystem.ctx.resume();
  showView("race");
  updateRaceUi();
  showToast("Saved race resumed.");
}

function endRace(manual = false) {
  if (!raceState.active) return;
  if (manual) {
    saveRace();
    raceState.active = false;
    updateHud();
    showView("garage");
    renderHub();
    return;
  }
  raceState.active = false;
  const success = missionProgress() >= 1 && raceState.focus > 0;
  const finishPosition = playerPosition();
  const age = ageBands[activeProfile.age];
  const directorReward = raceState.director ? raceState.director.reward : 1;
  const podiumBonus = finishPosition === 1 ? 120 : finishPosition <= 3 ? 60 : 0;
  const reward = Math.round((selectedRace.reward + raceState.coins * 7 + (success ? 80 : 20) + podiumBonus) * age.rewards * directorReward);
  const rep = success ? selectedRace.rep + (finishPosition === 1 ? 8 : 0) : Math.ceil(selectedRace.rep / 3);
  activeProfile.coins += reward;
  activeProfile.rep += rep;
  activeProfile.stats.races += 1;
  activeProfile.stats.wins += success && finishPosition === 1 ? 1 : 0;
  activeProfile.stats.totalCoins += raceState.coins;
  activeProfile.stats.bestScore = Math.max(activeProfile.stats.bestScore, Math.round(raceState.score));
  if (raceState.focus >= 50) activeProfile.stats.steadyRuns += 1;
  profiles[activeProfile.id] = activeProfile;
  saveProfiles();
  clearSavedRace();
  $("#finishTitle").textContent = success && finishPosition === 1 ? "Race Won" : success ? "Challenge Cleared" : "Race Complete";
  $("#finishStats").innerHTML = `
    <div><span>Position</span><strong>${finishPosition}/6</strong></div>
    <div><span>Coins earned</span><strong>${reward}</strong></div>
    <div><span>Reputation</span><strong>+${rep}</strong></div>
    <div><span>Score</span><strong>${Math.round(raceState.score)}</strong></div>
    <div><span>Damage</span><strong>${Math.round(raceState.damage)}%</strong></div>
    <div><span>Focus left</span><strong>${Math.max(0, Math.round(raceState.focus))}</strong></div>
  `;
  updateHud();
  renderHub();
  showView("finish");
}

function missionProgress() {
  if (selectedRace.type === "coins") return raceState.coins / selectedRace.goal;
  if (selectedRace.type === "focus") return raceState.focus / selectedRace.goal;
  if (selectedRace.type === "dodges") return raceState.dodges / selectedRace.goal;
  return raceState.score / selectedRace.goal;
}

function updateHud() {
  $("#profileChip").textContent = activeProfile ? `${activeProfile.name} | ${ageBands[activeProfile.age].label}` : "No Driver";
  $("#coinStat").textContent = activeProfile ? activeProfile.coins : 0;
  $("#repLabel").textContent = raceState.active ? "Heat" : "Rep";
  $("#repStat").textContent = raceState.active ? Math.round(raceState.heat) : activeProfile ? activeProfile.rep : 0;
  $("#speedStat").textContent = Math.max(0, Math.round(raceState.speed));
  $("#focusStat").textContent = Math.max(0, Math.round(raceState.focus));
  const damageStat = $("#damageStat");
  if (damageStat) damageStat.textContent = raceState.active ? `${Math.round(raceState.damage)}%` : "0%";
  if (raceState.active) {
    const pos = playerPosition();
    const leader = raceRankings()[0];
    $("#missionChip").textContent = raceState.chaseActive
      ? `P${pos}/6 | Police heat ${Math.round(raceState.heat)}%`
      : `P${pos}/6 | Leader ${leader.name} | ${selectedRace.target}`;
    if (raceState.speed < 8) $("#missionChip").textContent = "Hold Gas to accelerate | Brake to stop/reverse";
    if (raceState.resetTimer > 0) $("#missionChip").textContent = `Vehicle reset in ${Math.ceil(raceState.resetTimer)} | ${raceState.resetReason}`;
  }
}

function setCameraMode(mode, quiet = false) {
  cameraMode = mode;
  localStorage.setItem("velocityVaultCameraMode", mode);
  $$(".camera-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.camera === mode));
  if (!quiet) {
    const labels = { chase: "Third-person chase camera", hood: "Low hood camera", cockpit: "Windshield driver view" };
    showToast(labels[mode]);
  }
}

function applyPhoneGraphicsDefaults() {
  const key = "velocityVaultPhoneGraphicsDefaultsV27";
  if (!phoneGraphicsActive() || localStorage.getItem(key)) return;
  rendererMode = "webgl";
  if (cameraMode === "chase") cameraMode = "hood";
  localStorage.setItem("velocityVaultRendererMode", rendererMode);
  localStorage.setItem("velocityVaultCameraMode", cameraMode);
  localStorage.setItem(key, "applied");
}

function initWebGLRenderer() {
  if (!glCanvas || webglRenderer) return;
  try {
    webglRenderer = window.VelocityWebGLPipeline ? window.VelocityWebGLPipeline(glCanvas) : null;
  } catch {
    webglRenderer = null;
    rendererMode = "canvas";
    localStorage.setItem("velocityVaultRendererMode", rendererMode);
  }
}

function useWebGLRenderer() {
  return rendererMode === "webgl" && webglRenderer && webglRenderer.ready;
}

function phoneGraphicsActive() {
  const assets = window.VelocityPhoneAssets;
  if (assets && typeof assets.isPhoneViewport === "function" && assets.isPhoneViewport()) return true;
  return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}

function setRendererMode(mode, quiet = false) {
  rendererMode = mode;
  if (mode === "webgl") initWebGLRenderer();
  if (mode === "webgl" && !webglRenderer) rendererMode = "canvas";
  localStorage.setItem("velocityVaultRendererMode", rendererMode);
  $$(".renderer-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.renderer === rendererMode));
  $(".stage").classList.toggle("webgl", useWebGLRenderer());
  if (!quiet) showToast(useWebGLRenderer() ? "WebGL 3D renderer enabled." : "Classic 2D renderer enabled.");
}

function clearTouchDriveInputs() {
  input.left = false;
  input.right = false;
  input.gas = false;
  input.brake = false;
  input.boost = false;
  mobileTouchState.active.clear();
}

function setTouchDriveMode(mode, quiet = false) {
  touchDriveMode = mode === "toggle" ? "toggle" : "hold";
  localStorage.setItem("velocityVaultTouchDriveMode", touchDriveMode);
  document.body.classList.toggle("touch-toggle", touchDriveMode === "toggle");
  const label = $("#touchModeLabel");
  const modeButton = $(".control-mode");
  if (label) label.textContent = touchDriveMode === "toggle" ? "Toggle" : "Hold";
  if (modeButton) modeButton.setAttribute("aria-pressed", touchDriveMode === "toggle" ? "true" : "false");
  if (!quiet) {
    clearTouchDriveInputs();
    updateRaceUi();
    showToast(touchDriveMode === "toggle" ? "Touch controls set to toggle. Tap Gas or Brake to hold it on." : "Touch controls set to hold. Press and hold to drive.");
  }
}

function setTouchControlSize(size, quiet = false) {
  touchControlSize = size === "full" ? "full" : "mini";
  localStorage.setItem("velocityVaultTouchControlSize", touchControlSize);
  document.body.classList.toggle("control-mini", touchControlSize === "mini");
  if (touchControlSize === "mini" && touchDriveMode === "toggle") {
    setTouchDriveMode("hold", true);
    clearTouchDriveInputs();
  }
  const label = $("#touchSizeLabel");
  const sizeButton = $(".control-size");
  if (label) label.textContent = touchControlSize === "mini" ? "Full" : "Mini";
  if (sizeButton) {
    sizeButton.setAttribute("aria-pressed", touchControlSize === "mini" ? "true" : "false");
    sizeButton.setAttribute("aria-label", touchControlSize === "mini" ? "Switch to full controls" : "Switch to mini controls");
  }
  if (!quiet) {
    updateRaceUi();
    showToast(touchControlSize === "mini" ? "Mini one-thumb drive stick on. Drag diagonally to steer while accelerating." : "Full controls on. Tap Mini for more screen space.");
  }
}

function setDriveInput(control, pressed) {
  if (control === "left") {
    input.left = pressed;
    if (pressed) input.right = false;
  } else if (control === "right") {
    input.right = pressed;
    if (pressed) input.left = false;
  } else if (control === "neutral") {
    input.left = false;
    input.right = false;
  } else if (control === "gas") {
    input.gas = pressed;
    if (pressed) input.brake = false;
  } else if (control === "brake") {
    input.brake = pressed;
    if (pressed) input.gas = false;
  } else if (control === "boost") {
    input.boost = pressed;
  }
}

function toggleDriveInput(control) {
  if (control === "left") {
    setDriveInput("left", !input.left);
  } else if (control === "right") {
    setDriveInput("right", !input.right);
  } else if (control === "neutral") {
    setDriveInput("neutral", true);
  } else if (control === "gas") {
    setDriveInput("gas", !input.gas);
  } else if (control === "brake") {
    setDriveInput("brake", !input.brake);
  } else if (control === "boost") {
    setDriveInput("boost", !input.boost);
  }
}

function isDriveStickControl(control) {
  return typeof control === "string" && control.startsWith("stick:");
}

function driveStickControlAt(stick, clientX, clientY) {
  const rect = stick.getBoundingClientRect();
  if (!rect.width || !rect.height) return "";
  const nx = (clientX - rect.left) / rect.width - 0.5;
  const ny = (clientY - rect.top) / rect.height - 0.5;
  const dead = 0.15;
  const controls = ["stick"];
  if (ny < -dead) controls.push("gas");
  if (ny > dead) controls.push("brake");
  if (nx < -dead) controls.push("left");
  if (nx > dead) controls.push("right");
  if (controls.length === 1) controls.push("neutral");
  return controls.join(":");
}

function addTouchControls(control, controls) {
  if (!control) return;
  if (!isDriveStickControl(control)) {
    controls.add(control);
    return;
  }
  control.split(":").forEach((part) => {
    if (part && part !== "stick") controls.add(part);
  });
}

function mobileControlAt(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  const stick = el && el.closest ? el.closest(".drive-stick") : null;
  if (stick && document.body.classList.contains("control-mini")) return driveStickControlAt(stick, clientX, clientY);
  const button = el && el.closest ? el.closest(".mobile-control") : null;
  return button && button.dataset ? button.dataset.control : "";
}

function applyMobileTouchSnapshot() {
  if (touchDriveMode === "toggle") return;
  const controls = new Set();
  mobileTouchState.active.forEach((control) => addTouchControls(control, controls));
  const neutral = controls.has("neutral");
  const left = controls.has("left");
  const right = controls.has("right");
  const gas = controls.has("gas");
  const brake = controls.has("brake");
  input.left = neutral ? false : left && !right;
  input.right = neutral ? false : right && !left;
  input.gas = gas && !brake;
  input.brake = brake && !gas;
  input.boost = controls.has("boost");
  updateRaceUi();
}

function handleMobileTouchStart(event) {
  mobileTouchState.usingTouchEvents = true;
  event.preventDefault();
  startAudio();
  if (audioSystem && audioSystem.ctx.state === "suspended") audioSystem.ctx.resume();
  Array.from(event.changedTouches).forEach((touch) => {
    const control = mobileControlAt(touch.clientX, touch.clientY);
    if (!control) return;
    if (control === "size") {
      setTouchControlSize(touchControlSize === "mini" ? "full" : "mini");
      return;
    }
    if (control === "mode") {
      const now = performance.now();
      if (now - mobileTouchState.modeToggleAt > 260) {
        mobileTouchState.modeToggleAt = now;
        setTouchDriveMode(touchDriveMode === "toggle" ? "hold" : "toggle");
      }
      return;
    }
    if (touchDriveMode === "toggle" && !isDriveStickControl(control)) {
      toggleDriveInput(control);
      updateRaceUi();
      return;
    }
    mobileTouchState.active.set(touch.identifier, control);
  });
  applyMobileTouchSnapshot();
}

function handleMobileTouchMove(event) {
  if (touchDriveMode === "toggle") return;
  event.preventDefault();
  Array.from(event.changedTouches).forEach((touch) => {
    const control = mobileControlAt(touch.clientX, touch.clientY);
    if (control && control !== "mode" && control !== "size") {
      mobileTouchState.active.set(touch.identifier, control);
    } else {
      mobileTouchState.active.delete(touch.identifier);
    }
  });
  applyMobileTouchSnapshot();
}

function handleMobileTouchEnd(event) {
  if (touchDriveMode === "toggle") return;
  event.preventDefault();
  Array.from(event.changedTouches).forEach((touch) => mobileTouchState.active.delete(touch.identifier));
  applyMobileTouchSnapshot();
}

function bindDriveStickPointerControl() {
  const stick = $(".drive-stick");
  if (!stick) return;
  const pointerKey = "drive-stick-pointer";
  const applyStick = (event) => {
    if (event.pointerType === "touch" && mobileTouchState.usingTouchEvents) return;
    if (touchControlSize !== "mini") return;
    event.preventDefault();
    mobileTouchState.active.set(pointerKey, driveStickControlAt(stick, event.clientX, event.clientY));
    applyMobileTouchSnapshot();
  };
  const stopStick = (event) => {
    if (event && event.pointerType === "touch" && mobileTouchState.usingTouchEvents) return;
    if (event) event.preventDefault();
    mobileTouchState.active.delete(pointerKey);
    applyMobileTouchSnapshot();
    if (stick.releasePointerCapture && event && event.pointerId !== undefined) {
      try {
        stick.releasePointerCapture(event.pointerId);
      } catch {
        // Capture may already be released by the browser.
      }
    }
  };
  stick.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" && mobileTouchState.usingTouchEvents) return;
    startAudio();
    if (audioSystem && audioSystem.ctx.state === "suspended") audioSystem.ctx.resume();
    if (stick.setPointerCapture && event.pointerId !== undefined) {
      try {
        stick.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers reject capture after synthetic pointer events.
      }
    }
    applyStick(event);
  });
  stick.addEventListener("pointermove", applyStick);
  stick.addEventListener("pointerup", stopStick);
  stick.addEventListener("pointercancel", stopStick);
  stick.addEventListener("lostpointercapture", stopStick);
}

function registerOfflineApp() {
  if (!("serviceWorker" in navigator)) return;
  if (!location.protocol.startsWith("http")) return;
  navigator.serviceWorker.register("./sw.js").then(() => {
    showToast("Offline app mode ready.");
  }).catch(() => {
    showToast("Offline app mode needs HTTPS hosting.");
  });
}

function installApp() {
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (isStandalone) {
    showToast("Velocity Vault is already running as an app.");
    return;
  }
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(() => {
      deferredInstallPrompt = null;
    });
    return;
  }
  if (!location.protocol.startsWith("http")) {
    showToast("Install needs the secure GitHub Pages link. Then use Share > Add to Home Screen on iPhone, or Install on Android.");
    return;
  }
  showToast("iPhone: Safari Share > Add to Home Screen. Android/desktop: browser menu > Install / Add to Phone.");
}

function makeOpponents(playerVehicle, age, director) {
  const pool = vehicleDefs.filter((vehicle) => vehicle.id !== playerVehicle.id);
  return opponentNames.map((name, index) => {
    const vehicle = pool[(index * 2 + selectedRace.id.length) % pool.length];
    const startGap = 70 + index * 46;
    return {
      name,
      vehicleId: vehicle.id,
      lane: (index % 5) - 2,
      distance: startGap,
      speed: 35 + index * 8,
      targetBias: 0.9 + index * 0.035 + Math.random() * 0.08,
      focus: 100,
      damage: 0,
      wrecked: false,
      color: vehicle.color,
      wobble: Math.random() * Math.PI * 2,
      bumpCooldown: 0,
      laneVelocity: 0,
      spin: 0,
      finished: false,
      ageSpeed: age.speed,
      aiTune: director.traffic
    };
  });
}

function updateOpponents(dt, maxSpeed) {
  const length = raceLength();
  raceState.opponents.forEach((opponent, index) => {
    if (opponent.finished) return;
    opponent.damage = Math.max(0, Math.min(100, Number(opponent.damage) || 0));
    opponent.laneVelocity = Number(opponent.laneVelocity) || 0;
    opponent.spin = Number(opponent.spin) || 0;
    const vehicle = vehicleById(opponent.vehicleId);
    const routePush = routeVehicleBoost(selectedRace.place, vehicle.type, true);
    const racePressure = Math.max(-0.12, Math.min(0.16, (raceState.distance - opponent.distance) / length));
    const damageDrag = Math.max(0.28, 1 - ((opponent.damage || 0) / 100) * 0.58);
    const target = opponent.wrecked
      ? Math.max(18, maxSpeed * 0.16 * damageDrag)
      : maxSpeed * vehicle.speed * opponent.targetBias * routePush * (0.88 + opponent.aiTune * 0.07 + racePressure) * damageDrag;
    opponent.speed += (target - opponent.speed) * Math.min(1, dt * (opponent.wrecked ? 0.45 : 0.85 + vehicle.handling * 0.35));
    opponent.distance = Math.min(length + 80, opponent.distance + Math.max(0, opponent.speed) * dt);
    opponent.wobble += dt * (0.85 + index * 0.08);
    const laneTarget = Math.sin(opponent.wobble) * 1.7 + Math.sin(opponent.wobble * 0.47 + index) * 0.34;
    if (!opponent.wrecked) {
      opponent.lane += (laneTarget - opponent.lane) * dt * 0.34 * vehicle.handling * Math.max(0.42, damageDrag);
    }
    opponent.lane += (opponent.laneVelocity || 0) * dt;
    opponent.laneVelocity = (opponent.laneVelocity || 0) * Math.max(0, 1 - dt * (opponent.wrecked ? 0.75 : 1.35));
    opponent.lane = Math.max(-2.15, Math.min(2.15, opponent.lane));
    opponent.spin += (opponent.wrecked ? 1.8 : 0.2) * dt * Math.sign(opponent.laneVelocity || 1);
    opponent.bumpCooldown = Math.max(0, (opponent.bumpCooldown || 0) - dt);
    const wheelToWheel = Math.abs(opponent.distance - raceState.distance) < 18 && Math.abs(opponent.lane - raceState.lane) < 0.46;
    if (wheelToWheel && opponent.bumpCooldown <= 0 && raceState.resetTimer <= 0) {
      opponent.bumpCooldown = 1.35;
      const side = Math.sign(opponent.lane - raceState.lane) || (index % 2 ? -1 : 1);
      opponent.speed *= 0.78;
      opponent.laneVelocity += side * 1.15;
      opponent.focus = Math.max(0, opponent.focus - 22);
      raceState.speed *= 0.82;
      raceState.lateralVelocity -= side * 0.95;
      raceState.cameraShake = Math.max(raceState.cameraShake, 9);
      applyVehicleDamage(12 / Math.max(0.72, selectedVehicle().mass), `${opponent.name} side contact`);
      applyOpponentDamage(opponent, 22 / Math.max(0.74, vehicle.mass), `${opponent.name} damaged`, canvas.width / 2 + raceState.lane * laneWidth(), canvas.height * 0.76, opponent.color || "#ffd166");
      burst(canvas.width / 2 + raceState.lane * laneWidth(), canvas.height * 0.76, opponent.color || "#ffd166");
      playHitSound("impact");
    }
    if (opponent.distance >= length) opponent.finished = true;
  });
}

function routeVehicleBoost(place, vehicleType, rival = false) {
  if (place === "snow" && vehicleType === "snowmobile") return rival ? 1.12 : 1.1;
  if (place === "harbor" && vehicleType === "boat") return rival ? 1.14 : 1.12;
  if (place === "airfield" && (vehicleType === "airplane" || vehicleType === "helicopter")) return rival ? 1.12 : 1.1;
  if (place === "freight" && (vehicleType === "semi" || vehicleType === "truck")) return rival ? 1.16 : 1.14;
  if (place === "farm" && vehicleType === "tractor") return rival ? 1.18 : 1.16;
  if (place === "tokyo" && (vehicleType === "car" || vehicleType === "f1" || vehicleType === "prototype")) return rival ? 1.1 : 1.08;
  if (place === "desert" && (vehicleType === "monster" || vehicleType === "truck")) return rival ? 1.12 : 1.1;
  if (place === "rainforest" && (vehicleType === "truck" || vehicleType === "monster" || vehicleType === "tractor")) return rival ? 1.1 : 1.08;
  if (place === "europe" && (vehicleType === "f1" || vehicleType === "prototype" || vehicleType === "car")) return rival ? 1.1 : 1.08;
  return 1;
}

function raceRankings() {
  const racers = [{ name: "You", distance: raceState.distance, player: true }];
  raceState.opponents.forEach((opponent) => racers.push({
    name: opponent.name,
    distance: opponent.distance,
    player: false
  }));
  racers.sort((a, b) => b.distance - a.distance);
  return racers;
}

function playerPosition() {
  return raceRankings().findIndex((racer) => racer.player) + 1;
}

function spawnRival() {
  const age = ageBands[activeProfile.age];
  const director = raceState.director || getDirector(activeProfile);
  const lane = Math.floor(Math.random() * 5) - 2;
  const routeTypes = selectedRace.place === "harbor" ? ["boat", "car", "truck"]
    : selectedRace.place === "snow" ? ["snowmobile", "truck", "car"]
      : selectedRace.place === "airfield" ? ["airplane", "helicopter", "car", "truck"]
        : selectedRace.place === "freight" ? ["semi", "semi", "truck", "monster"]
          : selectedRace.place === "farm" ? ["tractor", "tractor", "truck", "monster"]
            : selectedRace.place === "tokyo" ? ["car", "f1", "prototype", "semi"]
              : selectedRace.place === "desert" ? ["monster", "truck", "semi", "car"]
                : selectedRace.place === "rainforest" ? ["truck", "monster", "tractor", "car"]
                  : ["car", "f1", "prototype", "truck", "monster"];
  const type = routeTypes[Math.floor(Math.random() * routeTypes.length)];
  const def = vehicleDefs.find((vehicle) => vehicle.type === type) || vehicleDefs[0];
  raceState.rivals.push({
    lane,
    y: -120,
    w: type === "semi" ? 82 : type === "tractor" ? 64 : type === "monster" || type === "truck" ? 68 : 54,
    h: type === "airplane" || type === "helicopter" ? 104 : 92,
    speed: 210 + Math.random() * 130 * age.traffic * director.traffic,
    color: Math.random() > 0.45 ? def.color : (Math.random() > 0.5 ? "#ff5b6b" : "#ffd166"),
    type,
    passed: false,
    contactCooldown: 0,
    damage: 0,
    wrecked: false,
    laneVelocity: 0,
    spin: 0
  });
}

function spawnPoliceUnit() {
  const lane = Math.floor(Math.random() * 5) - 2;
  raceState.police.push({
    lane,
    y: -170,
    w: 62,
    h: 112,
    speed: 260 + Math.random() * 95 + raceState.heat * 0.9,
    passed: false,
    contactCooldown: 0,
    damage: 0,
    wrecked: false,
    laneVelocity: 0,
    spin: 0
  });
}

function spawnCoin() {
  const lane = Math.floor(Math.random() * 5) - 2;
  raceState.coinsOnRoad.push({ lane, y: -60, r: 13, pulse: Math.random() * 10 });
}

function tick(dt) {
  if (!raceState.active || input.paused) return;
  const upgrades = activeProfile.upgrades;
  const age = ageBands[activeProfile.age];
  const director = raceState.director || getDirector(activeProfile);
  const vehicle = selectedVehicle();
  const gasInput = input.gas || input.gamepadGas;
  const brakeInput = input.brake || input.gamepadBrake;
  const boostInput = input.boost || input.gamepadBoost;
  raceState.crashCooldown = Math.max(0, raceState.crashCooldown - dt);
  if (raceState.resetTimer > 0) {
    raceState.resetTimer = Math.max(0, raceState.resetTimer - dt);
    raceState.speed *= Math.max(0, 1 - dt * 5.6);
    raceState.lateralVelocity *= Math.max(0, 1 - dt * 6.8);
    raceState.steerAngle *= Math.max(0, 1 - dt * 6.4);
    raceState.slip = Math.max(raceState.slip * 0.9, 0.55);
    raceState.cameraShake = Math.max(raceState.cameraShake, 2 + raceState.resetTimer * 1.8);
    emitDrivingEffects(dt, false, true, false, 0);
    if (raceState.resetTimer <= 0) completeVehicleReset();
    updateRaceUi();
    updateAudio();
    return;
  }
  const surfaceBoost = routeVehicleBoost(selectedRace.place, vehicle.type);
  const damageRatio = Math.min(0.86, (raceState.damage || 0) / 120);
  const performanceHealth = Math.max(0.42, 1 - damageRatio * 0.44);
  const handlingHealth = Math.max(0.48, 1 - damageRatio * 0.34);
  const maxSpeed = (245 + upgrades.engine * 26) * age.speed * vehicle.speed * surfaceBoost * performanceHealth;
  const keySteer = Number(input.right) - Number(input.left);
  const steerInput = Math.abs(input.gamepadSteer) > Math.abs(keySteer) ? input.gamepadSteer : keySteer;
  const boostPower = boostInput && gasInput && raceState.focus > 2 ? (60 + upgrades.boost * 17) * performanceHealth : 0;
  const speedLimit = maxSpeed + boostPower;
  const forwardSpeed = Math.max(0, raceState.speed);
  const reverseSpeed = Math.min(0, raceState.speed);
  const throttleAccel = (42 + upgrades.engine * 4.8) * age.speed * vehicle.speed * surfaceBoost * performanceHealth;
  const boostAccel = boostInput && gasInput && raceState.focus > 2 ? (54 + upgrades.boost * 9) * performanceHealth : 0;
  const brakeForce = ((88 + upgrades.tires * 5) / Math.max(0.72, vehicle.mass)) * Math.max(0.64, 1 - damageRatio * 0.24);
  const reverseAccel = 34 / Math.max(0.8, vehicle.mass);
  const rollingDrag = raceState.speed > 0 ? (10 + forwardSpeed * 0.035 + forwardSpeed * forwardSpeed * 0.00045) : (14 + Math.abs(reverseSpeed) * 0.12);

  if (gasInput) {
    raceState.speed += (throttleAccel + boostAccel) * dt;
  }
  if (brakeInput) {
    raceState.speed -= (raceState.speed > 4 ? brakeForce : reverseAccel) * dt;
  }
  if (!gasInput && !brakeInput && Math.abs(raceState.speed) > 0.05) {
    const drag = Math.min(Math.abs(raceState.speed), rollingDrag * dt);
    raceState.speed += raceState.speed > 0 ? -drag : drag;
  }
  raceState.speed = Math.max(-38, Math.min(speedLimit, raceState.speed));
  raceState.throttleLoad += ((gasInput ? 1 : 0) - raceState.throttleLoad) * Math.min(1, dt * 4.4);
  raceState.brakeHeat += ((brakeInput && Math.abs(raceState.speed) > 12 ? 1 : 0) - raceState.brakeHeat) * Math.min(1, dt * 5.2);
  if (boostInput && gasInput && raceState.focus > 2) raceState.focus -= dt * Math.max(4, 13 - upgrades.boost * 1.4);

  const speedGrip = Math.max(0.28, Math.min(1.18, Math.abs(raceState.speed) / 120));
  const steerTarget = steerInput * (0.92 + upgrades.tires * 0.045) * handlingHealth * (raceState.speed < -1 ? -0.62 : 1);
  raceState.steerAngle += (steerTarget - raceState.steerAngle) * Math.min(1, dt * (5.4 + vehicle.handling * 2.2) * handlingHealth);
  const lateralAccel = raceState.steerAngle * speedGrip * (4.2 + vehicle.handling * 1.35 + upgrades.tires * 0.28) * handlingHealth;
  raceState.lateralVelocity += lateralAccel * dt;
  const grip = (2.15 + vehicle.handling * 1.25 + upgrades.tires * 0.32 + (brakeInput ? 0.75 : 0)) * handlingHealth;
  raceState.lateralVelocity *= Math.max(0, 1 - dt * grip);
  raceState.lane += raceState.lateralVelocity * dt;
  raceState.x = raceState.lane;
  const offRoad = Math.max(0, Math.abs(raceState.lane) - 2.04);
  if (offRoad > 0) {
    raceState.lane = Math.max(-2.28, Math.min(2.28, raceState.lane));
    raceState.lateralVelocity -= Math.sign(raceState.lane) * offRoad * 6.5 * dt;
    raceState.speed *= Math.max(0.985, 1 - dt * (0.22 + offRoad * 0.24));
    raceState.focus -= dt * offRoad * 1.8;
    if (Math.abs(raceState.speed) > 90) applyVehicleDamage(dt * offRoad * (Math.abs(raceState.speed) / 34), "Off-road damage", true);
  }
  raceState.slip = Math.min(1, Math.abs(raceState.lateralVelocity) * 0.42 + Math.abs(raceState.steerAngle) * speedGrip * 0.18 + raceState.brakeHeat * 0.22 + offRoad * 0.5);
  raceState.distance = Math.max(0, raceState.distance + Math.max(0, raceState.speed) * dt);
  raceState.roadOffset += raceState.speed * dt;
  raceState.elapsed += dt;
  const curveSeed = selectedRace ? selectedRace.id.length * 0.43 : 1;
  const curveTarget = Math.sin(raceState.distance * 0.00034 + curveSeed) * 0.72 + Math.sin(raceState.distance * 0.00012 + curveSeed * 2.7) * 0.34;
  raceState.roadCurve += (curveTarget - (raceState.roadCurve || 0)) * Math.min(1, dt * 0.55);
  raceState.score += dt * Math.max(0, raceState.speed) * raceState.combo * 0.32;
  raceState.heat = Math.min(100, raceState.heat + dt * (gasInput ? 0.8 + Math.max(0, raceState.speed) / 185 : 0.1) + (boostInput && gasInput ? dt * 2.4 : 0));
  raceState.heatClock -= dt;
  raceState.cameraShake = Math.max(0, raceState.cameraShake - dt * 18);
  emitDrivingEffects(dt, gasInput, brakeInput, boostInput, steerInput);
  updateOpponents(dt, maxSpeed);
  raceState.spawnClock -= dt;
  raceState.coinClock -= dt;
  if (raceState.spawnClock <= 0 && raceState.speed > 35) {
    spawnRival();
    raceState.spawnClock = Math.max(0.48, 1.14 - age.traffic * director.traffic * 0.16 - raceState.elapsed * 0.004);
  }
  if (raceState.coinClock <= 0 && raceState.speed > 30) {
    spawnCoin();
    raceState.coinClock = Math.max(0.3, (0.76 - upgrades.magnet * 0.035) / director.coinRate);
  }
  if (raceState.heat > 18 && raceState.heatClock <= 0 && raceState.speed > 45) {
    raceState.chaseActive = true;
    spawnPoliceUnit();
    raceState.heatClock = Math.max(1.2, 4.5 - raceState.heat / 24 - activeProfile.upgrades.engine * 0.12);
    showToast(raceState.heat > 65 ? "High heat pursuit. Watch for interceptors." : "Police chase started.");
  }
  moveObjects(dt);
  if (raceState.focus <= 0 || raceState.distance >= raceLength()) endRace(false);
  updateRaceUi();
  updateAudio();
}

function moveObjects(dt) {
  const carLane = raceState.lane;
  const vehicle = selectedVehicle();
  raceState.rivals.forEach((rival) => {
    rival.damage = Math.max(0, Math.min(100, Number(rival.damage) || 0));
    rival.laneVelocity = Number(rival.laneVelocity) || 0;
    rival.spin = Number(rival.spin) || 0;
    rival.contactCooldown = Math.max(0, (rival.contactCooldown || 0) - dt);
    const damageDrag = Math.max(0.24, 1 - ((rival.damage || 0) / 100) * 0.66);
    if (rival.wrecked) {
      rival.speed *= Math.max(0, 1 - dt * 1.65);
      rival.spin += dt * (2.2 + Math.abs(rival.laneVelocity || 0)) * Math.sign(rival.laneVelocity || 1);
    } else {
      rival.speed *= Math.max(0, 1 - dt * (1 - damageDrag) * 0.18);
      const avoid = rival.y > canvas.height * 0.26 && rival.y < canvas.height * 0.7 && Math.abs(rival.lane - carLane) < 0.85
        ? Math.sign(rival.lane - carLane || 1) * 0.55
        : 0;
      rival.laneVelocity += avoid * dt;
    }
    rival.lane += (rival.laneVelocity || 0) * dt;
    rival.laneVelocity = (rival.laneVelocity || 0) * Math.max(0, 1 - dt * 1.2);
    rival.lane = Math.max(-2.24, Math.min(2.24, rival.lane));
    rival.y += (Math.max(18, rival.speed * damageDrag) + Math.max(0, raceState.speed) * (rival.wrecked ? 0.24 : 0.18)) * dt;
    if (!rival.passed && !rival.wrecked && rival.y > canvas.height * 0.72) {
      rival.passed = true;
      raceState.dodges += 1;
      raceState.combo = Math.min(5, raceState.combo + 0.12);
    }
    const laneHit = Math.abs(rival.lane - carLane) < 0.52;
    const yHit = rival.y > canvas.height * 0.64 && rival.y < canvas.height * 0.87;
    if (laneHit && yHit && rival.contactCooldown <= 0 && raceState.resetTimer <= 0) {
      rival.contactCooldown = 0.55;
      const shield = activeProfile.upgrades.shield;
      const impact = Math.max(8, (28 - shield * 2.7) / Math.max(0.72, vehicle.mass));
      const side = Math.sign(rival.lane - carLane) || (Math.random() > 0.5 ? 1 : -1);
      applyVehicleDamage(impact, "Traffic impact");
      applyTrafficDamage(rival, impact * 1.65, "Traffic disabled", canvas.width / 2 + carLane * laneWidth(), canvas.height * 0.76, rival.color || "#ff5b6b");
      raceState.combo = 1;
      raceState.cameraShake = Math.max(raceState.cameraShake, 7);
      raceState.speed *= Math.max(0.42, 0.78 - impact * 0.007);
      raceState.lateralVelocity -= side * 1.05;
      rival.laneVelocity += side * 1.35;
      rival.speed *= Math.max(0.24, 0.62 - impact * 0.006);
      burst(canvas.width / 2 + carLane * laneWidth(), canvas.height * 0.76, "#ff5b6b");
      playHitSound("impact");
    }
  });
  raceState.police.forEach((unit) => {
    unit.damage = Math.max(0, Math.min(100, Number(unit.damage) || 0));
    unit.laneVelocity = Number(unit.laneVelocity) || 0;
    unit.spin = Number(unit.spin) || 0;
    unit.contactCooldown = Math.max(0, (unit.contactCooldown || 0) - dt);
    const damageDrag = Math.max(0.22, 1 - ((unit.damage || 0) / 100) * 0.62);
    if (unit.wrecked) {
      unit.speed *= Math.max(0, 1 - dt * 1.45);
      unit.spin += dt * (2.4 + Math.abs(unit.laneVelocity || 0)) * Math.sign(unit.laneVelocity || 1);
    } else {
      const pursuitPull = Math.sign(carLane - unit.lane) * dt * (0.18 + raceState.heat / 260) * damageDrag;
      unit.lane += pursuitPull;
    }
    unit.lane += (unit.laneVelocity || 0) * dt;
    unit.laneVelocity = (unit.laneVelocity || 0) * Math.max(0, 1 - dt * 1.05);
    unit.lane = Math.max(-2.2, Math.min(2.2, unit.lane));
    unit.y += (Math.max(16, unit.speed * damageDrag) + Math.max(0, raceState.speed) * (unit.wrecked ? 0.22 : 0.12)) * dt;
    if (!unit.passed && !unit.wrecked && unit.y > canvas.height * 0.72) {
      unit.passed = true;
      raceState.dodges += 1;
      raceState.combo = Math.min(5, raceState.combo + 0.2);
      raceState.score += 180;
      raceState.heat = Math.max(10, raceState.heat - 4);
    }
    const laneHit = Math.abs(unit.lane - carLane) < 0.56;
    const yHit = unit.y > canvas.height * 0.61 && unit.y < canvas.height * 0.9;
    if (laneHit && yHit && unit.contactCooldown <= 0 && raceState.resetTimer <= 0) {
      unit.contactCooldown = 0.65;
      const shield = activeProfile.upgrades.shield;
      const impact = Math.max(12, (38 - shield * 2.5) / Math.max(0.72, vehicle.mass));
      const side = Math.sign(unit.lane - carLane) || (Math.random() > 0.5 ? 1 : -1);
      applyVehicleDamage(impact, "Police contact");
      applyTrafficDamage(unit, impact * 1.25, "Interceptor damaged", canvas.width / 2 + carLane * laneWidth(), canvas.height * 0.78, "#46d9ff");
      raceState.combo = 1;
      raceState.cameraShake = Math.max(raceState.cameraShake, 12);
      raceState.heat = Math.min(100, raceState.heat + 12);
      raceState.speed *= Math.max(0.36, 0.72 - impact * 0.006);
      raceState.lateralVelocity -= side * 1.3;
      unit.laneVelocity += side * 1.5;
      unit.speed *= Math.max(0.22, 0.58 - impact * 0.004);
      burst(canvas.width / 2 + carLane * laneWidth(), canvas.height * 0.78, "#46d9ff");
      burst(canvas.width / 2 + carLane * laneWidth(), canvas.height * 0.78, "#ff3348");
      playHitSound("police");
    }
  });
  const magnet = activeProfile.upgrades.magnet;
  raceState.coinsOnRoad.forEach((coin) => {
    coin.y += (180 + Math.max(0, raceState.speed) * 0.34) * dt;
    coin.pulse += dt * 8;
    const catchRange = 0.38 + magnet * 0.1;
    const laneHit = Math.abs(coin.lane - carLane) < catchRange;
    const yHit = coin.y > canvas.height * 0.62 && coin.y < canvas.height * 0.9;
    if (laneHit && yHit && !coin.hit) {
      coin.hit = true;
      raceState.coins += 1;
      raceState.score += 120 * raceState.combo;
      raceState.combo = Math.min(5, raceState.combo + 0.18);
      burst(canvas.width / 2 + carLane * laneWidth(), canvas.height * 0.76, "#ffd166");
      playHitSound("coin");
    }
  });
  raceState.rivals = raceState.rivals.filter((r) => r.y < canvas.height + 220);
  raceState.police = raceState.police.filter((p) => p.y < canvas.height + 240);
  if (!raceState.police.length && raceState.heat < 16) raceState.chaseActive = false;
  raceState.coinsOnRoad = raceState.coinsOnRoad.filter((c) => c.y < canvas.height + 80 && !c.hit);
  raceState.particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.max(0, 1 - dt * 1.8);
    p.vy *= Math.max(0, 1 - dt * 1.2);
    p.life -= dt;
  });
  raceState.particles = raceState.particles.filter((p) => p.life > 0);
}

function applyOpponentDamage(opponent, amount, reason, x, y, color) {
  if (!opponent || amount <= 0) return;
  opponent.damage = Math.max(0, Math.min(100, (opponent.damage || 0) + amount));
  opponent.bumpCooldown = Math.max(opponent.bumpCooldown || 0, 0.7);
  opponent.focus = Math.max(0, (opponent.focus || 100) - amount * 0.85);
  if (opponent.damage >= 100 && !opponent.wrecked) {
    opponent.wrecked = true;
    opponent.speed *= 0.22;
    opponent.laneVelocity += (Math.random() > 0.5 ? 1 : -1) * 1.4;
    opponent.spin += 0.8;
    showToast(`${reason}. Rival limping.`);
  }
  burst(x, y, color || "#ffd166");
  if (opponent.damage > 48) emitVehicleSmoke(x, y, opponent.damage, color || "#888888");
}

function applyTrafficDamage(target, amount, reason, x, y, color) {
  if (!target || amount <= 0) return;
  target.damage = Math.max(0, Math.min(100, (target.damage || 0) + amount));
  if (target.damage >= 100 && !target.wrecked) {
    target.wrecked = true;
    target.speed *= 0.18;
    target.spin += 1.2;
    target.laneVelocity += (Math.random() > 0.5 ? 1 : -1) * 1.2;
    showToast(reason);
  }
  if (target.damage > 35) emitVehicleSmoke(x, y, target.damage, color || "#777777");
}

function emitVehicleSmoke(x, y, damage, color = "#777777") {
  const count = Math.min(10, 3 + Math.floor(damage / 18));
  for (let i = 0; i < count; i += 1) {
    const life = 0.45 + Math.random() * 0.5;
    raceState.particles.push({
      x: x + (Math.random() - 0.5) * 32,
      y: y + (Math.random() - 0.5) * 22,
      vx: (Math.random() - 0.5) * 80,
      vy: -40 - Math.random() * 80,
      life,
      maxLife: life,
      radius: 10 + Math.random() * 18,
      color: damage > 72 ? "rgba(22,22,20,0.48)" : "rgba(120,126,120,0.34)"
    });
  }
}

function applyVehicleDamage(amount, reason = "Impact", quiet = false) {
  if (!raceState.active || raceState.resetTimer > 0 || amount <= 0) return;
  const shield = activeProfile ? activeProfile.upgrades.shield : 0;
  const vehicle = selectedVehicle();
  const massResist = Math.max(0.55, Math.min(1.15, 1.18 / Math.max(0.72, vehicle.mass)));
  const shieldResist = Math.max(0.58, 1 - shield * 0.055);
  const finalAmount = amount * massResist * shieldResist;
  raceState.damage = Math.max(0, Math.min(100, (raceState.damage || 0) + finalAmount));
  raceState.focus = Math.max(0, raceState.focus - Math.max(3, finalAmount * 0.64));
  raceState.crashCooldown = Math.max(raceState.crashCooldown, quiet ? 0.18 : 0.75);
  if (!quiet) {
    const label = raceState.damage >= 100 ? "Critical damage" : `${reason}: ${Math.round(raceState.damage)}% damage`;
    showToast(label);
  }
  if (raceState.damage >= 100) triggerVehicleReset(reason);
}

function triggerVehicleReset(reason = "Critical damage") {
  if (!raceState.active || raceState.resetTimer > 0) return;
  raceState.resetTimer = 3.2;
  raceState.resetReason = reason;
  raceState.speed = Math.min(18, Math.max(-4, raceState.speed * 0.18));
  raceState.lateralVelocity = 0;
  raceState.steerAngle = 0;
  raceState.combo = 1;
  raceState.cameraShake = Math.max(raceState.cameraShake, 18);
  raceState.focus = Math.max(8, raceState.focus - 7);
  clearTouchDriveInputs();
  burst(canvas.width / 2 + raceState.lane * laneWidth(), canvas.height * 0.78, "#ff5b6b");
  burst(canvas.width / 2 + raceState.lane * laneWidth(), canvas.height * 0.78, "#ffd166");
  playHitSound("impact");
  showToast(`${reason}. Resetting vehicle.`);
}

function completeVehicleReset() {
  raceState.resetTimer = 0;
  raceState.resetReason = "";
  raceState.damage = Math.min(42, raceState.damage * 0.42);
  raceState.lane = 0;
  raceState.x = 0;
  raceState.speed = 0;
  raceState.lateralVelocity = 0;
  raceState.steerAngle = 0;
  raceState.slip = 0;
  raceState.crashCooldown = 1.2;
  showToast("Vehicle reset. Damage stabilized.");
}

function manualResetVehicle() {
  if (!raceState.active) return;
  if (raceState.resetTimer > 0) return;
  raceState.damage = Math.min(100, raceState.damage + 6);
  triggerVehicleReset("Manual reset");
}

function burst(x, y, color) {
  for (let i = 0; i < 16; i += 1) {
    const life = 0.35 + Math.random() * 0.35;
    raceState.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 240,
      vy: (Math.random() - 0.8) * 220,
      life,
      maxLife: life,
      radius: 4 + Math.random() * 4,
      color
    });
  }
}

function emitDrivingEffects(dt, gasInput, brakeInput, boostInput, steerInput) {
  if (!raceState.active || canvas.width <= 0 || canvas.height <= 0) return;
  const speed = Math.abs(raceState.speed);
  const x = canvas.width / 2 + raceState.lane * laneWidth();
  const baseY = cameraMode === "cockpit" ? canvas.height * 0.78 : cameraMode === "hood" ? canvas.height * 0.93 : canvas.height * 0.87;
  const slipChance = Math.min(0.75, raceState.slip * 0.34 + (brakeInput && speed > 24 ? 0.12 : 0) + (Math.abs(steerInput) > 0 && speed > 90 ? 0.06 : 0));
  if (Math.random() < slipChance * dt * 18) {
    const side = Math.random() > 0.5 ? -1 : 1;
    const life = 0.35 + Math.random() * 0.28;
    raceState.particles.push({
      x: x + side * laneWidth() * 0.24 + (Math.random() - 0.5) * 18,
      y: baseY + Math.random() * 24,
      vx: -raceState.lateralVelocity * 34 + (Math.random() - 0.5) * 42,
      vy: -32 - Math.random() * 34,
      life,
      maxLife: life,
      radius: 10 + Math.random() * 18,
      color: brakeInput ? "rgba(190,205,205,0.42)" : "rgba(120,134,128,0.32)"
    });
  }
  if (boostInput && gasInput && raceState.focus > 2 && Math.random() < dt * 22) {
    const life = 0.25 + Math.random() * 0.18;
    raceState.particles.push({
      x: x + (Math.random() - 0.5) * laneWidth() * 0.5,
      y: baseY + 18 + Math.random() * 22,
      vx: (Math.random() - 0.5) * 36,
      vy: 80 + Math.random() * 90,
      life,
      maxLife: life,
      radius: 12 + Math.random() * 16,
      color: "rgba(255,209,102,0.58)"
    });
  }
  if (gasInput && speed < 20 && Math.random() < dt * 8) {
    const life = 0.28 + Math.random() * 0.22;
    raceState.particles.push({
      x: x + (Math.random() - 0.5) * laneWidth() * 0.42,
      y: baseY + 12,
      vx: (Math.random() - 0.5) * 24,
      vy: 34 + Math.random() * 36,
      life,
      maxLife: life,
      radius: 8 + Math.random() * 12,
      color: "rgba(244,251,248,0.26)"
    });
  }
  const damage = raceState.damage || 0;
  if (damage > 24 && Math.random() < dt * (4 + damage * 0.12)) {
    const life = 0.48 + Math.random() * 0.5;
    raceState.particles.push({
      x: x + (Math.random() - 0.5) * laneWidth() * 0.38,
      y: baseY + 8 + Math.random() * 18,
      vx: (Math.random() - 0.5) * 36 - raceState.lateralVelocity * 18,
      vy: 38 + Math.random() * 80,
      life,
      maxLife: life,
      radius: 12 + Math.random() * 24,
      color: damage > 70 ? "rgba(25,25,24,0.42)" : "rgba(135,138,132,0.28)"
    });
  }
}

function updateRaceUi() {
  $("#distanceBar").style.width = `${Math.min(100, (raceState.distance / raceLength()) * 100)}%`;
  $("#missionBar").style.width = `${Math.min(100, missionProgress() * 100)}%`;
  const damageBar = $("#damageBar");
  if (damageBar) damageBar.style.width = `${Math.min(100, raceState.damage || 0)}%`;
  const resetCar = $("#resetCar");
  if (resetCar) resetCar.textContent = raceState.resetTimer > 0 ? `Reset ${Math.ceil(raceState.resetTimer)}` : "Reset Car";
  $("#gasBtn").classList.toggle("pressed", input.gas || input.gamepadGas);
  $("#brakeBtn").classList.toggle("pressed", input.brake || input.gamepadBrake);
  $("#boostBtn").classList.toggle("pressed", input.boost || input.gamepadBoost);
  $$(".mobile-control").forEach((button) => {
    const control = button.dataset.control;
    const pressed = control === "left" ? input.left
      : control === "right" ? input.right
        : control === "neutral" ? !input.left && !input.right
          : control === "gas" ? input.gas || input.gamepadGas
            : control === "brake" ? input.brake || input.gamepadBrake
              : control === "boost" ? input.boost || input.gamepadBoost
                : control === "mode" ? touchDriveMode === "toggle"
                  : control === "size" ? touchControlSize === "mini"
                    : false;
    button.classList.toggle("pressed", pressed);
  });
  const touchLabel = $("#touchModeLabel");
  if (touchLabel) touchLabel.textContent = touchDriveMode === "toggle" ? "Toggle" : "Hold";
  const sizeLabel = $("#touchSizeLabel");
  if (sizeLabel) sizeLabel.textContent = touchControlSize === "mini" ? "Full" : "Mini";
  updateHud();
}

function laneWidth() {
  if (cameraMode === "cockpit") return Math.min(canvas.width * 0.145, 118);
  if (cameraMode === "hood") return Math.min(canvas.width * 0.13, 104);
  return Math.min(canvas.width * 0.115, 92);
}

let last = performance.now();
function loop(now = performance.now()) {
  const dt = Math.min(0.04, (now - last) / 1000);
  last = now;
  pollGamepad();
  tick(dt);
  drawFrame();
}

function drawFrame() {
  const w = canvas.width;
  const h = canvas.height;
  const shake = raceState.cameraShake;
  const theme = selectedRace ? selectedRace.theme : races[0].theme;
  if (useWebGLRenderer()) {
    $(".stage").classList.add("webgl");
    ctx.clearRect(0, 0, w, h);
    webglRenderer.resize(w, h);
    webglRenderer.render({
      width: w,
      height: h,
      raceState,
      selectedRace: selectedRace || races[0],
      selectedVehicle: selectedVehicle(),
      vehicleDefs,
      cameraMode
    });
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.55);
    drawWebGLRouteAtmosphere(w, h, theme);
    drawRealisticDrivingPass(w, h, theme);
    drawPhoneAssetTexturePass(w, h, theme);
    drawRoadWeightPass(w, h, theme);
    drawPhoneUltraGraphicsPass(w, h, theme);
    if (raceState.active) {
      drawObjects();
      drawCar(w, h);
    } else {
      drawDemoPursuitTraffic(w, h);
    }
    drawCameraOverlay(w, h, theme);
    drawDamageOverlay(w, h, theme);
    if (raceState.active) drawRaceStandings(w, h);
    drawParticles();
    drawPhoneFilmicPost(w, h, theme);
    drawCinematicGrade(w, h, theme);
    if (!raceState.active) drawAttract(w, h);
    if (input.paused && raceState.active) drawPause(w, h);
    ctx.restore();
    requestAnimationFrame(loop);
    return;
  }
  $(".stage").classList.remove("webgl");
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.55);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, theme[0]);
  sky.addColorStop(0.6, "#08100f");
  sky.addColorStop(1, "#050807");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  drawScenery(w, h, theme);
  drawRoad(w, h, theme);
  drawRealisticDrivingPass(w, h, theme);
  drawPhoneAssetTexturePass(w, h, theme);
  drawRoadWeightPass(w, h, theme);
  drawPhoneUltraGraphicsPass(w, h, theme);
  if (!raceState.active) drawDemoPursuitTraffic(w, h);
  drawObjects();
  drawCar(w, h);
  drawCameraOverlay(w, h, theme);
  drawDamageOverlay(w, h, theme);
  if (raceState.active) drawRaceStandings(w, h);
  drawParticles();
  drawPhoneFilmicPost(w, h, theme);
  drawCinematicGrade(w, h, theme);
  if (!raceState.active) drawAttract(w, h);
  if (input.paused && raceState.active) drawPause(w, h);
  ctx.restore();
  requestAnimationFrame(loop);
}

function drawWebGLRouteAtmosphere(w, h, theme) {
  const place = selectedRace && selectedRace.place ? selectedRace.place : "city";
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, `${theme[0]}99`);
  sky.addColorStop(0.6, "rgba(5,8,7,0.08)");
  sky.addColorStop(1, "rgba(5,8,7,0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.62);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.06, w * 0.5, h * 0.55, w * 0.62);
  glow.addColorStop(0, `${theme[1]}24`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  if (place === "tokyo" || place === "city") {
    ctx.globalAlpha = place === "tokyo" ? 0.4 : 0.24;
    ctx.strokeStyle = place === "tokyo" ? "#ff4fd8" : theme[1];
    ctx.lineWidth = 3;
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 97 + raceState.roadOffset * 0.18) % (w + 120) - 60;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.16);
      ctx.lineTo(x + 42, h * 0.78);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (place === "desert" || place === "canyon" || place === "freight") {
    const dust = ctx.createLinearGradient(0, h * 0.38, 0, h);
    dust.addColorStop(0, "rgba(255,183,74,0)");
    dust.addColorStop(0.72, "rgba(255,183,74,0.12)");
    dust.addColorStop(1, "rgba(255,183,74,0.18)");
    ctx.fillStyle = dust;
    ctx.fillRect(0, h * 0.34, w, h * 0.66);
  }

  if (place === "rainforest" || place === "snow") {
    ctx.strokeStyle = place === "snow" ? "rgba(244,251,248,0.28)" : "rgba(185,255,220,0.16)";
    ctx.lineWidth = place === "snow" ? 2 : 1;
    for (let i = 0; i < 58; i += 1) {
      const x = (i * 53 + raceState.elapsed * (place === "snow" ? 24 : 70)) % w;
      const y = (i * 37 + raceState.elapsed * (place === "snow" ? 18 : 110)) % h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (place === "snow" ? 4 : 12), y + (place === "snow" ? 6 : 28));
      ctx.stroke();
    }
  }

  if (raceState.speed > 90) {
    ctx.globalAlpha = Math.min(0.35, raceState.speed / 900);
    ctx.strokeStyle = theme[1];
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i += 1) {
      const y = h * (0.36 + (i % 12) * 0.05);
      const side = i % 2 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + side * w * 0.12, y);
      ctx.lineTo(w * 0.5 + side * w * (0.38 + (i % 4) * 0.06), y + h * 0.16);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawScenery(w, h, theme) {
  const place = selectedRace && selectedRace.place ? selectedRace.place : "city";
  ctx.save();
  if (place === "coast") drawCoastalScenery(w, h, theme);
  if (place === "city") drawMetroScenery(w, h, theme);
  if (place === "canyon") drawCanyonScenery(w, h, theme);
  if (place === "alpine") drawAlpineScenery(w, h, theme);
  if (place === "harbor") drawHarborScenery(w, h, theme);
  if (place === "snow") drawSnowScenery(w, h, theme);
  if (place === "airfield") drawAirfieldScenery(w, h, theme);
  if (place === "freight") drawFreightScenery(w, h, theme);
  if (place === "farm") drawFarmScenery(w, h, theme);
  if (place === "tokyo") drawTokyoScenery(w, h, theme);
  if (place === "desert") drawWorldDesertScenery(w, h, theme);
  if (place === "rainforest") drawRainforestScenery(w, h, theme);
  if (place === "europe") drawEuropeanScenery(w, h, theme);
  drawAtmosphericDepth(w, h, theme);
  drawRoadSigns(w, h, theme);
  ctx.restore();
}

function drawAtmosphericDepth(w, h, theme) {
  const place = selectedRace && selectedRace.place ? selectedRace.place : "city";
  const haze = ctx.createLinearGradient(0, h * 0.16, 0, h * 0.55);
  haze.addColorStop(0, "rgba(244,251,248,0.06)");
  haze.addColorStop(0.65, "rgba(70,217,255,0.05)");
  haze.addColorStop(1, "rgba(5,8,7,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.12, w, h * 0.44);

  if (place === "coast") {
    for (let i = 0; i < 10; i += 1) {
      const x = ((i * 131 + raceState.roadOffset * 0.03) % (w + 120)) - 60;
      ctx.strokeStyle = "rgba(244,251,248,0.22)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.31);
      ctx.lineTo(x - 20, h * 0.42);
      ctx.stroke();
      ctx.fillStyle = "rgba(187,242,74,0.18)";
      ctx.beginPath();
      ctx.ellipse(x - 24, h * 0.28, 22, 7, -0.35, 0, Math.PI * 2);
      ctx.ellipse(x + 3, h * 0.27, 20, 6, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (place === "city") {
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i += 1) {
      const x = w * (0.12 + i * 0.19);
      ctx.beginPath();
      ctx.moveTo(x, h * 0.34);
      ctx.lineTo(x + Math.sin(i) * 36, h * 0.2);
      ctx.stroke();
    }
  }

  if (place === "alpine") {
    ctx.fillStyle = "rgba(244,251,248,0.22)";
    for (let i = 0; i < 8; i += 1) {
      const x = ((i * 151 + raceState.roadOffset * 0.02) % (w + 160)) - 80;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.31);
      ctx.lineTo(x + 38, h * 0.18);
      ctx.lineTo(x + 76, h * 0.31);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (place === "harbor") {
    ctx.strokeStyle = "rgba(244,251,248,0.24)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i += 1) {
      const x = ((i * 137 + raceState.roadOffset * 0.05) % (w + 150)) - 75;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.24);
      ctx.lineTo(x + 22, h * 0.36);
      ctx.stroke();
    }
  }

  if (place === "snow") {
    ctx.fillStyle = "rgba(244,251,248,0.42)";
    for (let i = 0; i < 70; i += 1) {
      const x = (i * 59 + raceState.roadOffset * 0.06) % w;
      const y = h * 0.12 + ((i * 37 + raceState.elapsed * 28) % (h * 0.42));
      ctx.fillRect(x, y, 2, 2);
    }
  }

  if (place === "airfield") {
    ctx.strokeStyle = "rgba(255,209,102,0.22)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 13; i += 1) {
      const x = ((i * 91 + raceState.roadOffset * 0.08) % (w + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.36);
      ctx.lineTo(x + 34, h * 0.36);
      ctx.stroke();
    }
  }

  if (place === "tokyo") {
    ctx.strokeStyle = "rgba(255,79,216,0.22)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i += 1) {
      const x = ((i * 91 + raceState.roadOffset * 0.11) % (w + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.19);
      ctx.lineTo(x + 18, h * 0.43);
      ctx.stroke();
    }
  }

  if (place === "farm" || place === "freight") {
    ctx.strokeStyle = "rgba(255,209,102,0.16)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i += 1) {
      const y = h * 0.38 + i * 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + Math.sin(i) * 10);
      ctx.stroke();
    }
  }

  if (place === "rainforest") {
    ctx.fillStyle = "rgba(54,217,138,0.16)";
    for (let i = 0; i < 70; i += 1) {
      const x = ((i * 47 + raceState.roadOffset * 0.05) % (w + 80)) - 40;
      const y = h * 0.18 + (i % 18) * 16;
      ctx.beginPath();
      ctx.ellipse(x, y, 16 + (i % 5) * 3, 6, Math.sin(i), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMetroScenery(w, h, theme) {
  const lake = ctx.createLinearGradient(0, h * 0.33, 0, h * 0.56);
  lake.addColorStop(0, "rgba(38,84,96,0.38)");
  lake.addColorStop(1, "rgba(5,8,7,0.16)");
  ctx.fillStyle = lake;
  ctx.fillRect(0, h * 0.34, w, h * 0.18);
  ctx.strokeStyle = "rgba(244,251,248,0.12)";
  for (let i = 0; i < 7; i += 1) {
    const y = h * 0.39 + i * 18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.3, y - 8, w * 0.62, y + 10, w, y - 3);
    ctx.stroke();
  }
  for (let i = 0; i < 42; i += 1) {
    const x = ((i * 93 + raceState.roadOffset * 0.08) % (w + 180)) - 90;
    const bh = 92 + ((i * 47) % 230);
    const tower = ctx.createLinearGradient(x, h * 0.34 - bh, x + 70, h * 0.34);
    tower.addColorStop(0, i % 3 === 0 ? "rgba(70,217,255,0.26)" : "rgba(255,255,255,0.12)");
    tower.addColorStop(1, "rgba(5,8,7,0.4)");
    ctx.fillStyle = tower;
    ctx.fillRect(x, h * 0.34 - bh, 42 + (i % 5) * 11, bh);
    ctx.fillStyle = theme[i % 2 + 1];
    ctx.globalAlpha = 0.58;
    for (let y = 18; y < bh - 12; y += 22) ctx.fillRect(x + 9 + (y % 3) * 8, h * 0.34 - bh + y, 7, 8);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.07, h * 0.34);
  ctx.lineTo(w * 0.93, h * 0.34);
  ctx.stroke();
}

function drawCoastalScenery(w, h, theme) {
  const sun = ctx.createRadialGradient(w * 0.16, h * 0.16, 8, w * 0.16, h * 0.16, 130);
  sun.addColorStop(0, "rgba(255,209,102,0.58)");
  sun.addColorStop(1, "rgba(255,209,102,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h * 0.4);
  const water = ctx.createLinearGradient(0, h * 0.32, 0, h * 0.58);
  water.addColorStop(0, "rgba(70,217,255,0.2)");
  water.addColorStop(1, "rgba(5,8,7,0.1)");
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.32, w, h * 0.22);
  ctx.strokeStyle = "rgba(244,251,248,0.18)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const y = h * 0.37 + i * 18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.25, y + 14, w * 0.5, y - 12, w, y + 8);
    ctx.stroke();
  }
  ctx.strokeStyle = theme[1];
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.32);
  ctx.quadraticCurveTo(w * 0.5, h * 0.12, w * 0.92, h * 0.32);
  ctx.stroke();
  for (let i = 0; i < 9; i += 1) {
    const x = w * 0.12 + i * w * 0.095;
    ctx.strokeStyle = "rgba(244,251,248,0.3)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.18);
    ctx.lineTo(x, h * 0.34);
    ctx.stroke();
  }
}

function drawCanyonScenery(w, h, theme) {
  const layers = [
    { y: 0.35, color: "rgba(255,91,107,0.28)", scale: 1 },
    { y: 0.42, color: "rgba(255,209,102,0.22)", scale: 0.74 },
    { y: 0.49, color: "rgba(111,54,30,0.45)", scale: 0.55 }
  ];
  layers.forEach((layer, layerIndex) => {
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, h * layer.y);
    for (let i = 0; i <= 10; i += 1) {
      const x = i * w * 0.1;
      const y = h * layer.y - (((i * 37 + layerIndex * 19) % 90) + 20) * layer.scale;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h * 0.56);
    ctx.lineTo(0, h * 0.56);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = "rgba(255,209,102,0.32)";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.16, 42, 0, Math.PI * 2);
  ctx.fill();
}

function drawAlpineScenery(w, h, theme) {
  const fog = ctx.createLinearGradient(0, h * 0.16, 0, h * 0.56);
  fog.addColorStop(0, "rgba(185,216,224,0.16)");
  fog.addColorStop(1, "rgba(185,216,224,0)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, h * 0.14, w, h * 0.44);
  ctx.fillStyle = "rgba(244,251,248,0.16)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.38);
  ctx.lineTo(w * 0.18, h * 0.16);
  ctx.lineTo(w * 0.34, h * 0.38);
  ctx.lineTo(w * 0.54, h * 0.12);
  ctx.lineTo(w * 0.78, h * 0.38);
  ctx.lineTo(w, h * 0.2);
  ctx.lineTo(w, h * 0.52);
  ctx.lineTo(0, h * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(187,242,74,0.1)";
  for (let i = 0; i < 38; i += 1) {
    const x = ((i * 71 + raceState.roadOffset * 0.04) % (w + 80)) - 40;
    const y = h * 0.36 + (i % 5) * 20;
    ctx.beginPath();
    ctx.moveTo(x, y - 38);
    ctx.lineTo(x - 16, y);
    ctx.lineTo(x + 16, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHarborScenery(w, h, theme) {
  const water = ctx.createLinearGradient(0, h * 0.28, 0, h * 0.62);
  water.addColorStop(0, "rgba(70,217,255,0.28)");
  water.addColorStop(1, "rgba(4,24,32,0.48)");
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.3, w, h * 0.28);
  ctx.strokeStyle = "rgba(244,251,248,0.18)";
  for (let i = 0; i < 10; i += 1) {
    const y = h * 0.34 + i * 18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.28, y + 12, w * 0.56, y - 10, w, y + 6);
    ctx.stroke();
  }
  for (let i = 0; i < 16; i += 1) {
    const x = ((i * 113 + raceState.roadOffset * 0.05) % (w + 160)) - 80;
    const y = h * (0.3 + (i % 3) * 0.055);
    ctx.fillStyle = i % 2 ? "rgba(255,209,102,0.28)" : "rgba(70,217,255,0.24)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 36, y + 8);
    ctx.lineTo(x + 24, y + 18);
    ctx.lineTo(x - 18, y + 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "rgba(5,8,7,0.42)";
  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 97 + raceState.roadOffset * 0.03) % (w + 100)) - 50;
    ctx.fillRect(x, h * 0.22, 28 + (i % 4) * 18, h * 0.12);
  }
}

function drawSnowScenery(w, h, theme) {
  const skyGlow = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.54);
  skyGlow.addColorStop(0, "rgba(244,251,248,0.2)");
  skyGlow.addColorStop(1, "rgba(118,168,188,0)");
  ctx.fillStyle = skyGlow;
  ctx.fillRect(0, h * 0.1, w, h * 0.48);
  ctx.fillStyle = "rgba(244,251,248,0.28)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.42);
  ctx.lineTo(w * 0.14, h * 0.18);
  ctx.lineTo(w * 0.3, h * 0.42);
  ctx.lineTo(w * 0.48, h * 0.14);
  ctx.lineTo(w * 0.72, h * 0.42);
  ctx.lineTo(w, h * 0.2);
  ctx.lineTo(w, h * 0.54);
  ctx.lineTo(0, h * 0.54);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(10,35,33,0.48)";
  for (let i = 0; i < 44; i += 1) {
    const x = ((i * 67 + raceState.roadOffset * 0.05) % (w + 90)) - 45;
    const y = h * 0.36 + (i % 4) * 24;
    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x - 13, y);
    ctx.lineTo(x + 13, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawAirfieldScenery(w, h, theme) {
  const desert = ctx.createLinearGradient(0, h * 0.32, 0, h * 0.58);
  desert.addColorStop(0, "rgba(255,209,102,0.18)");
  desert.addColorStop(1, "rgba(77,55,35,0.34)");
  ctx.fillStyle = desert;
  ctx.fillRect(0, h * 0.32, w, h * 0.26);
  ctx.fillStyle = "rgba(5,8,7,0.5)";
  for (let i = 0; i < 9; i += 1) {
    const x = ((i * 151 + raceState.roadOffset * 0.04) % (w + 180)) - 90;
    const y = h * 0.31 + (i % 2) * 24;
    ctx.fillRect(x, y, 104, 42);
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 52, y - 28);
    ctx.lineTo(x + 94, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(244,251,248,0.32)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i += 1) {
    const x = ((i * 197 + raceState.roadOffset * 0.08) % (w + 220)) - 110;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.25);
    ctx.lineTo(x + 80, h * 0.29);
    ctx.lineTo(x + 36, h * 0.32);
    ctx.stroke();
  }
}

function drawFreightScenery(w, h, theme) {
  const plains = ctx.createLinearGradient(0, h * 0.34, 0, h * 0.58);
  plains.addColorStop(0, "rgba(255,209,102,0.22)");
  plains.addColorStop(1, "rgba(57,66,31,0.28)");
  ctx.fillStyle = plains;
  ctx.fillRect(0, h * 0.34, w, h * 0.24);
  ctx.strokeStyle = "rgba(244,251,248,0.18)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 10; i += 1) {
    const x = ((i * 146 + raceState.roadOffset * 0.08) % (w + 180)) - 90;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.3);
    ctx.lineTo(x + 32, h * 0.46);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 181 + raceState.roadOffset * 0.045) % (w + 220)) - 110;
    ctx.fillStyle = "rgba(5,8,7,0.48)";
    roundRect(x, h * 0.28, 120, 34, 4);
    ctx.fill();
    ctx.fillStyle = theme[1];
    ctx.globalAlpha = 0.45;
    ctx.fillRect(x + 14, h * 0.3, 28, 6);
    ctx.fillRect(x + 58, h * 0.3, 42, 6);
    ctx.globalAlpha = 1;
  }
}

function drawFarmScenery(w, h, theme) {
  const fields = ctx.createLinearGradient(0, h * 0.32, 0, h * 0.6);
  fields.addColorStop(0, "rgba(187,242,74,0.2)");
  fields.addColorStop(1, "rgba(56,88,31,0.42)");
  ctx.fillStyle = fields;
  ctx.fillRect(0, h * 0.32, w, h * 0.28);
  ctx.strokeStyle = "rgba(255,209,102,0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i += 1) {
    const y = h * 0.36 + i * 13;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.25, y + 8, w * 0.62, y - 7, w, y + 4);
    ctx.stroke();
  }
  for (let i = 0; i < 9; i += 1) {
    const x = ((i * 173 + raceState.roadOffset * 0.045) % (w + 200)) - 100;
    const y = h * 0.32 + (i % 3) * 26;
    ctx.fillStyle = i % 2 ? "rgba(160,40,31,0.5)" : "rgba(244,251,248,0.38)";
    ctx.fillRect(x, y, 58, 38);
    ctx.fillStyle = "rgba(117,86,47,0.72)";
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 29, y - 24);
    ctx.lineTo(x + 63, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawTokyoScenery(w, h, theme) {
  const glow = ctx.createLinearGradient(0, h * 0.08, 0, h * 0.56);
  glow.addColorStop(0, "rgba(255,79,216,0.12)");
  glow.addColorStop(0.56, "rgba(70,217,255,0.1)");
  glow.addColorStop(1, "rgba(5,8,7,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, h * 0.08, w, h * 0.5);
  for (let i = 0; i < 44; i += 1) {
    const x = ((i * 83 + raceState.roadOffset * 0.12) % (w + 180)) - 90;
    const bh = 100 + ((i * 41) % 260);
    ctx.fillStyle = i % 2 ? "rgba(7,12,24,0.74)" : "rgba(16,10,28,0.78)";
    ctx.fillRect(x, h * 0.36 - bh, 36 + (i % 4) * 16, bh);
    ctx.fillStyle = i % 3 ? theme[1] : theme[2];
    ctx.globalAlpha = 0.6;
    for (let y = 18; y < bh - 12; y += 24) ctx.fillRect(x + 8, h * 0.36 - bh + y, 10 + (i % 3) * 7, 7);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = "rgba(244,251,248,0.22)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.37);
  ctx.quadraticCurveTo(w * 0.5, h * 0.28, w, h * 0.37);
  ctx.stroke();
}

function drawWorldDesertScenery(w, h, theme) {
  const sand = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.6);
  sand.addColorStop(0, "rgba(255,183,74,0.24)");
  sand.addColorStop(1, "rgba(92,55,27,0.42)");
  ctx.fillStyle = sand;
  ctx.fillRect(0, h * 0.3, w, h * 0.3);
  for (let layer = 0; layer < 3; layer += 1) {
    ctx.fillStyle = `rgba(255,183,74,${0.12 + layer * 0.08})`;
    ctx.beginPath();
    ctx.moveTo(0, h * (0.42 + layer * 0.04));
    for (let i = 0; i <= 8; i += 1) {
      const x = i * w * 0.125;
      const y = h * (0.42 + layer * 0.04) - Math.sin(i * 0.8 + layer + raceState.roadOffset * 0.001) * 34;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h * 0.62);
    ctx.lineTo(0, h * 0.62);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "rgba(244,251,248,0.18)";
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.16, 48, 0, Math.PI * 2);
  ctx.fill();
}

function drawRainforestScenery(w, h, theme) {
  const canopy = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.6);
  canopy.addColorStop(0, "rgba(54,217,138,0.16)");
  canopy.addColorStop(1, "rgba(10,54,35,0.5)");
  ctx.fillStyle = canopy;
  ctx.fillRect(0, h * 0.24, w, h * 0.36);
  ctx.strokeStyle = "rgba(54,217,138,0.22)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 36; i += 1) {
    const x = ((i * 71 + raceState.roadOffset * 0.04) % (w + 100)) - 50;
    const y = h * 0.34 + (i % 5) * 24;
    ctx.beginPath();
    ctx.moveTo(x, y + 50);
    ctx.lineTo(x + Math.sin(i) * 16, y - 45);
    ctx.stroke();
    ctx.fillStyle = i % 2 ? "rgba(54,217,138,0.32)" : "rgba(187,242,74,0.18)";
    ctx.beginPath();
    ctx.ellipse(x - 12, y - 34, 30, 10, -0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 16, y - 28, 28, 9, 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(244,251,248,0.14)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 53 + raceState.elapsed * 40) % w;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.16);
    ctx.lineTo(x - 18, h * 0.58);
    ctx.stroke();
  }
}

function drawEuropeanScenery(w, h, theme) {
  const valley = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.58);
  valley.addColorStop(0, "rgba(220,232,239,0.18)");
  valley.addColorStop(1, "rgba(24,58,52,0.32)");
  ctx.fillStyle = valley;
  ctx.fillRect(0, h * 0.3, w, h * 0.28);
  ctx.fillStyle = "rgba(220,232,239,0.36)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.4);
  ctx.lineTo(w * 0.12, h * 0.13);
  ctx.lineTo(w * 0.28, h * 0.4);
  ctx.lineTo(w * 0.48, h * 0.1);
  ctx.lineTo(w * 0.72, h * 0.4);
  ctx.lineTo(w * 0.9, h * 0.18);
  ctx.lineTo(w, h * 0.4);
  ctx.lineTo(w, h * 0.56);
  ctx.lineTo(0, h * 0.56);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 137 + raceState.roadOffset * 0.035) % (w + 160)) - 80;
    const y = h * 0.33 + (i % 3) * 28;
    ctx.fillStyle = "rgba(244,251,248,0.44)";
    ctx.fillRect(x, y, 44, 30);
    ctx.fillStyle = "rgba(160,40,31,0.58)";
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 22, y - 18);
    ctx.lineTo(x + 48, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawRoadSigns(w, h, theme) {
  const signText = selectedRace && selectedRace.sign ? selectedRace.sign : "Race Route";
  const x = w * 0.75;
  const y = h * 0.25 + Math.sin(raceState.roadOffset * 0.004) * 8;
  ctx.strokeStyle = "rgba(244,251,248,0.28)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y + 28);
  ctx.lineTo(x, y + 94);
  ctx.stroke();
  ctx.fillStyle = "rgba(5,8,7,0.76)";
  roundRect(x - 82, y - 18, 164, 46, 6);
  ctx.fill();
  ctx.strokeStyle = theme[1];
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#f4fbf8";
  ctx.font = "900 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(signText, x, y + 10);
}

function drawRoad(w, h, theme) {
  const place = selectedRace && selectedRace.place ? selectedRace.place : "city";
  const horizon = cameraMode === "cockpit" ? h * 0.28 : cameraMode === "hood" ? h * 0.31 : h * 0.34;
  const roadTop = cameraMode === "cockpit" ? w * 0.12 : cameraMode === "hood" ? w * 0.15 : w * 0.14;
  const roadBottom = cameraMode === "cockpit" ? w * 1.05 : cameraMode === "hood" ? w * 0.95 : w * 1.02;
  const glare = ctx.createRadialGradient(w * 0.5, h * 0.62, w * 0.08, w * 0.5, h * 0.74, w * 0.75);
  glare.addColorStop(0, "rgba(244,251,248,0.08)");
  glare.addColorStop(1, "rgba(244,251,248,0)");
  ctx.fillStyle = glare;
  ctx.fillRect(0, horizon, w, h - horizon);
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadTop, horizon);
  ctx.lineTo(w / 2 + roadTop, horizon);
  ctx.lineTo(w / 2 + roadBottom, h);
  ctx.lineTo(w / 2 - roadBottom, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#222826";
  const asphalt = ctx.createLinearGradient(0, horizon, 0, h);
  if (place === "snow") {
    asphalt.addColorStop(0, "#596967");
    asphalt.addColorStop(0.45, "#394845");
    asphalt.addColorStop(1, "#1a2422");
  } else if (place === "harbor") {
    asphalt.addColorStop(0, "#28434a");
    asphalt.addColorStop(0.45, "#182d33");
    asphalt.addColorStop(1, "#0b1619");
  } else if (place === "airfield") {
    asphalt.addColorStop(0, "#3d3f3b");
    asphalt.addColorStop(0.45, "#282a27");
    asphalt.addColorStop(1, "#151613");
  } else if (place === "freight") {
    asphalt.addColorStop(0, "#393c34");
    asphalt.addColorStop(0.45, "#252820");
    asphalt.addColorStop(1, "#131610");
  } else if (place === "farm") {
    asphalt.addColorStop(0, "#5d5542");
    asphalt.addColorStop(0.45, "#3d3526");
    asphalt.addColorStop(1, "#211b13");
  } else if (place === "tokyo") {
    asphalt.addColorStop(0, "#252335");
    asphalt.addColorStop(0.45, "#171722");
    asphalt.addColorStop(1, "#0b0a12");
  } else if (place === "desert") {
    asphalt.addColorStop(0, "#6b5234");
    asphalt.addColorStop(0.45, "#473622");
    asphalt.addColorStop(1, "#21170e");
  } else if (place === "rainforest") {
    asphalt.addColorStop(0, "#314037");
    asphalt.addColorStop(0.45, "#1e2b24");
    asphalt.addColorStop(1, "#101812");
  } else if (place === "europe") {
    asphalt.addColorStop(0, "#3d4648");
    asphalt.addColorStop(0.45, "#283234");
    asphalt.addColorStop(1, "#141c1d");
  } else {
    asphalt.addColorStop(0, "#2e3330");
    asphalt.addColorStop(0.45, "#1f2422");
    asphalt.addColorStop(1, "#111615");
  }
  ctx.fillStyle = asphalt;
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadTop * 0.86, horizon);
  ctx.lineTo(w / 2 + roadTop * 0.86, horizon);
  ctx.lineTo(w / 2 + roadBottom * 0.7, h);
  ctx.lineTo(w / 2 - roadBottom * 0.7, h);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.17;
  for (let i = 0; i < 130; i += 1) {
    const y = ((i * 23 + raceState.roadOffset * 0.9) % (h + 40)) - 20;
    if (y < horizon) continue;
    const t = (y - horizon) / (h - horizon);
    const x = w * 0.5 + (Math.sin(i * 13.7) * roadBottom * 0.55 * t);
    ctx.fillStyle = i % 3 ? "#f4fbf8" : theme[1];
    ctx.fillRect(x, y, 1 + t * 3, 1 + t * 5);
  }
  ctx.restore();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#f4fbf8";
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i += 1) {
    const y = ((i * 42 + raceState.roadOffset * 0.6) % (h + 80)) - 40;
    const t = Math.max(0, (y - horizon) / (h - horizon));
    ctx.beginPath();
    ctx.moveTo(w / 2 - roadBottom * 0.65 * t, y);
    ctx.lineTo(w / 2 + roadBottom * 0.65 * t, y + 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let lane = -1.5; lane <= 1.5; lane += 1) {
    for (let i = 0; i < 14; i += 1) {
      const y = ((i * 116 + raceState.roadOffset * 1.42) % (h + 190)) - 95;
      if (y < horizon) continue;
      const t = Math.max(0, (y - horizon) / (h - horizon));
      const x = w / 2 + lane * laneWidth() * (0.3 + t * 1.05);
      const dashW = 2 + t * 7;
      const dashH = 20 + t * 72;
      const dash = ctx.createLinearGradient(x, y, x, y + dashH);
      dash.addColorStop(0, "rgba(244,251,248,0.08)");
      dash.addColorStop(0.35, "rgba(244,251,248,0.64)");
      dash.addColorStop(1, "rgba(244,251,248,0.12)");
      ctx.fillStyle = dash;
      roundRect(x - dashW / 2, y, dashW, dashH, dashW / 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = "rgba(244,251,248,0.72)";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.42;
  for (let lane = -2.5; lane <= 2.5; lane += 1) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + lane * laneWidth() * 0.28, horizon);
    ctx.lineTo(w / 2 + lane * laneWidth() * 1.28, h);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(244,251,248,0.58)";
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadTop * 0.9, horizon);
  ctx.lineTo(w / 2 - roadBottom * 0.7, h);
  ctx.moveTo(w / 2 + roadTop * 0.9, horizon);
  ctx.lineTo(w / 2 + roadBottom * 0.7, h);
  ctx.stroke();
  ctx.globalAlpha = 1;
  drawRoadsideDetails(w, h, theme, horizon, roadBottom);
  drawGuardrails(w, h, theme, horizon, roadTop, roadBottom);
  drawHeadlightBeams(w, h, theme, horizon);
}

function drawGuardrails(w, h, theme, horizon, roadTop, roadBottom) {
  ctx.save();
  for (let side = -1; side <= 1; side += 2) {
    ctx.strokeStyle = "rgba(205,218,214,0.38)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w / 2 + side * roadTop * 1.08, horizon + 12);
    ctx.lineTo(w / 2 + side * roadBottom * 0.82, h);
    ctx.stroke();
    ctx.strokeStyle = "rgba(5,8,7,0.78)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 + side * roadTop * 1.04, horizon + 26);
    ctx.lineTo(w / 2 + side * roadBottom * 0.78, h);
    ctx.stroke();
    for (let i = 0; i < 18; i += 1) {
      const y = ((i * 74 + raceState.roadOffset * 1.2) % (h + 120)) - 60;
      if (y < horizon) continue;
      const t = (y - horizon) / (h - horizon);
      const x = w / 2 + side * (roadTop * 1.08 + (roadBottom * 0.82 - roadTop * 1.08) * t);
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.42)" : theme[1];
      roundRect(x - side * 4, y, side * 10, 22 + t * 34, 3);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawRoadsideDetails(w, h, theme, horizon, roadBottom) {
  const place = selectedRace && selectedRace.place ? selectedRace.place : "city";
  for (let i = 0; i < 22; i += 1) {
    const y = ((i * 92 + raceState.roadOffset * 1.08) % (h + 160)) - 80;
    if (y < horizon) continue;
    const t = (y - horizon) / (h - horizon);
    const side = i % 2 === 0 ? -1 : 1;
    const x = w / 2 + side * roadBottom * (0.28 + t * 0.64);
    const size = 10 + t * 28;
    if (place === "canyon") {
      const rock = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
      rock.addColorStop(0, "rgba(255,150,83,0.46)");
      rock.addColorStop(1, "rgba(82,42,27,0.56)");
      ctx.fillStyle = rock;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size * 0.7, y + size);
      ctx.lineTo(x + size * 0.8, y + size * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (place === "alpine") {
      ctx.fillStyle = "rgba(23,45,35,0.72)";
      ctx.beginPath();
      ctx.moveTo(x, y - size * 1.2);
      ctx.lineTo(x - size * 0.7, y + size);
      ctx.lineTo(x + size * 0.7, y + size);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(244,251,248,0.2)";
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.9);
      ctx.lineTo(x, y + size * 0.8);
      ctx.stroke();
    } else if (place === "harbor") {
      ctx.fillStyle = "rgba(117,86,47,0.72)";
      ctx.fillRect(x - size * 0.2, y - size * 0.35, size * 0.4, size * 1.6);
      ctx.strokeStyle = "rgba(244,251,248,0.2)";
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.beginPath();
      ctx.moveTo(x - size * 0.7, y + size * 0.12);
      ctx.lineTo(x + size * 0.7, y + size * 0.12);
      ctx.stroke();
    } else if (place === "snow") {
      ctx.fillStyle = "rgba(244,251,248,0.76)";
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.72, size * 0.8, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(10,35,33,0.72)";
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size * 0.62, y + size * 0.6);
      ctx.lineTo(x + size * 0.62, y + size * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (place === "airfield") {
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,209,102,0.9)" : "rgba(244,251,248,0.5)";
      ctx.beginPath();
      ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(244,251,248,0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + size * 1.4);
      ctx.stroke();
    } else if (place === "freight") {
      ctx.fillStyle = "rgba(244,251,248,0.24)";
      roundRect(x - size * 0.7, y - size * 0.45, size * 1.4, size * 0.54, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(5,8,7,0.76)";
      ctx.fillRect(x - size * 0.52, y - size * 0.3, size * 0.32, size * 0.12);
      ctx.fillRect(x + size * 0.16, y - size * 0.3, size * 0.28, size * 0.12);
    } else if (place === "farm") {
      ctx.fillStyle = i % 3 === 0 ? "rgba(187,242,74,0.58)" : "rgba(255,209,102,0.46)";
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.85);
      ctx.lineTo(x - size * 0.36, y + size * 0.2);
      ctx.lineTo(x + size * 0.36, y + size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(117,86,47,0.62)";
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.beginPath();
      ctx.moveTo(x, y + size * 0.2);
      ctx.lineTo(x, y + size);
      ctx.stroke();
    } else if (place === "tokyo") {
      ctx.fillStyle = i % 2 ? "rgba(255,79,216,0.66)" : "rgba(70,217,255,0.58)";
      roundRect(x - size * 0.26, y - size * 1.2, size * 0.52, size * 1.5, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(5,8,7,0.82)";
      ctx.fillRect(x - size * 0.13, y - size * 1.05, size * 0.26, size * 0.96);
    } else if (place === "desert") {
      ctx.fillStyle = "rgba(255,183,74,0.52)";
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.15);
      ctx.lineTo(x - size, y + size * 0.68);
      ctx.lineTo(x + size, y + size * 0.68);
      ctx.closePath();
      ctx.fill();
    } else if (place === "rainforest") {
      ctx.strokeStyle = "rgba(38,78,46,0.82)";
      ctx.lineWidth = Math.max(3, size * 0.12);
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.4);
      ctx.lineTo(x, y + size * 1.3);
      ctx.stroke();
      ctx.fillStyle = "rgba(54,217,138,0.58)";
      ctx.beginPath();
      ctx.ellipse(x - size * 0.32, y - size * 0.46, size * 0.74, size * 0.24, -0.5, 0, Math.PI * 2);
      ctx.ellipse(x + size * 0.32, y - size * 0.36, size * 0.7, size * 0.22, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (place === "europe") {
      ctx.fillStyle = "rgba(244,251,248,0.68)";
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size * 0.7, y + size * 0.7);
      ctx.lineTo(x + size * 0.7, y + size * 0.7);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(244,251,248,0.28)";
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size * 1.5);
      ctx.stroke();
      ctx.fillStyle = theme[1];
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(x, y - size, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (place === "city" && i % 5 === 0) {
        const signW = size * 2.1;
        const signX = side < 0 ? x - signW : x;
        ctx.fillStyle = "rgba(5,8,7,0.82)";
        roundRect(signX, y - size * 1.2, signW, size * 0.78, 4);
        ctx.fill();
        ctx.strokeStyle = theme[1];
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#f4fbf8";
        ctx.font = `900 ${Math.max(8, size * 0.22)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("DOWNTOWN", signX + signW / 2, y - size * 0.73);
      }
    }
  }
}

function drawHeadlightBeams(w, h, theme, horizon) {
  const boostInput = input.boost || input.gamepadBoost;
  const alpha = cameraMode === "cockpit" ? 0.18 : 0.11;
  const beam = ctx.createLinearGradient(0, horizon, 0, h);
  beam.addColorStop(0, "rgba(255,255,255,0)");
  beam.addColorStop(0.62, `rgba(255,248,214,${alpha})`);
  beam.addColorStop(1, `rgba(70,217,255,${boostInput ? 0.22 : 0.08})`);
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(w * 0.43, h * 0.7);
  ctx.lineTo(w * 0.17, h);
  ctx.lineTo(w * 0.83, h);
  ctx.lineTo(w * 0.57, h * 0.7);
  ctx.closePath();
  ctx.fill();
  if (!boostInput) return;
  ctx.strokeStyle = theme[1];
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 8; i += 1) {
    const x = w * (0.18 + i * 0.09);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.52);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function objectPos(lane, y) {
  const h = canvas.height;
  const t = Math.max(0, y / h);
  const curveShift = (raceState.roadCurve || 0) * (1 - Math.min(1, t)) * canvas.width * 0.18;
  return {
    x: canvas.width / 2 + curveShift + lane * laneWidth() * (0.42 + t * 0.72),
    y,
    scale: 0.52 + t * 0.55
  };
}

function drawObjects() {
  raceState.opponents.forEach((opponent) => {
    const delta = opponent.distance - raceState.distance;
    const y = canvas.height * 0.68 - delta * 0.11;
    if (y < canvas.height * 0.28 || y > canvas.height * 1.02) return;
    const p = objectPos(opponent.lane, y);
    const vehicle = vehicleById(opponent.vehicleId);
    drawTrafficRearCar(p.x, p.y, 70 * p.scale, 112 * p.scale, opponent.color, false, vehicle.type, opponent.name, opponent.damage || 0, opponent.wrecked, opponent.spin || 0);
  });
  raceState.coinsOnRoad.forEach((coin) => {
    const p = objectPos(coin.lane, coin.y);
    drawRouteMarker(p.x, p.y, (coin.r * 2.8) * p.scale, coin.pulse);
  });
  raceState.rivals.forEach((rival) => {
    const p = objectPos(rival.lane, rival.y);
    drawTrafficRearCar(p.x, p.y, rival.w * p.scale * 1.1, rival.h * p.scale * 0.82, rival.color, false, rival.type || "car", "", rival.damage || 0, rival.wrecked, rival.spin || 0);
  });
  raceState.police.forEach((unit) => {
    const p = objectPos(unit.lane, unit.y);
    drawTrafficRearCar(p.x, p.y, unit.w * p.scale * 1.16, unit.h * p.scale * 0.84, "#f4fbf8", true, "car", "", unit.damage || 0, unit.wrecked, unit.spin || 0);
  });
}

function drawRouteMarker(x, y, size, pulse) {
  ctx.save();
  ctx.translate(x, y);
  const glow = 0.18 + Math.sin(pulse) * 0.05;
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = `rgba(255,209,102,${glow})`;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.25, size * 1.1, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,209,102,0.86)";
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.beginPath();
  ctx.moveTo(-size * 0.45, -size * 0.18);
  ctx.lineTo(0, size * 0.18);
  ctx.lineTo(size * 0.45, -size * 0.18);
  ctx.stroke();
  ctx.strokeStyle = "rgba(244,251,248,0.38)";
  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, -size * 0.02);
  ctx.lineTo(0, size * 0.2);
  ctx.lineTo(size * 0.28, -size * 0.02);
  ctx.stroke();
  ctx.restore();
}

function drawRaceStandings(w, h) {
  const pos = playerPosition();
  const vehicle = selectedVehicle();
  ctx.save();
  const panelW = Math.min(178, w * 0.34);
  const panelH = 54;
  const x = w - panelW - 14;
  const y = cameraMode === "chase" ? h * 0.13 : 14;
  ctx.fillStyle = "rgba(5,8,7,0.68)";
  roundRect(x, y, panelW, panelH, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(244,251,248,0.16)";
  ctx.stroke();
  ctx.fillStyle = pos === 1 ? "#ffd166" : "#f4fbf8";
  ctx.font = "900 18px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`P${pos}/6`, x + 12, y + 23);
  ctx.fillStyle = "rgba(244,251,248,0.72)";
  ctx.font = "800 11px system-ui";
  const leader = raceRankings()[0];
  ctx.fillText(`${leader.name} leads`, x + 12, y + 39);
  ctx.fillStyle = vehicle.color;
  roundRect(x + panelW - 48, y + 15, 32, 18, 5);
  ctx.fill();
  ctx.restore();
}

function drawTrafficLabel(w, h, label) {
  if (!label) return;
  ctx.fillStyle = "rgba(5,8,7,0.72)";
  roundRect(-w * 0.36, -h * 0.76, w * 0.72, h * 0.16, 4);
  ctx.fill();
  ctx.fillStyle = "#f4fbf8";
  ctx.font = `${Math.max(7, w * 0.12)}px system-ui`;
  ctx.textAlign = "center";
  ctx.fillText(label, 0, -h * 0.64);
}

function drawVehicleGroundContact(w, h, vehicleType = "car", speedFactor = 0.5) {
  const speed = Math.max(0.18, Math.min(1.15, Math.abs(speedFactor)));
  const air = ["airplane", "helicopter"].includes(vehicleType);
  const water = vehicleType === "boat";
  const snow = vehicleType === "snowmobile";
  ctx.save();
  const contactY = h * (air ? 0.58 : water ? 0.76 : 0.92);
  const contact = ctx.createRadialGradient(0, contactY - h * 0.05, w * 0.08, 0, contactY, w * 0.82);
  contact.addColorStop(0, air ? "rgba(0,0,0,0.34)" : "rgba(0,0,0,0.82)");
  contact.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = contact;
  ctx.beginPath();
  ctx.ellipse(0, contactY, w * 0.78, h * (air ? 0.1 : 0.2), 0, 0, Math.PI * 2);
  ctx.fill();

  if (!air && !water) {
    ctx.fillStyle = snow ? "rgba(244,251,248,0.54)" : "rgba(0,0,0,0.96)";
    ctx.beginPath();
    ctx.ellipse(-w * 0.34, h * 0.58, w * 0.14, h * 0.052, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.34, h * 0.58, w * 0.14, h * 0.052, 0, 0, Math.PI * 2);
    ctx.ellipse(-w * 0.35, h * 0.91, w * 0.19, h * 0.082, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.35, h * 0.91, w * 0.19, h * 0.082, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = (air ? 0.14 : 0.34) + speed * 0.18;
  ctx.strokeStyle = water ? "rgba(70,217,255,0.62)" : snow ? "rgba(244,251,248,0.7)" : "rgba(3,5,5,0.82)";
  ctx.lineWidth = Math.max(1.2, w * 0.018);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-w * 0.32, contactY - h * 0.05);
  ctx.lineTo(-w * (0.4 + speed * 0.24), contactY + h * 0.24);
  ctx.moveTo(w * 0.32, contactY - h * 0.05);
  ctx.lineTo(w * (0.4 + speed * 0.24), contactY + h * 0.24);
  ctx.stroke();
  ctx.restore();
}

function drawVehicleRoadLock(w, h, vehicleType = "car", speedFactor = 0.5) {
  const air = ["airplane", "helicopter"].includes(vehicleType);
  const water = vehicleType === "boat";
  const snow = vehicleType === "snowmobile";
  const speed = Math.max(0.18, Math.min(1.15, Math.abs(speedFactor)));
  ctx.save();
  ctx.globalAlpha = air ? 0.3 : 0.94;
  ctx.fillStyle = water ? "rgba(70,217,255,0.56)" : snow ? "rgba(244,251,248,0.7)" : "rgba(0,0,0,0.98)";
  if (air || water) {
    ctx.beginPath();
    ctx.ellipse(0, h * 0.78, w * 0.42, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    roundRect(-w * 0.52, h * 0.55, w * 0.18, h * 0.5, Math.max(4, w * 0.04));
    roundRect(w * 0.34, h * 0.55, w * 0.18, h * 0.5, Math.max(4, w * 0.04));
    ctx.fill();
    ctx.fillStyle = snow ? "rgba(244,251,248,0.78)" : "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.ellipse(-w * 0.38, h * 0.74, w * 0.12, h * 0.046, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.38, h * 0.74, w * 0.12, h * 0.046, 0, 0, Math.PI * 2);
    ctx.ellipse(-w * 0.36, h * 0.98, w * 0.18, h * 0.072, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.36, h * 0.98, w * 0.18, h * 0.072, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = air ? 0.18 : 0.54;
  ctx.strokeStyle = water ? "rgba(70,217,255,0.65)" : snow ? "rgba(244,251,248,0.72)" : "rgba(1,2,2,0.72)";
  ctx.lineWidth = Math.max(1.4, w * 0.02);
  ctx.lineCap = "round";
  ctx.beginPath();
  const trailY = air || water ? h * 0.78 : h * 1.0;
  ctx.moveTo(-w * 0.28, trailY);
  ctx.lineTo(-w * (0.32 + speed * 0.2), trailY + h * 0.2);
  ctx.moveTo(w * 0.28, trailY);
  ctx.lineTo(w * (0.32 + speed * 0.2), trailY + h * 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawPhoneAssetVehicleSprite(w, h, color, vehicleType = "car", police = false, damage = 0) {
  const assets = window.VelocityPhoneAssets;
  if (!assets || !assets.ready || typeof assets.getVehicleSprite !== "function") return false;
  const type = police ? "car" : vehicleType;
  const sprite = assets.getVehicleSprite(type, color, { police, damage });
  if (!sprite) return false;
  const wide = ["semi", "truck", "monster", "tank", "tractor"].includes(type);
  const air = ["boat", "snowmobile", "airplane", "helicopter"].includes(type);
  const spriteW = w * (type === "semi" ? 1.72 : wide ? 1.58 : 1.5);
  const spriteH = h * (type === "semi" ? 1.66 : air ? 1.48 : 1.56);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  drawVehicleGroundContact(w, h, type, Math.abs(raceState.speed || 0) / 220);
  ctx.drawImage(sprite, -spriteW / 2, -spriteH * 0.3, spriteW, spriteH);
  drawVehicleRoadLock(w, h, type, Math.abs(raceState.speed || 0) / 220);
  ctx.restore();
  return true;
}

function drawPhoneAssetTexturePass(w, h, theme) {
  const assets = window.VelocityPhoneAssets;
  if (!assets || !assets.ready || typeof assets.getRoadTexture !== "function") return;
  const texture = assets.getRoadTexture(selectedRace ? selectedRace.place : "city", theme);
  const pattern = ctx.createPattern(texture, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = assets.isPhoneViewport && assets.isPhoneViewport() ? 0.24 : 0.13;
  const tile = texture.width || 256;
  ctx.translate(-((raceState.roadOffset * 0.28) % tile), -((raceState.roadOffset * 0.08) % tile));
  ctx.fillStyle = pattern;
  ctx.fillRect(-256, h * 0.3, w + 512, h * 0.78 + 256);
  ctx.restore();

  ctx.save();
  const bloom = ctx.createRadialGradient(w * 0.5, h * 0.72, w * 0.05, w * 0.5, h * 0.78, w * 0.58);
  bloom.addColorStop(0, `${theme[1]}18`);
  bloom.addColorStop(0.52, "rgba(244,251,248,0.035)");
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, h * 0.34, w, h * 0.66);
  ctx.restore();
}

function drawRoadWeightPass(w, h, theme) {
  const horizon = cameraMode === "cockpit" ? h * 0.28 : cameraMode === "hood" ? h * 0.31 : h * 0.34;
  const roadTop = cameraMode === "cockpit" ? w * 0.12 : cameraMode === "hood" ? w * 0.15 : w * 0.14;
  const roadBottom = cameraMode === "cockpit" ? w * 1.05 : cameraMode === "hood" ? w * 0.95 : w * 1.02;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadTop * 0.88, horizon);
  ctx.lineTo(w / 2 + roadTop * 0.88, horizon);
  ctx.lineTo(w / 2 + roadBottom * 0.7, h);
  ctx.lineTo(w / 2 - roadBottom * 0.7, h);
  ctx.closePath();
  ctx.clip();

  const asphaltWeight = ctx.createLinearGradient(0, horizon, 0, h);
  asphaltWeight.addColorStop(0, "rgba(0,0,0,0)");
  asphaltWeight.addColorStop(0.55, "rgba(0,0,0,0.2)");
  asphaltWeight.addColorStop(1, "rgba(0,0,0,0.64)");
  ctx.fillStyle = asphaltWeight;
  ctx.fillRect(0, horizon, w, h - horizon);

  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = "rgba(0,0,0,0.86)";
  ctx.lineWidth = Math.max(2, w * 0.004);
  for (let lane = -1.5; lane <= 1.5; lane += 1) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + lane * laneWidth() * 0.23, horizon + h * 0.06);
    ctx.lineTo(w * 0.5 + lane * laneWidth() * 1.26, h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhoneUltraGraphicsPass(w, h, theme) {
  if (!phoneGraphicsActive()) return;
  const place = selectedRace && selectedRace.place ? selectedRace.place : "city";
  const horizon = cameraMode === "cockpit" ? h * 0.28 : cameraMode === "hood" ? h * 0.31 : h * 0.34;
  const roadTop = cameraMode === "cockpit" ? w * 0.12 : cameraMode === "hood" ? w * 0.15 : w * 0.14;
  const roadBottom = cameraMode === "cockpit" ? w * 1.05 : cameraMode === "hood" ? w * 0.95 : w * 1.02;
  const speed = Math.max(0, raceState.speed || 0);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadTop * 0.88, horizon);
  ctx.lineTo(w / 2 + roadTop * 0.88, horizon);
  ctx.lineTo(w / 2 + roadBottom * 0.7, h);
  ctx.lineTo(w / 2 - roadBottom * 0.7, h);
  ctx.closePath();
  ctx.clip();

  const rubber = ctx.createLinearGradient(0, horizon, 0, h);
  rubber.addColorStop(0, "rgba(0,0,0,0)");
  rubber.addColorStop(0.42, "rgba(0,0,0,0.18)");
  rubber.addColorStop(1, "rgba(0,0,0,0.46)");
  ctx.fillStyle = rubber;
  ctx.fillRect(0, horizon, w, h - horizon);

  ctx.globalAlpha = 0.38;
  ctx.strokeStyle = "rgba(1,2,2,0.78)";
  ctx.lineWidth = Math.max(2, w * 0.004);
  for (let lane = -1; lane <= 1; lane += 2) {
    const tireBase = laneWidth() * (0.18 + lane * 0.03);
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + lane * roadTop * 0.22, horizon + h * 0.04);
    ctx.bezierCurveTo(
      w * 0.5 + lane * tireBase,
      h * 0.55,
      w * 0.5 + lane * tireBase * 1.85 - (raceState.steerAngle || 0) * 18,
      h * 0.78,
      w * 0.5 + lane * tireBase * 2.4 - (raceState.lateralVelocity || 0) * 22,
      h
    );
    ctx.stroke();
  }

  ctx.globalAlpha = place === "tokyo" || place === "city" || place === "harbor" || place === "rainforest" ? 0.36 : 0.18;
  for (let i = 0; i < 18; i += 1) {
    const y = ((i * 67 + raceState.roadOffset * 1.1) % (h + 130)) - 40;
    if (y < horizon) continue;
    const t = Math.max(0, (y - horizon) / (h - horizon));
    const spread = w * (0.1 + t * 0.44);
    const x = w * 0.5 + Math.sin(i * 2.11) * w * 0.08 * t;
    const reflection = ctx.createLinearGradient(x - spread, y, x + spread, y);
    reflection.addColorStop(0, "rgba(255,255,255,0)");
    reflection.addColorStop(0.46, `${theme[1]}66`);
    reflection.addColorStop(0.52, "rgba(255,255,255,0.22)");
    reflection.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = reflection;
    ctx.lineWidth = 1 + t * 7;
    ctx.beginPath();
    ctx.moveTo(x - spread, y);
    ctx.quadraticCurveTo(x, y + 5 + t * 18, x + spread, y + 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = place === "snow" ? "rgba(244,251,248,0.72)" : "rgba(2,4,4,0.86)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 42; i += 1) {
    const y = ((i * 53 + raceState.roadOffset * 1.48) % (h + 120)) - 40;
    if (y < horizon) continue;
    const t = Math.max(0, (y - horizon) / (h - horizon));
    const x = w * 0.5 + Math.sin(i * 8.7) * roadBottom * 0.48 * t;
    const crack = 10 + t * 42;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(i) * crack, y + 4 + t * 18);
    ctx.lineTo(x + Math.cos(i * 1.7) * crack * 0.7, y + 10 + t * 24);
    ctx.stroke();
  }

  ctx.restore();

  ctx.save();
  const foreground = ctx.createLinearGradient(0, h * 0.64, 0, h);
  foreground.addColorStop(0, "rgba(0,0,0,0)");
  foreground.addColorStop(0.52, speed > 70 ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.14)");
  foreground.addColorStop(1, "rgba(0,0,0,0.48)");
  ctx.fillStyle = foreground;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);

  if (speed > 45) {
    ctx.globalAlpha = Math.min(0.34, speed / 620);
    ctx.strokeStyle = "rgba(244,251,248,0.42)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 18; i += 1) {
      const side = i % 2 ? -1 : 1;
      const x = side < 0 ? (i * 59 + raceState.roadOffset * 0.8) % (w * 0.28) : w - ((i * 59 + raceState.roadOffset * 0.8) % (w * 0.28));
      const y = h * (0.46 + (i % 9) * 0.06);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + side * w * 0.12, y + h * 0.18);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPhoneFilmicPost(w, h, theme) {
  if (!phoneGraphicsActive()) return;
  const place = selectedRace && selectedRace.place ? selectedRace.place : "city";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const bloom = ctx.createRadialGradient(w * 0.5, h * 0.54, w * 0.05, w * 0.5, h * 0.58, w * 0.7);
  bloom.addColorStop(0, "rgba(255,255,255,0.06)");
  bloom.addColorStop(0.42, `${theme[1]}16`);
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = place === "desert" || place === "canyon" ? "rgba(255,183,74,0.22)"
    : place === "snow" || place === "europe" ? "rgba(220,232,239,0.22)"
      : "rgba(70,217,255,0.16)";
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 71 + Math.floor(raceState.elapsed * 13) * 17) % w;
    const y = (i * 43 + Math.floor(raceState.elapsed * 11) * 23) % h;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function drawTrafficRearCar(x, y, width, height, color, police = false, vehicleType = "car", label = "", damage = 0, wrecked = false, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (wrecked || damage > 45) ctx.rotate(Math.max(-0.22, Math.min(0.22, (spin || 0) * 0.18)));
  const t = Math.max(0.3, Math.min(1.25, y / canvas.height));
  const w = width * (0.76 + t * 0.28);
  const h = height * (0.72 + t * 0.12);

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(0, h * 0.42, w * 0.62, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  if (drawPhoneAssetVehicleSprite(w, h, color, vehicleType, police, damage)) {
    drawTrafficLabel(w, h, label);
    drawTrafficDamageBadge(w, h, damage, wrecked);
    ctx.restore();
    return;
  }

  if (!police && vehicleType !== "car") {
    drawSpecialVehicleSilhouette(w, h, color, vehicleType, false);
    drawVehicleDamageMarks(w, h, damage);
    drawTrafficDamageBadge(w, h, damage, wrecked);
    drawTrafficLabel(w, h, label);
    ctx.restore();
    return;
  }

  ctx.fillStyle = "#050807";
  roundRect(-w * 0.56, -h * 0.03, w * 0.16, h * 0.36, 5);
  ctx.fill();
  roundRect(w * 0.4, -h * 0.03, w * 0.16, h * 0.36, 5);
  ctx.fill();
  drawWheelRim(-w * 0.49, h * 0.08, w * 0.075, h * 0.15);
  drawWheelRim(w * 0.49, h * 0.08, w * 0.075, h * 0.15);
  drawWheelRim(-w * 0.48, h * 0.3, w * 0.065, h * 0.105, "rgba(255,209,102,0.24)");
  drawWheelRim(w * 0.48, h * 0.3, w * 0.065, h * 0.105, "rgba(255,209,102,0.24)");

  const body = ctx.createLinearGradient(-w * 0.48, -h * 0.48, w * 0.48, h * 0.44);
  body.addColorStop(0, police ? "#ffffff" : shade(color, 38));
  body.addColorStop(0.48, police ? "#dce2e1" : color);
  body.addColorStop(1, police ? "#9da9a7" : shade(color, -44));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, -h * 0.5);
  ctx.lineTo(w * 0.34, -h * 0.5);
  ctx.lineTo(w * 0.52, -h * 0.12);
  ctx.lineTo(w * 0.42, h * 0.42);
  ctx.lineTo(-w * 0.42, h * 0.42);
  ctx.lineTo(-w * 0.52, -h * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(1, w * 0.016);
  ctx.stroke();
  drawVehicleTrimDetails(w, h, color, police);

  ctx.fillStyle = "rgba(5,8,7,0.86)";
  roundRect(-w * 0.28, -h * 0.35, w * 0.56, h * 0.2, 7);
  ctx.fill();
  ctx.fillStyle = "rgba(222,249,255,0.22)";
  roundRect(-w * 0.22, -h * 0.31, w * 0.24, h * 0.035, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(5,8,7,0.92)";
  roundRect(-w * 0.34, h * 0.02, w * 0.68, h * 0.21, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(244,251,248,0.18)";
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, h * 0.06);
  ctx.lineTo(w * 0.26, h * 0.06);
  ctx.moveTo(0, h * 0.02);
  ctx.lineTo(0, h * 0.23);
  ctx.stroke();

  if (police) {
    ctx.fillStyle = "#111817";
    ctx.fillRect(-w * 0.38, -h * 0.08, w * 0.76, h * 0.09);
    ctx.fillStyle = "#f4fbf8";
    ctx.font = `${Math.max(7, w * 0.13)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("POLICE", 0, h * 0.17);
    const flash = Math.sin(raceState.elapsed * 18) > 0;
    ctx.fillStyle = flash ? "#ff3348" : "#46d9ff";
    roundRect(-w * 0.18, -h * 0.22, w * 0.36, h * 0.06, 3);
    ctx.fill();
  }

  drawTrafficLabel(w, h, label);

  ctx.fillStyle = "#ff3348";
  roundRect(-w * 0.35, h * 0.3, w * 0.18, h * 0.06, 3);
  ctx.fill();
  roundRect(w * 0.17, h * 0.3, w * 0.18, h * 0.06, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(244,251,248,0.58)";
  roundRect(-w * 0.08, h * 0.32, w * 0.16, h * 0.035, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(5,8,7,0.9)";
  roundRect(-w * 0.17, h * 0.43, w * 0.12, h * 0.035, 3);
  ctx.fill();
  roundRect(w * 0.05, h * 0.43, w * 0.12, h * 0.035, 3);
  ctx.fill();
  drawVehicleDamageMarks(w, h, damage);
  drawTrafficDamageBadge(w, h, damage, wrecked);
  ctx.restore();
}

function drawTrafficDamageBadge(w, h, damage, wrecked) {
  if (damage < 12 && !wrecked) return;
  ctx.save();
  const barWidth = w * 0.58;
  const pct = Math.min(1, damage / 100);
  ctx.fillStyle = "rgba(5,8,7,0.74)";
  roundRect(-barWidth / 2, -h * 0.88, barWidth, h * 0.055, 3);
  ctx.fill();
  ctx.fillStyle = wrecked ? "#ff5b6b" : damage > 58 ? "#ffd166" : "#bbf24a";
  roundRect(-barWidth / 2, -h * 0.88, barWidth * pct, h * 0.055, 3);
  ctx.fill();
  if (wrecked) {
    ctx.fillStyle = "rgba(255,91,107,0.72)";
    ctx.beginPath();
    ctx.moveTo(-w * 0.16, -h * 0.72);
    ctx.lineTo(0, -h * 0.56);
    ctx.lineTo(w * 0.16, -h * 0.72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawWheelRim(x, y, rx, ry, accent = "rgba(70,217,255,0.26)") {
  ctx.save();
  ctx.fillStyle = "rgba(4,6,6,0.96)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(244,251,248,0.28)";
  ctx.lineWidth = Math.max(1, rx * 0.18);
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, rx * 0.12);
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.58, y);
  ctx.lineTo(x + rx * 0.58, y);
  ctx.moveTo(x, y - ry * 0.55);
  ctx.lineTo(x, y + ry * 0.55);
  ctx.moveTo(x - rx * 0.38, y - ry * 0.38);
  ctx.lineTo(x + rx * 0.38, y + ry * 0.38);
  ctx.moveTo(x + rx * 0.38, y - ry * 0.38);
  ctx.lineTo(x - rx * 0.38, y + ry * 0.38);
  ctx.stroke();
  ctx.restore();
}

function drawVehicleTrimDetails(w, h, color, police = false) {
  ctx.save();
  const trim = police ? "#111817" : shade(color, -46);
  ctx.fillStyle = trim;
  roundRect(-w * 0.65, -h * 0.24, w * 0.14, h * 0.06, 3);
  ctx.fill();
  roundRect(w * 0.51, -h * 0.24, w * 0.14, h * 0.06, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(244,251,248,0.22)";
  ctx.lineWidth = Math.max(1, w * 0.011);
  ctx.beginPath();
  ctx.moveTo(-w * 0.33, -h * 0.08);
  ctx.lineTo(-w * 0.42, h * 0.38);
  ctx.moveTo(w * 0.33, -h * 0.08);
  ctx.lineTo(w * 0.42, h * 0.38);
  ctx.moveTo(-w * 0.22, -h * 0.36);
  ctx.lineTo(w * 0.22, -h * 0.36);
  ctx.stroke();
  ctx.fillStyle = "rgba(5,8,7,0.86)";
  roundRect(-w * 0.23, h * 0.38, w * 0.46, h * 0.065, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(244,251,248,0.74)";
  roundRect(-w * 0.075, h * 0.392, w * 0.15, h * 0.032, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,248,214,0.8)";
  roundRect(-w * 0.37, -h * 0.46, w * 0.17, h * 0.055, 3);
  ctx.fill();
  roundRect(w * 0.2, -h * 0.46, w * 0.17, h * 0.055, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(5,8,7,0.84)";
  roundRect(-w * 0.34, h * 0.25, w * 0.68, h * 0.055, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(244,251,248,0.18)";
  roundRect(-w * 0.22, -h * 0.31, w * 0.44, h * 0.045, 3);
  ctx.fill();
  ctx.restore();
}

function drawSpecialVehicleSilhouette(w, h, color, vehicleType, player) {
  const paint = ctx.createLinearGradient(-w * 0.5, -h * 0.48, w * 0.48, h * 0.48);
  paint.addColorStop(0, shade(color, 42));
  paint.addColorStop(0.5, color);
  paint.addColorStop(1, shade(color, -48));
  ctx.fillStyle = paint;

  if (vehicleType === "f1" || vehicleType === "prototype") {
    ctx.fillStyle = "#050807";
    roundRect(-w * 0.62, h * 0.2, w * 0.18, h * 0.2, 6);
    ctx.fill();
    roundRect(w * 0.44, h * 0.2, w * 0.18, h * 0.2, 6);
    ctx.fill();
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.58);
    ctx.lineTo(w * 0.36, -h * 0.2);
    ctx.lineTo(w * 0.26, h * 0.45);
    ctx.lineTo(-w * 0.26, h * 0.45);
    ctx.lineTo(-w * 0.36, -h * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.1, w * 0.18, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, -35);
    roundRect(-w * 0.48, h * 0.36, w * 0.96, h * 0.08, 3);
    ctx.fill();
  } else if (vehicleType === "semi") {
    ctx.fillStyle = "#050807";
    roundRect(-w * 0.72, -h * 0.02, w * 0.18, h * 0.5, 7);
    ctx.fill();
    roundRect(w * 0.54, -h * 0.02, w * 0.18, h * 0.5, 7);
    ctx.fill();
    roundRect(-w * 0.72, -h * 0.42, w * 0.16, h * 0.22, 6);
    ctx.fill();
    roundRect(w * 0.56, -h * 0.42, w * 0.16, h * 0.22, 6);
    ctx.fill();
    ctx.fillStyle = paint;
    roundRect(-w * 0.42, -h * 0.58, w * 0.84, h * 0.38, 6);
    ctx.fill();
    ctx.fillStyle = shade(color, -28);
    roundRect(-w * 0.5, -h * 0.16, w * 1.0, h * 0.68, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    roundRect(-w * 0.27, -h * 0.5, w * 0.54, h * 0.18, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(244,251,248,0.48)";
    ctx.fillRect(-w * 0.34, -h * 0.1, w * 0.68, h * 0.08);
    ctx.fillRect(-w * 0.34, h * 0.08, w * 0.68, h * 0.08);
  } else if (vehicleType === "tractor") {
    ctx.fillStyle = "#050807";
    roundRect(-w * 0.64, h * 0.12, w * 0.26, h * 0.36, 9);
    ctx.fill();
    roundRect(w * 0.38, h * 0.12, w * 0.26, h * 0.36, 9);
    ctx.fill();
    roundRect(-w * 0.48, -h * 0.42, w * 0.14, h * 0.2, 5);
    ctx.fill();
    roundRect(w * 0.34, -h * 0.42, w * 0.14, h * 0.2, 5);
    ctx.fill();
    ctx.fillStyle = paint;
    roundRect(-w * 0.3, -h * 0.48, w * 0.6, h * 0.36, 8);
    ctx.fill();
    ctx.fillStyle = shade(color, -28);
    roundRect(-w * 0.42, -h * 0.06, w * 0.84, h * 0.38, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    roundRect(-w * 0.2, -h * 0.38, w * 0.4, h * 0.16, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,209,102,0.6)";
    ctx.lineWidth = Math.max(2, w * 0.035);
    ctx.beginPath();
    ctx.moveTo(-w * 0.44, h * 0.38);
    ctx.lineTo(w * 0.44, h * 0.38);
    ctx.stroke();
  } else if (vehicleType === "truck" || vehicleType === "monster" || vehicleType === "tank") {
    const tire = vehicleType === "monster" ? 0.24 : 0.17;
    ctx.fillStyle = "#050807";
    roundRect(-w * 0.67, -h * 0.08, w * tire, h * 0.5, 7);
    ctx.fill();
    roundRect(w * (0.67 - tire), -h * 0.08, w * tire, h * 0.5, 7);
    ctx.fill();
    ctx.fillStyle = paint;
    roundRect(-w * 0.48, -h * 0.48, w * 0.96, h * 0.82, vehicleType === "tank" ? 3 : 7);
    ctx.fill();
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    roundRect(-w * 0.27, -h * 0.32, w * 0.54, h * 0.22, 5);
    ctx.fill();
    if (vehicleType === "tank") {
      ctx.fillStyle = shade(color, -25);
      roundRect(-w * 0.22, -h * 0.18, w * 0.44, h * 0.3, 4);
      ctx.fill();
      ctx.fillRect(-w * 0.04, -h * 0.66, w * 0.08, h * 0.5);
    }
  } else if (vehicleType === "boat" || vehicleType === "snowmobile") {
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.58);
    ctx.quadraticCurveTo(w * 0.5, -h * 0.05, w * 0.24, h * 0.48);
    ctx.lineTo(-w * 0.24, h * 0.48);
    ctx.quadraticCurveTo(-w * 0.5, -h * 0.05, 0, -h * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    roundRect(-w * 0.16, -h * 0.12, w * 0.32, h * 0.24, 5);
    ctx.fill();
    ctx.strokeStyle = vehicleType === "boat" ? "rgba(70,217,255,0.58)" : "rgba(244,251,248,0.58)";
    ctx.lineWidth = Math.max(2, w * 0.04);
    ctx.beginPath();
    ctx.moveTo(-w * 0.44, h * 0.36);
    ctx.lineTo(-w * 0.68, h * 0.5);
    ctx.moveTo(w * 0.44, h * 0.36);
    ctx.lineTo(w * 0.68, h * 0.5);
    ctx.stroke();
  } else if (vehicleType === "helicopter") {
    ctx.fillStyle = "rgba(244,251,248,0.68)";
    roundRect(-w * 0.62, -h * 0.64, w * 1.24, h * 0.05, 2);
    ctx.fill();
    ctx.fillStyle = paint;
    roundRect(-w * 0.28, -h * 0.36, w * 0.56, h * 0.56, 14);
    ctx.fill();
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    roundRect(-w * 0.17, -h * 0.24, w * 0.34, h * 0.18, 5);
    ctx.fill();
    ctx.strokeStyle = shade(color, -30);
    ctx.lineWidth = Math.max(2, w * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.18);
    ctx.lineTo(0, h * 0.56);
    ctx.stroke();
  } else if (vehicleType === "airplane") {
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.62);
    ctx.lineTo(w * 0.2, h * 0.48);
    ctx.lineTo(-w * 0.2, h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-w * 0.68, h * 0.02);
    ctx.lineTo(w * 0.68, h * 0.02);
    ctx.lineTo(w * 0.22, h * 0.22);
    ctx.lineTo(-w * 0.22, h * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    roundRect(-w * 0.1, -h * 0.34, w * 0.2, h * 0.26, 4);
    ctx.fill();
  }

  const groundVehicle = !["boat", "snowmobile", "helicopter", "airplane"].includes(vehicleType);
  if (groundVehicle) {
    const rimAccent = vehicleType === "tractor" ? "rgba(255,209,102,0.38)" : "rgba(70,217,255,0.28)";
    const frontY = vehicleType === "f1" || vehicleType === "prototype" ? h * 0.33 : h * 0.18;
    const rearY = vehicleType === "f1" || vehicleType === "prototype" ? h * 0.43 : h * 0.38;
    drawWheelRim(-w * 0.55, frontY, w * 0.075, h * 0.12, rimAccent);
    drawWheelRim(w * 0.55, frontY, w * 0.075, h * 0.12, rimAccent);
    drawWheelRim(-w * 0.5, rearY, w * 0.07, h * 0.105, rimAccent);
    drawWheelRim(w * 0.5, rearY, w * 0.07, h * 0.105, rimAccent);
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    roundRect(-w * 0.26, h * 0.31, w * 0.52, h * 0.075, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(255,248,214,0.86)";
    roundRect(-w * 0.34, -h * 0.5, w * 0.18, h * 0.055, 3);
    ctx.fill();
    roundRect(w * 0.16, -h * 0.5, w * 0.18, h * 0.055, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(244,251,248,0.2)";
    ctx.lineWidth = Math.max(1, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, -h * 0.08);
    ctx.lineTo(-w * 0.36, h * 0.3);
    ctx.moveTo(w * 0.32, -h * 0.08);
    ctx.lineTo(w * 0.36, h * 0.3);
    ctx.stroke();
  } else if (vehicleType === "boat" || vehicleType === "snowmobile") {
    ctx.fillStyle = "rgba(244,251,248,0.18)";
    roundRect(-w * 0.18, -h * 0.4, w * 0.36, h * 0.055, 3);
    ctx.fill();
    ctx.fillStyle = vehicleType === "boat" ? "rgba(70,217,255,0.44)" : "rgba(244,251,248,0.44)";
    roundRect(-w * 0.34, h * 0.35, w * 0.68, h * 0.045, 3);
    ctx.fill();
  } else if (vehicleType === "helicopter") {
    ctx.fillStyle = "rgba(244,251,248,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.62, w * 0.66, h * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(5,8,7,0.82)";
    roundRect(-w * 0.1, h * 0.48, w * 0.2, h * 0.08, 3);
    ctx.fill();
  } else if (vehicleType === "airplane") {
    ctx.fillStyle = "rgba(255,248,214,0.82)";
    roundRect(-w * 0.08, -h * 0.54, w * 0.16, h * 0.05, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(70,217,255,0.36)";
    roundRect(-w * 0.48, h * 0.08, w * 0.96, h * 0.035, 3);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = Math.max(1, w * 0.016);
  ctx.stroke();
  if (player) drawVehicleDamageMarks(w, h, raceState.damage || 0);
  if (player) {
    ctx.fillStyle = "rgba(255,209,102,0.55)";
    ctx.beginPath();
    ctx.ellipse(0, h * 0.52, w * 0.24, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDemoPursuitTraffic(w, h) {
  const t = performance.now() / 1000;
  const demo = [
    { lane: -1.15 + Math.sin(t * 0.7) * 0.15, y: h * 0.43, color: "#ff5b6b", police: false, s: 0.58 },
    { lane: 1.05 + Math.sin(t * 0.9) * 0.12, y: h * 0.5, color: "#f4fbf8", police: true, s: 0.68 },
    { lane: 0.08 + Math.sin(t * 1.1) * 0.18, y: h * 0.61, color: "#46d9ff", police: false, s: 0.86 }
  ];
  demo.forEach((car) => {
    const p = objectPos(car.lane, car.y);
    drawTrafficRearCar(p.x, p.y, 78 * car.s * p.scale, 118 * car.s * p.scale, car.color, car.police);
  });
  ctx.save();
  ctx.globalAlpha = 0.18 + Math.max(0, Math.sin(t * 12)) * 0.1;
  let wash = ctx.createRadialGradient(w * 0.18, h * 0.48, 10, w * 0.18, h * 0.48, w * 0.55);
  wash.addColorStop(0, "rgba(255,51,72,0.44)");
  wash.addColorStop(1, "rgba(255,51,72,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  wash = ctx.createRadialGradient(w * 0.82, h * 0.48, 10, w * 0.82, h * 0.48, w * 0.55);
  wash.addColorStop(0, "rgba(70,217,255,0.4)");
  wash.addColorStop(1, "rgba(70,217,255,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawCar(w, h) {
  if (cameraMode === "cockpit") return;
  const vehicle = selectedVehicle();
  const x = w / 2 + raceState.lane * laneWidth();
  const y = cameraMode === "hood" ? h * 0.99 : h * 0.82;
  const sizeBoost = vehicle.type === "semi" ? 1.28 : vehicle.type === "monster" || vehicle.type === "tank" ? 1.18 : vehicle.type === "tractor" ? 1.08 : vehicle.type === "f1" || vehicle.type === "snowmobile" ? 0.9 : 1;
  const carWidth = (cameraMode === "hood" ? 220 : 118) * sizeBoost;
  const carHeight = (cameraMode === "hood" ? 190 : 178) * sizeBoost;
  if (cameraMode === "chase") {
    drawPlayerChaseCar(x, y + 18, carWidth * 1.26, carHeight * 1.02, vehicle.color, vehicle.type);
  } else {
    drawVehicle(x, y, carWidth, carHeight, vehicle.color, true, false, vehicle.type);
  }
  if ((input.boost || input.gamepadBoost) && raceState.active) {
    ctx.fillStyle = "rgba(255,209,102,0.82)";
    ctx.beginPath();
    ctx.moveTo(x - carWidth * 0.28, y + carHeight * 0.44);
    ctx.lineTo(x, y + carHeight * 0.95 + Math.random() * 34);
    ctx.lineTo(x + carWidth * 0.28, y + carHeight * 0.44);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPlayerChaseCar(x, y, width, height, color, vehicleType = "car") {
  ctx.save();
  ctx.translate(x, y);
  const bodyYaw = Math.max(-0.12, Math.min(0.12, (raceState.steerAngle || 0) * 0.055 + (raceState.lateralVelocity || 0) * 0.018));
  ctx.rotate(bodyYaw);

  const shadow = ctx.createRadialGradient(0, height * 0.38, width * 0.08, 0, height * 0.42, width * 0.72);
  shadow.addColorStop(0, "rgba(0,0,0,0.54)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, height * 0.42, width * 0.74, height * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  if (drawPhoneAssetVehicleSprite(width, height, color, vehicleType, false, raceState.damage || 0)) {
    ctx.restore();
    return;
  }

  if (vehicleType !== "car") {
    drawSpecialVehicleSilhouette(width, height, color, vehicleType, true);
    ctx.restore();
    return;
  }

  const paint = ctx.createLinearGradient(-width * 0.5, -height * 0.52, width * 0.42, height * 0.5);
  paint.addColorStop(0, shade(color, 56));
  paint.addColorStop(0.22, color);
  paint.addColorStop(0.58, shade(color, -22));
  paint.addColorStop(1, shade(color, -56));

  ctx.fillStyle = "#050807";
  roundRect(-width * 0.56, -height * 0.18, width * 0.16, height * 0.5, 8);
  ctx.fill();
  roundRect(width * 0.4, -height * 0.18, width * 0.16, height * 0.5, 8);
  ctx.fill();
  drawWheelRim(-width * 0.49, -height * 0.01, width * 0.08, height * 0.16);
  drawWheelRim(width * 0.49, -height * 0.01, width * 0.08, height * 0.16);
  drawWheelRim(-width * 0.48, height * 0.27, width * 0.07, height * 0.12, "rgba(255,209,102,0.24)");
  drawWheelRim(width * 0.48, height * 0.27, width * 0.07, height * 0.12, "rgba(255,209,102,0.24)");

  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.moveTo(-width * 0.34, -height * 0.52);
  ctx.lineTo(width * 0.34, -height * 0.52);
  ctx.quadraticCurveTo(width * 0.54, -height * 0.38, width * 0.5, -height * 0.08);
  ctx.lineTo(width * 0.43, height * 0.36);
  ctx.quadraticCurveTo(width * 0.31, height * 0.55, 0, height * 0.58);
  ctx.quadraticCurveTo(-width * 0.31, height * 0.55, -width * 0.43, height * 0.36);
  ctx.lineTo(-width * 0.5, -height * 0.08);
  ctx.quadraticCurveTo(-width * 0.54, -height * 0.38, -width * 0.34, -height * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = Math.max(2, width * 0.018);
  ctx.stroke();
  drawVehicleTrimDetails(width, height, color, false);

  const windshield = ctx.createLinearGradient(0, -height * 0.46, 0, height * 0.08);
  windshield.addColorStop(0, "rgba(222,249,255,0.72)");
  windshield.addColorStop(0.38, "rgba(58,88,94,0.82)");
  windshield.addColorStop(1, "rgba(3,6,7,0.96)");
  ctx.fillStyle = windshield;
  ctx.beginPath();
  ctx.moveTo(-width * 0.28, -height * 0.39);
  ctx.lineTo(width * 0.28, -height * 0.39);
  ctx.lineTo(width * 0.34, -height * 0.08);
  ctx.quadraticCurveTo(0, height * 0.03, -width * 0.34, -height * 0.08);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(5,8,7,0.9)";
  roundRect(-width * 0.32, height * 0.12, width * 0.64, height * 0.27, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(244,251,248,0.18)";
  ctx.stroke();

  ctx.strokeStyle = "rgba(5,8,7,0.52)";
  ctx.lineWidth = Math.max(2, width * 0.024);
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.49);
  ctx.lineTo(0, height * 0.55);
  ctx.moveTo(-width * 0.42, -height * 0.05);
  ctx.lineTo(width * 0.42, -height * 0.05);
  ctx.moveTo(-width * 0.38, height * 0.36);
  ctx.lineTo(width * 0.38, height * 0.36);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(-width * 0.31, -height * 0.48);
  ctx.lineTo(-width * 0.08, -height * 0.43);
  ctx.lineTo(-width * 0.23, -height * 0.3);
  ctx.closePath();
  ctx.moveTo(width * 0.31, -height * 0.48);
  ctx.lineTo(width * 0.08, -height * 0.43);
  ctx.lineTo(width * 0.23, -height * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff3348";
  roundRect(-width * 0.36, height * 0.42, width * 0.22, height * 0.055, 4);
  ctx.fill();
  roundRect(width * 0.14, height * 0.42, width * 0.22, height * 0.055, 4);
  ctx.fill();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#ff3348";
  ctx.beginPath();
  ctx.ellipse(-width * 0.25, height * 0.44, width * 0.32, height * 0.08, 0, 0, Math.PI * 2);
  ctx.ellipse(width * 0.25, height * 0.44, width * 0.32, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(5,8,7,0.9)";
  roundRect(-width * 0.19, height * 0.49, width * 0.38, height * 0.05, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(244,251,248,0.64)";
  roundRect(-width * 0.08, height * 0.5, width * 0.16, height * 0.03, 3);
  ctx.fill();

  drawVehicleDamageMarks(width, height, raceState.damage || 0);
  ctx.restore();
}

function drawVehicleDamageMarks(width, height, damage) {
  if (!damage || damage < 14) return;
  ctx.save();
  const dents = Math.min(8, Math.floor(damage / 12));
  ctx.strokeStyle = "rgba(5,8,7,0.72)";
  ctx.lineWidth = Math.max(1.5, width * 0.018);
  ctx.lineCap = "round";
  for (let i = 0; i < dents; i += 1) {
    const side = i % 2 ? -1 : 1;
    const x = side * width * (0.12 + (i % 3) * 0.085);
    const y = -height * 0.25 + (i % 5) * height * 0.14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + side * width * 0.16, y + height * (0.04 + (i % 2) * 0.035));
    ctx.stroke();
  }
  ctx.globalAlpha = Math.min(0.45, damage / 160);
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  for (let i = 0; i < dents; i += 1) {
    const x = ((i * 41) % 100 - 50) / 100 * width * 0.62;
    const y = ((i * 29) % 100 - 48) / 100 * height * 0.72;
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.035, height * 0.025, i * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (damage > 58) {
    ctx.globalAlpha = Math.min(0.62, damage / 140);
    ctx.fillStyle = "rgba(255,91,107,0.42)";
    roundRect(-width * 0.3, -height * 0.48, width * 0.18, height * 0.055, 3);
    ctx.fill();
  }
  ctx.restore();
}

function drawCameraOverlay(w, h, theme) {
  if (cameraMode === "chase") {
    ctx.save();
    const mirror = ctx.createLinearGradient(0, 0, 0, h * 0.18);
    mirror.addColorStop(0, "rgba(3,6,6,0.78)");
    mirror.addColorStop(1, "rgba(3,6,6,0)");
    ctx.fillStyle = mirror;
    ctx.fillRect(0, 0, w, h * 0.18);
    ctx.fillStyle = "rgba(5,8,7,0.58)";
    roundRect(w * 0.39, h * 0.055, w * 0.22, h * 0.055, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(244,251,248,0.18)";
    ctx.stroke();
    ctx.fillStyle = theme[1];
    ctx.font = "900 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(raceState.chaseActive ? "PURSUIT CAMERA" : "CHASE CAMERA", w * 0.5, h * 0.09);
    ctx.restore();
    return;
  }
  if (cameraMode === "hood") {
    const hood = ctx.createLinearGradient(0, h * 0.72, 0, h);
    hood.addColorStop(0, "rgba(70,217,255,0.05)");
    hood.addColorStop(0.58, "#101817");
    hood.addColorStop(1, "#050807");
    ctx.fillStyle = hood;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h);
    ctx.quadraticCurveTo(w * 0.5, h * 0.68, w * 0.86, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = theme[1];
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.91);
    ctx.lineTo(w * 0.64, h * 0.91);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }
  if (cameraMode !== "cockpit") return;
  ctx.save();
  ctx.fillStyle = "rgba(2,5,5,0.64)";
  ctx.fillRect(0, 0, w, h * 0.1);
  const dash = ctx.createLinearGradient(0, h * 0.74, 0, h);
  dash.addColorStop(0, "rgba(6,10,10,0.52)");
  dash.addColorStop(0.42, "#0a0f0e");
  dash.addColorStop(1, "#020403");
  ctx.fillStyle = dash;
  ctx.fillRect(0, h * 0.75, w, h * 0.25);
  ctx.fillStyle = "#080d0c";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.2, h * 0.78);
  ctx.lineTo(w * 0.8, h * 0.78);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(244,251,248,0.28)";
  ctx.lineWidth = 10;
  roundRect(w * 0.08, h * 0.12, w * 0.84, h * 0.58, 18);
  ctx.stroke();
  ctx.strokeStyle = "rgba(244,251,248,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.68);
  ctx.quadraticCurveTo(w * 0.5, h * 0.76, w * 0.92, h * 0.68);
  ctx.stroke();
  ctx.strokeStyle = theme[1];
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.14);
  ctx.lineTo(w * 0.5 + raceState.lane * 22, h * 0.68);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#111817";
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.9, Math.min(w, h) * 0.13, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#46d9ff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.9, Math.min(w, h) * 0.1, Math.PI * 1.06, Math.PI * 1.94);
  ctx.stroke();
  ctx.fillStyle = "#bbf24a";
  ctx.font = "900 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(raceState.speed)} MPH`, w * 0.5, h * 0.9);
  ctx.fillStyle = "rgba(5,8,7,0.74)";
  roundRect(w * 0.11, h * 0.8, w * 0.22, h * 0.1, 8);
  ctx.fill();
  ctx.fillStyle = raceState.chaseActive ? "#ff5b6b" : "#a9bbb5";
  ctx.font = "900 14px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(raceState.chaseActive ? "PURSUIT ACTIVE" : "STREET CLEAR", w * 0.13, h * 0.835);
  ctx.fillStyle = "#f4fbf8";
  ctx.font = "800 12px system-ui";
  ctx.fillText(`HEAT ${Math.round(raceState.heat)}%`, w * 0.13, h * 0.865);
  ctx.fillStyle = "rgba(5,8,7,0.74)";
  roundRect(w * 0.67, h * 0.8, w * 0.22, h * 0.1, 8);
  ctx.fill();
  ctx.fillStyle = theme[1];
  ctx.font = "900 14px system-ui";
  ctx.textAlign = "right";
  ctx.fillText(selectedRace ? selectedRace.mood.toUpperCase() : "STREET RACE", w * 0.87, h * 0.835);
  ctx.fillStyle = "#f4fbf8";
  ctx.font = "800 12px system-ui";
  ctx.fillText(`${Math.round((raceState.distance / raceLength()) * 100)}% ROUTE`, w * 0.87, h * 0.865);
  if (raceState.chaseActive) {
    ctx.globalAlpha = 0.18 + Math.max(0, Math.sin(raceState.elapsed * 16)) * 0.14;
    ctx.fillStyle = "#ff3348";
    ctx.fillRect(0, 0, w * 0.5, h);
    ctx.fillStyle = "#46d9ff";
    ctx.fillRect(w * 0.5, 0, w * 0.5, h);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawDamageOverlay(w, h, theme) {
  if (!raceState.active) return;
  const damage = Math.max(0, raceState.damage || 0);
  const resetting = raceState.resetTimer > 0;
  if (damage < 10 && !resetting) return;
  ctx.save();
  const danger = Math.min(0.34, damage / 280 + (resetting ? 0.18 : 0));
  const edge = ctx.createRadialGradient(w * 0.5, h * 0.52, h * 0.28, w * 0.5, h * 0.52, h * 0.9);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(0.68, "rgba(0,0,0,0)");
  edge.addColorStop(1, `rgba(255,51,72,${danger})`);
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);

  if (cameraMode === "cockpit" || damage > 48) {
    ctx.strokeStyle = `rgba(244,251,248,${Math.min(0.28, damage / 240)})`;
    ctx.lineWidth = Math.max(1, w * 0.002);
    const cracks = Math.floor(Math.min(8, damage / 12));
    for (let i = 0; i < cracks; i += 1) {
      const anchorX = w * (0.2 + ((i * 0.17) % 0.6));
      const anchorY = h * (0.18 + ((i * 0.13) % 0.38));
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(anchorX + Math.sin(i * 1.9) * w * 0.08, anchorY + h * (0.05 + (i % 3) * 0.025));
      ctx.lineTo(anchorX + Math.cos(i * 1.4) * w * 0.1, anchorY + h * (0.1 + (i % 2) * 0.03));
      ctx.stroke();
    }
  }

  if (resetting) {
    ctx.fillStyle = "rgba(5,8,7,0.78)";
    roundRect(w * 0.5 - 132, h * 0.36, 264, 78, 8);
    ctx.fill();
    ctx.strokeStyle = theme[2];
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f4fbf8";
    ctx.font = "900 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`RESET ${Math.ceil(raceState.resetTimer)}`, w * 0.5, h * 0.36 + 32);
    ctx.fillStyle = "#a9bbb5";
    ctx.font = "800 12px system-ui";
    ctx.fillText(raceState.resetReason || "Vehicle recovery", w * 0.5, h * 0.36 + 55);
  }
  ctx.restore();
}

function drawCinematicGrade(w, h, theme) {
  const speedLines = Math.max(0, (raceState.speed - 190) / 150);
  if (speedLines > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.32, speedLines * 0.26);
    ctx.strokeStyle = theme[1];
    ctx.lineWidth = 2;
    for (let i = 0; i < 22; i += 1) {
      const x = (i * 73 + raceState.roadOffset * 0.35) % w;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.42);
      ctx.lineTo(x - 90, h);
      ctx.stroke();
    }
    ctx.restore();
  }
  const slipGlow = Math.min(0.24, (raceState.slip || 0) * 0.18 + (raceState.brakeHeat || 0) * 0.08);
  if (slipGlow > 0.01 && raceState.active) {
    ctx.save();
    const gripWash = ctx.createLinearGradient(0, h * 0.55, 0, h);
    gripWash.addColorStop(0, "rgba(255,255,255,0)");
    gripWash.addColorStop(1, `rgba(244,251,248,${slipGlow})`);
    ctx.fillStyle = gripWash;
    ctx.fillRect(0, h * 0.55, w, h * 0.45);
    ctx.restore();
  }
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.52, h * 0.22, w * 0.5, h * 0.52, h * 0.9);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawRealisticDrivingPass(w, h, theme) {
  const place = selectedRace && selectedRace.place ? selectedRace.place : "city";
  const speed = Math.max(0, raceState.speed);
  const horizon = cameraMode === "cockpit" ? h * 0.28 : cameraMode === "hood" ? h * 0.31 : h * 0.34;
  ctx.save();

  const depthFog = ctx.createLinearGradient(0, horizon - h * 0.08, 0, horizon + h * 0.18);
  depthFog.addColorStop(0, "rgba(244,251,248,0.02)");
  depthFog.addColorStop(0.52, place === "desert" || place === "canyon" ? "rgba(255,209,102,0.12)" : "rgba(210,230,235,0.08)");
  depthFog.addColorStop(1, "rgba(5,8,7,0)");
  ctx.fillStyle = depthFog;
  ctx.fillRect(0, Math.max(0, horizon - h * 0.12), w, h * 0.36);

  const wetPlaces = ["city", "tokyo", "coast", "harbor", "rainforest"];
  if (wetPlaces.includes(place)) {
    ctx.globalAlpha = place === "tokyo" ? 0.32 : 0.2;
    for (let i = 0; i < 16; i += 1) {
      const y = ((i * 47 + raceState.roadOffset * 0.72) % (h * 0.62)) + horizon;
      const t = Math.min(1, Math.max(0, (y - horizon) / (h - horizon)));
      const ribbonW = w * (0.12 + t * 0.5);
      const x = w * 0.5 + Math.sin(i * 1.7 + raceState.elapsed) * w * 0.04;
      const shine = ctx.createLinearGradient(x - ribbonW, y, x + ribbonW, y);
      shine.addColorStop(0, "rgba(244,251,248,0)");
      shine.addColorStop(0.5, `${theme[1]}55`);
      shine.addColorStop(1, "rgba(244,251,248,0)");
      ctx.strokeStyle = shine;
      ctx.lineWidth = 1 + t * 5;
      ctx.beginPath();
      ctx.moveTo(x - ribbonW, y);
      ctx.quadraticCurveTo(x, y + 5 + t * 12, x + ribbonW, y + 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (raceState.active && speed > 35) {
    const carX = w / 2 + raceState.lane * laneWidth();
    const baseY = cameraMode === "cockpit" ? h * 0.76 : cameraMode === "hood" ? h * 0.9 : h * 0.86;
    const slipAlpha = Math.min(0.32, 0.05 + (raceState.slip || 0) * 0.22);
    ctx.strokeStyle = `rgba(8,10,10,${slipAlpha})`;
    ctx.lineWidth = Math.max(2, w * 0.006);
    for (let side = -1; side <= 1; side += 2) {
      const tireX = carX + side * laneWidth() * 0.22;
      ctx.beginPath();
      ctx.moveTo(tireX, baseY);
      ctx.bezierCurveTo(
        tireX - raceState.lateralVelocity * 15,
        baseY + h * 0.06,
        tireX - raceState.steerAngle * 24,
        h,
        tireX - raceState.steerAngle * 48,
        h + 20
      );
      ctx.stroke();
    }
  }

  if (speed > 105) {
    const blur = Math.min(0.26, (speed - 105) / 720);
    ctx.globalAlpha = blur;
    ctx.strokeStyle = "rgba(244,251,248,0.7)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 34; i += 1) {
      const side = i % 2 ? -1 : 1;
      const y = h * (0.36 + (i % 17) * 0.04);
      const x0 = w * 0.5 + side * w * (0.18 + (i % 5) * 0.05);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + side * w * 0.18, y + h * 0.22);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (["city", "tokyo", "airfield", "freight"].includes(place) || cameraMode === "cockpit") {
    const cone = ctx.createRadialGradient(w * 0.5, h * 0.78, w * 0.04, w * 0.5, h * 0.7, w * 0.42);
    cone.addColorStop(0, "rgba(255,246,202,0.16)");
    cone.addColorStop(1, "rgba(255,246,202,0)");
    ctx.fillStyle = cone;
    ctx.fillRect(0, horizon, w, h - horizon);
  }

  if (place === "desert" || place === "canyon" || place === "freight") {
    ctx.globalAlpha = Math.min(0.28, 0.08 + speed / 980);
    ctx.fillStyle = "rgba(255,183,74,0.22)";
    for (let i = 0; i < 26; i += 1) {
      const x = (i * 79 + raceState.roadOffset * 0.11) % w;
      const y = h * 0.38 + ((i * 31 + raceState.elapsed * 55) % (h * 0.5));
      ctx.beginPath();
      ctx.ellipse(x, y, 18 + (i % 4) * 8, 3 + (i % 3), 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (place === "snow") {
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = "rgba(244,251,248,0.75)";
    for (let i = 0; i < 46; i += 1) {
      const x = (i * 61 + raceState.elapsed * 34) % w;
      const y = (i * 43 + raceState.elapsed * 52 + raceState.roadOffset * 0.05) % h;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  if (place === "coast" || place === "desert") {
    const sunX = place === "coast" ? w * 0.18 : w * 0.78;
    const sunY = h * 0.16;
    const flare = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, w * 0.28);
    flare.addColorStop(0, "rgba(255,226,150,0.35)");
    flare.addColorStop(1, "rgba(255,226,150,0)");
    ctx.fillStyle = flare;
    ctx.fillRect(0, 0, w, h * 0.48);
  }

  ctx.restore();
}

function drawVehicle(x, y, width, height, color, player, police = false, vehicleType = "car") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.46)";
  ctx.beginPath();
  ctx.ellipse(0, height * 0.42, width * 0.68, height * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  if (drawPhoneAssetVehicleSprite(width, height, color, vehicleType, police, player ? raceState.damage || 0 : 0)) {
    ctx.restore();
    return;
  }

  if (!police && vehicleType !== "car") {
    drawSpecialVehicleSilhouette(width, height, color, vehicleType, player);
    ctx.restore();
    return;
  }

  const tireW = width * 0.17;
  const tireH = height * 0.3;
  ctx.fillStyle = "#050807";
  roundRect(-width * 0.56, -height * 0.29, tireW, tireH, 5);
  ctx.fill();
  roundRect(width * 0.39, -height * 0.29, tireW, tireH, 5);
  ctx.fill();
  roundRect(-width * 0.56, height * 0.14, tireW, tireH, 5);
  ctx.fill();
  roundRect(width * 0.39, height * 0.14, tireW, tireH, 5);
  ctx.fill();
  drawWheelRim(-width * 0.475, -height * 0.14, width * 0.07, height * 0.12);
  drawWheelRim(width * 0.475, -height * 0.14, width * 0.07, height * 0.12);
  drawWheelRim(-width * 0.475, height * 0.26, width * 0.07, height * 0.12, "rgba(255,209,102,0.24)");
  drawWheelRim(width * 0.475, height * 0.26, width * 0.07, height * 0.12, "rgba(255,209,102,0.24)");

  const body = ctx.createLinearGradient(-width * 0.48, -height * 0.52, width * 0.48, height * 0.52);
  body.addColorStop(0, shade(color, 42));
  body.addColorStop(0.2, color);
  body.addColorStop(0.54, shade(color, -18));
  body.addColorStop(1, shade(color, -42));
  ctx.fillStyle = police ? "#f0f2f0" : body;
  ctx.beginPath();
  ctx.moveTo(-width * 0.26, -height * 0.54);
  ctx.lineTo(width * 0.26, -height * 0.54);
  ctx.quadraticCurveTo(width * 0.51, -height * 0.48, width * 0.5, -height * 0.2);
  ctx.lineTo(width * 0.45, height * 0.38);
  ctx.quadraticCurveTo(width * 0.28, height * 0.57, 0, height * 0.58);
  ctx.quadraticCurveTo(-width * 0.28, height * 0.57, -width * 0.45, height * 0.38);
  ctx.lineTo(-width * 0.5, -height * 0.2);
  ctx.quadraticCurveTo(-width * 0.51, -height * 0.48, -width * 0.26, -height * 0.54);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = Math.max(1, width * 0.018);
  ctx.stroke();
  drawVehicleTrimDetails(width, height, color, police);

  ctx.fillStyle = police ? "#111817" : shade(color, -36);
  ctx.globalAlpha = 0.64;
  ctx.beginPath();
  ctx.moveTo(-width * 0.38, -height * 0.24);
  ctx.lineTo(-width * 0.22, -height * 0.48);
  ctx.lineTo(width * 0.22, -height * 0.48);
  ctx.lineTo(width * 0.38, -height * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  if (police) {
    ctx.fillStyle = "#111817";
    ctx.fillRect(-width * 0.34, -height * 0.16, width * 0.68, height * 0.11);
    ctx.fillStyle = "#f4fbf8";
    ctx.font = `${Math.max(8, width * 0.14)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("POLICE", 0, height * 0.24);
  }

  const glass = ctx.createLinearGradient(0, -height * 0.42, 0, height * 0.24);
  glass.addColorStop(0, "rgba(220,244,255,0.58)");
  glass.addColorStop(0.45, "rgba(43,66,70,0.84)");
  glass.addColorStop(1, "rgba(7,11,12,0.92)");
  ctx.fillStyle = glass;
  roundRect(-width * 0.31, -height * 0.39, width * 0.62, height * 0.21, 8);
  ctx.fill();
  roundRect(-width * 0.29, -height * 0.11, width * 0.58, height * 0.32, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(244,251,248,0.28)";
  ctx.lineWidth = Math.max(1, width * 0.015);
  ctx.stroke();
  ctx.fillStyle = player ? "#dce8ef" : "#e6d69b";
  ctx.beginPath();
  ctx.arc(0, -height * 0.02, width * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#050807";
  roundRect(-width * 0.09, -height * 0.04, width * 0.18, height * 0.045, 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(0, -height * 0.02, width * 0.12, Math.PI * 1.04, Math.PI * 1.96);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,248,214,0.94)";
  ctx.beginPath();
  ctx.moveTo(-width * 0.36, -height * 0.49);
  ctx.lineTo(-width * 0.11, -height * 0.45);
  ctx.lineTo(-width * 0.24, -height * 0.36);
  ctx.closePath();
  ctx.moveTo(width * 0.36, -height * 0.49);
  ctx.lineTo(width * 0.11, -height * 0.45);
  ctx.lineTo(width * 0.24, -height * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff8d6";
  ctx.beginPath();
  ctx.ellipse(-width * 0.25, -height * 0.42, width * 0.28, height * 0.1, -0.28, 0, Math.PI * 2);
  ctx.ellipse(width * 0.25, -height * 0.42, width * 0.28, height * 0.1, 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#ff3348";
  roundRect(-width * 0.32, height * 0.42, width * 0.17, height * 0.055, 3);
  ctx.fill();
  roundRect(width * 0.15, height * 0.42, width * 0.17, height * 0.055, 3);
  ctx.fill();
  if (police) {
    const flash = Math.sin(raceState.elapsed * 18) > 0;
    ctx.fillStyle = flash ? "#ff3348" : "#46d9ff";
    roundRect(-width * 0.21, -height * 0.25, width * 0.42, height * 0.055, 3);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = flash ? "#ff3348" : "#46d9ff";
    ctx.beginPath();
    ctx.arc(0, -height * 0.25, width * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = "rgba(5,8,7,0.5)";
  ctx.lineWidth = Math.max(1.5, width * 0.02);
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.51);
  ctx.lineTo(0, height * 0.5);
  ctx.moveTo(-width * 0.41, -height * 0.16);
  ctx.lineTo(width * 0.41, -height * 0.16);
  ctx.moveTo(-width * 0.37, height * 0.28);
  ctx.lineTo(width * 0.37, height * 0.28);
  ctx.stroke();
  ctx.fillStyle = "rgba(244,251,248,0.22)";
  ctx.fillRect(-width * 0.34, height * 0.19, width * 0.68, height * 0.026);

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(1, width * 0.012);
  ctx.beginPath();
  ctx.moveTo(-width * 0.43, -height * 0.13);
  ctx.quadraticCurveTo(-width * 0.56, height * 0.02, -width * 0.42, height * 0.33);
  ctx.moveTo(width * 0.43, -height * 0.13);
  ctx.quadraticCurveTo(width * 0.56, height * 0.02, width * 0.42, height * 0.33);
  ctx.stroke();
  if (player) drawVehicleDamageMarks(width, height, raceState.damage || 0);
  ctx.restore();
}

function shade(hex, amount) {
  const raw = hex.replace("#", "");
  const num = parseInt(raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawParticles() {
  raceState.particles.forEach((p) => {
    const fade = Math.max(0, p.life / (p.maxLife || 0.7));
    ctx.globalAlpha = fade;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (p.radius || 4) * (1.1 - fade * 0.35), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawAttract(w, h) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(5,8,7,0.38)";
  roundRect(w / 2 - 330, h * 0.36 - 54, 660, 118, 8);
  ctx.fill();
  ctx.fillStyle = "#f4fbf8";
  ctx.font = "900 34px system-ui";
  ctx.fillText("Press Quick Play. Hit The Street.", w / 2, h * 0.36);
  ctx.fillStyle = "#a9bbb5";
  ctx.font = "700 16px system-ui";
  ctx.fillText("Performance cars, police heat, and cinematic routes built for replay.", w / 2, h * 0.36 + 34);
  ctx.restore();
}

function drawPause(w, h) {
  ctx.fillStyle = "rgba(0,0,0,0.56)";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#f4fbf8";
  ctx.textAlign = "center";
  ctx.font = "900 48px system-ui";
  ctx.fillText("Paused", w / 2, h / 2);
}

function syncViewportSize() {
  const viewport = window.visualViewport;
  const width = Math.max(320, Math.floor(viewport ? viewport.width : window.innerWidth));
  const height = Math.max(240, Math.floor(viewport ? viewport.height : window.innerHeight));
  document.documentElement.style.setProperty("--vvw", `${width}px`);
  document.documentElement.style.setProperty("--vvh", `${height}px`);
}

function fitCanvas() {
  syncViewportSize();
  const rect = canvas.getBoundingClientRect();
  const racingViewport = document.body.classList.contains("race-live");
  const minWidth = racingViewport ? 320 : 640;
  const minHeight = racingViewport ? 240 : 420;
  const width = Math.max(minWidth, Math.floor(rect.width));
  const height = Math.max(minHeight, Math.floor(rect.height));
  canvas.width = width;
  canvas.height = height;
  if (glCanvas) {
    glCanvas.width = width;
    glCanvas.height = height;
  }
  if (webglRenderer) webglRenderer.resize(width, height);
}

function bindEvents() {
  $$(".age-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedAge = btn.dataset.age;
      $$(".age-card").forEach((item) => item.classList.toggle("selected", item === btn));
    });
  });
  $("#quickPlay").addEventListener("click", () => enterProfile(true));
  $("#startProfile").addEventListener("click", () => enterProfile(false));
  $("#installApp").addEventListener("click", installApp);
  $("#resetProfiles").addEventListener("click", () => {
    if (!confirm("Clear all local Velocity Vault profiles on this device?")) return;
    profiles = {};
    saveProfiles();
    clearSavedRace();
    renderSavedRaceButton();
    showToast("Local profiles cleared.");
  });
  $("#logoutBtn").addEventListener("click", () => {
    activeProfile = null;
    raceState.active = false;
    $("#modeChip").textContent = "Select Profile";
    $("#missionChip").textContent = "Mission Ready";
    updateHud();
    showView("login");
  });
  $$(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      tab = btn.dataset.tab;
      $$(".tab").forEach((item) => item.classList.toggle("active", item === btn));
      $$(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `${tab}Tab`));
    });
  });
  $("#launchRace").addEventListener("click", launchRace);
  $("#resumeRace").addEventListener("click", resumeSavedRace);
  $("#saveRace").addEventListener("click", saveRace);
  $("#resetCar").addEventListener("click", manualResetVehicle);
  $("#endRace").addEventListener("click", () => endRace(true));
  $("#toGarage").addEventListener("click", () => {
    showView("garage");
    renderHub();
  });
  $("#nextRace").addEventListener("click", () => {
    const idx = races.findIndex((race) => race.id === selectedRace.id);
    selectedRace = races[Math.min(races.length - 1, idx + 1)];
    showView("garage");
    renderHub();
  });
  $("#pauseBtn").addEventListener("click", () => {
    input.paused = !input.paused;
    $("#pauseBtn").textContent = input.paused ? "Play" : "Pause";
  });
  $("#refreshDirector").addEventListener("click", () => {
    renderDirector();
    renderRaces();
    renderUpgrades();
    showToast("AI tuning refreshed for this driver.");
  });
  $$(".camera-btn").forEach((btn) => {
    btn.addEventListener("click", () => setCameraMode(btn.dataset.camera));
  });
  $$(".renderer-btn").forEach((btn) => {
    btn.addEventListener("click", () => setRendererMode(btn.dataset.renderer));
  });
  bindHold($("#leftBtn"), "left");
  bindHold($("#rightBtn"), "right");
  bindHold($("#gasBtn"), "gas");
  bindHold($("#brakeBtn"), "brake");
  bindHold($("#boostBtn"), "boost");
  $$(".mobile-control").forEach((button) => bindMobileControl(button));
  bindDriveStickPointerControl();
  const mobileLayer = $(".mobile-drive-controls");
  mobileLayer.addEventListener("touchstart", handleMobileTouchStart, { passive: false });
  mobileLayer.addEventListener("touchmove", handleMobileTouchMove, { passive: false });
  mobileLayer.addEventListener("touchend", handleMobileTouchEnd, { passive: false });
  mobileLayer.addEventListener("touchcancel", handleMobileTouchEnd, { passive: false });
  window.addEventListener("keydown", (event) => setKey(event, true));
  window.addEventListener("keyup", (event) => setKey(event, false));
  const resizeGame = () => {
    syncViewportSize();
    fitCanvas();
  };
  window.addEventListener("resize", resizeGame);
  window.addEventListener("orientationchange", () => setTimeout(resizeGame, 180));
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resizeGame);
    window.visualViewport.addEventListener("scroll", resizeGame);
  }
  window.addEventListener("gamepadconnected", (event) => setController(event.gamepad));
  window.addEventListener("gamepaddisconnected", () => clearController());
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showToast("App install is available.");
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showToast("Velocity Vault installed.");
  });
}

function bindHold(button, key) {
  const start = (event) => {
    event.preventDefault();
    input[key] = true;
    if (button.setPointerCapture && event.pointerId !== undefined) {
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers reject capture after synthetic pointer events.
      }
    }
  };
  const stop = (event) => {
    if (event) event.preventDefault();
    input[key] = false;
    if (button.releasePointerCapture && event && event.pointerId !== undefined) {
      try {
        button.releasePointerCapture(event.pointerId);
      } catch {
        // Capture may already be released by the browser.
      }
    }
  };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("lostpointercapture", stop);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

function bindMobileControl(button) {
  const control = button.dataset.control;
  const start = (event) => {
    if (event.pointerType === "touch" && mobileTouchState.usingTouchEvents) return;
    event.preventDefault();
    startAudio();
    if (audioSystem && audioSystem.ctx.state === "suspended") audioSystem.ctx.resume();
    if (control === "size") {
      setTouchControlSize(touchControlSize === "mini" ? "full" : "mini");
      return;
    }
    if (control === "mode") {
      setTouchDriveMode(touchDriveMode === "toggle" ? "hold" : "toggle");
      return;
    }
    if (touchDriveMode === "toggle") {
      toggleDriveInput(control);
      updateRaceUi();
      return;
    }
    setDriveInput(control, true);
    updateRaceUi();
    if (button.setPointerCapture && event.pointerId !== undefined) {
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers reject capture after synthetic pointer events.
      }
    }
  };
  const stop = (event) => {
    if (event && event.pointerType === "touch" && mobileTouchState.usingTouchEvents) return;
    if (event) event.preventDefault();
    if (touchDriveMode === "toggle" || control === "mode" || control === "size") return;
    setDriveInput(control, false);
    updateRaceUi();
    if (button.releasePointerCapture && event && event.pointerId !== undefined) {
      try {
        button.releasePointerCapture(event.pointerId);
      } catch {
        // Capture may already be released by the browser.
      }
    }
  };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("lostpointercapture", stop);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

function setController(gamepad) {
  controllerState.connected = true;
  controllerState.name = gamepad.id || "Gamepad";
  controllerState.index = gamepad.index;
  $("#controllerChip").textContent = "Controller: On";
  $("#controllerName").textContent = controllerState.name;
  showToast("Controller connected.");
}

function clearController() {
  controllerState.connected = false;
  controllerState.name = "";
  controllerState.index = null;
  input.gamepadSteer = 0;
  input.gamepadGas = false;
  input.gamepadBrake = false;
  input.gamepadBoost = false;
  input.gamepadPauseHeld = false;
  input.gamepadResetHeld = false;
  $("#controllerChip").textContent = "Controller: Off";
  $("#controllerName").textContent = "Bluetooth controller ready";
  showToast("Controller disconnected.");
}

function pollGamepad() {
  if (!navigator.getGamepads) return;
  const pads = navigator.getGamepads();
  const pad = controllerState.index !== null ? pads[controllerState.index] : Array.from(pads).find(Boolean);
  if (!pad) {
    if (controllerState.connected) clearController();
    return;
  }
  if (!controllerState.connected) setController(pad);
  const stick = Math.abs(pad.axes[0] || 0) > 0.18 ? pad.axes[0] : 0;
  const dpadLeft = pad.buttons[14] && pad.buttons[14].pressed;
  const dpadRight = pad.buttons[15] && pad.buttons[15].pressed;
  input.gamepadSteer = dpadLeft ? -1 : dpadRight ? 1 : stick;
  input.gamepadGas = Boolean((pad.buttons[7] && pad.buttons[7].value > 0.18) || (pad.buttons[0] && pad.buttons[0].pressed));
  input.gamepadBrake = Boolean((pad.buttons[6] && pad.buttons[6].value > 0.18) || (pad.buttons[2] && pad.buttons[2].pressed));
  input.gamepadBoost = Boolean((pad.buttons[1] && pad.buttons[1].pressed) || (pad.buttons[5] && pad.buttons[5].pressed));
  const pausePressed = Boolean((pad.buttons[9] && pad.buttons[9].pressed) || (pad.buttons[8] && pad.buttons[8].pressed));
  if (pausePressed && !input.gamepadPauseHeld) {
    input.paused = !input.paused;
    $("#pauseBtn").textContent = input.paused ? "Play" : "Pause";
  }
  input.gamepadPauseHeld = pausePressed;
  const resetPressed = Boolean(pad.buttons[3] && pad.buttons[3].pressed);
  if (resetPressed && !input.gamepadResetHeld) manualResetVehicle();
  input.gamepadResetHeld = resetPressed;
}

function setKey(event, down) {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") input.left = down;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") input.right = down;
  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") input.gas = down;
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") input.brake = down;
  if (event.key === " ") input.boost = down;
  if (event.key.toLowerCase() === "p" && down) {
    input.paused = !input.paused;
    $("#pauseBtn").textContent = input.paused ? "Play" : "Pause";
  }
  if (event.key.toLowerCase() === "r" && down) manualResetVehicle();
}

bindEvents();
syncViewportSize();
fitCanvas();
updateHud();
applyPhoneGraphicsDefaults();
setCameraMode(cameraMode, true);
setTouchDriveMode(touchDriveMode, true);
setTouchControlSize(touchControlSize, true);
initWebGLRenderer();
setRendererMode(rendererMode, true);
registerOfflineApp();
drawFrame();

"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const canvas = $("#gameCanvas");
const ctx = canvas.getContext("2d");

const storeKey = "velocityVaultProfilesV1";
const ageBands = {
  rookie: { label: "Rookie 5-8", help: "Wide lanes, bigger coin streaks, cheerful missions.", speed: 0.86, traffic: 0.72, rewards: 1.18 },
  prodigy: { label: "Prodigy 9-12", help: "Sharper goals, more traffic, better rewards.", speed: 1, traffic: 1, rewards: 1 },
  elite: { label: "Elite 13+", help: "Fast pace, tighter windows, premium rep bonuses.", speed: 1.17, traffic: 1.25, rewards: 1.15 },
  family: { label: "Family All", help: "Balanced settings made for pass-and-play.", speed: 0.96, traffic: 0.9, rewards: 1.05 }
};

const races = [
  { id: "neon", name: "Neon Harbor Sprint", length: 3600, target: "Collect 18 coins", type: "coins", goal: 18, reward: 150, rep: 16, theme: ["#0c1a1b", "#46d9ff", "#bbf24a"] },
  { id: "skyline", name: "Skyline Focus Run", length: 4300, target: "Keep focus above 60", type: "focus", goal: 60, reward: 180, rep: 20, theme: ["#12151d", "#ffd166", "#46d9ff"] },
  { id: "canyon", name: "Canyon Drift Clash", length: 5000, target: "Dodge 30 rivals", type: "dodges", goal: 30, reward: 220, rep: 28, theme: ["#15110c", "#ff5b6b", "#ffd166"] },
  { id: "vault", name: "Vault Grand Prix", length: 6200, target: "Score 5000 points", type: "score", goal: 5000, reward: 320, rep: 42, theme: ["#09100f", "#bbf24a", "#46d9ff"] }
];

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

const input = {
  left: false,
  right: false,
  boost: false,
  paused: false,
  gamepadSteer: 0,
  gamepadBoost: false,
  gamepadPauseHeld: false
};

const controllerState = {
  connected: false,
  name: "",
  index: null
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
  roadOffset: 0,
  spawnClock: 0,
  coinClock: 0,
  rivals: [],
  coinsOnRoad: [],
  particles: [],
  elapsed: 0,
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

function makeProfile(name, pin, age) {
  return {
    id: `${age}:${name.toLowerCase()}`,
    name,
    pinHash: pin ? hashPin(pin) : "",
    age,
    coins: 250,
    rep: 0,
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
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
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

function renderHub() {
  if (!activeProfile) return;
  $("#driverSummary").textContent = `${ageBands[activeProfile.age].label} | ${activeProfile.coins} coins | ${activeProfile.rep} rep | Power ${profilePower(activeProfile)}`;
  renderRaces();
  renderUpgrades();
  renderMissions();
  renderDirector();
}

function renderRaces() {
  const list = $("#raceList");
  list.innerHTML = "";
  const director = getDirector(activeProfile);
  races.forEach((race, index) => {
    const locked = activeProfile.rep < index * 22;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `race-card ${selectedRace.id === race.id ? "selected" : ""}`;
    card.disabled = locked;
    card.innerHTML = `
      <div class="card-top"><strong>${race.name}</strong><span class="badge">${locked ? `${index * 22} rep` : `${Math.round(race.reward * director.reward)} coins`}</span></div>
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
  const age = ageBands[activeProfile.age];
  const director = getDirector(activeProfile);
  Object.assign(raceState, {
    active: true,
    distance: 0,
    speed: 90 * age.speed + activeProfile.upgrades.engine * 10,
    focus: 100,
    score: 0,
    coins: 0,
    dodges: 0,
    combo: 1,
    lane: 0,
    x: 0,
    roadOffset: 0,
    spawnClock: 0,
    coinClock: 0,
    rivals: [],
    coinsOnRoad: [],
    particles: [],
    elapsed: 0,
    countdown: 0,
    finished: false,
    director
  });
  $("#raceTitle").textContent = selectedRace.name;
  $("#raceBrief").textContent = selectedRace.target;
  $("#modeChip").textContent = selectedRace.name;
  $("#missionChip").textContent = `${selectedRace.target} | ${director.event.name}`;
  showView("race");
  showToast("Race launched. Keyboard, touch, or Bluetooth controller ready.");
}

function endRace(manual = false) {
  if (!raceState.active) return;
  raceState.active = false;
  if (manual) {
    showView("garage");
    renderHub();
    return;
  }
  const success = missionProgress() >= 1 && raceState.focus > 0;
  const age = ageBands[activeProfile.age];
  const directorReward = raceState.director ? raceState.director.reward : 1;
  const reward = Math.round((selectedRace.reward + raceState.coins * 7 + (success ? 80 : 20)) * age.rewards * directorReward);
  const rep = success ? selectedRace.rep : Math.ceil(selectedRace.rep / 3);
  activeProfile.coins += reward;
  activeProfile.rep += rep;
  activeProfile.stats.races += 1;
  activeProfile.stats.wins += success ? 1 : 0;
  activeProfile.stats.totalCoins += raceState.coins;
  activeProfile.stats.bestScore = Math.max(activeProfile.stats.bestScore, Math.round(raceState.score));
  if (raceState.focus >= 50) activeProfile.stats.steadyRuns += 1;
  profiles[activeProfile.id] = activeProfile;
  saveProfiles();
  $("#finishTitle").textContent = success ? "Challenge Cleared" : "Race Complete";
  $("#finishStats").innerHTML = `
    <div><span>Coins earned</span><strong>${reward}</strong></div>
    <div><span>Reputation</span><strong>+${rep}</strong></div>
    <div><span>Score</span><strong>${Math.round(raceState.score)}</strong></div>
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
  $("#repStat").textContent = activeProfile ? activeProfile.rep : 0;
  $("#speedStat").textContent = Math.max(0, Math.round(raceState.speed));
  $("#focusStat").textContent = Math.max(0, Math.round(raceState.focus));
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
    showToast("To install on a phone, host this folder on HTTPS, then add it to the home screen.");
    return;
  }
  showToast("Use your browser menu to install or add Velocity Vault to the home screen.");
}

function spawnRival() {
  const age = ageBands[activeProfile.age];
  const director = raceState.director || getDirector(activeProfile);
  const lane = Math.floor(Math.random() * 5) - 2;
  raceState.rivals.push({
    lane,
    y: -120,
    w: 54,
    h: 92,
    speed: 210 + Math.random() * 130 * age.traffic * director.traffic,
    color: Math.random() > 0.5 ? "#ff5b6b" : "#ffd166",
    passed: false
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
  const steerPower = 2.15 + upgrades.tires * 0.22;
  const boostInput = input.boost || input.gamepadBoost;
  const boostPower = boostInput && raceState.focus > 2 ? 72 + upgrades.boost * 16 : 0;
  const topSpeed = (245 + upgrades.engine * 26) * age.speed + boostPower;
  raceState.speed += (topSpeed - raceState.speed) * Math.min(1, dt * 1.8);
  if (boostInput && raceState.focus > 2) raceState.focus -= dt * Math.max(4, 13 - upgrades.boost * 1.4);
  const keySteer = Number(input.right) - Number(input.left);
  const steerInput = Math.abs(input.gamepadSteer) > Math.abs(keySteer) ? input.gamepadSteer : keySteer;
  raceState.lane += steerInput * steerPower * dt;
  raceState.lane += (0 - raceState.lane) * dt * 0.18;
  raceState.lane = Math.max(-2.18, Math.min(2.18, raceState.lane));
  raceState.distance += raceState.speed * dt;
  raceState.roadOffset += raceState.speed * dt;
  raceState.elapsed += dt;
  raceState.score += dt * raceState.speed * raceState.combo * 0.32;
  raceState.spawnClock -= dt;
  raceState.coinClock -= dt;
  if (raceState.spawnClock <= 0) {
    spawnRival();
    raceState.spawnClock = Math.max(0.48, 1.14 - age.traffic * director.traffic * 0.16 - raceState.elapsed * 0.004);
  }
  if (raceState.coinClock <= 0) {
    spawnCoin();
    raceState.coinClock = Math.max(0.3, (0.76 - upgrades.magnet * 0.035) / director.coinRate);
  }
  moveObjects(dt);
  if (raceState.focus <= 0 || raceState.distance >= selectedRace.length) endRace(false);
  updateRaceUi();
}

function moveObjects(dt) {
  const carLane = raceState.lane;
  raceState.rivals.forEach((rival) => {
    rival.y += rival.speed * dt;
    if (!rival.passed && rival.y > canvas.height * 0.72) {
      rival.passed = true;
      raceState.dodges += 1;
      raceState.combo = Math.min(5, raceState.combo + 0.12);
    }
    const laneHit = Math.abs(rival.lane - carLane) < 0.52;
    const yHit = rival.y > canvas.height * 0.64 && rival.y < canvas.height * 0.87;
    if (laneHit && yHit && !rival.hit) {
      rival.hit = true;
      const shield = activeProfile.upgrades.shield;
      raceState.focus -= Math.max(8, 24 - shield * 3.4);
      raceState.combo = 1;
      burst(canvas.width / 2 + carLane * laneWidth(), canvas.height * 0.76, "#ff5b6b");
      showToast("Impact absorbed. Hold focus.");
    }
  });
  const magnet = activeProfile.upgrades.magnet;
  raceState.coinsOnRoad.forEach((coin) => {
    coin.y += (240 + raceState.speed * 0.2) * dt;
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
    }
  });
  raceState.rivals = raceState.rivals.filter((r) => r.y < canvas.height + 120 && !r.hit);
  raceState.coinsOnRoad = raceState.coinsOnRoad.filter((c) => c.y < canvas.height + 80 && !c.hit);
  raceState.particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  });
  raceState.particles = raceState.particles.filter((p) => p.life > 0);
}

function burst(x, y, color) {
  for (let i = 0; i < 16; i += 1) {
    raceState.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 240,
      vy: (Math.random() - 0.8) * 220,
      life: 0.35 + Math.random() * 0.35,
      color
    });
  }
}

function updateRaceUi() {
  $("#distanceBar").style.width = `${Math.min(100, (raceState.distance / selectedRace.length) * 100)}%`;
  $("#missionBar").style.width = `${Math.min(100, missionProgress() * 100)}%`;
  updateHud();
}

function laneWidth() {
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
  const theme = selectedRace ? selectedRace.theme : races[0].theme;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, theme[0]);
  sky.addColorStop(0.6, "#08100f");
  sky.addColorStop(1, "#050807");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  drawCity(w, h, theme);
  drawRoad(w, h, theme);
  drawObjects();
  drawCar(w, h);
  drawParticles();
  if (!raceState.active) drawAttract(w, h);
  if (input.paused && raceState.active) drawPause(w, h);
  requestAnimationFrame(loop);
}

function drawCity(w, h, theme) {
  ctx.save();
  for (let i = 0; i < 28; i += 1) {
    const x = ((i * 97 + raceState.roadOffset * 0.08) % (w + 160)) - 80;
    const bh = 70 + ((i * 43) % 160);
    ctx.fillStyle = i % 3 === 0 ? "rgba(70,217,255,0.14)" : "rgba(255,255,255,0.07)";
    ctx.fillRect(x, h * 0.34 - bh, 46 + (i % 4) * 12, bh);
    ctx.fillStyle = theme[i % 2 + 1];
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x + 8, h * 0.34 - bh + 16, 8, 8);
    ctx.fillRect(x + 28, h * 0.34 - bh + 40, 8, 8);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawRoad(w, h, theme) {
  const horizon = h * 0.36;
  const roadTop = w * 0.18;
  const roadBottom = w * 0.82;
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadTop, horizon);
  ctx.lineTo(w / 2 + roadTop, horizon);
  ctx.lineTo(w / 2 + roadBottom, h);
  ctx.lineTo(w / 2 - roadBottom, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#222826";
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadTop * 0.86, horizon);
  ctx.lineTo(w / 2 + roadTop * 0.86, horizon);
  ctx.lineTo(w / 2 + roadBottom * 0.7, h);
  ctx.lineTo(w / 2 - roadBottom * 0.7, h);
  ctx.closePath();
  ctx.fill();
  const stripeCount = 18;
  for (let i = 0; i < stripeCount; i += 1) {
    const y = ((i * 80 + raceState.roadOffset * 1.35) % (h + 160)) - 80;
    const t = Math.max(0, (y - horizon) / (h - horizon));
    const width = 7 + t * 18;
    const len = 28 + t * 80;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.2)" : theme[1];
    for (let lane = -2; lane <= 2; lane += 1) {
      const x = w / 2 + lane * laneWidth() * (0.28 + t * 0.92);
      ctx.fillRect(x - width / 2, y, width, len);
    }
  }
  ctx.strokeStyle = theme[2];
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadTop * 0.9, horizon);
  ctx.lineTo(w / 2 - roadBottom * 0.7, h);
  ctx.moveTo(w / 2 + roadTop * 0.9, horizon);
  ctx.lineTo(w / 2 + roadBottom * 0.7, h);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function objectPos(lane, y) {
  const h = canvas.height;
  const t = Math.max(0, y / h);
  return {
    x: canvas.width / 2 + lane * laneWidth() * (0.42 + t * 0.72),
    y,
    scale: 0.52 + t * 0.55
  };
}

function drawObjects() {
  raceState.coinsOnRoad.forEach((coin) => {
    const p = objectPos(coin.lane, coin.y);
    const r = coin.r * p.scale + Math.sin(coin.pulse) * 2;
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff3b0";
    ctx.beginPath();
    ctx.arc(p.x - r * 0.25, p.y - r * 0.25, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  });
  raceState.rivals.forEach((rival) => {
    const p = objectPos(rival.lane, rival.y);
    drawVehicle(p.x, p.y, rival.w * p.scale, rival.h * p.scale, rival.color, false);
  });
}

function drawCar(w, h) {
  const x = w / 2 + raceState.lane * laneWidth();
  const y = h * 0.78;
  drawVehicle(x, y, 76, 118, "#46d9ff", true);
  if ((input.boost || input.gamepadBoost) && raceState.active) {
    ctx.fillStyle = "rgba(255,209,102,0.82)";
    ctx.beginPath();
    ctx.moveTo(x - 22, y + 60);
    ctx.lineTo(x, y + 116 + Math.random() * 26);
    ctx.lineTo(x + 22, y + 60);
    ctx.closePath();
    ctx.fill();
  }
}

function drawVehicle(x, y, width, height, color, player) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(0, height * 0.38, width * 0.58, height * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(-width / 2, -height / 2, width, height, 10);
  ctx.fill();
  ctx.fillStyle = player ? "#bbf24a" : "#111817";
  roundRect(-width * 0.32, -height * 0.28, width * 0.64, height * 0.33, 8);
  ctx.fill();
  ctx.fillStyle = "#050807";
  ctx.fillRect(-width * 0.46, -height * 0.24, width * 0.13, height * 0.28);
  ctx.fillRect(width * 0.33, -height * 0.24, width * 0.13, height * 0.28);
  ctx.fillRect(-width * 0.46, height * 0.14, width * 0.13, height * 0.28);
  ctx.fillRect(width * 0.33, height * 0.14, width * 0.13, height * 0.28);
  ctx.fillStyle = player ? "#f4fbf8" : "#ffd166";
  ctx.fillRect(-width * 0.28, -height * 0.48, width * 0.18, height * 0.08);
  ctx.fillRect(width * 0.1, -height * 0.48, width * 0.18, height * 0.08);
  ctx.restore();
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
    ctx.globalAlpha = Math.max(0, p.life / 0.7);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 + p.life * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawAttract(w, h) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(5,8,7,0.58)";
  roundRect(w / 2 - 270, h * 0.47 - 70, 540, 140, 8);
  ctx.fill();
  ctx.fillStyle = "#f4fbf8";
  ctx.font = "900 38px system-ui";
  ctx.fillText("Build. Boost. Beat the Vault.", w / 2, h * 0.47);
  ctx.fillStyle = "#a9bbb5";
  ctx.font = "700 16px system-ui";
  ctx.fillText("Pick a driver, tune your car, and chase missions.", w / 2, h * 0.47 + 34);
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

function fitCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(640, Math.floor(rect.width));
  canvas.height = Math.max(420, Math.floor(rect.height));
}

function bindEvents() {
  $$(".age-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedAge = btn.dataset.age;
      $$(".age-card").forEach((item) => item.classList.toggle("selected", item === btn));
    });
  });
  $("#startProfile").addEventListener("click", () => {
    const name = sanitizeName($("#driverName").value);
    const pin = $("#driverPin").value.replace(/\D/g, "").slice(0, 6);
    const id = `${selectedAge}:${name.toLowerCase()}`;
    const existing = profiles[id];
    if (existing && existing.pinHash && existing.pinHash !== hashPin(pin)) {
      showToast("PIN did not match this local profile.");
      return;
    }
    const profile = existing || makeProfile(name, pin, selectedAge);
    profiles[profile.id] = profile;
    saveProfiles();
    setActiveProfile(profile);
  });
  $("#installApp").addEventListener("click", installApp);
  $("#resetProfiles").addEventListener("click", () => {
    if (!confirm("Clear all local Velocity Vault profiles on this device?")) return;
    profiles = {};
    saveProfiles();
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
  bindHold($("#leftBtn"), "left");
  bindHold($("#rightBtn"), "right");
  bindHold($("#boostBtn"), "boost");
  window.addEventListener("keydown", (event) => setKey(event, true));
  window.addEventListener("keyup", (event) => setKey(event, false));
  window.addEventListener("resize", fitCanvas);
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
  };
  const stop = () => {
    input[key] = false;
  };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointerleave", stop);
  button.addEventListener("pointercancel", stop);
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
  input.gamepadBoost = false;
  input.gamepadPauseHeld = false;
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
  input.gamepadBoost = Boolean(
    (pad.buttons[0] && pad.buttons[0].pressed) ||
    (pad.buttons[7] && pad.buttons[7].value > 0.35) ||
    (pad.buttons[6] && pad.buttons[6].value > 0.35)
  );
  const pausePressed = Boolean((pad.buttons[9] && pad.buttons[9].pressed) || (pad.buttons[8] && pad.buttons[8].pressed));
  if (pausePressed && !input.gamepadPauseHeld) {
    input.paused = !input.paused;
    $("#pauseBtn").textContent = input.paused ? "Play" : "Pause";
  }
  input.gamepadPauseHeld = pausePressed;
}

function setKey(event, down) {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") input.left = down;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") input.right = down;
  if (event.key === " " || event.key === "ArrowUp" || event.key.toLowerCase() === "w") input.boost = down;
  if (event.key.toLowerCase() === "p" && down) {
    input.paused = !input.paused;
    $("#pauseBtn").textContent = input.paused ? "Play" : "Pause";
  }
}

bindEvents();
fitCanvas();
updateHud();
registerOfflineApp();
drawFrame();

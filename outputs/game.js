const levels = [
  {
    title: "Tutorial: First Sprouts",
    reward: "Ring the dewdrop bell.",
    size: 5,
    seeds: 2,
    maxTurns: 3,
    rule: "Sprout",
    ruleText: "A planted cell stays alive. Empty cells bloom when they touch exactly one living neighbor.",
    goalText: "Paint one or two cells in the green patch, then press Grow. The first charm spreads outward one step at a time.",
    paintable: rect(0, 2, 2, 2),
    targets: [[2, 2]],
    rocks: [],
    tutorialHints: true,
    solution: [[1, 2]],
    update: sproutRule
  },
  {
    title: "Meadow Primer",
    reward: "Wake the moonflower.",
    size: 6,
    seeds: 3,
    maxTurns: 4,
    rule: "Sprout",
    ruleText: "A planted cell stays alive. Empty cells bloom when they touch exactly one living neighbor.",
    goalText: "Paint up to three cells in the soft green patch, then grow until a sprout reaches the golden reward.",
    paintable: rect(0, 2, 3, 3),
    targets: [[5, 2]],
    rocks: [],
    solution: [[2, 3]],
    update: sproutRule
  },
  {
    title: "Brook Crossing",
    reward: "Light the pebble bridge.",
    size: 7,
    seeds: 4,
    maxTurns: 5,
    rule: "Pairing",
    ruleText: "Living cells survive with one or two neighbors. Empty cells bloom with exactly two neighbors.",
    goalText: "Use pairs to carry life across the board. Light both reward tiles before the charm fades.",
    paintable: rect(0, 1, 3, 5),
    targets: [[5, 1], [6, 1]],
    rocks: [[3, 0], [3, 1], [3, 5], [3, 6]],
    solution: [[2, 2], [2, 3]],
    update: pairingRule
  },
  {
    title: "Clockwork Glade",
    reward: "Start the brass sunflower.",
    size: 9,
    seeds: 5,
    maxTurns: 6,
    rule: "Life",
    ruleText: "Classic Conway rules: survive with two or three neighbors, bloom with exactly three.",
    goalText: "Shape a small glider that drifts beyond the planting patch and touches the reward tile.",
    paintable: rect(0, 1, 4, 7),
    targets: [[4, 5]],
    rocks: [[5, 0], [6, 1], [7, 7], [5, 8], [7, 2], [8, 6]],
    solution: [[2, 2], [3, 3], [1, 4], [2, 4], [3, 4]],
    update: lifeRule
  },
  {
    title: "Starling Orchard",
    reward: "Open the tiny sky gate.",
    size: 11,
    seeds: 7,
    maxTurns: 12,
    rule: "Life",
    ruleText: "Classic Conway rules with old stones blocking growth. Count all eight surrounding cells.",
    goalText: "Send a glider through the open orchard lane and land on the far reward tile.",
    paintable: [...rect(0, 2, 4, 7), ...rect(1, 1, 2, 9)],
    targets: [[5, 9]],
    rocks: [[5, 0], [6, 1], [8, 2], [9, 4], [7, 9], [9, 9], [10, 6]],
    solution: [[1, 4], [2, 5], [0, 6], [1, 6], [2, 6]],
    update: lifeRule
  },
  {
    title: "Twin Grove Relay",
    reward: "Tie the two ribbon bells.",
    size: 16,
    seeds: 10,
    maxTurns: 10,
    rule: "Life",
    ruleText: "Classic Conway rules with two separated planting patches and stones that move before each Grow.",
    goalText: "Build in both green patches. Each little grove must send growth inward while the center stones slide to their next marked spots.",
    paintable: [...rect(1, 2, 3, 3), ...rect(12, 2, 3, 3)],
    targets: [[5, 6], [10, 6]],
    rocks: [[7, 1], [8, 1], [7, 9], [8, 9], [0, 7], [15, 7], [7, 12], [8, 12]],
    movingRocks: [
      { positions: [[7, 4], [7, 5], [7, 6], [7, 7], [7, 8], [7, 7], [7, 6], [7, 5], [7, 4], [7, 5], [7, 6]] },
      { positions: [[8, 8], [8, 7], [8, 6], [8, 5], [8, 4], [8, 5], [8, 6], [8, 7], [8, 8], [8, 7], [8, 6]] }
    ],
    solution: [[2, 2], [3, 3], [1, 4], [2, 4], [3, 4], [13, 2], [12, 3], [14, 4], [13, 4], [12, 4]],
    update: lifeRule
  }
];

const ruleExamples = {
  Sprout: {
    title: "One neighbor wakes a new sprout",
    before: [".....", ".....", "..#..", ".....", "....."],
    after: [".....", ".###.", ".###.", ".###.", "....."],
    note: "The planted sprout remains, and every empty cell touching it blooms."
  },
  Pairing: {
    title: "Pairs invite new growth",
    before: [".....", "..#..", ".....", "..#..", "....."],
    after: [".....", ".....", "..#..", ".....", "....."],
    note: "An empty cell with exactly two neighbors blooms. Lonely sprouts fade."
  },
  Life: {
    title: "Three gather, two or three endure",
    before: [".....", "..#..", "..#..", "..#..", "....."],
    after: [".....", ".....", ".###.", ".....", "....."],
    note: "Classic Life: empty cells need three neighbors; living cells survive with two or three."
  }
};

const board = document.querySelector("#board");
const levelTitle = document.querySelector("#levelTitle");
const levelCounter = document.querySelector("#levelCounter");
const rewardText = document.querySelector("#rewardText");
const rewardBox = document.querySelector("#rewardBox");
const seedCount = document.querySelector("#seedCount");
const turnCount = document.querySelector("#turnCount");
const ruleName = document.querySelector("#ruleName");
const goalText = document.querySelector("#goalText");
const ruleText = document.querySelector("#ruleText");
const ruleModal = document.querySelector("#ruleModal");
const ruleModalTitle = document.querySelector("#ruleModalTitle");
const ruleAnimation = document.querySelector("#ruleAnimation");
const ruleModalNote = document.querySelector("#ruleModalNote");
const startLevelBtn = document.querySelector("#startLevelBtn");
const rulePreviewList = document.querySelector("#rulePreviewList");
const completionModal = document.querySelector("#completionModal");
const completionTitle = document.querySelector("#completionTitle");
const completionReward = document.querySelector("#completionReward");
const completionPattern = document.querySelector("#completionPattern");
const completionStats = document.querySelector("#completionStats");
const completionReplayBtn = document.querySelector("#completionReplayBtn");
const completionNextBtn = document.querySelector("#completionNextBtn");
const stepBtn = document.querySelector("#stepBtn");
const runBtn = document.querySelector("#runBtn");
const hintBtn = document.querySelector("#hintBtn");
const undoBtn = document.querySelector("#undoBtn");
const resetBtn = document.querySelector("#resetBtn");
const editorBtn = document.querySelector("#editorBtn");
const audioBtn = document.querySelector("#audioBtn");
const editorModal = document.querySelector("#editorModal");
const editorCloseBtn = document.querySelector("#editorCloseBtn");
const editorLoadBtn = document.querySelector("#editorLoadBtn");
const editorClearBtn = document.querySelector("#editorClearBtn");
const editorBoard = document.querySelector("#editorBoard");
const editorModes = document.querySelector("#editorModes");
const editorName = document.querySelector("#editorName");
const editorReward = document.querySelector("#editorReward");
const editorGoal = document.querySelector("#editorGoal");
const editorSize = document.querySelector("#editorSize");
const editorSeeds = document.querySelector("#editorSeeds");
const editorTurns = document.querySelector("#editorTurns");
const editorRule = document.querySelector("#editorRule");
const editorExport = document.querySelector("#editorExport");
const audioModal = document.querySelector("#audioModal");
const audioCloseBtn = document.querySelector("#audioCloseBtn");
const soundToggleBtn = document.querySelector("#soundToggleBtn");
const musicToggleBtn = document.querySelector("#musicToggleBtn");
const soundVolume = document.querySelector("#soundVolume");
const musicVolume = document.querySelector("#musicVolume");
const musicTrack = document.querySelector("#musicTrack");
const prevLevel = document.querySelector("#prevLevel");
const nextLevel = document.querySelector("#nextLevel");
const confetti = document.querySelector("#confetti");
const confettiCtx = confetti.getContext("2d");

let levelIndex = 0;
let alive = new Set();
let history = [];
let turns = 0;
let running = false;
let won = false;
let runTimer = null;
let revealedHints = new Set();
let newGrowth = new Set();
let fadingGrowth = new Set();
let ruleModalOpen = true;
let completionOpen = false;
let soundEnabled = true;
let musicEnabled = false;
let audioModalOpen = false;
let editorModalOpen = false;
let soundVolumeLevel = .7;
let musicVolumeLevel = .45;
let audioContext = null;
let activeRule = null;
const seenRules = new Set();
let editorState = createBlankEditorState();

function rect(x, y, width, height) {
  const cells = [];
  for (let cy = y; cy < y + height; cy += 1) {
    for (let cx = x; cx < x + width; cx += 1) cells.push([cx, cy]);
  }
  return cells;
}

function key(x, y) {
  return `${x},${y}`;
}

function parseKey(cellKey) {
  return cellKey.split(",").map(Number);
}

function flowerKind(x, y, turn) {
  return ((x * 17 + y * 31 + turn * 7) % 11) === 0 ? "flower" : "";
}

function currentLevel() {
  return levels[levelIndex];
}

function hasCell(list, x, y) {
  return list.some(([cx, cy]) => cx === x && cy === y);
}

function rockSetAt(level, turn) {
  const rocks = new Set((level.rocks || []).map(([x, y]) => key(x, y)));
  (level.movingRocks || []).forEach((wall) => {
    const [x, y] = wall.positions[Math.min(turn, wall.positions.length - 1)];
    rocks.add(key(x, y));
  });
  return rocks;
}

function hasRockAt(level, turn, x, y) {
  return rockSetAt(level, turn).has(key(x, y));
}

function inBounds(level, x, y) {
  return x >= 0 && y >= 0 && x < level.size && y < level.size;
}

function neighborCount(level, source, x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (inBounds(level, nx, ny) && source.has(key(nx, ny))) count += 1;
    }
  }
  return count;
}

function sproutRule(level, source, x, y) {
  if (source.has(key(x, y))) return true;
  return neighborCount(level, source, x, y) === 1;
}

function pairingRule(level, source, x, y) {
  const neighbors = neighborCount(level, source, x, y);
  if (source.has(key(x, y))) return neighbors === 1 || neighbors === 2;
  return neighbors === 2;
}

function lifeRule(level, source, x, y) {
  const neighbors = neighborCount(level, source, x, y);
  if (source.has(key(x, y))) return neighbors === 2 || neighbors === 3;
  return neighbors === 3;
}

function resetLevel(index = levelIndex) {
  stopRun();
  levelIndex = index;
  alive = new Set();
  history = [];
  turns = 0;
  won = false;
  revealedHints = new Set();
  newGrowth = new Set();
  fadingGrowth = new Set();
  completionOpen = false;
  activeRule = currentLevel().rule;
  ruleModalOpen = !seenRules.has(activeRule);
  render();
}

function livingSeedsUsed() {
  const level = currentLevel();
  return [...alive].filter((cellKey) => {
    const [x, y] = parseKey(cellKey);
    return hasCell(level.paintable, x, y) && !hasRockAt(level, turns, x, y);
  }).length;
}

function pushHistory() {
  history.push({ alive: new Set(alive), turns, won });
  if (history.length > 20) history.shift();
}

function revealHint() {
  const level = currentLevel();
  if (ruleModalOpen || turns > 0 || won) return;
  const nextHint = level.solution.find(([x, y]) => !revealedHints.has(key(x, y)));
  if (!nextHint) return;
  revealedHints.add(key(nextHint[0], nextHint[1]));
  playSound("hint");
  render();
}

function toggleCell(x, y) {
  const level = currentLevel();
  if (ruleModalOpen || won || turns > 0 || !hasCell(level.paintable, x, y) || hasRockAt(level, turns, x, y)) return;
  const cellKey = key(x, y);
  pushHistory();
  newGrowth = new Set();
  fadingGrowth = new Set();
  if (alive.has(cellKey)) {
    alive.delete(cellKey);
  } else if (livingSeedsUsed() < level.seeds) {
    alive.add(cellKey);
    playSound("plant");
  }
  render();
}

function step() {
  const level = currentLevel();
  if (ruleModalOpen || won || turns >= level.maxTurns || alive.size === 0) return;
  pushHistory();
  const previousAlive = new Set(alive);
  const next = new Set();
  const blocked = rockSetAt(level, turns + 1);
  for (let y = 0; y < level.size; y += 1) {
    for (let x = 0; x < level.size; x += 1) {
      if (blocked.has(key(x, y))) continue;
      if (level.update(level, alive, x, y)) next.add(key(x, y));
    }
  }
  newGrowth = new Set([...next].filter((cellKey) => !previousAlive.has(cellKey)));
  fadingGrowth = new Set([...previousAlive].filter((cellKey) => !next.has(cellKey)));
  alive = next;
  turns += 1;
  won = touchesTarget();
  if (won) {
    stopRun();
    completionOpen = true;
    playSound("reward");
    burstConfetti();
  } else {
    playSound("grow");
  }
  render();
}

function undo() {
  const previous = history.pop();
  if (!previous) return;
  stopRun();
  alive = previous.alive;
  turns = previous.turns;
  won = previous.won;
  newGrowth = new Set();
  fadingGrowth = new Set();
  completionOpen = false;
  render();
}

function toggleRun() {
  if (ruleModalOpen) return;
  if (running) {
    stopRun();
    return;
  }
  running = true;
  runBtn.textContent = "Stop";
  runTimer = window.setInterval(() => {
    const level = currentLevel();
    if (won || turns >= level.maxTurns || alive.size === 0) {
      stopRun();
      return;
    }
    step();
  }, 520);
}

function stopRun() {
  running = false;
  runBtn.textContent = "Run";
  if (runTimer) window.clearInterval(runTimer);
  runTimer = null;
}

function isTextEntryTarget(target) {
  if (!target || !target.tagName) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function handleShortcuts(event) {
  if (isTextEntryTarget(event.target) || audioModalOpen || editorModalOpen) return;
  if (event.key === "F10") {
    event.preventDefault();
    step();
  } else if (event.ctrlKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
  } else if (event.ctrlKey && event.key.toLowerCase() === "r") {
    event.preventDefault();
    resetLevel();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  render();
  if (soundEnabled) playSound("hint");
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    const playResult = musicTrack.play();
    if (playResult && playResult.catch) {
      playResult.catch(() => {
        musicEnabled = false;
        render();
      });
    }
  } else {
    musicTrack.pause();
  }
  render();
}

function openAudioModal() {
  audioModalOpen = true;
  render();
}

function closeAudioModal() {
  audioModalOpen = false;
  render();
}

function ruleUpdate(rule) {
  return { Sprout: sproutRule, Pairing: pairingRule, Life: lifeRule }[rule] || sproutRule;
}

function createBlankEditorState() {
  return {
    title: "New Grove",
    reward: "Wake a tiny charm.",
    goalText: "Paint cells, grow the charm, and reach every reward.",
    size: 7,
    seeds: 4,
    maxTurns: 6,
    rule: "Sprout",
    mode: "paintable",
    paintable: new Set(),
    targets: new Set(),
    rocks: new Set(),
    solution: new Set()
  };
}

function loadEditorFromLevel(level = currentLevel()) {
  editorState = {
    title: level.title,
    reward: level.reward,
    goalText: level.goalText,
    size: level.size,
    seeds: level.seeds,
    maxTurns: level.maxTurns,
    rule: level.rule,
    mode: "paintable",
    paintable: new Set(level.paintable.map(([x, y]) => key(x, y))),
    targets: new Set(level.targets.map(([x, y]) => key(x, y))),
    rocks: new Set((level.rocks || []).map(([x, y]) => key(x, y))),
    solution: new Set((level.solution || []).map(([x, y]) => key(x, y)))
  };
  syncEditorFieldsFromState();
}

function syncEditorFieldsFromState() {
  editorName.value = editorState.title;
  editorReward.value = editorState.reward;
  editorGoal.value = editorState.goalText;
  editorSize.value = String(editorState.size);
  editorSeeds.value = String(editorState.seeds);
  editorTurns.value = String(editorState.maxTurns);
  editorRule.value = editorState.rule;
}

function numberFromField(field, fallback, min, max) {
  const value = Number(field.value);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function trimEditorCells() {
  ["paintable", "targets", "rocks", "solution"].forEach((name) => {
    editorState[name] = new Set([...editorState[name]].filter((cellKey) => {
      const [x, y] = parseKey(cellKey);
      return x >= 0 && y >= 0 && x < editorState.size && y < editorState.size;
    }));
  });
}

function syncEditorFromFields() {
  editorState.title = editorName.value.trim() || "New Grove";
  editorState.reward = editorReward.value.trim() || "Wake a tiny charm.";
  editorState.goalText = editorGoal.value.trim() || "Paint cells, grow the charm, and reach every reward.";
  editorState.size = numberFromField(editorSize, editorState.size, 4, 16);
  editorState.seeds = numberFromField(editorSeeds, editorState.seeds, 1, 16);
  editorState.maxTurns = numberFromField(editorTurns, editorState.maxTurns, 1, 24);
  editorState.rule = editorRule.value;
  trimEditorCells();
  renderEditor();
}

function setEditorMode(mode) {
  editorState.mode = mode;
  renderEditor();
}

function toggleEditorSet(set, cellKey) {
  if (set.has(cellKey)) set.delete(cellKey);
  else set.add(cellKey);
}

function toggleEditorCell(x, y) {
  if (x < 0 || y < 0 || x >= editorState.size || y >= editorState.size) return;
  const cellKey = key(x, y);
  if (editorState.mode === "erase") {
    editorState.paintable.delete(cellKey);
    editorState.targets.delete(cellKey);
    editorState.rocks.delete(cellKey);
    editorState.solution.delete(cellKey);
  } else if (editorState.mode === "paintable") {
    toggleEditorSet(editorState.paintable, cellKey);
    if (!editorState.paintable.has(cellKey)) editorState.solution.delete(cellKey);
  } else if (editorState.mode === "target") {
    toggleEditorSet(editorState.targets, cellKey);
  } else if (editorState.mode === "rock") {
    toggleEditorSet(editorState.rocks, cellKey);
    if (editorState.rocks.has(cellKey)) {
      editorState.paintable.delete(cellKey);
      editorState.solution.delete(cellKey);
      editorState.targets.delete(cellKey);
    }
  } else if (editorState.mode === "solution") {
    editorState.paintable.add(cellKey);
    toggleEditorSet(editorState.solution, cellKey);
  }
  renderEditor();
}

function sortedCells(set) {
  return [...set].map(parseKey).sort(([ax, ay], [bx, by]) => ay - by || ax - bx);
}

function arraySource(cells) {
  return `[${cells.map(([x, y]) => `[${x}, ${y}]`).join(", ")}]`;
}

function buildEditorLevel() {
  return {
    title: editorState.title,
    reward: editorState.reward,
    size: editorState.size,
    seeds: editorState.seeds,
    maxTurns: editorState.maxTurns,
    rule: editorState.rule,
    ruleText: (levels.find((level) => level.rule === editorState.rule) || levels[0]).ruleText,
    goalText: editorState.goalText,
    paintable: sortedCells(editorState.paintable),
    targets: sortedCells(editorState.targets),
    rocks: sortedCells(editorState.rocks),
    solution: sortedCells(editorState.solution),
    update: ruleUpdate(editorState.rule)
  };
}

function editorExportText() {
  const level = buildEditorLevel();
  return `{
  title: ${JSON.stringify(level.title)},
  reward: ${JSON.stringify(level.reward)},
  size: ${level.size},
  seeds: ${level.seeds},
  maxTurns: ${level.maxTurns},
  rule: ${JSON.stringify(level.rule)},
  ruleText: ${JSON.stringify(level.ruleText)},
  goalText: ${JSON.stringify(level.goalText)},
  paintable: ${arraySource(level.paintable)},
  targets: ${arraySource(level.targets)},
  rocks: ${arraySource(level.rocks)},
  solution: ${arraySource(level.solution)},
  update: ${level.rule.toLowerCase()}Rule
}`;
}

function openEditor(blank = false) {
  editorModalOpen = true;
  if (blank) {
    editorState = createBlankEditorState();
    syncEditorFieldsFromState();
  } else {
    loadEditorFromLevel();
  }
  render();
}

function closeEditor() {
  editorModalOpen = false;
  render();
}

function clearEditor() {
  editorState = createBlankEditorState();
  syncEditorFieldsFromState();
  renderEditor();
}

function renderEditor() {
  editorModal.hidden = !editorModalOpen;
  if (!editorModalOpen) return;
  editorExport.value = editorExportText();
  editorBoard.style.gridTemplateColumns = `repeat(${editorState.size}, 1fr)`;
  editorBoard.innerHTML = "";
  for (let y = 0; y < editorState.size; y += 1) {
    for (let x = 0; x < editorState.size; x += 1) {
      const cellKey = key(x, y);
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "editor-cell";
      if (editorState.paintable.has(cellKey)) cell.className += " paintable";
      if (editorState.targets.has(cellKey)) cell.className += " target";
      if (editorState.rocks.has(cellKey)) cell.className += " rock";
      if (editorState.solution.has(cellKey)) cell.className += " solution";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `editor row ${y + 1}, column ${x + 1}`);
      cell.addEventListener("click", () => toggleEditorCell(x, y));
      editorBoard.appendChild(cell);
    }
  }
  editorModes.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("current", button.getAttribute("data-mode") === editorState.mode);
  });
}

function updateSoundVolume() {
  soundVolumeLevel = Number(soundVolume.value) / 100;
}

function updateMusicVolume() {
  musicVolumeLevel = Number(musicVolume.value) / 100;
  musicTrack.volume = musicVolumeLevel;
}

function getAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  return audioContext;
}

function playSound(kind) {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;

  const notes = {
    plant: [360, 520, .05],
    grow: [280, 420, .07],
    hint: [640, 760, .04],
    reward: [420, 720, .16]
  };
  const [startFrequency, endFrequency, duration] = notes[kind] || notes.grow;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = kind === "reward" ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.08 * soundVolumeLevel, now + .01);
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + .02);
}

function touchesTarget() {
  const level = currentLevel();
  return level.targets.every(([x, y]) => alive.has(key(x, y)));
}

function onionSkinHints(level) {
  const hints = new Set();
  if (!level.tutorialHints || turns > 0 || alive.size === 0) return hints;
  for (let y = 0; y < level.size; y += 1) {
    for (let x = 0; x < level.size; x += 1) {
      const cellKey = key(x, y);
      if (!alive.has(cellKey) && !hasCell(level.rocks, x, y) && level.update(level, alive, x, y)) {
        hints.add(cellKey);
      }
    }
  }
  return hints;
}

function renderRulePreview() {
  rulePreviewList.innerHTML = "";
  const rules = [...new Set(levels.map((level) => level.rule))];
  rules.forEach((rule) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = rule;
    button.addEventListener("click", () => openRuleModal(rule));
    item.classList.toggle("current", rule === currentLevel().rule);
    item.appendChild(button);
    rulePreviewList.appendChild(item);
  });
}

function renderRuleExample(rule) {
  const example = ruleExamples[rule];
  ruleAnimation.innerHTML = "";
  if (!example) return;

  ruleModalTitle.textContent = example.title;
  ruleText.textContent = levels.find((level) => level.rule === rule).ruleText;
  ruleModalNote.textContent = example.note;
  ruleAnimation.style.gridTemplateColumns = `repeat(${example.before[0].length}, 1fr)`;
  example.before.forEach((row, y) => {
    [...row].forEach((beforeValue, x) => {
      const afterValue = example.after[y][x];
      const cell = document.createElement("i");
      cell.className = "rule-animation-cell";
      cell.classList.toggle("before-alive", beforeValue === "#");
      cell.classList.toggle("after-alive", afterValue === "#");
      cell.classList.toggle("will-change", beforeValue !== afterValue);
      ruleAnimation.appendChild(cell);
    });
  });
}

function openRuleModal(rule) {
  activeRule = rule;
  ruleModalOpen = true;
  render();
}

function closeRuleModal() {
  if (activeRule) seenRules.add(activeRule);
  ruleModalOpen = false;
  render();
}

function replayCompletedLevel() {
  resetLevel(levelIndex);
}

function goToNextLevel() {
  if (levelIndex >= levels.length - 1) return;
  resetLevel(levelIndex + 1);
}

function renderCompletion(level) {
  completionModal.hidden = !completionOpen;
  if (!completionOpen) return;

  completionTitle.textContent = `${level.title} complete`;
  completionReward.textContent = level.reward;
  const seedsLeft = Math.max(0, level.seeds - livingSeedsUsed());
  completionStats.textContent = `${turns} turn${turns === 1 ? "" : "s"} grown with ${seedsLeft} seed${seedsLeft === 1 ? "" : "s"} tucked away.`;
  completionPattern.style.gridTemplateColumns = `repeat(${level.size}, 1fr)`;
  completionPattern.innerHTML = "";
  for (let y = 0; y < level.size; y += 1) {
    for (let x = 0; x < level.size; x += 1) {
      const cell = document.createElement("i");
      const cellKey = key(x, y);
      cell.className = "completion-cell";
      cell.classList.toggle("alive", alive.has(cellKey));
      cell.classList.toggle("target", hasCell(level.targets, x, y));
      cell.classList.toggle("rock", hasCell(level.rocks, x, y));
      completionPattern.appendChild(cell);
    }
  }
  completionNextBtn.disabled = levelIndex === levels.length - 1;
  completionNextBtn.textContent = levelIndex === levels.length - 1 ? "Garden Complete" : "Next Level";
}

function render() {
  const level = currentLevel();
  levelTitle.textContent = level.title;
  levelCounter.textContent = `${levelIndex + 1} / ${levels.length}`;
  rewardText.textContent = won ? `${level.reward} Reward found!` : level.reward;
  rewardBox.classList.toggle("won", won);
  seedCount.textContent = Math.max(0, level.seeds - livingSeedsUsed());
  turnCount.textContent = `${turns} / ${level.maxTurns}`;
  ruleName.textContent = level.rule;
  goalText.textContent = level.goalText;
  ruleModal.hidden = !ruleModalOpen;
  prevLevel.disabled = levelIndex === 0;
  nextLevel.disabled = levelIndex === levels.length - 1;
  stepBtn.disabled = ruleModalOpen || won || turns >= level.maxTurns || alive.size === 0;
  runBtn.disabled = ruleModalOpen || won || turns >= level.maxTurns || alive.size === 0;
  hintBtn.disabled = ruleModalOpen || won || turns > 0 || revealedHints.size >= level.solution.length;
  hintBtn.textContent = revealedHints.size >= level.solution.length ? "Hinted" : `Hint ${revealedHints.size}/${level.solution.length}`;
  undoBtn.disabled = history.length === 0;
  audioModal.hidden = !audioModalOpen;
  editorModal.hidden = !editorModalOpen;
  soundToggleBtn.textContent = soundEnabled ? "Sound On" : "Sound Off";
  musicToggleBtn.textContent = musicEnabled ? "Music On" : "Music Off";
  soundVolume.value = String(Math.round(soundVolumeLevel * 100));
  musicVolume.value = String(Math.round(musicVolumeLevel * 100));
  musicTrack.volume = musicVolumeLevel;
  renderRuleExample(activeRule || level.rule);
  renderRulePreview();
  renderCompletion(level);
  renderEditor();

  const hints = onionSkinHints(level);
  const currentRocks = rockSetAt(level, turns);
  const nextRocks = rockSetAt(level, Math.min(turns + 1, level.maxTurns));
  board.style.gridTemplateColumns = `repeat(${level.size}, 1fr)`;
  board.innerHTML = "";
  for (let y = 0; y < level.size; y += 1) {
    for (let x = 0; x < level.size; x += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      const cellKey = key(x, y);
      const isPaintable = hasCell(level.paintable, x, y);
      const isTarget = hasCell(level.targets, x, y);
      const isRock = currentRocks.has(cellKey);
      const isStaticRock = hasCell(level.rocks || [], x, y);
      const isNextRock = !isRock && nextRocks.has(cellKey);
      const neighbors = isRock ? 0 : neighborCount(level, alive, x, y);
      cell.classList.toggle("paintable", isPaintable);
      cell.classList.toggle("target", isTarget);
      cell.classList.toggle("rock", isRock);
      cell.classList.toggle("moving-rock", isRock && !isStaticRock);
      cell.classList.toggle("next-rock", isNextRock);
      cell.classList.toggle("alive", alive.has(cellKey));
      cell.classList.toggle("flower", alive.has(cellKey) && flowerKind(x, y, turns) === "flower");
      cell.classList.toggle("hint", hints.has(cellKey));
      cell.classList.toggle("solution-hint", revealedHints.has(cellKey) && !alive.has(cellKey));
      cell.classList.toggle("new-growth", newGrowth.has(cellKey));
      cell.classList.toggle("fading", fadingGrowth.has(cellKey));
      cell.disabled = ruleModalOpen || won || turns > 0 || !isPaintable || isRock;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", describeCell(x, y, {
        isPaintable,
        isTarget,
        isRock,
        isNextRock,
        isAlive: alive.has(cellKey),
        isHint: hints.has(cellKey),
        isSolutionHint: revealedHints.has(cellKey),
        neighbors
      }));
      if (neighbors > 0) {
        const count = document.createElement("span");
        count.className = "neighbor-count";
        count.textContent = String(neighbors);
        count.setAttribute("aria-hidden", "true");
        cell.appendChild(count);
      }
      cell.addEventListener("click", () => toggleCell(x, y));
      board.appendChild(cell);
    }
  }
}

function describeCell(x, y, state) {
  const parts = [`row ${y + 1}`, `column ${x + 1}`];
  if (state.isAlive) parts.push("living sprout");
  if (state.isHint) parts.push("next growth hint");
  if (state.isSolutionHint) parts.push("solution hint");
  if (state.neighbors > 0) parts.push(`${state.neighbors} living neighbors`);
  if (state.isTarget) parts.push("reward tile");
  if (state.isRock) parts.push("old stone");
  if (state.isNextRock) parts.push("next moving wall");
  if (state.isPaintable) parts.push("plantable");
  return parts.join(", ");
}

function burstConfetti() {
  const rect = confetti.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  confetti.width = Math.floor(rect.width * scale);
  confetti.height = Math.floor(rect.height * scale);
  confettiCtx.setTransform(scale, 0, 0, scale, 0, 0);
  const pieces = Array.from({ length: 70 }, () => ({
    x: rect.width / 2,
    y: rect.height / 2,
    vx: (Math.random() - .5) * 8,
    vy: -Math.random() * 7 - 1,
    color: ["#e4ab3d", "#cc4f73", "#3f9b6d", "#7db6d9"][Math.floor(Math.random() * 4)],
    life: 50 + Math.random() * 25
  }));
  let frame = 0;
  function animate() {
    confettiCtx.clearRect(0, 0, rect.width, rect.height);
    pieces.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += .18;
      piece.life -= 1;
      confettiCtx.globalAlpha = Math.max(0, piece.life / 70);
      confettiCtx.fillStyle = piece.color;
      confettiCtx.fillRect(piece.x, piece.y, 7, 7);
    });
    confettiCtx.globalAlpha = 1;
    frame += 1;
    if (frame < 80) requestAnimationFrame(animate);
    else confettiCtx.clearRect(0, 0, rect.width, rect.height);
  }
  animate();
}

stepBtn.addEventListener("click", step);
runBtn.addEventListener("click", toggleRun);
hintBtn.addEventListener("click", revealHint);
undoBtn.addEventListener("click", undo);
resetBtn.addEventListener("click", () => resetLevel());
editorBtn.addEventListener("click", () => openEditor());
audioBtn.addEventListener("click", openAudioModal);
editorCloseBtn.addEventListener("click", closeEditor);
editorLoadBtn.addEventListener("click", () => openEditor());
editorClearBtn.addEventListener("click", clearEditor);
editorName.addEventListener("input", syncEditorFromFields);
editorReward.addEventListener("input", syncEditorFromFields);
editorGoal.addEventListener("input", syncEditorFromFields);
editorSize.addEventListener("input", syncEditorFromFields);
editorSeeds.addEventListener("input", syncEditorFromFields);
editorTurns.addEventListener("input", syncEditorFromFields);
editorRule.addEventListener("input", syncEditorFromFields);
editorModes.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => setEditorMode(button.getAttribute("data-mode")));
});
audioCloseBtn.addEventListener("click", closeAudioModal);
soundToggleBtn.addEventListener("click", toggleSound);
musicToggleBtn.addEventListener("click", toggleMusic);
soundVolume.addEventListener("input", updateSoundVolume);
musicVolume.addEventListener("input", updateMusicVolume);
prevLevel.addEventListener("click", () => resetLevel(levelIndex - 1));
nextLevel.addEventListener("click", () => resetLevel(levelIndex + 1));
startLevelBtn.addEventListener("click", closeRuleModal);
completionReplayBtn.addEventListener("click", replayCompletedLevel);
completionNextBtn.addEventListener("click", goToNextLevel);
window.addEventListener("keydown", handleShortcuts);

resetLevel(0);

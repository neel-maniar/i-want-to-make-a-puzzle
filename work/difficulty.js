const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rulePressure = {
  Sprout: 1,
  Pairing: 1.25,
  Life: 1.6
};

function makeElement() {
  return {
    children: [],
    style: {},
    classList: { toggle() {} },
    appendChild(child) {
      this.children.push(child);
    },
    addEventListener() {},
    setAttribute() {},
    getContext() {
      return { setTransform() {}, clearRect() {}, fillRect() {} };
    },
    getBoundingClientRect() {
      return { width: 400, height: 400 };
    },
    set innerHTML(value) {
      this.children = [];
    }
  };
}

function loadLevels(root = path.resolve(__dirname, "..")) {
  const source = fs.readFileSync(path.join(root, "outputs", "game.js"), "utf8");
  const context = {
    console,
    Set,
    Array,
    Math,
    Number,
    window: { devicePixelRatio: 1, clearInterval() {}, setInterval() {} },
    requestAnimationFrame() {},
    document: { querySelector: makeElement, createElement: makeElement }
  };
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__levels = levels;`, context);
  return context.__levels;
}

function key(x, y) {
  return `${x},${y}`;
}

function hasCell(cells, x, y) {
  return cells.some(([cx, cy]) => cx === x && cy === y);
}

function uniquePaintable(level) {
  const seen = new Set();
  const cells = [];
  const startingRocks = rockSetAt(level, 0);
  level.paintable.forEach(([x, y]) => {
    const cellKey = key(x, y);
    if (!seen.has(cellKey) && !startingRocks.has(cellKey)) {
      seen.add(cellKey);
      cells.push([x, y]);
    }
  });
  return cells;
}

function rockSetAt(level, turn) {
  const rocks = new Set((level.rocks || []).map(([x, y]) => key(x, y)));
  (level.movingRocks || []).forEach((wall) => {
    const [x, y] = wall.positions[Math.min(turn, wall.positions.length - 1)];
    rocks.add(key(x, y));
  });
  return rocks;
}

function combinationsCount(total, choose) {
  if (choose < 0 || choose > total) return 0;
  let result = 1;
  for (let i = 1; i <= choose; i += 1) {
    result = (result * (total - choose + i)) / i;
  }
  return Math.round(result);
}

function possibleTries(plantableCount, seeds) {
  let total = 0;
  for (let size = 1; size <= Math.min(plantableCount, seeds); size += 1) {
    total += combinationsCount(plantableCount, size);
  }
  return total;
}

function chebyshevDistance(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
}

function rewardDistance(level, plantableCells = uniquePaintable(level)) {
  let best = Infinity;
  plantableCells.forEach((cell) => {
    const farthestRequiredTarget = Math.max(
      ...level.targets.map((target) => chebyshevDistance(cell, target))
    );
    best = Math.min(best, farthestRequiredTarget);
  });
  return best;
}

function stepLevel(level, alive, turn) {
  const next = new Set();
  const blocked = rockSetAt(level, turn);
  for (let y = 0; y < level.size; y += 1) {
    for (let x = 0; x < level.size; x += 1) {
      if (blocked.has(key(x, y))) continue;
      if (level.update(level, alive, x, y)) next.add(key(x, y));
    }
  }
  return next;
}

function winTurn(level, seedCells) {
  let alive = new Set(seedCells.map(([x, y]) => key(x, y)));
  for (let turn = 1; turn <= level.maxTurns; turn += 1) {
    alive = stepLevel(level, alive, turn);
    if (level.targets.every(([x, y]) => alive.has(key(x, y)))) return turn;
    if (alive.size === 0) return 0;
  }
  return 0;
}

function eachCombination(cells, count, visit, start = 0, chosen = []) {
  if (chosen.length === count) {
    visit(chosen);
    return;
  }
  for (let i = start; i <= cells.length - (count - chosen.length); i += 1) {
    chosen.push(cells[i]);
    eachCombination(cells, count, visit, i + 1, chosen);
    chosen.pop();
  }
}

function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function sampleCombination(cells, count, random) {
  const pool = cells.slice();
  for (let i = 0; i < count; i += 1) {
    const swapIndex = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[swapIndex]] = [pool[swapIndex], pool[i]];
  }
  return pool.slice(0, count);
}

function countWinningStarts(level, options = {}) {
  const exactLimit = options.exactLimit ?? 5000;
  const sampleSize = options.sampleSize ?? 6000;
  const cells = uniquePaintable(level);
  const totalTries = possibleTries(cells.length, level.seeds);
  let winning = 0;
  let shortestWinTurn = Infinity;

  if (totalTries <= exactLimit) {
    for (let size = 1; size <= Math.min(cells.length, level.seeds); size += 1) {
      eachCombination(cells, size, (candidate) => {
        const turn = winTurn(level, candidate);
        if (turn) {
          winning += 1;
          shortestWinTurn = Math.min(shortestWinTurn, turn);
        }
      });
    }
    return {
      exact: true,
      winningTries: winning,
      sampledTries: totalTries,
      shortestWinTurn: Number.isFinite(shortestWinTurn) ? shortestWinTurn : null
    };
  }

  const random = lcg(level.title.length * 1009 + cells.length * 97 + level.seeds);
  let sampled = 0;
  for (let size = 1; size <= Math.min(cells.length, level.seeds); size += 1) {
    const triesForSize = combinationsCount(cells.length, size);
    const sizeSamples = Math.max(1, Math.round(sampleSize * (triesForSize / totalTries)));
    for (let i = 0; i < sizeSamples; i += 1) {
      sampled += 1;
      const turn = winTurn(level, sampleCombination(cells, size, random));
      if (turn) {
        winning += 1;
        shortestWinTurn = Math.min(shortestWinTurn, turn);
      }
    }
  }

  let estimatedWinning = Math.round((winning / sampled) * totalTries);
  let certifiedFloor = false;
  if (estimatedWinning === 0 && Array.isArray(level.solution)) {
    const certifiedTurn = winTurn(level, level.solution);
    if (certifiedTurn) {
      estimatedWinning = 1;
      shortestWinTurn = Math.min(shortestWinTurn, certifiedTurn);
      certifiedFloor = true;
    }
  }

  return {
    exact: false,
    winningTries: estimatedWinning,
    sampledTries: sampled,
    sampleWins: winning,
    certifiedFloor,
    shortestWinTurn: Number.isFinite(shortestWinTurn) ? shortestWinTurn : null
  };
}

function difficultyBand(score) {
  if (score < 4) return "gentle";
  if (score < 8) return "medium";
  if (score < 13) return "tricky";
  return "thorny";
}

function analyzeLevel(level, options = {}) {
  const plantableCells = uniquePaintable(level);
  const tries = possibleTries(plantableCells.length, level.seeds);
  const wins = countWinningStarts(level, options);
  const winRate = wins.winningTries / tries;
  const scarcityBits = wins.winningTries > 0 ? -Math.log2(winRate) : Infinity;
  const distance = rewardDistance(level, plantableCells);
  const pressure = rulePressure[level.rule] ?? 1.4;
  const distancePressure = 1 + distance / level.maxTurns;
  const score = scarcityBits * distancePressure * pressure;

  return {
    title: level.title,
    rule: level.rule,
    size: level.size,
    plantableCells: plantableCells.length,
    seeds: level.seeds,
    possibleTries: tries,
    winningTries: wins.winningTries,
    winRate,
    exact: wins.exact,
    sampledTries: wins.sampledTries,
    sampleWins: wins.sampleWins,
    rewardDistance: distance,
    shortestWinTurn: wins.shortestWinTurn,
    turnSlack: wins.shortestWinTurn === null ? null : level.maxTurns - wins.shortestWinTurn,
    scarcityBits,
    rulePressure: pressure,
    score,
    band: difficultyBand(score)
  };
}

function analyzeLevels(levels, options = {}) {
  return levels.map((level) => analyzeLevel(level, options));
}

module.exports = {
  analyzeLevel,
  analyzeLevels,
  combinationsCount,
  countWinningStarts,
  loadLevels,
  possibleTries,
  rewardDistance,
  rulePressure,
  winTurn
};

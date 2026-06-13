const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "outputs", "game.js"), "utf8");

function loadGame() {
  const element = () => ({
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
  });
  const context = {
    console,
    Set,
    Array,
    Math,
    Number,
    window: { devicePixelRatio: 1, clearInterval() {}, setInterval() {} },
    requestAnimationFrame() {},
    document: { querySelector: element, createElement: element }
  };
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__levels = levels;`, context);
  return context.__levels;
}

function key(x, y) {
  return `${x},${y}`;
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

function touchesTarget(level, alive) {
  return level.targets.every(([x, y]) => alive.has(key(x, y)));
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

function wins(level, seeds) {
  let alive = new Set(seeds.map(([x, y]) => key(x, y)));
  for (let turn = 1; turn <= level.maxTurns; turn += 1) {
    alive = stepLevel(level, alive, turn);
    if (touchesTarget(level, alive)) return turn;
    if (alive.size === 0) return 0;
  }
  return 0;
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

function combinations(cells, count, visit, start = 0, chosen = []) {
  if (chosen.length === count) return visit(chosen);
  for (let i = start; i <= cells.length - (count - chosen.length); i += 1) {
    chosen.push(cells[i]);
    if (combinations(cells, count, visit, i + 1, chosen)) return true;
    chosen.pop();
  }
  return false;
}

function findSolution(level) {
  if (Array.isArray(level.solution)) {
    const certifiedWinTurn = wins(level, level.solution);
    if (certifiedWinTurn) {
      return {
        seeds: level.solution.map(([x, y]) => [x, y]),
        winTurn: certifiedWinTurn,
        certified: true
      };
    }
  }

  const cells = uniquePaintable(level);
  for (let count = 1; count <= level.seeds; count += 1) {
    let found = null;
    combinations(cells, count, (candidate) => {
      const winTurn = wins(level, candidate);
      if (winTurn) found = { seeds: candidate.map(([x, y]) => [x, y]), winTurn };
      return Boolean(found);
    });
    if (found) return found;
  }
  return null;
}

loadGame().forEach((level) => {
  const solution = findSolution(level);
  console.log(`${level.title}: ${solution ? JSON.stringify(solution) : "NO SOLUTION"}`);
});

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "outputs", "game.js"), "utf8");

function element() {
  return {
    children: [],
    style: {},
    classList: { toggle() {} },
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    setAttribute() {},
    getContext() { return { setTransform() {}, clearRect() {}, fillRect() {} }; },
    getBoundingClientRect() { return { width: 400, height: 400 }; },
    set innerHTML(value) { this.children = []; }
  };
}

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

function key(x, y) { return `${x},${y}`; }
function hasCell(list, x, y) { return list.some(([cx, cy]) => cx === x && cy === y); }
function rockSetAt(level, turn) {
  const rocks = new Set((level.rocks || []).map(([x, y]) => key(x, y)));
  (level.movingRocks || []).forEach((wall) => {
    const [x, y] = wall.positions[Math.min(turn, wall.positions.length - 1)];
    rocks.add(key(x, y));
  });
  return rocks;
}
function step(level, alive, turn) {
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
function draw(level, alive, turn) {
  const rocks = rockSetAt(level, turn);
  for (let y = 0; y < level.size; y += 1) {
    let row = "";
    for (let x = 0; x < level.size; x += 1) {
      if (hasCell(level.targets, x, y)) row += alive.has(key(x, y)) ? "W" : "T";
      else if (rocks.has(key(x, y))) row += "X";
      else row += alive.has(key(x, y)) ? "#" : ".";
    }
    console.log(row);
  }
}

const levelIndex = Number(process.argv[2]);
const seeds = process.argv.slice(3).map((cell) => cell.split(",").map(Number));
const level = context.__levels[levelIndex];
if (process.env.CLEAR_ROCKS === "1") level.rocks = [];
let alive = new Set(seeds.map(([x, y]) => key(x, y)));
console.log(level.title, JSON.stringify(seeds));
draw(level, alive, 0);
for (let turn = 1; turn <= level.maxTurns; turn += 1) {
  alive = step(level, alive, turn);
  const won = level.targets.every(([x, y]) => alive.has(key(x, y)));
  console.log(`turn ${turn}${won ? " WON" : ""}`);
  draw(level, alive, turn);
  if (won) break;
}

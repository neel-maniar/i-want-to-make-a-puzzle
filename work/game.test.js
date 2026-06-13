const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "outputs", "index.html"), "utf8");
const gameSource = fs.readFileSync(path.join(root, "outputs", "game.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "outputs", "styles.css"), "utf8");
const {
  analyzeLevels,
  combinationsCount,
  possibleTries,
  rewardDistance
} = require("./difficulty");

function makeElement() {
  const classes = new Set();
  const attributes = new Map();
  const element = {
    textContent: "",
    value: "",
    hidden: false,
    disabled: false,
    paused: true,
    volume: 1,
    children: [],
    listeners: {},
    style: {},
    className: "",
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      }
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener(event, handler) {
      this.listeners[event] = handler;
    },
    click() {
      if (this.listeners.click) this.listeners.click();
    },
    play() {
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    getContext() {
      return {
        setTransform() {},
        clearRect() {},
        fillRect() {}
      };
    },
    getBoundingClientRect() {
      return { width: 400, height: 400 };
    }
  };
  Object.defineProperty(element, "innerHTML", {
    get() {
      return "";
    },
    set() {
      element.children = [];
    }
  });
  return element;
}

function loadGame(options = {}) {
  const elements = new Map();
  const audioStarts = [];
  function FakeAudioContext() {
    this.currentTime = 0;
    this.destination = {};
  }
  FakeAudioContext.prototype.createOscillator = function createOscillator() {
    return {
      type: "",
      frequency: {
        setValueAtTime() {},
        exponentialRampToValueAtTime() {}
      },
      connect() {},
      start() {
        audioStarts.push("start");
      },
      stop() {
        audioStarts.push("stop");
      }
    };
  };
  FakeAudioContext.prototype.createGain = function createGain() {
    return {
      gain: {
        setValueAtTime() {},
        exponentialRampToValueAtTime() {}
      },
      connect() {}
    };
  };
  const context = {
    console,
    Set,
    Array,
    Math,
    Number,
    window: {
      devicePixelRatio: 1,
      clearInterval() {},
      setInterval() {
        return 1;
      },
      AudioContext: options.audio ? FakeAudioContext : undefined,
      webkitAudioContext: undefined
    },
    requestAnimationFrame() {},
    document: {
      querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, makeElement());
        return elements.get(selector);
      },
      createElement() {
        return makeElement();
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(
    `${gameSource}\n;globalThis.__levels = levels; globalThis.__ruleExamples = ruleExamples; globalThis.__render = render; globalThis.__toggleCell = toggleCell; globalThis.__revealHint = revealHint; globalThis.__resetLevel = resetLevel; globalThis.__closeRuleModal = closeRuleModal; globalThis.__openRuleModal = openRuleModal; globalThis.__step = step; globalThis.__playSound = playSound;`,
    context
  );
  context.__elements = elements;
  context.__audioStarts = audioStarts;
  return context;
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function includesCell(cells, x, y) {
  return cells.some(([cx, cy]) => cx === x && cy === y);
}

function uniqueCells(cells) {
  return new Set(cells.map(([x, y]) => cellKey(x, y))).size;
}

function stepLevel(level, alive) {
  const next = new Set();
  const blocked = rockSetAt(level, 1);
  for (let y = 0; y < level.size; y += 1) {
    for (let x = 0; x < level.size; x += 1) {
      if (blocked.has(cellKey(x, y))) continue;
      if (level.update(level, alive, x, y)) next.add(cellKey(x, y));
    }
  }
  return next;
}

function solutionWinTurn(level) {
  let alive = new Set(level.solution.map(([x, y]) => cellKey(x, y)));
  return winTurnFromAlive(level, alive);
}

function winTurnFromAlive(level, alive) {
  for (let turn = 1; turn <= level.maxTurns; turn += 1) {
    alive = stepLevelAtTurn(level, alive, turn);
    if (level.targets.every(([x, y]) => alive.has(cellKey(x, y)))) return turn;
  }
  return 0;
}

function rockSetAt(level, turn) {
  const rocks = new Set((level.rocks || []).map(([x, y]) => cellKey(x, y)));
  (level.movingRocks || []).forEach((wall) => {
    const [x, y] = wall.positions[Math.min(turn, wall.positions.length - 1)];
    rocks.add(cellKey(x, y));
  });
  return rocks;
}

function stepLevelAtTurn(level, alive, turn) {
  const next = new Set();
  const blocked = rockSetAt(level, turn);
  for (let y = 0; y < level.size; y += 1) {
    for (let x = 0; x < level.size; x += 1) {
      if (blocked.has(cellKey(x, y))) continue;
      if (level.update(level, alive, x, y)) next.add(cellKey(x, y));
    }
  }
  return next;
}

function hasComponentOnlyWin(level, component) {
  const cells = [...component].map((cell) => cell.split(",").map(Number));
  function visit(start, chosen) {
    if (chosen.length > 0 && winTurnFromAlive(level, new Set(chosen.map(([x, y]) => cellKey(x, y))))) {
      return true;
    }
    if (chosen.length === Math.min(level.seeds, cells.length)) return false;
    for (let i = start; i < cells.length; i += 1) {
      chosen.push(cells[i]);
      if (visit(i + 1, chosen)) return true;
      chosen.pop();
    }
    return false;
  }
  return visit(0, []);
}

function paintableComponents(level) {
  const cells = new Set(level.paintable.map(([x, y]) => cellKey(x, y)));
  const components = [];
  while (cells.size > 0) {
    const [start] = cells;
    const stack = [start];
    const component = new Set();
    cells.delete(start);
    while (stack.length > 0) {
      const current = stack.pop();
      component.add(current);
      const [x, y] = current.split(",").map(Number);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const next = cellKey(x + dx, y + dy);
        if (cells.has(next)) {
          cells.delete(next);
          stack.push(next);
        }
      });
    }
    components.push(component);
  }
  return components;
}

test("multi-reward levels require every reward tile at once", () => {
  const { __levels: levels } = loadGame();
  const multiRewardLevels = levels.filter((level) => level.targets.length > 1);
  assert.ok(multiRewardLevels.length > 0, "expected at least one multi-reward level");
  multiRewardLevels.forEach((level) => {
    const firstTargetOnly = new Set([cellKey(level.targets[0][0], level.targets[0][1])]);
    assert.strictEqual(
      level.targets.every(([x, y]) => firstTargetOnly.has(cellKey(x, y))),
      false,
      `${level.title} should not be satisfied by only one reward tile`
    );
  });
});

test("first level is a small tutorial with the gentlest rule", () => {
  const { __levels: levels } = loadGame();
  assert.match(levels[0].title, /tutorial/i);
  assert.strictEqual(levels[0].rule, "Sprout");
  assert.ok(levels[0].size <= 5, "tutorial grid should be small");
  assert.ok(levels[0].goalText.toLowerCase().includes("paint"), "tutorial should explain the first action");
});

test("every level has a legal certified solution that reaches a reward", () => {
  const { __levels: levels } = loadGame();
  levels.forEach((level) => {
    assert.ok(Array.isArray(level.solution), `${level.title} needs a certified solution`);
    assert.ok(level.solution.length > 0, `${level.title} solution cannot be empty`);
    assert.ok(level.solution.length <= level.seeds, `${level.title} solution uses too many seeds`);
    assert.strictEqual(uniqueCells(level.solution), level.solution.length, `${level.title} solution repeats cells`);
    level.solution.forEach(([x, y]) => {
      assert.ok(includesCell(level.paintable, x, y), `${level.title} solution cell ${x},${y} is not paintable`);
      assert.ok(!includesCell(level.rocks, x, y), `${level.title} solution cell ${x},${y} is blocked by a stone`);
    });
    assert.ok(solutionWinTurn(level) > 0, `${level.title} certified solution does not reach a reward`);
  });
});

test("every certified solution wins through the public game loop", () => {
  const context = loadGame();
  context.__levels.forEach((level, index) => {
    context.__resetLevel(index);
    context.__closeRuleModal();
    level.solution.forEach(([x, y]) => context.__toggleCell(x, y));
    for (let i = 0; i < level.maxTurns; i += 1) context.__step();
    assert.strictEqual(
      context.__elements.get("#rewardBox").classList.contains("won"),
      true,
      `${level.title} certified solution should win through UI actions`
    );
  });
});

test("winning a level opens a completion screen with replay and next actions", () => {
  assert.match(html, /id="completionModal"/);
  assert.match(html, /id="completionNextBtn"/);
  assert.match(html, /id="completionReplayBtn"/);
  const context = loadGame();
  const level = context.__levels[0];
  const modal = context.__elements.get("#completionModal");
  const replayBtn = context.__elements.get("#completionReplayBtn");
  const nextBtn = context.__elements.get("#completionNextBtn");

  context.__closeRuleModal();
  level.solution.forEach(([x, y]) => context.__toggleCell(x, y));
  for (let i = 0; i < level.maxTurns; i += 1) context.__step();

  assert.strictEqual(modal.hidden, false, "completion modal should open after a win");
  assert.match(context.__elements.get("#completionTitle").textContent, /complete/i);
  assert.match(context.__elements.get("#completionReward").textContent, /dewdrop bell/i);
  assert.match(context.__elements.get("#completionStats").textContent, /turn/i);
  assert.ok(context.__elements.get("#completionPattern").children.length > 0, "completion should show the final pattern");

  replayBtn.click();
  assert.strictEqual(modal.hidden, true, "replay should hide completion modal");
  assert.strictEqual(context.__elements.get("#levelCounter").textContent, `1 / ${context.__levels.length}`);
  assert.strictEqual(context.__elements.get("#turnCount").textContent, "0 / 3");

  context.__toggleCell(level.solution[0][0], level.solution[0][1]);
  for (let i = 0; i < level.maxTurns; i += 1) context.__step();
  nextBtn.click();
  assert.strictEqual(modal.hidden, true, "next level should hide completion modal");
  assert.strictEqual(context.__elements.get("#levelCounter").textContent, `2 / ${context.__levels.length}`);
});

test("growth steps mark new and fading cells for propagation animation", () => {
  const context = loadGame();
  context.__closeRuleModal();
  context.__toggleCell(1, 2);
  context.__step();
  let board = context.__elements.get("#board");
  assert.ok(
    board.children.some((cell) => cell.classList.contains("new-growth")),
    "sprout growth should mark newly born cells"
  );

  context.__resetLevel(3);
  context.__closeRuleModal();
  context.__levels[3].solution.forEach(([x, y]) => context.__toggleCell(x, y));
  context.__step();
  board = context.__elements.get("#board");
  assert.ok(
    board.children.some((cell) => cell.classList.contains("new-growth")),
    "Life growth should mark newly born cells"
  );
  assert.ok(
    board.children.some((cell) => cell.classList.contains("fading")),
    "Life growth should mark cells that faded out"
  );
});

test("cells show current neighbor counts after planting", () => {
  const context = loadGame();
  context.__closeRuleModal();
  context.__toggleCell(0, 2);
  const board = context.__elements.get("#board");
  const adjacentCell = board.children.find((cell) =>
    cell.getAttribute("aria-label").startsWith("row 3, column 2")
  );
  const farCell = board.children.find((cell) =>
    cell.getAttribute("aria-label").startsWith("row 5, column 5")
  );

  assert.ok(adjacentCell.children.some((child) => child.className === "neighbor-count" && child.textContent === "1"));
  assert.ok(farCell.children.every((child) => child.className !== "neighbor-count"));
});

test("a level can preview and apply scheduled moving walls", () => {
  const context = loadGame();
  const movingIndex = context.__levels.findIndex((level) => Array.isArray(level.movingRocks));
  assert.ok(movingIndex >= 0, "expected a level with scheduled moving walls");

  context.__resetLevel(movingIndex);
  context.__closeRuleModal();
  let board = context.__elements.get("#board");
  assert.ok(board.children.some((cell) => cell.classList.contains("moving-rock")));
  assert.ok(board.children.some((cell) => cell.classList.contains("next-rock")));

  const firstWall = context.__levels[movingIndex].movingRocks[0];
  const [startX, startY] = firstWall.positions[0];
  const [nextX, nextY] = firstWall.positions[1];
  context.__toggleCell(...context.__levels[movingIndex].solution[0]);
  context.__step();
  board = context.__elements.get("#board");
  const oldWallCell = board.children[startY * context.__levels[movingIndex].size + startX];
  const newWallCell = board.children[nextY * context.__levels[movingIndex].size + nextX];
  assert.strictEqual(oldWallCell.classList.contains("moving-rock"), false);
  assert.strictEqual(newWallCell.classList.contains("moving-rock"), true);
});

test("audio settings modal controls sound effects volume and toggle", () => {
  assert.match(html, /id="audioBtn"/);
  assert.match(html, /id="audioModal"/);
  assert.match(html, /id="soundVolume"/);
  const context = loadGame({ audio: true });
  const audioBtn = context.__elements.get("#audioBtn");
  const modal = context.__elements.get("#audioModal");
  const soundToggle = context.__elements.get("#soundToggleBtn");
  const soundVolume = context.__elements.get("#soundVolume");

  assert.strictEqual(modal.hidden, true);
  audioBtn.click();
  assert.strictEqual(modal.hidden, false);
  assert.strictEqual(soundToggle.textContent, "Sound On");
  assert.strictEqual(soundVolume.value, "70");

  context.__closeRuleModal();
  context.__toggleCell(0, 2);
  assert.ok(context.__audioStarts.length > 0, "planting should trigger a sound when enabled");

  const soundsBeforeMute = context.__audioStarts.length;
  soundToggle.click();
  assert.strictEqual(soundToggle.textContent, "Sound Off");
  context.__playSound("grow");
  assert.strictEqual(context.__audioStarts.length, soundsBeforeMute, "muted sounds should not start");

  soundVolume.value = "25";
  soundVolume.listeners.input();
  soundToggle.click();
  assert.strictEqual(soundToggle.textContent, "Sound On");
  context.__playSound("grow");
  assert.ok(context.__audioStarts.length > soundsBeforeMute, "unmuted sounds should start again");
});

test("audio settings modal plays the music track and adjusts its volume", () => {
  assert.match(html, /id="musicToggleBtn"/);
  assert.match(html, /id="musicVolume"/);
  assert.match(html, /quiet-time-david-fesliyan\.mp3/);
  const context = loadGame();
  const audioBtn = context.__elements.get("#audioBtn");
  const musicBtn = context.__elements.get("#musicToggleBtn");
  const musicVolume = context.__elements.get("#musicVolume");
  const musicTrack = context.__elements.get("#musicTrack");

  audioBtn.click();
  assert.strictEqual(musicBtn.textContent, "Music Off");
  assert.strictEqual(musicVolume.value, "45");
  assert.strictEqual(musicTrack.volume, .45);

  musicVolume.value = "20";
  musicVolume.listeners.input();
  assert.strictEqual(musicTrack.volume, .2);

  musicBtn.click();
  assert.strictEqual(musicBtn.textContent, "Music On");
  assert.strictEqual(musicTrack.paused, false, "music should play the provided track");

  musicBtn.click();
  assert.strictEqual(musicBtn.textContent, "Music Off");
  assert.strictEqual(musicTrack.paused, true, "music should pause the provided track");
});

test("difficulty analyzer reports search space, wins, distance, and score", () => {
  const { __levels: levels } = loadGame();
  const analyses = analyzeLevels(levels, { exactLimit: 5000, sampleSize: 1000 });
  assert.strictEqual(analyses.length, levels.length);
  analyses.forEach((analysis) => {
    assert.ok(analysis.possibleTries >= analysis.winningTries, `${analysis.title} has impossible win counts`);
    assert.ok(analysis.winningTries > 0, `${analysis.title} should have at least one winning try`);
    assert.ok(analysis.rewardDistance >= 0, `${analysis.title} should report reward distance`);
    assert.ok(Number.isFinite(analysis.score), `${analysis.title} should have a finite difficulty score`);
    assert.match(analysis.band, /gentle|medium|tricky|thorny/);
  });
});

test("difficulty scores strictly increase by level order", () => {
  const { __levels: levels } = loadGame();
  const analyses = analyzeLevels(levels, { exactLimit: 5000, sampleSize: 1000 });
  for (let i = 1; i < analyses.length; i += 1) {
    assert.ok(
      analyses[i].score > analyses[i - 1].score,
      `${analyses[i].title} score ${analyses[i].score.toFixed(2)} should exceed ${analyses[i - 1].title} score ${analyses[i - 1].score.toFixed(2)}`
    );
  }
});

test("difficulty math counts combinations and nearest reward distance", () => {
  assert.strictEqual(combinationsCount(5, 2), 10);
  assert.strictEqual(possibleTries(4, 2), 10);
  assert.strictEqual(
    rewardDistance({ paintable: [[0, 0], [2, 2]], targets: [[4, 3]], rocks: [] }),
    2
  );
  assert.strictEqual(
    rewardDistance({ paintable: [[0, 0]], targets: [[1, 0], [4, 0]], rocks: [] }),
    4
  );
});

test("later levels grow larger as the player progresses", () => {
  const { __levels: levels } = loadGame();
  for (let i = 1; i < levels.length; i += 1) {
    assert.ok(
      levels[i].size >= levels[i - 1].size,
      `${levels[i].title} should not shrink from the previous level`
    );
  }
  assert.ok(levels.at(-1).size >= 10, "the final level should be noticeably larger");
});

test("one level requires planting in two disjoint plantation regions", () => {
  const { __levels: levels } = loadGame();
  const twoPatchLevel = levels.find((level) => /two|twin|split/i.test(level.title));
  assert.ok(twoPatchLevel, "expected a level themed around two disjoint plantations");
  assert.ok(twoPatchLevel.targets.length >= 2, "two-patch level should require multiple rewards");

  const components = paintableComponents(twoPatchLevel);
  assert.ok(components.length >= 2, "plantable cells should form at least two disjoint regions");
  const usedComponents = components.filter((component) =>
    twoPatchLevel.solution.some(([x, y]) => component.has(cellKey(x, y)))
  );
  assert.ok(usedComponents.length >= 2, "certified solution should use both disjoint regions");
  components.forEach((component) => {
    assert.strictEqual(
      hasComponentOnlyWin(twoPatchLevel, component),
      false,
      "no single plantation region should be able to win by itself"
    );
  });
});

test("the rule almanac renders one clickable entry per ruleset", () => {
  assert.match(html, /id="rulePreviewList"/);
  const context = loadGame();
  const previewList = context.__elements.get("#rulePreviewList");
  const uniqueRules = [...new Set(context.__levels.map((level) => level.rule))];
  assert.strictEqual(previewList.children.length, uniqueRules.length);
  assert.deepStrictEqual(
    previewList.children.map((child) => child.children[0].textContent),
    uniqueRules
  );

  context.__closeRuleModal();
  assert.strictEqual(context.__elements.get("#ruleModal").hidden, true);
  previewList.children[0].children[0].click();
  assert.strictEqual(context.__elements.get("#ruleModal").hidden, false);
});

test("each ruleset opens the animated modal only the first time it appears", () => {
  assert.match(html, /id="ruleModal"/);
  assert.match(html, /id="ruleAnimation"/);
  assert.match(html, /id="startLevelBtn"/);
  const context = loadGame();
  const modal = context.__elements.get("#ruleModal");
  const animation = context.__elements.get("#ruleAnimation");
  const stepBtn = context.__elements.get("#stepBtn");

  assert.strictEqual(modal.hidden, false, "modal should be visible on level load");
  assert.ok(animation.children.length > 0, "expected animated rule cells");
  assert.ok(
    animation.children.some((cell) => cell.classList.contains("will-change")),
    "animation should mark cells that change under the rule"
  );
  assert.strictEqual(stepBtn.disabled, true, "play should wait until the rule modal is dismissed");
  assert.ok(context.__ruleExamples.Sprout.before.length > 0);
  assert.ok(context.__ruleExamples.Pairing.after.length > 0);
  assert.ok(context.__ruleExamples.Life.before.length > 0);

  context.__closeRuleModal();
  assert.strictEqual(modal.hidden, true, "modal should close when the player starts the level");

  context.__resetLevel(1);
  assert.strictEqual(modal.hidden, true, "modal should stay hidden for a repeated ruleset");

  context.__resetLevel(2);
  assert.strictEqual(modal.hidden, false, "modal should open for a newly introduced ruleset");
  context.__closeRuleModal();

  context.__resetLevel(3);
  assert.strictEqual(modal.hidden, false, "modal should open for Life when first introduced");
  context.__closeRuleModal();

  context.__resetLevel(4);
  assert.strictEqual(modal.hidden, true, "modal should stay hidden for repeated Life levels");
});

test("tutorial shows onion-skin hints for cells that will grow next", () => {
  const context = loadGame();
  context.__closeRuleModal();
  context.__toggleCell(0, 2);
  const board = context.__elements.get("#board");
  const hintedCells = board.children.filter((cell) => cell.classList.contains("hint"));
  assert.ok(hintedCells.length > 0, "expected tutorial preview cells after planting");
  assert.ok(
    hintedCells.every((cell) => !cell.classList.contains("alive")),
    "hints should be previews, not already-living cells"
  );
});

test("hint button reveals one solution square at a time until the solution is acquired", () => {
  assert.match(html, /id="hintBtn"/);
  const context = loadGame();
  context.__closeRuleModal();
  const level = context.__levels[0];
  const board = context.__elements.get("#board");

  context.__revealHint();
  assert.strictEqual(
    board.children.filter((cell) => cell.classList.contains("solution-hint")).length,
    1
  );

  for (let i = 1; i < level.solution.length + 3; i += 1) context.__revealHint();
  assert.strictEqual(
    board.children.filter((cell) => cell.classList.contains("solution-hint")).length,
    level.solution.length
  );

  context.__resetLevel(1);
  assert.strictEqual(
    board.children.filter((cell) => cell.classList.contains("solution-hint")).length,
    0,
    "changing levels should clear revealed hints"
  );
});

test("cell hover keeps spritesheet coordinates intact", () => {
  assert.match(styles, /button:not\(\.cell\):hover/);
  assert.doesNotMatch(styles, /button:hover\s*\{[^}]*background\s*:/);
  assert.match(styles, /\.cell\s*\{[^}]*background-size:\s*var\(--sprite-size\)/s);
  assert.match(styles, /\.cell\s*\{[^}]*background-repeat:\s*no-repeat/s);
});

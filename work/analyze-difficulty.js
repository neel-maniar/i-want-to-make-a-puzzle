const { analyzeLevels, loadLevels } = require("./difficulty");

function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function number(value) {
  return value.toLocaleString("en-US");
}

function fixed(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "inf";
}

const levels = loadLevels();
const analyses = analyzeLevels(levels, { exactLimit: 5000, sampleSize: 1000 });

analyses.forEach((level, index) => {
  const mode = level.exact ? "exact" : `estimated from ${number(level.sampledTries)} samples`;
  console.log(`${index + 1}. ${level.title} (${level.band})`);
  console.log(`   rule=${level.rule} board=${level.size}x${level.size} seeds=${level.seeds}`);
  console.log(`   possible=${number(level.possibleTries)} winning=${number(level.winningTries)} (${mode}) winRate=${percent(level.winRate)}`);
  console.log(`   rewardDistance=${level.rewardDistance} shortestWin=${level.shortestWinTurn ?? "none"} turnSlack=${level.turnSlack ?? "none"}`);
  console.log(`   scarcityBits=${fixed(level.scarcityBits)} rulePressure=${level.rulePressure} score=${fixed(level.score)}`);
});

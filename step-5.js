const ansiEscapes = require("ansi-escapes");
const { red, yellow, blue } = require("chalk");
const { toBlock, mapBlock, concatBlocks, toString } = require("terminal-block-fonts");

function leftPad(number) {
  if (number < 10) {
    return "0" + number;
  } else {
    return String(number);
  }
}

function getTime() {
  const date = new Date();

  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds()
  };
}

function rainbowClock12(time) {
  const { hour, minute, second } = time;

  let ampmHour = hour % 12;

  if (ampmHour === 0) {
    // for 0 and 12, they're showed as 12AM and 12PM
    ampmHour = 12;
  }

  const hourBlock = toBlock(leftPad(ampmHour));
  const minuteBlock = toBlock(leftPad(minute));
  const secondBlock = toBlock(leftPad(second));
  const sepBlock = toBlock(":");
  const ampmBlock = toBlock(hour >= 12 ? " PM" : " AM");

  return toString(concatBlocks(
    mapBlock(hourBlock, red),
    sepBlock,
    mapBlock(minuteBlock, yellow),
    sepBlock,
    mapBlock(secondBlock, blue),
    ampmBlock
  ));
}

function rainbowClock24(time) {
  const { hour, minute, second } = time;

  const hourBlock = toBlock(leftPad(hour));
  const minuteBlock = toBlock(leftPad(minute));
  const secondBlock = toBlock(leftPad(second));
  const sepBlock = toBlock(":");

  return toString(concatBlocks(
    mapBlock(hourBlock, red),
    sepBlock,
    mapBlock(minuteBlock, yellow),
    sepBlock,
    mapBlock(secondBlock, blue)
  ));
}

function run() {
  const program = require("commander");

  program
    .version("1.0.0")
    .option("--mode <mode>", "display mode, can be with either 12h or 24h", "24h")
    .parse(process.argv);

  const clock = program.mode === "12h" ? rainbowClock12 : rainbowClock24;

  process.stdout.write(clock(getTime()));

  setInterval(() => {
    const currentTimeString = clock(getTime());

    process.stdout.write(ansiEscapes.eraseLines(7) + currentTimeString);
  }, 1000);
}

module.exports = {
  run
};


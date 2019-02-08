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

function rainbowClock(time) {
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

process.stdout.write(rainbowClock(getTime()));

setInterval(() => {
  const currentTimeString = rainbowClock(getTime());

  process.stdout.write(ansiEscapes.eraseLines(7) + currentTimeString);
}, 1000);

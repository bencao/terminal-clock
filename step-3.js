// use npm package
const ansiEscapes = require("ansi-escapes");

// pad leading zero when necessary
// also convert integer to a string
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

function simpleClock(time) {
  const { hour, minute, second } = time;

  return hour + ":" + minute + ":" + second;
}

setInterval(() => {
  // erase 1 line before we write the time string
  process.stdout.write(ansiEscapes.eraseLines(1) + simpleClock(getTime()));
}, 1000);

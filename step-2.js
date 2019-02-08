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
  process.stdout.write(simpleClock(getTime()) + "\n");
}, 1000);

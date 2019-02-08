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

function checkAutocomplete(argv) {
  if (argv[2] === "--completion") {
    // generate completion script

    process.stdout.write(`
      _clock_completion() {
        COMPREPLY=( $(compgen -W '$(clock --compgen "\${COMP_CWORD}" "\${COMP_WORDS[COMP_CWORD-1]}" "\${COMP_LINE}")' -- "\${COMP_WORDS[COMP_CWORD]}") )
      }
      complete -F _clock_completion clock
    `);

    // exit process immediately after completion request
    process.exit(0);
  } else if (argv[2] === "--compgen") {
    // fragment is the above "$COMP_CWORD" telling us
    // which word is being worked on
    const fragment = parseInt(argv[3], 10);

    if (fragment === 1) {
      // for the 1st position we return 3 possible option names
      process.stdout.write('--mode --help --version');
    } else if (fragment === 2) {
      // for the 2nd position we return 3 possible candidates
      const prevWord = argv[4];

      // line is the exact text users can see from the command line
      // it can be very useful for more complex autocompletion cases
      // const line = argv[5];

      if (prevWord === "--mode") {
        process.stdout.write('12h 24h');
      }
    }
    // otherwise we output nothing which means nothing to suggest

    // exit process immediately after completion request
    process.exit(0);
  }
}

function run() {
  checkAutocomplete(process.argv);

  const program = require("commander");

  program
    .version("1.0.0")
    .option("--mode <mode>", "display mode, can be either 12h or 24h", "24h")
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


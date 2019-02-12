# Step by step tutorial: building a modern CLI app with animation, autocompletion and binary distribution

Command line interface (CLI) development has come a long way from the simple “HelloWorld” program we built as our very first CLI app, to modern CLI apps such as `git` and `docker` which support complex patterns such as subcommands, many CLI options, and interactive outputs.

In this article, we would like to walk you through those modern technics for building an attractive CLI app with a concrete example - a command line clock.

![Terminal Clock](terminal-clock.gif)

For simplification purpose, we’ll build this application with Javascript and some [npm](http://npmjs.com) packages, but the technics could apply to all languages.

Let’s start building.

Table of Contents

  * [Step 1: Preparations](#step-1-preparations)
  * [Step 2: Build a simple app that prints the current time every second](#step-2-build-a-simple-app-that-prints-the-current-time-every-second)
  * [Step 3: Overwrite existing line instead of creating new lines every second](#step-3-overwrite-existing-line-instead-of-creating-new-lines-every-second)
  * [Step 4: Beautify the UI](#step-4-beautify-the-ui)
  * [Step 5: Add command line options](#step-5-add-command-line-options)
  * [Step 6: Add autocomplete](#step-6-add-autocomplete)
  * [Step 7: Pack the app as an executable (language specific)](#step-7-pack-the-app-as-an-executable-language-specific)
  * [Closing](#closing)

## Step 1: Preparations

Download and install [Node.js](https://nodejs.org/en/).

Create a working directory named `clock` and initiate an empty Node.js project.

```shell
mkdir clock
cd clock
npm init
```

## Step 2: Build a simple app that prints the current time every second

Let’s create a file named as `index.js` with the following content:

```javascript
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
```

If we run the program with `node index.js`, we’ll get result like this:

```shell
$ node index.js
15:49:29
15:49:30
15:49:31
15:49:32
15:49:33
15:49:34
```

## Step 3: Overwrite existing line instead of creating new lines every second

I bet you have seen command line progress bar before. It looks cool, isn’t it? But how does it actually work?

The magic spell is called the [ANSI Escape Code](https://en.wikipedia.org/wiki/ANSI_escape_code). The ANSI Escape Code defines invisible special character sequences to represent display control commands, for example, “Erase current line” or “Clear screen”. Since CLI apps are typically running in text terminals which support the ANSI Escape Code, for the following sequences

```javascript
==>
^EraseCurrentLine^MoveCursorLeft
===>
^EraseCurrentLine^MoveCursorLeft
====>
```

If we play the sequence slowly we could see an animation effect that the progress bar is slowly moving.

Since ANSI Escape codes are special invisible characters, it is better to use some type of dictionaries instead of hard code them directly in the program. For Node.js, there’s an npm package called [ansi-escapes](https://www.npmjs.com/package/ansi-escapes) which provides an easy to use interface for CLI developers.

```shell
# install package
npm install --save ansi-escapes
```

Open index.js and make a simple modification to render an ANSI Escape Code that erases the previous output line.

```javascript
// use npm package
const ansiEscapes = require("ansi-escapes");

/// unchanged from the previous example
function leftPad(number) { ... }
function getTime() { ... }
function simpleClock(time) { ... }

setInterval(() => {
  // erase 1 line before we write the time string
  process.stdout.write(ansiEscapes.eraseLines(1) + simpleClock(getTime()));
}, 1000);
```

Run the program again with `node index.js`, we should see the output now keeps updating the current line instead of printing into new lines, Yay!

## Step 4: Beautify the UI

Our command line clock works, but it is not very pretty. Let’s decorate it a little bit!

The first thing we would do is to add some colors to the output. Similar to “erase line” code, there’re some ANSI escape codes specific for color control purpose. For example the following shell command prints a greeting in red:

```shell
# the starting sequence for red is \u001b[31m
# and the reset sequence is \u001b[0m
echo "\u001b[31m Hi \u001b[0m"
```

The second thing we could do is to make those numbers look bigger.

We’ll utilize a npm package [chalk](https://www.npmjs.com/package/chalk) to help us wrap our content in color control sequences, and another npm package [terminal-block-fonts](https://www.npmjs.com/package/terminal-block-fonts) to help draw big numbers in terminal.

```shell
# install packages
npm install --save chalk
npm install --save terminal-block-fonts
```

And we’ll add a new rainbowClock function to `index.js`:

```javascript
const ansiEscapes = require("ansi-escapes");
const { red, yellow, blue } = require("chalk");
const { toBlock, mapBlock, concatBlocks, toString } = require("terminal-block-fonts");

// unchanged from the previous example
function leftPad(number) { ... }
function getTime() { ... }

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

// print once
// because the second and later runs will erase 7 lines
process.stdout.write(rainbowClock(getTime()));

setInterval(() => {
  const currentTimeString = rainbowClock(getTime());

  // magic number 7 here is the height of the block font
  process.stdout.write(ansiEscapes.eraseLines(7) + currentTimeString);
}, 1000);
```

And we can run the program again with `node index.js` to see the colorful clock!

## Step 5: Add command line options

Now we have a clock that shows time in the 24-hour clock. Sometimes people would prefer to have the 12-hour clock instead.

This is the right timing to add command line options. Thinking of the right user interface first: if we’re the users, we may wish the command line to offer those conveniences:

1. can be used as a simple command such as `clock`
2. print usage information if called with `--help` flag
3. support 12-hour clock if called with the flag `--mode 12h`

With the above requirements, it is possible to build a simple program to handle them, but a more cost-effective way is to use a “commander” library. For Node.js, the package is [commander](https://www.npmjs.com/package/commander). Many other languages have similar commander library available.

With commander, you can easily define command options like this:

```javascript
const program = require("commander");

program
  .version("0.1.0")
  .option("--mode <mode>", "display mode, can be either 12h or 24h", "24h")
  .parse(process.argv);
```

Due to the scope, we won’t include sub commands in the clock example, but it is pretty intuitive to implement with commander library as well:

```javascript
const git = require("commander");

git
  .command("add <files..>", "add files to stage")
  .option("-A, --all", "add all files")
  .action((files, options) => {
    // handle git add in this block
  });

git
  .command("commit", "create a commit with staged files")
  .option("-m <message>", "commit message")
  .action(options => {
    // handle git commit in this block
  });
```

Let’s install the commander package.

```shell
npm install --save commander
```

Update `index.js` to add support for command line options:

```javascript
const ansiEscapes = require("ansi-escapes");
const { red, yellow, blue } = require("chalk");
const { toBlock, mapBlock, concatBlocks, toString } = require("terminal-block-fonts");

// unchanged from the previous example
function leftPad(number) { ... }
function getTime() { ... }

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
```

And we need to create a binary file in `bin/clock`:

```shell
mkdir bin
touch bin/clock
chmod +x bin/clock

# add bin directory to path so we can call "clock" directly
export PATH=$PATH:./bin
```

and the content of `bin/clock` would be like this, which simply call the run function from `index.js`

```shell
#!/usr/bin/env node

require("..").run();
```

And we can give it a try now, try those commands:  `clock`, `clock --mode 12h`, `clock --help`.

## Step 6: Add autocomplete

Now that we have a fully working command line app, it has a few options, and for the option `--mode` it has two possible option values. Adding autocomplete will definitely make the user experience even more delightful. Let’s give it a try!

Autocomplete in command line works in a way as described below:

1. when a user presses the tab key, the shell (bash or zsh or others) first detects current command name, and check if a completion function has been defined for the given command.
2. if a completion function has been found, the shell will invoke the registered callback function to get a list of candidates
3. the shell will show candidates and if there’s only one candidate word available, the shell will automatically fill that word to the command line

According to the workflow, we have 2 things in our to-do list:

1. to implement a mechanism to help our users register the completion function to their shell
2. to implement the callback that returns candidate words

We’ll use additional command line options to add those support, and for simplification purpose, we’ll add support for bash only, but adding support other shells should be quite similar. If you’re interested in more general solutions, there’s a pretty neat solution for Node.js named [omelette](https://www.npmjs.com/package/omelette) available.

We would make some changes to our `index.js` file:

```javascript
const ansiEscapes = require("ansi-escapes");
const { red, yellow, blue } = require("chalk");
const { toBlock, mapBlock, concatBlocks, toString } = require("terminal-block-fonts");

// unchanged from the previous example
function leftPad(number) { ... }
function getTime() { ... }
function rainbowClock12(time) { ... }
function rainbowClock24(time) { ... }

function checkAutocomplete(argv) {
  if (argv[2] === "--completion") {
    // generate completion script

    // we define a completion function for command named "clock"
    // which call (clock --compgen <fragment> <prevWord> <line>) to get candidate words
    // the last "-- ${COMP_WORDS[COMP_CWORD]}" argument
    // tells compgen to filter candidates by
    // prefix which is the fragment that is currently being working on
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
      const prevWord = argv[4];

      // line is the exact text users see from the command line
      // it contains full context information
      // which can be very useful for more complex autocompletion cases
      // const line = argv[5];

      // for the 2nd position we return 2 possible candidates if the first word is --mode
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
  // check autocomplete
  // if handled the process will exit
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
```

Now that the autocompletion is available, let’s test it with:

```bash
# this is how our user install completion function
# if this line is added to .bashrc
# users will get autocompletion after they start a new shell
$ eval "$(clock --completion)"

$ clock <tab>
--help --mode --version

$ clock --mode <tab>
12h 24h
```


## Step 7: Pack the app as an executable (language specific)

Our clock app is done, it is really cool, and we would like to share it with our friend. But how should we distribute it?

The typical way of sharing a Node.js program is through [npm](http://npmjs.com), which is a public package registry. We can publish our app to npm, and others can get it with a few steps:

1. Install Node.js runtime if they don't have it yet (since Javascript is an interpreted language)
2. npm install -g published-package-name

Not too bad, right? But we may have known that compiled languages such as Go can distribute a single binary file, there’s no need to install the runtime, which is really convenient for end users.

The good news is that for Node.js we can also achieve that experience! Let’s see how we can make it.

The tool we are going to use is called [pkg](https://www.npmjs.com/package/pkg). We can install it by:

```bash
npm install -g pkg
```

And then compiling is actually super easy:

```bash
$ pkg bin/clock
> pkg@4.3.7
> Targets not specified. Assuming:
  node8-linux-x64, node8-macos-x64, node8-win-x64

# and we have a few binary generated!
$ ls -lh
drwxr-xr-x   3 user  staff    96B Feb  7 17:37 bin
-rwxr-xr-x   1 user  staff    34M Feb  8 11:16 clock
-rwxr-xr-x   1 user  staff    34M Feb  8 11:30 clock-linux
-rwxr-xr-x   1 user  staff    34M Feb  8 11:30 clock-macos
-rw-r--r--   1 user  staff    22M Feb  8 11:30 clock-win.exe
-rw-r--r--   1 user  staff   3.3K Feb  8 11:01 index.js
drwxr-xr-x  23 user  staff   736B Feb  7 17:27 node_modules
-rw-r--r--   1 user  staff   5.6K Feb  7 17:27 package-lock.json
-rw-r--r--   1 user  staff   372B Feb  7 17:27 package.json

$ ./clock-macos --help
Usage: clock [options]

Options:
  -V, --version  output the version number
  --mode <mode>  display mode, can be either 12h or 24h (default: "24h")
  -h, --help     output usage information
```

## Closing

That’s it. We have built a modern CLI app, with the help of some really useful libraries, it is not that hard, isn’t it? Even though the tutorial is built in Node.js, for other languages, those technics should also be applicable.

For complete code, you can checkout it from http://github.com/bencao/terminal-clock.

We hope you enjoyed the tutorial and learned something new. Please let us know if you find something that can make a CLI app even better!

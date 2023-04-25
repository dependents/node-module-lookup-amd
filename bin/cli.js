#!/usr/bin/env node

'use strict';

const program = require('commander');
const lookup = require('../index.js');
const { version } = require('../package.json');

program
  .version(version)
  .usage('[options] <path>')
  .option('-c, --config <path>', 'location of a RequireJS config file for AMD')
  .option('-f, --filename <path>', 'file containing the dependency')
  .option('-d, --directory <path>', 'directory containing all files')
  .parse();

const partial = program.args[0];
const { filename, config } = program.opts();

const result = lookup({
  config,
  filename,
  partial
});

console.log(result);

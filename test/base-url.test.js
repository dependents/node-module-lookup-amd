'use strict';

const assert = require('node:assert').strict;
const path = require('node:path');
const { ConfigFile } = require('requirejs-config-file');
const { suite } = require('uvu');
const lookup = require('../index.js');

const directory = path.join(__dirname, '/fixtures/js');
const filename = path.join(directory, '/a.js');
const config = path.join(__dirname, '/fixtures/config.json');
const innerConfig = path.join(__dirname, 'fixtures/js/innerConfig.json');

const test = suite('baseUrl');

test('no baseUrl + configPath: defaults to directory containing the config file', () => {
  const configObject = new ConfigFile(config).read();
  delete configObject.baseUrl;

  const expected = path.join(directory, '../forNoBaseUrl.js');
  const actual = lookup({
    config: configObject,
    configPath: config,
    partial: 'forNoBaseUrl',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('no baseUrl, no configPath: defaults to directory containing the given file', () => {
  const configObject = new ConfigFile(config).read();
  delete configObject.baseUrl;

  const expected = path.join(directory, 'b.js');
  const actual = lookup({
    config: configObject,
    partial: 'b',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('leading slash: does not duplicate the baseUrl in the resolved file', () => {
  const expected = path.join(directory, 'a.js');
  const actual = lookup({
    config: innerConfig,
    partial: 'a',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('filename outside baseUrl: still resolves the partial', () => {
  const expected = path.join(directory, 'b.js');
  const actual = lookup({
    config,
    partial: 'b',
    filename: path.join(__dirname, '/base-url.test.js')
  });

  assert.equal(path.normalize(actual), expected);
});

test.run();

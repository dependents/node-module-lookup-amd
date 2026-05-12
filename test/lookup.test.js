'use strict';

const assert = require('node:assert').strict;
const path = require('node:path');
const { ConfigFile } = require('requirejs-config-file');
const { suite } = require('uvu');
const lookup = require('../index.js');

const directory = path.join(__dirname, '/fixtures/js');
const filename = path.join(directory, '/a.js');
const config = path.join(__dirname, '/fixtures/config.json');

const test = suite('lookup');

test('returns the real path of an aliased module given a path to a requirejs config file', () => {
  const expected = path.join(directory, 'b.js');
  const actual = lookup({
    config,
    partial: 'b',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('resolves absolute paths about the baseUrl, not the module', () => {
  const expected = path.join(directory, 'c.js');
  const actual = lookup({
    config,
    partial: '/c',
    filename: `${directory}/subdir/a.js`
  });

  assert.equal(path.normalize(actual), expected);
});

test('resolves relative paths with same directory', () => {
  const expected = path.join(directory, '/subdir/c.js');
  const actual = lookup({
    config,
    partial: './c',
    filename: `${directory}/subdir/a.js`
  });

  assert.equal(path.normalize(actual), expected);
});

test('returns the looked up path given a loaded requirejs config object', () => {
  const expected = path.join(directory, 'b.js');
  const configObject = new ConfigFile(config).read();
  const actual = lookup({
    config: configObject,
    configPath: config,
    partial: 'foobar',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('supports paths that use plugin loaders', () => {
  const expected = path.join(directory, '../templates/a.mustache');
  const actual = lookup({
    config,
    partial: 'hgn!templates/a',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('supports relative plugin loader paths', () => {
  // templates should path lookup to ../templates
  const expected = path.join(directory, 'templates/a.mustache');
  const actual = lookup({
    config,
    partial: 'hgn!./templates/a',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('supports relative plugin loader paths outside baseDir', () => {
  // templates should path lookup to ../templates
  const expected = path.join(directory, '../templates/a.mustache');
  const actual = lookup({
    config,
    partial: 'hgn!../templates/a',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('supports plugin loader usage with the full extension', () => {
  const expected = path.join(directory, '../templates/a.mustache');
  const actual = lookup({
    config,
    partial: 'text!../templates/a.mustache',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('supports map aliasing', () => {
  const expected = path.join(directory, '../templates/inner/b.mustache');
  const actual = lookup({
    config,
    partial: 'hgn!inner/templates/b',
    filename
  });

  assert.equal(path.normalize(actual), expected);
});

test('does not throw if the config is missing', () => {
  assert.doesNotThrow(() => {
    lookup({
      partial: 'b',
      filename
    });
  });
});

test('properly resolves files with the .min.js extension', () => {
  const expected = path.join(directory, 'vendor/jquery.min.js');
  const actual = lookup({
    config,
    partial: 'jquery',
    filename: `${directory}/subdir/a.js`
  });

  assert.equal(path.normalize(actual), expected);
});

test('does not confuse minified and unminified files in the same dir', () => {
  const expected = path.join(directory, 'vendor/jquery.js');
  const actual = lookup({
    config,
    partial: 'jquery',
    filename: `${directory}/subdir/a.js`
  });

  assert.notEqual(path.normalize(actual), expected);
});

test('resolves from subdir', () => {
  const expected = path.join(directory, 'subdir/c.js');
  const actual = lookup({
    partial: '../c',
    filename: `${directory}/subdir/subsubdir/a.js`
  });

  assert.equal(path.normalize(actual), expected);
});

test('resolves from sub subdir', () => {
  const expected = path.join(directory, 'b.js');
  const actual = lookup({
    partial: '../../b',
    // config,
    filename: `${directory}/subdir/subsubdir/a.js`
  });

  assert.equal(path.normalize(actual), expected);
});

test('resolves from sub sub sub dir', () => {
  const expected = path.join(directory, 'b.js');
  const actual = lookup({
    partial: '../../../b',
    // config,
    filename: `${directory}/subdir/subsubdir/subsubsubdir/a.js`
  });

  assert.equal(path.normalize(actual), expected);
});

test('resolves style imports', () => {
  const expected = path.join(directory, '../styles/myStyles.css');
  const actual = lookup({
    config,
    partial: 'css!styles/myStyles',
    filename: `${directory}/subdir/a.js`
  });

  assert.equal(path.normalize(actual), expected);
});

test('does not throw if the baseUrl is missing', () => {
  const configObject = new ConfigFile(config).read();
  delete configObject.baseUrl;

  assert.doesNotThrow(() => {
    lookup({
      config: configObject,
      configPath: config,
      partial: 'foobar',
      filename
    });
  });
});

test('does not throw if config.map is missing', () => {
  const configObject = new ConfigFile(config).read();
  delete configObject.map;

  assert.doesNotThrow(() => {
    lookup({
      config: configObject,
      configPath: config,
      partial: 'foobar',
      filename
    });
  });
});

test('does not throw if config.paths is missing', () => {
  const configObject = new ConfigFile(config).read();
  delete configObject.paths;

  assert.doesNotThrow(() => {
    lookup({
      config: configObject,
      configPath: config,
      partial: 'foobar',
      filename
    });
  });
});

test('does not throw if the partial doesn\'t resolve to a file', () => {
  assert.doesNotThrow(() => {
    lookup({
      config,
      partial: 'foo/bar',
      filename: `${directory}/subdir/a.js`
    });
  });
});

test.run();


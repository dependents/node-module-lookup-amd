/* eslint-env mocha */

'use strict';

const assert = require('assert').strict;
const path = require('path');
const process = require('process');
const { ConfigFile } = require('requirejs-config-file');
const lookup = require('../index.js');

let directory;
let filename;
let config;

describe('lookup', () => {
  beforeEach(() => {
    directory = path.join(__dirname, '/fixtures/js');
    filename = path.join(directory, '/a.js');
    config = path.join(__dirname, '/fixtures/config.json');
  });

  it('returns the real path of an aliased module given a path to a requirejs config file', () => {
    const expected = path.join(directory, 'b.js');
    const actual = lookup({
      config,
      partial: 'b',
      filename
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('resolves absolute paths about the baseUrl, not the module', () => {
    const expected = path.join(directory, 'c.js');
    const actual = lookup({
      config,
      partial: '/c',
      filename: `${directory}/subdir/a.js`
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('resolves relative paths with same directory', () => {
    const expected = path.join(directory, '/subdir/c.js');
    const actual = lookup({
      config,
      partial: './c',
      filename: `${directory}/subdir/a.js`
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('returns the looked up path given a loaded requirejs config object', () => {
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

  it('supports paths that use plugin loaders', () => {
    const expected = path.join(directory, '../templates/a.mustache');
    const actual = lookup({
      config,
      partial: 'hgn!templates/a',
      filename
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('supports relative plugin loader paths', () => {
    // templates should path lookup to ../templates
    const expected = path.join(directory, 'templates/a.mustache');
    const actual = lookup({
      config,
      partial: 'hgn!./templates/a',
      filename
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('supports relative plugin loader paths outside baseDir', () => {
    // templates should path lookup to ../templates
    const expected = path.join(directory, '../templates/a.mustache');
    const actual = lookup({
      config,
      partial: 'hgn!../templates/a',
      filename
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('supports plugin loader usage with the full extension', () => {
    const expected = path.join(directory, '../templates/a.mustache');
    const actual = lookup({
      config,
      partial: 'text!../templates/a.mustache',
      filename
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('supports map aliasing', () => {
    const expected = path.join(directory, '../templates/inner/b.mustache');
    const actual = lookup({
      config,
      partial: 'hgn!inner/templates/b',
      filename
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('does not throw if the config is missing', () => {
    assert.doesNotThrow(() => {
      lookup({
        partial: 'b',
        filename
      });
    });
  });

  it('properly resolves files with the .min.js extension', () => {
    const expected = path.join(directory, 'vendor/jquery.min.js');
    const actual = lookup({
      config,
      partial: 'jquery',
      filename: `${directory}/subdir/a.js`
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('does not confuse minified and unminified files in the same dir', () => {
    const expected = path.join(directory, 'vendor/jquery.js');
    const actual = lookup({
      config,
      partial: 'jquery',
      filename: `${directory}/subdir/a.js`
    });

    assert.notEqual(path.normalize(actual), expected);
  });

  it('resolves from subdir', () => {
    const expected = path.join(directory, 'subdir/c.js');
    const actual = lookup({
      partial: '../c',
      filename: `${directory}/subdir/subsubdir/a.js`
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('resolves from sub subdir', () => {
    const expected = path.join(directory, 'b.js');
    const actual = lookup({
      partial: '../../b',
      // config,
      filename: `${directory}/subdir/subsubdir/a.js`
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('resolves from sub sub sub dir', () => {
    const expected = path.join(directory, 'b.js');
    const actual = lookup({
      partial: '../../../b',
      // config,
      filename: `${directory}/subdir/subsubdir/subsubsubdir/a.js`
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('resolves style imports', () => {
    const expected = path.join(directory, '../styles/myStyles.css');
    const actual = lookup({
      config,
      partial: 'css!styles/myStyles',
      filename: `${directory}/subdir/a.js`
    });

    assert.equal(path.normalize(actual), expected);
  });

  it('does not throw if the baseUrl is missing', () => {
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

  it('does not throw if config.map is missing', () => {
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

  it('does not throw if config.paths is missing', () => {
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

  it('does not throw if the partial doesn\'t resolve to a file', () => {
    assert.doesNotThrow(() => {
      lookup({
        config,
        partial: 'foo/bar',
        filename: `${directory}/subdir/a.js`
      });
    });
  });

  describe('when no baseUrl is in the config', () => {
    describe('and a configPath is supplied', () => {
      it('defaults the directory containing the config file', () => {
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
    });

    describe('and the configPath was not supplied', () => {
      it('defaults to the directory containing the given file', () => {
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
    });
  });

  describe('when a filename is not within the base url', () => {
    it('still resolves the partial', () => {
      const expected = path.join(directory, 'b.js');
      const actual = lookup({
        config,
        partial: 'b',
        filename: path.join(__dirname, '/test.js')
      });

      assert.equal(path.normalize(actual), expected);
    });
  });

  describe('when the baseUrl has a leading slash', () => {
    beforeEach(function() {
      this._config = path.join(__dirname, 'fixtures/js/innerConfig.json');
    });

    it('does not duplicate the baseUrl in the resolved file', function() {
      const expected = path.join(directory, 'a.js');
      const actual = lookup({
        config: this._config,
        partial: 'a',
        filename
      });

      assert.equal(path.normalize(actual), expected);
    });
  });

  describe('when config is missing but the directory option is set', () => {
    it('resolves absolute paths based on directory', () => {
      const expected = path.join(directory, 'subdir/c.js');
      const actual = lookup({
        partial: 'subdir/c',
        filename: `${directory}/subdir/a.js`,
        directory
      });

      assert.equal(path.normalize(actual), expected);
    });

    it('resolves relative paths based on filename', () => {
      const expected = path.join(directory, 'subdir/c.js');
      const actual = lookup({
        partial: './c',
        filename: `${directory}/subdir/a.js`,
        directory
      });

      assert.equal(path.normalize(actual), expected);
    });
  });

  describe('when run from within the directory, with no config, no directory', () => {
    const cwd = process.cwd();

    beforeEach(() => {
      process.chdir(directory);
    });

    afterEach(() => {
      process.chdir(cwd);
    });

    it('resolves correctly when directory is relative and there is multiple similar named files', () => {
      const expected = 'z.js';
      const actual = lookup({
        partial: 'z',
        filename: 'subdir/b.js',
        directory: '.'
      });

      assert.equal(path.normalize(actual), expected);
    });
  });
});

'use strict';

const assert = require('assert');
const path = require('path');
const {ConfigFile} = require('requirejs-config-file');
const sinon = require('sinon');

const lookup = require('../');

let directory;
let filename;
let config;

describe('lookup', function() {
  beforeEach(function() {
    directory = path.normalize(__dirname + '/example/js');
    filename = path.normalize(directory + '/a.js');
    config = path.normalize(__dirname + '/example/config.json');
  });

  it('returns the real path of an aliased module given a path to a requirejs config file', function() {
    assert.equal(lookup({
      config,
      partial: 'b',
      filename
    }), path.join(directory, 'b.js'));
  });

  it('resolves absolute paths about the baseUrl, not the module', function() {
    assert.equal(lookup({
      config,
      partial: '/c',
      filename: `${directory}/subdir/a.js`,
    }), path.join(directory, 'c.js'));
  });

  it('resolves relative paths with same directory', function() {
    assert.equal(lookup({
      config,
      partial: './c',
      filename: `${directory}/subdir/a.js`,
    }), path.join(directory, '/subdir/c.js'));
  });

  it('returns the looked up path given a loaded requirejs config object', function() {
    const configObject = new ConfigFile(config).read();
    assert.equal(lookup({
      config: configObject,
      configPath: config,
      partial: 'foobar',
      filename
    }), path.join(directory, 'b.js'));
  });

  it('supports paths that use plugin loaders', function() {
    assert.equal(lookup({
      config,
      partial: 'hgn!templates/a',
      filename
    }), path.join(directory, '../templates/a.mustache'));
  });

  it('supports relative plugin loader paths', function() {
    // templates should path lookup to ../templates
    assert.equal(lookup({
      config,
      partial: 'hgn!./templates/a',
      filename
    }), path.join(directory, 'templates/a.mustache'));
  });

  it('supports relative plugin loader paths outside baseDir', function() {
    // templates should path lookup to ../templates
    assert.equal(lookup({
      config,
      partial: 'hgn!../templates/a',
      filename
    }), path.join(directory, '../templates/a.mustache'));
  });

  it('supports plugin loader usage with the full extension', function() {
    assert.equal(lookup({
      config,
      partial: 'text!../templates/a.mustache',
      filename
    }), path.join(directory, '../templates/a.mustache'));
  });

  it('supports map aliasing', function() {
    assert.equal(lookup({
      config,
      partial: 'hgn!inner/templates/b',
      filename
    }), path.join(directory, '../templates/inner/b.mustache'));
  });

  it('does not throw if the config is missing', function() {
    assert.doesNotThrow(function() {
      lookup({
        partial: 'b',
        filename
      });
    });
  });

  it('properly resolves files with the .min.js extension', function() {
    assert.equal(lookup({
      config,
      partial: 'jquery',
      filename: `${directory}/subdir/a.js`,
    }), path.join(directory, 'vendor/jquery.min.js'));
  });

  it('does not confuse minified and unminified files in the same dir', function() {
    assert.notEqual(lookup({
      config,
      partial: 'jquery',
      filename: `${directory}/subdir/a.js`,
    }), path.join(directory, 'vendor/jquery.js'));
  });

  it('resolves from subdir', function() {
    assert.equal(lookup({
      partial: '../c',
      filename: `${directory}/subdir/subsubdir/a.js`,
    }), path.join(directory, 'subdir/c.js'));
  });

  it('resolves from sub subdir', function() {
    assert.equal(lookup({
      partial: '../../b',
      // config,
      filename: `${directory}/subdir/subsubdir/a.js`,
    }), path.join(directory, 'b.js'));
  });

  it('resolves from sub sub sub dir', function() {
    assert.equal(lookup({
      partial: '../../../b',
      // config,
      filename: `${directory}/subdir/subsubdir/subsubsubdir/a.js`,
    }), path.join(directory, 'b.js'));
  });

  it('resolves style imports', function() {
    assert.equal(lookup({
      config,
      partial: 'css!styles/myStyles',
      filename: `${directory}/subdir/a.js`,
    }), path.join(directory, '../styles/myStyles.css'));
  });

  it('does not throw if the baseUrl is missing', function() {
    const configObject = new ConfigFile(config).read();
    delete configObject.baseUrl;

    assert.doesNotThrow(function() {
      lookup({
        config: configObject,
        configPath: config,
        partial: 'foobar',
        filename
      });
    });
  });

  it('does not throw if config.map is missing', function() {
    const configObject = new ConfigFile(config).read();
    delete configObject.map;

    assert.doesNotThrow(function() {
      lookup({
        config: configObject,
        configPath: config,
        partial: 'foobar',
        filename
      });
    });
  });

  it('does not throw if config.paths is missing', function() {
    const configObject = new ConfigFile(config).read();
    delete configObject.paths;

    assert.doesNotThrow(function() {
      lookup({
        config: configObject,
        configPath: config,
        partial: 'foobar',
        filename
      });
    });
  });

  it('does not throw if the partial doesn\'t resolve to a file', function() {
    assert.doesNotThrow(() => {
      lookup({
        config,
        partial: 'foo/bar',
        filename: `${directory}/subdir/a.js`,
      });
    });
  });

  describe('when no baseUrl is in the config', function() {
    describe('and a configPath is supplied', function() {
      it('defaults the directory containing the config file', function() {
        const configObject = new ConfigFile(config).read();
        delete configObject.baseUrl;

        assert.equal(lookup({
          config: configObject,
          configPath: config,
          partial: 'forNoBaseUrl',
          filename
        }), path.join(directory, '../forNoBaseUrl.js'));
      });
    });

    describe('and the configPath was not supplied', function() {
      it('defaults to the directory containing the given file', function() {
        const configObject = new ConfigFile(config).read();
        delete configObject.baseUrl;

        assert.equal(lookup({
          config: configObject,
          partial: 'b',
          filename
        }), path.join(directory, 'b.js'));
      });
    });
  });

  describe('when a filename is not within the base url', function() {
    it('still resolves the partial', function() {
      assert.equal(lookup({
        config,
        partial: 'b',
        filename: __dirname + '/test.js'
      }), path.join(directory, 'b.js'));
    });
  });

  describe('when the baseUrl has a leading slash', function() {
    beforeEach(function() {
      this._config = __dirname + '/example/js/innerConfig.json';
    });

    it('does not duplicate the baseUrl in the resolved file', function() {
      assert.equal(lookup({
        config: this._config,
        partial: 'a',
        filename
      }), path.join(directory, 'a.js'));
    });
  });

  describe('when config is missing but the directory option is set', function() {
    it('resolves absolute paths based on directory', function() {
      assert.equal(lookup({
        partial: 'subdir/c',
        filename: `${directory}/subdir/a.js`,
        directory: directory
      }), path.join(directory, 'subdir/c.js'));
    });

    it('resolves relative paths based on filename', function() {
      assert.equal(lookup({
        partial: './c',
        filename: `${directory}/subdir/a.js`,
        directory: directory
      }), path.join(directory, 'subdir/c.js'));
    });
  });

  describe('when run from within the directory, with no config, no directory', function() {
    const cwd = process.cwd();

    beforeEach(function() {
      process.chdir(directory);
    });

    afterEach(function() {
      process.chdir(cwd);
    });

    it('resolves correctly when directory is relative and there is multiple similar named files', function() {
      assert.equal(lookup({
        partial: 'z',
        filename: `subdir/b.js`,
        directory: '.',
      }), 'z.js');
    });
  });
});

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigFile } from 'requirejs-config-file';
import { describe, it, expect } from 'vitest';
import lookup from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const directory = path.join(__dirname, '/fixtures/js');
const filename = path.join(directory, '/a.js');
const config = path.join(__dirname, '/fixtures/config.json');

describe('lookup', () => {
  it('returns the real path of an aliased module given a path to a requirejs config file', () => {
    const expected = path.join(directory, 'b.js');
    const actual = lookup({
      config,
      partial: 'b',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('resolves absolute paths about the baseUrl, not the module', () => {
    const expected = path.join(directory, 'c.js');
    const actual = lookup({
      config,
      partial: '/c',
      filename: `${directory}/subdir/a.js`
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('resolves relative paths with same directory', () => {
    const expected = path.join(directory, '/subdir/c.js');
    const actual = lookup({
      config,
      partial: './c',
      filename: `${directory}/subdir/a.js`
    });

    expect(path.normalize(actual)).toBe(expected);
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

    expect(path.normalize(actual)).toBe(expected);
  });

  it('supports paths that use plugin loaders', () => {
    const expected = path.join(directory, '../templates/a.mustache');
    const actual = lookup({
      config,
      partial: 'hgn!templates/a',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('supports relative plugin loader paths', () => {
    const expected = path.join(directory, 'templates/a.mustache');
    const actual = lookup({
      config,
      partial: 'hgn!./templates/a',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('supports relative plugin loader paths outside baseDir', () => {
    const expected = path.join(directory, '../templates/a.mustache');
    const actual = lookup({
      config,
      partial: 'hgn!../templates/a',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('supports plugin loader usage with the full extension', () => {
    const expected = path.join(directory, '../templates/a.mustache');
    const actual = lookup({
      config,
      partial: 'text!../templates/a.mustache',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('supports map aliasing', () => {
    const expected = path.join(directory, '../templates/inner/b.mustache');
    const actual = lookup({
      config,
      partial: 'hgn!inner/templates/b',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('does not throw if the config is missing', () => {
    expect(() => {
      lookup({
        partial: 'b',
        filename
      });
    }).not.toThrow();
  });

  it('properly resolves files with the .min.js extension', () => {
    const expected = path.join(directory, 'vendor/jquery.min.js');
    const actual = lookup({
      config,
      partial: 'jquery',
      filename: `${directory}/subdir/a.js`
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('does not confuse minified and unminified files in the same dir', () => {
    const expected = path.join(directory, 'vendor/jquery.js');
    const actual = lookup({
      config,
      partial: 'jquery',
      filename: `${directory}/subdir/a.js`
    });

    expect(path.normalize(actual)).not.toBe(expected);
  });

  it('resolves from subdir', () => {
    const expected = path.join(directory, 'subdir/c.js');
    const actual = lookup({
      partial: '../c',
      filename: `${directory}/subdir/subsubdir/a.js`
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('resolves from sub subdir', () => {
    const expected = path.join(directory, 'b.js');
    const actual = lookup({
      partial: '../../b',
      filename: `${directory}/subdir/subsubdir/a.js`
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('resolves from sub sub sub dir', () => {
    const expected = path.join(directory, 'b.js');
    const actual = lookup({
      partial: '../../../b',
      filename: `${directory}/subdir/subsubdir/subsubsubdir/a.js`
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('resolves style imports', () => {
    const expected = path.join(directory, '../styles/myStyles.css');
    const actual = lookup({
      config,
      partial: 'css!styles/myStyles',
      filename: `${directory}/subdir/a.js`
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('does not throw if the baseUrl is missing', () => {
    const configObject = new ConfigFile(config).read();
    delete configObject.baseUrl;

    expect(() => {
      lookup({
        config: configObject,
        configPath: config,
        partial: 'foobar',
        filename
      });
    }).not.toThrow();
  });

  it('does not throw if config.map is missing', () => {
    const configObject = new ConfigFile(config).read();
    delete configObject.map;

    expect(() => {
      lookup({
        config: configObject,
        configPath: config,
        partial: 'foobar',
        filename
      });
    }).not.toThrow();
  });

  it('does not throw if config.paths is missing', () => {
    const configObject = new ConfigFile(config).read();
    delete configObject.paths;

    expect(() => {
      lookup({
        config: configObject,
        configPath: config,
        partial: 'foobar',
        filename
      });
    }).not.toThrow();
  });

  it('does not throw if the partial doesn\'t resolve to a file', () => {
    expect(() => {
      lookup({
        config,
        partial: 'foo/bar',
        filename: `${directory}/subdir/a.js`
      });
    }).not.toThrow();
  });
});

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigFile } from 'requirejs-config-file';
import { describe, it, expect } from 'vitest';
import lookup from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const directory = path.join(__dirname, '/fixtures/js');
const filename = path.join(directory, '/a.js');
const config = path.join(__dirname, '/fixtures/config.json');
const innerConfig = path.join(__dirname, 'fixtures/js/innerConfig.json');

describe('baseUrl', () => {
  it('no baseUrl + configPath: defaults to directory containing the config file', () => {
    const configObject = new ConfigFile(config).read();
    delete configObject.baseUrl;

    const expected = path.join(directory, '../forNoBaseUrl.js');
    const actual = lookup({
      config: configObject,
      configPath: config,
      partial: 'forNoBaseUrl',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('no baseUrl, no configPath: defaults to directory containing the given file', () => {
    const configObject = new ConfigFile(config).read();
    delete configObject.baseUrl;

    const expected = path.join(directory, 'b.js');
    const actual = lookup({
      config: configObject,
      partial: 'b',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('leading slash: does not duplicate the baseUrl in the resolved file', () => {
    const expected = path.join(directory, 'a.js');
    const actual = lookup({
      config: innerConfig,
      partial: 'a',
      filename
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('filename outside baseUrl: still resolves the partial', () => {
    const expected = path.join(directory, 'b.js');
    const actual = lookup({
      config,
      partial: 'b',
      filename: path.join(__dirname, '/base-url.test.js')
    });

    expect(path.normalize(actual)).toBe(expected);
  });
});

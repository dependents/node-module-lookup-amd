import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach
} from 'vitest';
import lookup from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const directory = path.join(__dirname, '/fixtures/js');

describe('directory option', () => {
  it('resolves absolute paths based on directory', () => {
    const expected = path.join(directory, 'subdir/c.js');
    const actual = lookup({
      partial: 'subdir/c',
      filename: `${directory}/subdir/a.js`,
      directory
    });

    expect(path.normalize(actual)).toBe(expected);
  });

  it('resolves relative paths based on filename', () => {
    const expected = path.join(directory, 'subdir/c.js');
    const actual = lookup({
      partial: './c',
      filename: `${directory}/subdir/a.js`,
      directory
    });

    expect(path.normalize(actual)).toBe(expected);
  });
});

describe('run from directory', () => {
  let savedCwd;

  beforeEach(() => {
    savedCwd = process.cwd();
    process.chdir(directory);
  });

  afterEach(() => {
    process.chdir(savedCwd);
  });

  it('resolves correctly when directory is relative and there are multiple similarly named files', () => {
    const expected = 'z.js';
    const actual = lookup({
      partial: 'z',
      filename: 'subdir/b.js',
      directory: '.'
    });

    expect(path.normalize(actual)).toBe(expected);
  });
});

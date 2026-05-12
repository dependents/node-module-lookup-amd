import { strict as assert } from 'node:assert';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { suite } from 'uvu';
import lookup from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const directory = path.join(__dirname, '/fixtures/js');

const directoryOption = suite('directory option');

directoryOption('resolves absolute paths based on directory', () => {
  const expected = path.join(directory, 'subdir/c.js');
  const actual = lookup({
    partial: 'subdir/c',
    filename: `${directory}/subdir/a.js`,
    directory
  });

  assert.equal(path.normalize(actual), expected);
});

directoryOption('resolves relative paths based on filename', () => {
  const expected = path.join(directory, 'subdir/c.js');
  const actual = lookup({
    partial: './c',
    filename: `${directory}/subdir/a.js`,
    directory
  });

  assert.equal(path.normalize(actual), expected);
});

directoryOption.run();

const runFromDirectory = suite('run from directory');

let savedCwd;

runFromDirectory.before.each(() => {
  savedCwd = process.cwd();
  process.chdir(directory);
});

runFromDirectory.after.each(() => {
  process.chdir(savedCwd);
});

runFromDirectory('resolves correctly when directory is relative and there are multiple similarly named files', () => {
  const expected = 'z.js';
  const actual = lookup({
    partial: 'z',
    filename: 'subdir/b.js',
    directory: '.'
  });

  assert.equal(path.normalize(actual), expected);
});

runFromDirectory.run();

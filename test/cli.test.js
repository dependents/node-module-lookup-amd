import { strict as assert } from 'node:assert';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { suite } from 'uvu';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');

const test = suite('cli');

test('prints error and exits 1 when path argument is missing', () => {
  const result = spawnSync(process.execPath, [cliPath], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /error: missing required argument 'path'/);
});

test.run();

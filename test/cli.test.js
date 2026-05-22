import process from 'node:process';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');

describe('cli', () => {
  it('prints error and exits 1 when path argument is missing', () => {
    const result = spawnSync(process.execPath, [cliPath], {
      encoding: 'utf8'
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/error: missing required argument 'path'/);
  });
});

/* eslint-env mocha */

'use strict';

const assert = require('assert').strict;
const process = require('process');
const { spawnSync } = require('child_process');
const path = require('path');

const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');

describe('lookup-amd CLI', () => {
  it('prints error and exits 1 when path argument is missing', () => {
    const result = spawnSync(process.execPath, [cliPath], {
      encoding: 'utf8'
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /error: missing required argument 'path'/);
  });
});

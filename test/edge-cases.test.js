'use strict';

const assert = require('node:assert').strict;
const path = require('node:path');
const requireJs = require('requirejs');
const { ConfigFile } = require('requirejs-config-file');
const { suite } = require('uvu');
const lookup = require('../index.js');

const directory = path.join(__dirname, '/fixtures/js');
const filename = path.join(directory, '/a.js');
const config = path.join(__dirname, '/fixtures/config.json');

const test = suite('edge cases');

test('deeply nested paths: expands ... path notation to ../../ for nested subdirectory resolution', () => {
  const originalToUrl = requireJs.toUrl;
  const originalConfig = requireJs.config;

  // Mock requirejs.toUrl to return a path with ...
  requireJs.toUrl = () => '.../a';
  requireJs.config = () => {};

  const expected = path.join(directory, 'a.js');
  const actual = lookup({
    config: {
      baseUrl: 'js',
      paths: {}
    },
    configPath: path.join(directory, 'subdir/subsubdir'),
    partial: 'deeplyNested',
    filename: path.join(directory, 'subdir/subsubdir/a.js')
  });

  // Restore original functions
  requireJs.toUrl = originalToUrl;
  requireJs.config = originalConfig;

  assert.equal(path.normalize(actual), expected);
});

test('file system errors: throws non-ENOENT errors from fileExists', () => {
  const configObject = new ConfigFile(config).read();
  const resolvedPath = path.join(directory, 'some.css');

  const mockFs = {
    statSync(filepath) {
      // Allow configPath check to succeed (it's a file, so isDirectory returns false)
      if (filepath === config) {
        return {
          isFile() {
            return true;
          },
          isDirectory() {
            return false;
          }
        };
      }

      // Allow directory check to succeed
      if (filepath === path.dirname(config)) {
        return {
          isFile() {
            return false;
          },
          isDirectory() {
            return true;
          }
        };
      }

      // Throw a non-ENOENT error when checking the actual file (in fileExists)
      if (filepath === resolvedPath) {
        const error = new Error('Permission denied');
        error.code = 'EACCES';
        throw error;
      }

      // Default for other paths
      return {
        isFile() {
          return false;
        },
        isDirectory() {
          return false;
        }
      };
    }
  };

  assert.throws(() => {
    lookup({
      config: configObject,
      configPath: config,
      partial: 'some.css', // Use an extension so fileExists is called
      filename,
      fileSystem: mockFs
    });
  }, {
    message: 'Permission denied'
  });
});

test('file system errors: handles ENOENT errors gracefully when file does not exist', () => {
  const configObject = new ConfigFile(config).read();
  const resolvedPath = path.join(directory, 'nonexistent.js');

  const mockFs = {
    statSync(filepath) {
      // Allow configPath check to succeed (it's a file, so isDirectory returns false)
      if (filepath === config) {
        return {
          isFile() {
            return true;
          },
          isDirectory() {
            return false;
          }
        };
      }

      // Allow directory check to succeed
      if (filepath === path.dirname(config)) {
        return {
          isFile() {
            return false;
          },
          isDirectory() {
            return true;
          }
        };
      }

      // Throw an ENOENT error for the nonexistent file (in fileExists)
      if (filepath === resolvedPath) {
        const error = new Error('File not found');
        error.code = 'ENOENT';
        throw error;
      }

      // Default for other paths
      return {
        isFile() {
          return false;
        },
        isDirectory() {
          return false;
        }
      };
    },
    readdirSync() {
      // Return empty array so findFileLike returns empty string
      return [];
    }
  };

  const actual = lookup({
    config: configObject,
    configPath: config,
    partial: 'nonexistent.js',
    filename,
    fileSystem: mockFs
  });

  // Should return empty string when file doesn't exist
  assert.equal(actual, '');
});

test.run();

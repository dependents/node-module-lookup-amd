'use strict';

const fs = require('fs');
const path = require('path');
const { debuglog } = require('util');
const requirejs = require('requirejs');
const { ConfigFile } = require('requirejs-config-file');

const debug = debuglog('lookup');

/**
 * Determines the real path of a potentially aliased dependency path
 * via the paths section of a require config
 *
 * @param  {Object} options
 * @param  {String} options.partial - The dependency name
 * @param  {String} options.filename - The file containing the dependency
 * @param  {String} [options.directory] - The directory to use for resolving absolute paths (when no config is used)
 * @param  {String|Object} [options.config] - Path to a RequireJS config file, or a pre-parsed config object
 * @param  {String} [options.configPath] - The location of the config file used to determine the module resolution directory
 * @param  {Object} [options.fileSystem] - An alternative filesystem / fs implementation to use for locating files.
 *
 * @return {String}
 */
module.exports = function(options = {}) {
  let { configPath } = options;
  let config = options.config || {};
  const { partial: depPath, filename } = options;
  const fileSystem = options.fileSystem || fs;

  debug(`config: ${config}`);
  debug(`partial: ${depPath}`);
  debug(`filename: ${filename}`);

  if (typeof config === 'string') {
    configPath = path.dirname(config);
    config = new ConfigFile(config, fileSystem).read();
    debug(`converting given config file ${configPath} to an object:\n`, config);
  }

  if (configPath && !fileSystem.statSync(configPath).isDirectory()) {
    configPath = path.dirname(configPath);
  }

  debug(`configPath: ${configPath}`);

  if (!config.baseUrl) {
    config.baseUrl = './';
    debug(`set baseUrl to ${config.baseUrl}`);
  }

  let normalizedModuleId = stripLoader(depPath);
  let resolutionDirectory;

  if (normalizedModuleId[0] === '.' || (!configPath && !options.directory)) {
    resolutionDirectory = path.dirname(options.filename);
    debug(`module resolution directory (relative): ${resolutionDirectory}`);
  } else {
    if (configPath) {
      resolutionDirectory = configPath;
      debug(`module resolution directory (based on configPath): ${resolutionDirectory}`);
    } else if (options.directory) {
      resolutionDirectory = options.directory;
      debug(`module resolution directory (based on directory): ${resolutionDirectory}`);
    }

    if (config.baseUrl[0] === '/') {
      debug('baseUrl with a leading slash detected');
      resolutionDirectory = resolutionDirectory.replaceAll('\\', '/').replace(config.baseUrl, '');
      debug(`new resolution directory: ${resolutionDirectory}`);
    }

    if (normalizedModuleId[0] === '/') {
      normalizedModuleId = normalizedModuleId.replaceAll(/^\/+/g, '');
    }

    requirejs.config(config);
    normalizedModuleId = requirejs.toUrl(normalizedModuleId);
  }

  debug(`requirejs normalized module id: ${normalizedModuleId}`);

  if (normalizedModuleId.includes('...')) {
    debug('detected a nested subdirectory resolution that needs to be expanded');
    normalizedModuleId = normalizedModuleId.replace('.../', '../../');
    debug(`expanded module id: ${normalizedModuleId}`);
  }

  const resolved = path.join(resolutionDirectory, normalizedModuleId);

  debug(`resolved url: ${resolved}`);

  // No need to search for a file that already has an extension
  // Need to guard against jquery.min being treated as a real file
  if (path.extname(resolved) && fileExists(resolved, fileSystem)) {
    debug(`${resolved} already has an extension and is a real file`);
    return resolved;
  }

  const foundFile = findFileLike(resolved) || '';

  if (foundFile) {
    debug(`found file like ${resolved}: ${foundFile}`);
  } else {
    debug(`could not find any file like ${resolved}`);
  }

  return foundFile;
};

/**
 * Finds a file on disk whose name starts with the basename of `resolved` followed by a dot
 * (e.g. resolves `foo/bar` to `foo/bar.js`)
 *
 * @param  {String} resolved - Absolute path without extension
 * @return {String|undefined} Absolute path of the matched file, or undefined if none found
 */
function findFileLike(resolved) {
  const dir = path.dirname(resolved);
  const base = path.basename(resolved);
  const pattern = `${base}.`;

  debug(`looking for file like ${resolved}.*`);

  try {
    const files = fs.readdirSync(dir);
    const matches = files
      .filter(file => file.startsWith(pattern))
      .map(file => path.join(dir, file));

    debug(`found the following matches: ${matches.join('\n')}`);

    // Not great if there are multiple matches, but the pattern should be
    // specific enough to prevent multiple results
    return matches[0];
  } catch (error) {
    debug(`error when looking for a match: ${error.message}`);
    return '';
  }
}

/**
 * Returns whether a file exists at the given path
 *
 * @param  {String} filepath
 * @param  {Object} fileSystem - fs-compatible implementation
 * @return {Boolean}
 */
function fileExists(filepath = '', fileSystem = fs) {
  try {
    return fileSystem.statSync(filepath).isFile();
  } catch (error) {
    // Check exception. If ENOENT - no such file or directory ok, file doesn't exist.
    // Otherwise something else went wrong, we don't have rights to access the file, ...
    if (error.code !== 'ENOENT') {
      throw error;
    }

    return false;
  }
}

/**
 * Strips the AMD plugin loader prefix from a dependency path (e.g. `text!foo` -> `foo`)
 *
 * @param  {String} partial - Dependency path, optionally prefixed with a loader
 * @return {String} Dependency path without the loader prefix
 */
function stripLoader(partial) {
  const exclamationLocation = partial.indexOf('!');

  if (exclamationLocation !== -1) {
    debug(`stripping off the plugin loader from ${partial}`);
    partial = partial.slice(exclamationLocation + 1);
    debug(`partial is now ${partial}`);
  }

  return partial;
}

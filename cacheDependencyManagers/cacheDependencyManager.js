'use strict';

var fs = require('fs');
var path = require('path');
var logger = require('../util/logger');
var md5 = require('MD5');
var shell = require('shelljs');


function CacheDependencyManager (config) {
  this.config = config;
}

var getFileHash = function (filePath) {
  var file = fs.readFileSync(filePath);
  return md5(file);
};

// Given a path relative to process' current working directory,
// returns a normalized absolute path
var getAbsolutePath = function (relativePath) {
  return path.resolve(process.cwd(), relativePath);
};

CacheDependencyManager.prototype.cacheLogInfo = function (message) {
  logger.logInfo('[' + this.config.cliName + '] ' + message);
};

CacheDependencyManager.prototype.cacheLogError = function (error) {
  logger.logError('[' + this.config.cliName + '] ' + error);
};


CacheDependencyManager.prototype.installDependencies = function () {
  var error = null;
  var installCommand = this.config.installCommand + ' ' + this.config.installOptions;
  installCommand = installCommand.trim();
  this.cacheLogInfo('running [' + installCommand + ']...');
  if (shell.exec(installCommand).code !== 0) {
    error = 'error running ' + this.config.installCommand;
    this.cacheLogError(error);
  } else {
    this.cacheLogInfo('installed ' + this.config.cliName + ' dependencies, now archiving');
  }
  return error;
};


CacheDependencyManager.prototype.archiveDependencies = function (cacheDirectory, cachePath) {
  var error = null;
  var installedDirectory = getAbsolutePath(this.config.installDirectory);
  this.cacheLogInfo('archiving dependencies from ' + installedDirectory);

  // Make sure cache directory is created
  shell.mkdir('-p', cacheDirectory);

  // Now archive installed directory
  if (shell.exec('tar -zcf ' + cachePath + ' -C ' + installedDirectory + ' .').code !== 0) {
    error = 'error tar-ing ' + installedDirectory;
    this.cacheLogError(error);
    shell.rm(cachePath);
  } else {
    this.cacheLogInfo('done archiving');
  }
  return error;
};

CacheDependencyManager.prototype.extractDependencies = function (cachePath) {
  var error = null;
  var installedDirectory = getAbsolutePath(this.config.installDirectory);
  this.cacheLogInfo('clearing installed dependencies at ' + installedDirectory);
  var removeExitCode = shell.exec('rm -rf ' + installedDirectory).code;
  if (removeExitCode !== 0) {
    error = 'error removing installed dependencies at ' + installedDirectory;
    this.cacheLogError(error);
  } else {
    this.cacheLogInfo('...cleared');

    // Make sure install directory is created
    shell.mkdir('-p', installedDirectory);

    this.cacheLogInfo('extracting dependencies from ' + cachePath);
    var tarExtractCode = shell.exec('tar -zxf ' + cachePath + ' -C ' + installedDirectory).code;
    if (tarExtractCode !== 0) {
      error = 'error untar-ing ' + cachePath;
      this.cacheLogError(error);
    } else {
      this.cacheLogInfo('done extracting');
    }
  }
  return error;
};


CacheDependencyManager.prototype.loadDependencies = function (callback) {
  var self = this;
  var error = null;

  // Check if config file for dependency manager exists
  if (! fs.existsSync(this.config.configPath)) {
    this.cacheLogInfo('Dependency config file ' + this.config.configPath + ' does not exist. Skipping install');
    callback(null);
    return;
  }
  this.cacheLogInfo('config file exists');

  // Check if package manger CLI is installed
  if (! shell.which(this.config.cliName)) {
    error = 'Command line tool ' + this.config.cliName + ' not installed';
    this.cacheLogError(error);
    callback(error);
    return;
  }
  this.cacheLogInfo('cli exists');


  // Get hash of dependency config file
  var hash = getFileHash(this.config.configPath);
  this.cacheLogInfo('hash of ' + this.config.configPath + ': ' + hash);
  // cachePath is absolute path to where local cache of dependencies is located
  var cacheDirectory = path.resolve(this.config.cacheDirectory, this.config.cliName, this.config.getCliVersion());
  var cachePath = path.resolve(cacheDirectory, hash + '.tar.gz');

  // Check if local cache of dependencies exists
  if (! this.config.forceRefresh && fs.existsSync(cachePath)) {
    this.cacheLogInfo('cache exists');

    // Try to extract dependencies
    error = this.extractDependencies(cachePath);
    if (error !== null) {
      callback(error);
      return;
    }
    // Success!

  } else { // install dependencies with CLI tool and cache

    // Try to install dependencies using package manager
    error = this.installDependencies();
    if (error !== null) {
      callback(error);
      return;
    }

    // Try to archive newly installed dependencies
    error = this.archiveDependencies(cacheDirectory, cachePath);
    if (error !== null) {
      callback(error);
      return;
    }

    // Success!
    self.cacheLogInfo('installed and archived dependencies');
  }

  callback(error);
};

/**
 * Looks for available package manager configs in cacheDependencyManagers
 * directory. Returns an object with package manager names as keys
 * and absolute paths to configs as values
 *
 * Ex: {
 *  npm: /usr/local/lib/node_modules/npm-cache/cacheDependencyMangers/npmConfig.js,
 *  bower: /usr/local/lib/node_modules/npm-cache/cacheDependencyMangers/bowerConfig.js
 * }
 *
 * @return {Object} availableManagers
 */
CacheDependencyManager.getAvailableManagers = function () {
  if (CacheDependencyManager.managers === undefined) {
    CacheDependencyManager.managers = {};
    var files = fs.readdirSync(__dirname);
    var managerRegex = /(\S+)Config\.js/;
    files.forEach(
      function addAvailableManager (file) {
        var result = managerRegex.exec(file);
        if (result !== null) {
          var managerName = result[1];
          CacheDependencyManager.managers[managerName] = path.join(__dirname, file);
        }
      }
    );
  }
  return CacheDependencyManager.managers;
};

module.exports = CacheDependencyManager;

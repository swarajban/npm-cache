'use strict';

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var logger = require('../util/logger');
var md5 = require('md5');
var isUsingComposerLock = null;

// Returns path to configuration file for composer. Uses
// composer.lock if it exists; otherwise,
// defaults to composer.json
var getComposerConfigPath = function () {
  var composerLockPath = path.resolve(process.cwd(), 'composer.lock');
  var composerJsonPath = path.resolve(process.cwd(), 'composer.json');

  if (isUsingComposerLock === null) {
    if (fs.existsSync(composerLockPath)) {
      logger.logInfo('[composer] using composer.lock instead of composer.json');
      isUsingComposerLock = true;
    }  else {
      isUsingComposerLock = false;
    }
  }

  return isUsingComposerLock ? composerLockPath : composerJsonPath;
};

// Composer.json can specify a custom vendor directory
// Let's get it if we can!
var getComposerInstallDirectory = function () {
  var composerInstallDirectory = 'vendor';

  var exists = null;
  try {
    exists = fs.statSync(getComposerConfigPath());
  } catch (e) {}

  if (exists !== null) {
    var composerConfig = JSON.parse(fs.readFileSync(getComposerConfigPath()));
    if ('config' in composerConfig && 'vendor-dir' in composerConfig.config) {
      composerInstallDirectory = composerConfig.config['vendor-dir'];
    }
  }
  return composerInstallDirectory;
};

// Function to extract composer version number
var getCliVersion = function () {
  var version = 'UnknownComposer';
  var versionString = shell.exec('composer --version', {silent: true}).output;
  // Example below:
  //    Composer version 1.0.0-alpha9 2014-12-07 17:15:20
  var versionRegex = /Composer version (\S+)/;
  var result = versionRegex.exec(versionString);
  if (result !== null) {
    version = result[1];
  } else {
    logger.logInfo('Could not find composer version from version string: ' + versionString);
  }
  return version;
};

function getFileHash(filePath) {
  var json = JSON.parse(fs.readFileSync(filePath));

  if (isUsingComposerLock) {
    return json['content-hash'];
  }

  return md5(JSON.stringify({
    packages: json.require,
    packagesDev: json['require-dev'],
    repos: json.repositories
  }));
};

module.exports = {
  cliName: 'composer',
  getCliVersion: getCliVersion,
  configPath: getComposerConfigPath(),
  installDirectory: getComposerInstallDirectory(),
  installCommand: 'composer install',
  getFileHash: getFileHash
};

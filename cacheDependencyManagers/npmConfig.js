'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');
var logger = require('../util/logger');

function getNpmMajorVersion() {
    return parseInt(getNpmVersion().split(/\./)[0] || 0, 10);
}

function getNpmVersion() {
    return shell.exec('npm --version', {silent: true}).output.trim();
}

// Returns path to configuration file for npm. Uses
// - npm-shrinkwrap.json if it exists; otherwise,
// - package-lock.json if it exists and npm >= 5; otherwise,
// - defaults to package.json
var getNpmConfigPath = function () {
  var shrinkWrapPath = path.resolve(process.cwd(), 'npm-shrinkwrap.json');
  if (fs.existsSync(shrinkWrapPath)) {
    logger.logInfo('[npm] using npm-shrinkwrap.json instead of package.json');
    return shrinkWrapPath;
  }

  if (getNpmMajorVersion() >= 5) {
      var packageLockPath = path.resolve(process.cwd(), 'package-lock.json');
      if (fs.existsSync(packageLockPath)) {
          logger.logInfo('[npm] using package-lock.json instead of package.json');
          return packageLockPath;
      }
  }

  var packagePath = path.resolve(process.cwd(), 'package.json');
  return packagePath;
};

function getFileHash(filePath) {
  var json = JSON.parse(fs.readFileSync(filePath));

  // Detect if we are reading a package-lock.json file and retrieve the
  // dependencies depending on the lockfile version. In version 1, no packages
  // object. Version 2 and 3 have a packages object to describe the project's
  // metadata, including its (dev) dependencies.
  if (json.lockfileVersion) {
    var lockfileVersion = json.lockfileVersion;
    logger.logInfo(`Generating hash from package-lock.json version ${lockfileVersion}`);

    switch (lockfileVersion) {
      case 1:
        return md5(JSON.stringify({
          dependencies: json.dependencies,
          devDependencies: json.devDependencies
        }));
      case 2:
      case 3:
        var packages = json.packages[""];

        return md5(JSON.stringify({
          dependencies: packages.dependencies,
          devDependencies: packages.devDependencies
        }));
      default:
        logger.logError('Unsupported lock file version. Open a pull request if you think it should be.');
        return;
    }
  }

  logger.logInfo(`Hash generated from package.json`);
  
  return md5(JSON.stringify({
    dependencies: json.dependencies,
    devDependencies: json.devDependencies,
    environment: process.env.NODE_ENV
  }));
}

module.exports = {
  cliName: 'npm',
  getCliVersion: getNpmVersion,
  configPath: getNpmConfigPath(),
  installDirectory: 'node_modules',
  installCommand: 'npm install',
  getFileHash: getFileHash
};

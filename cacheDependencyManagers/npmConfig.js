'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');
var logger = require('../util/logger');


// Returns path to configuration file for npm. Uses
// - npm-shrinkwrap.json if it exists; otherwise,
// - package-lock.json if it exists; otherwise,
// - defaults to package.json
var getNpmConfigPath = function () {
  var shrinkWrapPath = path.resolve(process.cwd(), 'npm-shrinkwrap.json');
  if (fs.existsSync(shrinkWrapPath)) {
    logger.logInfo('[npm] using npm-shrinkwrap.json instead of package.json');
    return shrinkWrapPath;
  }
  
  var packageLockPath = path.resolve(process.cwd(), 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    logger.logInfo('[npm] using package-lock.json instead of package.json');
    return packageLockPath;
  }

  var packagePath = path.resolve(process.cwd(), 'package.json');
  return packagePath;
};

function getFileHash(filePath) {
  var json = JSON.parse(fs.readFileSync(filePath));
  return md5(JSON.stringify({
    dependencies: json.dependencies,
    devDependencies: json.devDependencies
  }));
}

module.exports = {
  cliName: 'npm',
  getCliVersion: function getNpmVersion () {
    return shell.exec('npm --version', {silent: true}).output.trim();
  },
  configPath: getNpmConfigPath(),
  installDirectory: 'node_modules',
  installCommand: 'npm install',
  getFileHash: getFileHash
};

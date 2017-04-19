'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');
var logger = require('../util/logger');
var isUsingYarnLock = null;


// Returns path to configuration file for yarn. Uses
// yarn.lock
var getYarnConfigPath = function () {
  var yarnLockPath = path.resolve(process.cwd(), 'yarn.lock');
  var packageJsonPath = path.resolve(process.cwd(), 'package.json');

  if (isUsingYarnLock === null) {
      if (fs.existsSync(yarnLockPath)) {
          logger.logInfo('[yarn] using yarn.lock instead of package.json');
          isUsingYarnLock = true;
      }  else {
          isUsingYarnLock = false;
      }
  }

  return isUsingYarnLock ? yarnLockPath : packageJsonPath;
};

function getFileHash(filePath) {
  if (isUsingYarnLock) {
      var yarnlockfile = fs.readFileSync(filePath);
      return md5(yarnlockfile);
  } else {
      var json = JSON.parse(fs.readFileSync(filePath));
      return md5(JSON.stringify({
          dependencies: json.dependencies,
          devDependencies: json.devDependencies
      }));
  }
}

function getYarnPostCachedInstallCommand() {
  var packagePath = path.resolve(process.cwd(), 'package.json');
  var json = JSON.parse(fs.readFileSync(packagePath));
  if (json.scripts.prepublish)
    return 'npm run prepublish';
  else
    return null;
}

module.exports = {
  cliName: 'yarn',
  getCliVersion: function getYarnVersion () {
    return shell.exec('yarn --version', {silent: true}).output.trim();
  },
  configPath: getYarnConfigPath(),
  installDirectory: 'node_modules',
  installCommand: 'yarn',
  getFileHash: getFileHash,
  postCachedInstallCommand: getYarnPostCachedInstallCommand()
};

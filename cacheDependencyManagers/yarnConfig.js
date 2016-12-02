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
  var npmJsonPath = path.resolve(process.cwd(), 'package.json');

  if (isUsingYarnLock === null) {
      if (fs.existsSync(yarnLockPath)) {
          logger.logInfo('[yarn] using yarn.lock instead of composer.json');
          isUsingYarnLock = true;
      }  else {
          isUsingYarnLock = false;
      }
  }

  return isUsingYarnLock ? yarnLockPath : npmJsonPath;
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

module.exports = {
  cliName: 'yarn',
  getCliVersion: function getNpmVersion () {
    return shell.exec('yarn --version', {silent: true}).output.trim();
  },
  configPath: getYarnConfigPath(),
  installDirectory: 'node_modules',
  installCommand: 'yarn',
  getFileHash: getFileHash
};

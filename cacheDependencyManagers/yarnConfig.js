'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');
var logger = require('../util/logger');


// Returns path to configuration file for yarn. Uses
// yarn.lock
var getYarnConfigPath = function () {
  return path.resolve(process.cwd(), 'yarn.lock');
};

function getFileHash(filePath) {
  var yarnlockfile = fs.readFileSync(filePath);
  return md5(yarnlockfile);
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

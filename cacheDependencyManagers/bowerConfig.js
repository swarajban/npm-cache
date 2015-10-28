'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');
var logger = require('../util/logger');

var getBowerInstallDirectory = function () {
  var bowerComponentLocation = 'bower_components';
  var bowerRcPath = path.resolve(process.cwd(), '.bowerrc');
  if (fs.existsSync(bowerRcPath)) {
    var bowerRcFile = fs.readFileSync(bowerRcPath);
    var bowerRc = JSON.parse(bowerRcFile);
    if (bowerRc.directory) {
      bowerComponentLocation = bowerRc.directory;
      logger.logInfo('[bower] bower_components located at ' + bowerComponentLocation + ' per bowerrc');
    }
  }
  return bowerComponentLocation;
};


function getFileHash(filePath) {
  var json = JSON.parse(fs.readFileSync(filePath));
  return md5(JSON.stringify({
    dependencies: json.dependencies,
    devDependencies: json.devDependencies,
    overrides: json.overrides
  }));
};

module.exports = {
  cliName: 'bower',
  getCliVersion: function getNpmVersion () {
    return shell.exec('bower --version', {silent: true}).output.trim();
  },
  configPath: path.resolve(process.cwd(), 'bower.json'),
  installDirectory: getBowerInstallDirectory(),
  installCommand: 'bower install',
  getFileHash: getFileHash
};

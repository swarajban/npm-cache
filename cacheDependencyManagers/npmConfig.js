'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');
var logger = require('../util/logger');


// Returns path to configuration file for npm. Uses
// npm-shrinkwrap.json if it exists; otherwise,
// defaults to package.json
var getNpmConfigPath = function () {
  var shrinkWrapPath = path.resolve(process.cwd(), 'npm-shrinkwrap.json');
  var packagePath = path.resolve(process.cwd(), 'package.json');
  if (fs.existsSync(shrinkWrapPath)) {
    logger.logInfo('[npm] using npm-shrinkwrap.json instead of package.json');
    return shrinkWrapPath;
  } else {
    return packagePath;
  }
};

function getFileHash(filePath) {
  var json = JSON.parse(fs.readFileSync(filePath));
  return md5(JSON.stringify({
    dependencies: json.dependencies,
    devDependencies: json.devDependencies
  }));
}

function getNpmPostCachedInstallCommand() {
  var packagePath = path.resolve(process.cwd(), 'package.json');
  var json = JSON.parse(fs.readFileSync(packagePath));
  if (json.scripts.prepublish)
    return 'npm run prepublish';
  else
    return null;
}

module.exports = {
  cliName: 'npm',
  getCliVersion: function getNpmVersion () {
    return shell.exec('npm --version', {silent: true}).output.trim();
  },
  configPath: getNpmConfigPath(),
  installDirectory: 'node_modules',
  installCommand: 'npm install',
  postCachedInstallCommand: getNpmPostCachedInstallCommand(),
  getFileHash: getFileHash
};

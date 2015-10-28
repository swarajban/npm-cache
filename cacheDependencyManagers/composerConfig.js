'use strict';

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var logger = require('../util/logger');

var composerFilePath = path.resolve(process.cwd(), 'composer.json');


// Composer.json can specify a custom vendor directory
// Let's get it if we can!
var getComposerInstallDirectory = function () {
  var composerInstallDirectory = 'vendor';

  var exists = null;
  try {
    exists = fs.statSync(composerFilePath);
  } catch (e) {}

  if (exists !== null) {
    var composerConfig = require(composerFilePath);
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
  var versionRegex = /^Composer version (\S+)/;
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
  return md5(JSON.stringify({
    packages: json.packages,
    packagesDev: json['packages-dev']
  }));
};

module.exports = {
  cliName: 'composer',
  getCliVersion: getCliVersion,
  configPath: composerFilePath,
  installDirectory: getComposerInstallDirectory(),
  installCommand: 'composer install',
  getFileHash: getFileHash
};

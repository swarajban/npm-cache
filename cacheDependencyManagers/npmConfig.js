'use strict';

var path = require('path');
var fs = require('fs');
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


module.exports = {
  cliName: 'npm',
  configPath: getNpmConfigPath(),
  installDirectory: 'node_modules',
  installCommand: 'npm install'
};

'use strict';

var path = require('path');
var fs = require('fs');
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


module.exports = {
  cliName: 'bower',
  configPath: path.resolve(process.cwd(), 'bower.json'),
  installDirectory: getBowerInstallDirectory(),
  installCommand: 'bower install'
};

'use strict';

var path = require('path');

module.exports = {
  cliName: 'npm',
  configPath: path.resolve(process.cwd(), 'package.json'),
  installDirectory: 'node_modules',
  installCommand: 'npm install'
};

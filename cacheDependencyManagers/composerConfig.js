'use strict';

var path = require('path');

module.exports = {
  cliName: 'composer',
  configPath: path.resolve(process.cwd(), 'composer.json'),
  installDirectory: 'vendor',
  installCommand: 'composer install'
};

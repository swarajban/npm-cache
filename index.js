#! /usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');

var util = require('./util/util');
var logger = require('./util/logger');
var CacheDependencyManager = require('./cacheDependencyManagers/baseCacheDependencyManager');


if (! shell.which('tar')) {
  logger.logError('tar command-line tool not found. exiting...');
  return;
}

// Parse command line options
var yargs = require('yargs')
  .usage('Usage: $0 install')
  .example('$0 install', 'try to install npm, bower, and composer components')
  .example('$0 install bower', 'install only bower components')
  .example('$0 install bower npm', 'install bower and npm components')
  .example('$0 install --cacheDirectory /Users/cached/', 'try to install npm, bower, and composer components, using /Users/cached/ as cache directory')
  .alias('h', 'help')
  .string('cacheDirectory');
var argv = yargs.argv;

var shouldInstall = argv._.indexOf('install') !== -1;

// Show help message if help flag specified
// or install not specified
if (argv.help || ! shouldInstall) {
  console.log(yargs.help());
  return;
}

// Use ~/.package_cache as default cacheDirectory, or use user-specified directory
var cacheDirectory = argv.cacheDirectory || path.resolve(util.getHomeDirectory(), '.package_cache');
logger.logInfo('using ' + cacheDirectory + ' as cache directory');
if (! fs.existsSync(cacheDirectory)) {
  // create directory if it doesn't exist
  shell.mkdir('-p', cacheDirectory);
  logger.logInfo('creating cache directory');
}


var availableManagers = {
  npm: './cacheDependencyManagers/npmConfig.js',
  bower: './cacheDependencyManagers/bowerConfig.js',
  composer: './cacheDependencyManagers/composerConfig.js'
};

var defaultManagers = ['npm', 'bower', 'composer'];

// Parse args for which dependency managers to install
var specifiedManagers;
if (argv._.length === 1) {
  specifiedManagers = defaultManagers;
} else {
  specifiedManagers = argv._;
}

specifiedManagers.forEach(function (dependencyManagerName) {
  if (dependencyManagerName in availableManagers) {
    logger.logInfo('installing ' + dependencyManagerName + ' dependencies');
    var config = require(availableManagers[dependencyManagerName]);
    var manager = new CacheDependencyManager(config);
    manager.loadDependencies(cacheDirectory);
  }
});


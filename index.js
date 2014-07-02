#! /usr/bin/env node
'use strict';

var fs = require('fs');
var shell = require('shelljs');
var util = require('./util/util');
var logger = require('./util/logger');
var path = require('path');
var NpmCacheDependencyManager = require('./cacheDependencyManagers/npmCacheDependencyManager');
var BowerCacheDependencyManager = require('./cacheDependencyManagers/bowerCacheDependencyManager');
var ComposerCacheDependencyManager = require('./cacheDependencyManagers/composerCacheDependencyManager');

var availableManagers = {
  npm: NpmCacheDependencyManager,
  bower: BowerCacheDependencyManager,
  composer: ComposerCacheDependencyManager
};

var defaultManagers = ['npm', 'bower', 'composer'];

var init = function () {
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
    .example('$0 install --cachedDirectory /Users/cached/', 'try to install npm, bower, and composer components, using /Users/cached/ as cached directory')
    .alias('h', 'help')
    .string('cachedDirectory');
  var argv = yargs.argv;

  var shouldInstall = argv._.indexOf('install') !== -1;

  // Show help message if help flag specified
  // or install not specified
  if (argv.help || ! shouldInstall) {
    console.log(yargs.help());
    return;
  }

  // Use ~/.package_cache as default cacheDirectory, or use user-specified directory
  var cacheDirectory = argv.cachedDirectory || path.resolve(util.getHomeDirectory(), '.package_cache');
  logger.logInfo('using ' + cacheDirectory + ' as cache directory');
  if (! fs.existsSync(cacheDirectory)) {
    // create directory if it doesn't exist
    shell.mkdir('-p', cacheDirectory);
    logger.logInfo('creating cache directory');
  }

  
  // Parse args for which dependency managers to install
  var specifiedManagers;
  if (argv._.length === 1) {
    specifiedManagers = defaultManagers;
  } else {
    specifiedManagers = argv._;
  }

  var dependencyManagers = [];
  specifiedManagers.forEach(function (dependencyManager) {
    if (availableManagers[dependencyManager]) {
      dependencyManagers.push(new availableManagers[dependencyManager](cacheDirectory));
      logger.logInfo('will install ' + dependencyManager);
    }
  });

  // load dependencies for specified managers
  dependencyManagers.forEach(function (dependencyManager) {
    dependencyManager.loadDependencies();
  });
};

init();

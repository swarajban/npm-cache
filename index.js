#! /usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var parser = require('nomnom');
var async = require('async');
var glob = require('glob');

var logger = require('./util/logger');
var ParseUtils = require('./util/parseUtils');
var CacheDependencyManager = require('./cacheDependencyManagers/cacheDependencyManager');

// Main entry point for npm-cache
var main = function () {
  checkTarExists();

  // Parse CLI Args
  parser.command('install')
    .callback(installDependencies)
    .option('forceRefresh', {
      abbr: 'r',
      flag: true,
      default: false,
      help: 'force installing dependencies from package manager without cache'
    })
    .help('install specified dependencies');

  parser.command('clean')
    .callback(cleanCache)
    .help('clear cache directory');

  parser.option('cacheDirectory', {
    default: path.resolve(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, '.package_cache'),
    abbr: 'c',
    help: 'directory where dependencies will be cached'
  });

  parser.option('version', {
    abbr: 'v',
    help: 'displays version info and exit',
    flag: true,
    callback: function () {
      var packagePath = path.resolve(__dirname, 'package.json');
      var packageFile = fs.readFileSync(packagePath);
      var packageParsed = JSON.parse(packageFile);
      console.log(packageParsed.version);
      process.exit(0);
    }
  });


  var examples = [
    'Examples:',
    '\tnpm-cache install\t# try to install npm, bower, and composer components',
    '\tnpm-cache install bower\t# install only bower components',
    '\tnpm-cache install bower npm\t# install bower and npm components',
    '\tnpm-cache install bower --allow-root composer --dry-run\t# install bower with allow-root, and composer with --dry-run',
    '\tnpm-cache --cacheDirectory /home/cache/ install bower \t# install components using /home/cache as cache directory',
    '\tnpm-cache --forceRefresh install bower\t# force installing dependencies from package manager without cache',
    '\tnpm-cache clean\t# cleans out all cached files in cache directory'
  ];
  parser.help(examples.join('\n'));

  var npmCacheArgs = ParseUtils.getNpmCacheArgs();
  parser.parse(npmCacheArgs);
};

// Verify system 'tar' command, exit if if it doesn't exist
var checkTarExists = function () {
  if (! shell.which('tar')) {
    logger.logError('tar command-line tool not found. exiting...');
    process.exit(1);
  }
};

// Creates cache directory if it does not exist yet
var prepareCacheDirectory = function (cacheDirectory) {
  logger.logInfo('using ' + cacheDirectory + ' as cache directory');
  if (! fs.existsSync(cacheDirectory)) {
    // create directory if it doesn't exist
    shell.mkdir('-p', cacheDirectory);
    logger.logInfo('creating cache directory');
  }
};

// npm-cache command handlers

// main method for installing specified dependencies
var installDependencies = function (opts) {
  prepareCacheDirectory(opts.cacheDirectory);

  var availableManagers = CacheDependencyManager.getAvailableManagers();
  var managerArguments = ParseUtils.getManagerArgs();
  var managers = Object.keys(managerArguments);

  async.each(
    managers,
    function startManager (managerName, callback) {
      var managerConfig = require(availableManagers[managerName]);
      managerConfig.cacheDirectory = opts.cacheDirectory;
      managerConfig.forceRefresh = opts.forceRefresh;
      managerConfig.installOptions = managerArguments[managerName];
      var manager = new CacheDependencyManager(managerConfig);
      manager.loadDependencies(callback);
    },
    function onInstalled (error) {
      if (error === undefined) {
        logger.logInfo('successfully installed all dependencies');
        process.exit(0);
      } else {
        logger.logError('error installing dependencies');
        process.exit(1);
      }
    }
  );
};

// Removes all cached dependencies from cache directory
var cleanCache = function (opts) {
  prepareCacheDirectory(opts.cacheDirectory);
  var md5Regexp = /\/[0-9a-f]{32}\.tar\.gz/i;
  var isCachedFile = function (fileName) {
    return md5Regexp.test(fileName);
  };
  var candidateFileNames = glob.sync(opts.cacheDirectory + '/*.tar.gz');
  var cachedFiles = candidateFileNames.filter(isCachedFile);
  cachedFiles.forEach(function (fileName) {
    fs.unlinkSync(fileName);
  });
  logger.logInfo('cleaned ' + cachedFiles.length + ' files from cache directory');
};


main();
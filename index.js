#! /usr/bin/env node
'use strict';

var fs = require('fs-extra');
var path = require('path');
var parser = require('nomnom');
var async = require('async');
var rimraf = require('rimraf');

var logger = require('./util/logger');
var ParseUtils = require('./util/parseUtils');
var CacheDependencyManager = require('./cacheDependencyManagers/cacheDependencyManager');

// Main entry point for npm-cache
var main = function () {
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

  parser.command('hash')
    .callback(reportHash)
    .help('reports the current working hash');

  var defaultCacheDirectory = process.env.NPM_CACHE_DIR;
  if (defaultCacheDirectory === undefined) {
    var homeDirectory = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    if (homeDirectory !== undefined) {
      defaultCacheDirectory = path.resolve(homeDirectory, '.package_cache');
    } else {
      defaultCacheDirectory = path.resolve('/tmp', '.package_cache');
    }
  }

  parser.option('cacheDirectory', {
    default: defaultCacheDirectory,
    abbr: 'c',
    help: 'directory where dependencies will be cached'
  });
  parser.option('noArchive', {
    abbr: 'd',
    help: 'when installing a new dependency set, those dependencies will be stored uncompressed. This requires more disk space but notably increases performance',
    flag: true
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
    '\tnpm-cache install --cacheDirectory /home/cache/ bower \t# install components using /home/cache as cache directory',
    '\tnpm-cache install --forceRefresh  bower\t# force installing dependencies from package manager without cache',
    '\tnpm-cache install --noArchive npm\t# do not compress/archive the cached dependencies',
    '\tnpm-cache clean\t# cleans out all cached files in cache directory',
    '\tnpm-cache hash\t# reports the current working hash'
  ];
  parser.help(examples.join('\n'));

  var npmCacheArgs = ParseUtils.getNpmCacheArgs();
  parser.parse(npmCacheArgs);
};

// Creates cache directory if it does not exist yet
var prepareCacheDirectory = function (cacheDirectory) {
  logger.logInfo('using ' + cacheDirectory + ' as cache directory');
  if (! fs.existsSync(cacheDirectory)) {
    // create directory if it doesn't exist
    fs.mkdirsSync(cacheDirectory);
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
      managerConfig.noArchive = opts.noArchive;
      managerConfig.installOptions = managerArguments[managerName];
      var manager = new CacheDependencyManager(managerConfig);
      manager.loadDependencies(callback);
    },
    function onInstalled (error) {
      if (error === null) {
        logger.logInfo('successfully installed all dependencies');
        process.exit(0);
      } else {
        logger.logError('error installing dependencies');
        process.exit(1);
      }
    }
  );
};

var reportHash = function (opts) {
  var availableManagers = CacheDependencyManager.getAvailableManagers();
  var managerArguments = ParseUtils.getManagerArgs();
  var managers = Object.keys(managerArguments);

  if (managers.length > 1) {
    logger.logError('can only calculate hash for one dependency manager at a time');
    process.exit(1);
  }

  async.each(
    managers,
    function calculateHash (managerName) {
      var managerConfig = require(availableManagers[managerName]);
      managerConfig.cacheDirectory = opts.cacheDirectory;

      var hash = managerConfig.getFileHash(managerConfig.configPath);
      console.log(hash);
    }
  );
};


// Recursively lists files in directory up to maxDepth
var cachedFileListHelper = function (dir, fileList, regex, currDepth, maxDepth) {
  if (currDepth === maxDepth) {
    return fileList;
  }

  var dirFiles = fs.readdirSync(dir);
  dirFiles.forEach(
    function (file) {
      var filePath = path.join(dir, file);
      if (regex.test(filePath)) {
        fileList.push(filePath);
      }

      if (fs.statSync(filePath).isDirectory()) {
        cachedFileListHelper(filePath, fileList, regex, currDepth + 1, maxDepth);
      }
    }
  );
  return fileList;
};

// Returns list of candidate cached files
var getCachedFileList = function (baseDir) {
  var cacheRegex = /[0-9a-f]{32}[\.tar\.gz]*$/i;
  return cachedFileListHelper(baseDir, [], cacheRegex, 0, 3);
};

// Removes all cached dependencies from cache directory
var cleanCache = function (opts) {
  prepareCacheDirectory(opts.cacheDirectory);

  var cachedFileList = getCachedFileList(opts.cacheDirectory);
  cachedFileList.forEach(
    function (filePath) {
      rimraf.sync(filePath);
      // fs.unlinkSync(filePath);
    }
  );

  logger.logInfo('cleaned ' + cachedFileList.length + ' files from cache directory');
};


main();
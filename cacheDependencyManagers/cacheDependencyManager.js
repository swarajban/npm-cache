'use strict';

var fs = require('fs-extra');
var path = require('path');
var logger = require('../util/logger');
var shell = require('shelljs');
var which = require('which');
var tar = require('tar-fs');
var fstream = require('fstream');
var md5 = require('md5');
var tmp = require('tmp');
var _ = require('lodash');
var zlib = require('zlib');

var cacheVersion = '1';

function CacheDependencyManager (config) {
  this.config = config;
}

// Given a path relative to process' current working directory,
// returns a normalized absolute path
var getAbsolutePath = function (relativePath) {
  return path.resolve(process.cwd(), relativePath);
};

var getFileBackupPath = function (installedDirectory) {
  return path.join(installedDirectory, '.npm-cache');
};

var getFileBackupFilename = function (file) {
  return path.basename(file) + '_' + md5(file);
};

CacheDependencyManager.prototype.cacheLogInfo = function (message) {
  logger.logInfo('[' + this.config.cliName + '] ' + message);
};

CacheDependencyManager.prototype.cacheLogError = function (error) {
  logger.logError('[' + this.config.cliName + '] ' + error);
};


CacheDependencyManager.prototype.installDependencies = function () {
  var error = null;
  var installCommand = this.config.installCommand + ' ' + this.config.installOptions;
  installCommand = installCommand.trim();
  this.cacheLogInfo('running [' + installCommand + ']...');
  if (shell.exec(installCommand).code !== 0) {
    error = 'error running ' + this.config.installCommand;
    this.cacheLogError(error);
  } else {
    this.cacheLogInfo('installed ' + this.config.cliName + ' dependencies, now archiving');
  }
  return error;
};

CacheDependencyManager.prototype.backupFile = function (backupPath, file) {
  var sourceFile = getAbsolutePath(file);
  var backupFilename = getFileBackupFilename(file);
  var backupFile = path.join(backupPath, backupFilename);
  if (!fs.existsSync(sourceFile)) {
    this.cacheLogError('backup file [file not found]:' + file);
    return;
  }

  fs.mkdirsSync(backupPath);
  fs.copySync(sourceFile, backupFile);
  this.cacheLogInfo('backup file: ' + file);
};

CacheDependencyManager.prototype.restoreFile = function (backupPath, file) {
  var sourceFile = getAbsolutePath(file);
  var backupFilename = getFileBackupFilename(file);
  var backupFile = path.join(backupPath, backupFilename);
  if (!fs.existsSync(backupFile)) {
    this.cacheLogError('restore file [file not found]:' + file);
    return;
  }

  fs.copySync(backupFile, sourceFile);
  this.cacheLogInfo('restore file: ' + file);
};

CacheDependencyManager.prototype.archiveDependencies = function (cacheDirectory, cachePath, callback) {
  var self = this;
  var error = null;
  var installedDirectory = getAbsolutePath(this.config.installDirectory);
  var fileBackupDirectory = getFileBackupPath(installedDirectory);
  this.cacheLogInfo('archiving dependencies from ' + installedDirectory);

  if (!fs.existsSync(installedDirectory)) {
    this.cacheLogInfo('skipping archive. Install directory does not exist.');
    return error;
  }

  if (this.config.addToArchiveAndRestore) {
    this.backupFile(fileBackupDirectory, this.config.addToArchiveAndRestore);
  }

  // Make sure cache directory is created
  fs.mkdirsSync(cacheDirectory);

  var tmpName = tmp.tmpNameSync({
    dir: cacheDirectory
  });
  tmp.setGracefulCleanup();

  function onError(error) {
    self.cacheLogError('error tar-ing ' + installedDirectory + ' :' + error);
    onFinally();
    callback(error);
  }

  function onEnd() {
    if (fs.existsSync(cachePath)) {
      fs.removeSync(cachePath);
    }
    fs.renameSync(tmpName, cachePath);
    self.cacheLogInfo('installed and archived dependencies');
    onFinally();
    callback();
  }

  function onFinally() {
    if (fs.existsSync(fileBackupDirectory)) {
      fs.removeSync(fileBackupDirectory);
    }

    if (fs.existsSync(tmpName)) {
      fs.removeSync(tmpName);
    }
  }

  var installedDirectoryStream = fstream.Reader({path: installedDirectory}).on('error', onError);
  // TODO: speed this up
  if (this.config.noArchive) {
    installedDirectoryStream
      .on('end', onEnd)
      .pipe(fstream.Writer({path: tmpName, type: 'Directory'}));

  } else {
    tar.pack(installedDirectory)
      .pipe(zlib.createGzip())
      .pipe(fs.createWriteStream(tmpName))
      .on('error', onError)
      .on('finish', onEnd);
  }
};

CacheDependencyManager.prototype.installCachedDependencies = function (cachePath, compressedCacheExists, callback) {
  var self = this;
  var installDirectory = getAbsolutePath(this.config.installDirectory);
  var fileBackupDirectory = getFileBackupPath(installDirectory);
  var targetPath = path.dirname(installDirectory);
  this.cacheLogInfo('clearing installed dependencies at ' + installDirectory);
  fs.removeSync(installDirectory);
  this.cacheLogInfo('...cleared');
  this.cacheLogInfo('retrieving dependencies from ' + cachePath);

  function onError(error) {
    self.cacheLogError('Error retrieving ' + cachePath + ': ' + error);
    callback(error);
  }
  function onEnd() {
    if (self.config.addToArchiveAndRestore) {
      self.restoreFile(fileBackupDirectory, self.config.addToArchiveAndRestore);
      fs.removeSync(fileBackupDirectory);
    }
    self.cacheLogInfo('done extracting');
    callback();
  }

  if (compressedCacheExists) {
    fs.createReadStream(cachePath)
      .pipe(zlib.createGunzip())
      .pipe(tar.extract(installDirectory))
      .on('error', onError)
      .on('finish', onEnd);
  } else {
    fstream.Reader(cachePath)
        .on('error', onError)
        .on('end', onEnd)
        .pipe(fstream.Writer(targetPath));
  }
};


CacheDependencyManager.prototype.loadDependencies = function (callback) {
  var self = this;
  var error = null;

  // Check if config file for dependency manager exists
  if (! fs.existsSync(this.config.configPath)) {
    this.cacheLogInfo('Dependency config file ' + this.config.configPath + ' does not exist. Skipping install');
    callback(null);
    return;
  }
  this.cacheLogInfo('config file exists');

  // Check if package manger CLI is installed
  try {
    which.sync(this.config.cliName);
    this.cacheLogInfo('cli exists');
  }
  catch (e) {
    error = 'Command line tool ' + this.config.cliName + ' not installed';
    this.cacheLogError(error);
    callback(error);
    return;
  }

  // Get hash of dependency config file
  var hash = this.config.getFileHash(this.config.configPath);
  hash = md5(cacheVersion + hash);
  this.cacheLogInfo('hash of ' + this.config.configPath + ': ' + hash);
  // cachePath is absolute path to where local cache of dependencies is located
  var cacheDirectory = path.resolve(this.config.cacheDirectory, this.config.cliName, this.config.getCliVersion());
  var cachePathArchive = path.resolve(cacheDirectory, hash + '.tar.gz');
  var cachePathNotArchived = path.resolve(cacheDirectory, hash);

  // Check if local cache of dependencies exists
  var cacheArchiveExists = fs.existsSync(cachePathArchive);
  var cacheNotArchivedExists = fs.existsSync(cachePathNotArchived);
  if (!this.config.forceRefresh && (cacheArchiveExists || cacheNotArchivedExists)) {
    this.cacheLogInfo('cache exists');

    // Try to retrieve cached dependencies
    this.installCachedDependencies(
      cacheArchiveExists ? cachePathArchive : cachePathNotArchived,
      cacheArchiveExists,
      callback
    );

  } else { // install dependencies with CLI tool and cache
    // Try to install dependencies using package manager
    error = this.installDependencies();
    if (error !== null) {
      callback(error);
      return;
    }

    // Try to archive newly installed dependencies
    var cachePathWithInstalledDirectory = path.resolve(cachePathNotArchived, this.config.installDirectory);
      this.archiveDependencies(
      this.config.noArchive ? cachePathNotArchived : cacheDirectory,
      this.config.noArchive ? cachePathWithInstalledDirectory : cachePathArchive,
      callback
    );
  }
};

/**
 * only return 'composer', 'npm' and 'bower' thereby `npm-cache install` doesn't change behavior if managers are added
 *
 * @returns {Object} availableDefaultManagers
 */
CacheDependencyManager.getAvailableDefaultManagers = function() {
  return _.pick(CacheDependencyManager.getAvailableManagers(), ['composer', 'npm', 'bower']);
};

/**
 * Looks for available package manager configs in cacheDependencyManagers
 * directory. Returns an object with package manager names as keys
 * and absolute paths to configs as values
 *
 * Ex: {
 *  npm: /usr/local/lib/node_modules/npm-cache/cacheDependencyMangers/npmConfig.js,
 *  bower: /usr/local/lib/node_modules/npm-cache/cacheDependencyMangers/bowerConfig.js
 * }
 *
 * @return {Object} availableManagers
 */
CacheDependencyManager.getAvailableManagers = function () {
  if (CacheDependencyManager.managers === undefined) {
    CacheDependencyManager.managers = {};
    var files = fs.readdirSync(__dirname);
    var managerRegex = /(\S+)Config\.js/;
    files.forEach(
      function addAvailableManager (file) {
        var result = managerRegex.exec(file);
        if (result !== null) {
          var managerName = result[1];
          CacheDependencyManager.managers[managerName] = path.join(__dirname, file);
        }
      }
    );
  }
  return CacheDependencyManager.managers;
};

module.exports = CacheDependencyManager;

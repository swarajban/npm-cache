'use strict';

var fs = require('fs-extra');
var path = require('path');
var logger = require('../util/logger');
var shell = require('shelljs');
var which = require('which');
var tar = require('tar-fs');
var fstream = require('fstream');
var md5 = require('../util/md5');
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

CacheDependencyManager.prototype.cacheLogRunning = function (message) {
  logger.logRunning('[' + this.config.cliName + '] ' + message);
};

CacheDependencyManager.prototype.cacheLogError = function (error) {
  logger.logError('[' + this.config.cliName + '] ' + error);
};


CacheDependencyManager.prototype.installDependencies = function () {
  var error = null;
  var getInstallCommand = typeof this.config.installCommand === 'function' ?
    this.config.installCommand :
    function () { return this.config.installCommand; }.bind(this);

  var installCommand = getInstallCommand() + ' ' + this.config.installOptions;
  installCommand = installCommand.trim();
  //deleting symlink if it exists
  var installedDirectory = getAbsolutePath(this.config.installDirectory);
  //using a try to test if there is a symlink to be deleted: fs.existsSync(installedDirectory) returns false if the symlink doesn't point to anything
  try {
    if (fs.lstatSync(installedDirectory).isSymbolicLink()) {
      this.cacheLogInfo('install directory ' + installedDirectory + ' exists already and is a symlink - removing it');
      fs.removeSync(installedDirectory);
    } else {
      this.cacheLogInfo('install directory ' + installedDirectory + ' dont already exist or is not a symlink - dont remove it');
    }
  } catch(err) {
    this.cacheLogInfo('install directory ' + installedDirectory + ' dont already exist or is not a symlink - dont remove it');
  }
  this.cacheLogRunning('running [' + installCommand + ']');

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

    if(self.config.useSymlink) {
      console.log('creating symlink to have ' + installedDirectory + ' to point to ' + cachePath);
      //'dir' requires admin rights on windows, junction works. This argument is ignored by other platforms
      fs.symlinkSync(cachePath, installedDirectory, 'junction');

      //some modules might need to find files based on a relative path which can be a problem, so we need to create a reverse symlink
      if (self.config.reverseSymlink) {
        var reverseCacheSymLink = path.resolve(cachePath, '../', self.config.reverseSymlink);
        var projectDirectory = path.resolve(installedDirectory, '../');
        if (fs.existsSync(reverseCacheSymLink) && fs.lstatSync(reverseCacheSymLink).isSymbolicLink()) {
          self.cacheLogInfo(reverseCacheSymLink + ' exists already and is a symlink - removing it');
          fs.removeSync(reverseCacheSymLink);
        }
        self.cacheLogInfo('creating reverse symlink ' + reverseCacheSymLink + ' to point to ' + projectDirectory);
        fs.symlinkSync(projectDirectory, reverseCacheSymLink, 'junction');
      }
    } else {
        console.log('not creating symlink');
    }

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
  if(this.config.useSymlink) {
    self.cacheLogInfo('moving ' + installedDirectory + ' to ' + tmpName);
    fs.renameSync(installedDirectory, tmpName);
    onEnd();
  }
  // TODO: speed this up
  else if (this.config.noArchive) {
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
  this.cacheLogInfo('retrieving dependencies from ' + cachePath + ' to ' + targetPath);

  //update last modified date of cachePath to know we used that archive
  fs.utimesSync(cachePath, Date.now()/1000, Date.now()/1000);

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

    if (self.config.postCachedInstallCommand) {
      self.cacheLogInfo('launching post cached install command: ' + self.config.postCachedInstallCommand);
      var postCachedInstallCommand = self.config.postCachedInstallCommand.trim();
      if (shell.exec(postCachedInstallCommand).code !== 0) {
          var error = 'error running ' + self.config.postCachedInstallCommand;
          self.cacheLogError(error);
      } else {
          self.cacheLogInfo('post cached installed command (' + self.config.postCachedInstallCommand + ') done for ' + self.config.cliName);
      }
    }

    callback();
  }

  if (compressedCacheExists && !this.config.useSymlink) {
    fs.createReadStream(cachePath)
      .pipe(zlib.createGunzip())
      .pipe(tar.extract(installDirectory))
      .on('error', onError)
      .on('finish', onEnd);
  } else {
    if (!this.config.useSymlink) {
      fstream.Reader(cachePath)
        .on('error', onError)
        .on('end', onEnd)
        .pipe(fstream.Writer(targetPath));
    } else {
      var cachePathSymLink = path.resolve(cachePath, 'node_modules');
      this.cacheLogInfo('creating symlink ' + installDirectory + ' to point to ' + cachePathSymLink);
      //'dir' requires admin rights on windows, junction works. This argument is ignored by other platforms
      fs.symlinkSync(cachePathSymLink, installDirectory, 'junction');

      //some modules might need to find files based on a relative path which can be a problem, so we need to create a reverse symlink
      if (this.config.reverseSymlink) {
        var reverseCacheSymLink = path.resolve(cachePath, '../', this.config.reverseSymlink);
        var projectDirectory = path.resolve(installDirectory, '../');
        if (fs.existsSync(reverseCacheSymLink) && fs.lstatSync(reverseCacheSymLink).isSymbolicLink()) {
          this.cacheLogInfo(reverseCacheSymLink + ' exists already and is a symlink - removing it');
          fs.removeSync(reverseCacheSymLink);
        }
        this.cacheLogInfo('creating reverse symlink ' + reverseCacheSymLink + ' to point to ' + projectDirectory);
        fs.symlinkSync(projectDirectory, reverseCacheSymLink, 'junction');
      }

      onEnd();
    }
  }
};


CacheDependencyManager.prototype.loadDependencies = function (callback) {
  var error = null;

  // Check if config file for dependency manager exists
  if (! fs.existsSync(this.config.configPath)) {
    this.cacheLogInfo('No config file at:  ' + this.config.configPath + ' Skipping');
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
  var hash = this.config.getFileHash(this.config.configPath, this.config.installOptions);
  hash = md5(cacheVersion + hash);
  this.cacheLogInfo('hash of ' + this.config.configPath + ': ' + hash);
  // cachePath is absolute path to where local cache of dependencies is located
  var cacheDirectory = path.resolve(this.config.cacheDirectory, this.config.cliName, this.config.getCliVersion());
  var cachePathArchive = path.resolve(cacheDirectory, hash + '.tar.gz');
  var cachePathNotArchived = path.resolve(cacheDirectory, hash);

  // Check if local cache of dependencies exists
  var cacheArchiveExists = fs.existsSync(cachePathArchive);
  var cacheNotArchivedExists = fs.existsSync(cachePathNotArchived);
  if (!this.config.forceRefresh && ((!this.config.noArchive && cacheArchiveExists) || (this.config.noArchive && cacheNotArchivedExists))) {
    this.cacheLogInfo('cache exists');

    // Try to retrieve cached dependencies
    this.installCachedDependencies(
      (cacheArchiveExists && !this.config.useSymlink) ? cachePathArchive : cachePathNotArchived,
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

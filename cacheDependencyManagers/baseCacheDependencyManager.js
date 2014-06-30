var fs = require('fs');
var path = require('path');
var logger = require('../util/logger');
var md5 = require('MD5');
var shell = require('shelljs');
var targz = require('tar.gz');


function CacheDependencyManager (cacheDirectory) {
  this.cacheDirectory = cacheDirectory;
}

var getFileHash = function (filePath) {
  var file = fs.readFileSync(filePath);
  return md5(file);
};

CacheDependencyManager.prototype.getName = function () {
  return 'CacheDependencyManager';
};

CacheDependencyManager.prototype.getCliName = function () {
  logger.logError('Override getCliName() in subclasses!');
};

CacheDependencyManager.prototype.getConfigPath = function () {
  logger.logError('Override getConfigPath() in subclasses!');
};

CacheDependencyManager.prototype.getInstalledDirectory = function () {
  logger.logError('Override getInstalledDirectory() in subclasses!');
};

CacheDependencyManager.prototype.cacheLogInfo = function (message) {
  logger.logInfo('[' + this.getName() + '] ' + message);
};

CacheDependencyManager.prototype.cacheLogError = function (error) {
  logger.logError('[' + this.getName() + '] ' + error);
};

CacheDependencyManager.prototype.installDependencies = function () {
  logger.logError('Override installDependencies() in subclasses!');
};

CacheDependencyManager.prototype.archiveDependencies = function (cachePath, onFinish) {
  var self = this;
  var installedDirectory = path.resolve(process.cwd(), this.getInstalledDirectory());
  new targz().compress(installedDirectory, cachePath,
    function (err) {
      if (err) {
        self.cacheLogError('error compressing directory');
      } else {
        onFinish();
      }
    }
  );
};

CacheDependencyManager.prototype.extractDependencies = function (cachePath, onFinish) {
  var self = this;
  new targz().extract(cachePath, process.cwd(),
    function (err) {
      if (err) {
        self.cacheLogError('error extracting cached directory: ' + cachePath);
      } else {
        onFinish();
      }
    });
};

CacheDependencyManager.prototype.loadDependencies = function () {
  var self = this;

  // Check if config file for dependency manager exists
  if (! fs.existsSync(this.getConfigPath())) {
    this.cacheLogInfo('Dependency config file ' + this.getConfigPath() + ' does not exist. Skipping npm install');
    return;
  }
  this.cacheLogInfo('config file exists');

  // Get hash of dependency config file
  var hash = getFileHash(this.getConfigPath());
  this.cacheLogInfo('hash: ' + hash);
  // cachePath is absolute path to where local cache of dependencies is located
  var cachePath = path.resolve(this.cacheDirectory, hash + '.tar.gz');

  // Check if local cache of dependencies exists
  if (fs.existsSync(cachePath)) {
    console.log('cache exists');
    this.extractDependencies(cachePath,
      function onExtracted () {
        self.cacheLogInfo('extracted cached dependencies');
      }
    );
  } else { // install dependencies with CLI tool and cache
    if (! shell.which(this.getCliName())) {
      this.cacheLogError('Command line tool ' + this.getCliName() + ' not installed');
      return;
    }
    this.installDependencies();
    this.archiveDependencies(cachePath,
      function onArchived () {
        self.cacheLogInfo('installed and archived dependencies');
      }
    );
  }
};

module.exports = CacheDependencyManager;

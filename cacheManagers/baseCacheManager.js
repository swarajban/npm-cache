var fs = require('fs');
var logger = require('../util/logger');
var md5 = require('MD5');

function BaseCacheManager (cacheDirectory) {
  this.cacheDirectory = cacheDirectory;
}

var getHomeDirectory = function () {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
};

var getFileHash = function (filePath) {
  var file = fs.readFileSync(filePath);
  return md5(file);
};

var cacheExists = function (hash) {
  var home = getHomeDirectory();
};

BaseCacheManager.prototype.name = 'BaseCacheManager';

BaseCacheManager.prototype.getConfigPath = function () {
  logger.logError('Override getConfigPath() in subclasses!');
};

BaseCacheManager.prototype.cacheLogInfo = function (message) {
  logger.logInfo('[' + this.name + '] ' + message);
};

BaseCacheManager.prototype.cacheLogError = function (error) {
  logger.logError('[' + this.name + '] ' + error);
};

BaseCacheManager.prototype.installDependencies = function () {
  // Verify file exists
  if (! fs.existsSync(this.getConfigPath())) {
    this.cacheLogError('Could not find config path');
    return;
  }
  this.cacheLogInfo('config file exists');

  // Get hash of file
  var hash = getFileHash(this.getConfigPath());
  this.cacheLogInfo('hash: ' + hash);

  // Check for ~/.package_cache/{{hash}}.tar.gz
  if (cacheExists(hash)) {
    // install from cache
  }
  else {
    // install, and then cache
  }

  this.cacheLogInfo('installed dependencies');
};

module.exports = BaseCacheManager;

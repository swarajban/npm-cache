var BaseCacheManager = require('./baseCacheManager');
var path = require('path');
var shell = require('shelljs');

// Inherit from BaseCacheManager
function NpmCacheManager (cacheDirectory) {
  BaseCacheManager.call(this, cacheDirectory);
}
NpmCacheManager.prototype = Object.create(BaseCacheManager.prototype);
NpmCacheManager.prototype.constructor = NpmCacheManager;

// Override BaseCacheManager methods
NpmCacheManager.prototype.getName = function () {
  return 'npm';
};

NpmCacheManager.prototype.getConfigPath = function () {
  return path.resolve(process.cwd(), 'package.json');
};

NpmCacheManager.prototype.getCliName = function () {
  return 'npm';
};

NpmCacheManager.prototype.getInstalledDirectory = function () {
  return 'node_modules';
};

NpmCacheManager.prototype.installDependencies = function () {
  this.cacheLogInfo('installing npm dependencies...');
  if (shell.exec('npm install').code !== 0) {
    this.cacheLogError('error running npm install');
    return;
  }
  this.cacheLogInfo('installed npm dependencies, now archiving');
};


module.exports = NpmCacheManager;

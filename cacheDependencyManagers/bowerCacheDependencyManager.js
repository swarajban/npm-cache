var CacheDependencyManager = require('./baseCacheDependencyManager');
var path = require('path');
var shell = require('shelljs');

// Inherit from CacheDependencyManager
function BowerCacheDependencyManager (cacheDirectory) {
  CacheDependencyManager.call(this, cacheDirectory);
}
BowerCacheDependencyManager.prototype = Object.create(CacheDependencyManager.prototype);
BowerCacheDependencyManager.prototype.constructor = BowerCacheDependencyManager;

// Override CacheDependencyManager methods
BowerCacheDependencyManager.prototype.getName = function () {
  return 'bower';
};

BowerCacheDependencyManager.prototype.getConfigPath = function () {
  return path.resolve(process.cwd(), 'bower.json');
};

BowerCacheDependencyManager.prototype.getCliName = function () {
  return 'bower';
};

BowerCacheDependencyManager.prototype.getInstalledDirectory = function () {
  return 'bower_components';
};

BowerCacheDependencyManager.prototype.installDependencies = function () {
  this.cacheLogInfo('installing bower dependencies...');
  if (shell.exec('bower install').code !== 0) {
    this.cacheLogError('error running bower install');
    return;
  }
  this.cacheLogInfo('installed bower dependencies, now archiving');
};


module.exports = BowerCacheDependencyManager;

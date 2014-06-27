var BaseCacheManager = require('./baseCacheManager');
var path = require('path');

// Inherit from BaseCacheManager
function NpmCacheManager (cacheDirectory) {
  BaseCacheManager.call(this, cacheDirectory);
}
NpmCacheManager.prototype = Object.create(BaseCacheManager.prototype);
NpmCacheManager.prototype.constructor = NpmCacheManager;

// Override BaseCacheManager methods
NpmCacheManager.prototype.name = 'npm';

NpmCacheManager.prototype.getConfigPath = function () {
  return path.resolve(process.cwd(), 'package.json');
};

NpmCacheManager.prototype.installDependencies = function () {
  this.cacheLogInfo('about to install das dependencies');
};


module.exports = NpmCacheManager;

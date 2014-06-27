var BaseCacheManager = require('./baseCacheManager');

function NpmCacheManager () {
  var npmCacheManager = {};
  npmCacheManager.__proto__ = BaseCacheManager();

  npmCacheManager.name = 'npm';
  npmCacheManager.getConfigPath = function () {
    return 'package.json';
  };
  return npmCacheManager;
}

module.exports = NpmCacheManager;

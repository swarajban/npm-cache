var BaseCacheManager = require('./baseCacheManager');
var path = require('path');

function NpmCacheManager () {
  var npmCacheManager = {};
  npmCacheManager.__proto__ = BaseCacheManager();

  npmCacheManager.name = 'npm';

  npmCacheManager.getConfigPath = function () {
    return path.resolve(__dirname, '..', 'package.json');
  };

  return npmCacheManager;
}

module.exports = NpmCacheManager;

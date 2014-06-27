var _ = require('lodash');
var util = require('./util/util');
var path = require('path');
var NpmCacheManager = require('./cacheManagers/npmCacheManager');


var init = function () {
  var cacheDirectory = path.resolve(util.getHomeDirectory(), '.package_cache');

  var cacheManagers = [];
  cacheManagers.push(new NpmCacheManager(cacheDirectory));

  _.forEach(cacheManagers, function (cacheManager) {
    cacheManager.loadDependencies();
  });
};

init();

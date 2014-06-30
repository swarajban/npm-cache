var _ = require('lodash');
var util = require('./util/util');
var path = require('path');
var NpmCacheDependencyManager = require('./cacheDependencyManagers/npmCacheDependencyManager');


var init = function () {
  var cacheDirectory = path.resolve(util.getHomeDirectory(), '.package_cache');

  var cacheManagers = [];
  cacheManagers.push(new NpmCacheDependencyManager(cacheDirectory));

  _.forEach(cacheManagers, function (cacheManager) {
    cacheManager.loadDependencies();
  });
};

init();

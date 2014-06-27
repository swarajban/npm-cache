var _ = require('lodash');
var NpmCacheManager = require('./cacheManagers/npmCacheManager');


var init = function () {
  var cacheManagers = [];
  cacheManagers.push(new NpmCacheManager());

  _.forEach(cacheManagers, function (cacheManager) {
    cacheManager.installDependencies();
  });
};

init();

var _ = require('lodash');
var NpmCacheManager = require('./cacheManagers/npmCacheManager');


var init = function () {
  var cacheManagers = [];
  cacheManagers.push(new NpmCacheManager('1234'));

  _.forEach(cacheManagers, function (cacheManager) {
    cacheManager.installDependencies();
  });
};

init();

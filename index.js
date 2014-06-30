var _ = require('lodash');
var shell = require('shelljs');
var util = require('./util/util');
var logger = require('./util/logger');
var path = require('path');
var NpmCacheDependencyManager = require('./cacheDependencyManagers/npmCacheDependencyManager');
var BowerCacheDependencyManager = require('./cacheDependencyManagers/bowerCacheDependencyManager');


var init = function () {
  if (! shell.which('tar')) {
    logger.logError('tar command-line tool not found. exiting...');
    return;
  }

  var cacheDirectory = path.resolve(util.getHomeDirectory(), '.package_cache');
  var cacheManagers = [];
  cacheManagers.push(new NpmCacheDependencyManager(cacheDirectory));
  cacheManagers.push(new BowerCacheDependencyManager(cacheDirectory));

  _.forEach(cacheManagers, function (cacheManager) {
    cacheManager.loadDependencies();
  });
};

init();

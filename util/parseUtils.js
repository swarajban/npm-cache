'use strict';

var _ = require('lodash');
var CacheDependencyManager = require('../cacheDependencyManagers/cacheDependencyManager');

/**
 * Returns an array of strings containing command line arguments
 * for npm-cache. Excludes any arguments to be passed to package
 * managers
 *
 * Ex: npm-cache --forceRefresh --cacheDirectory /tmp bower --allow-root
 *  Returns [--forceRefresh, --cacheDirectory, /tmp]
 *
 * @return {string[]} args
 */
exports.getNpmCacheArgs = function () {
  var npmCacheArgs = [];

  var availableManagers = CacheDependencyManager.getAvailableManagers();

  var allArguments = process.argv.slice(2);
  for (var i = 0; i < allArguments.length; i++) {
    var currArgument = allArguments[i];
    if (currArgument in availableManagers) {
      break;
    } else {
      npmCacheArgs.push(currArgument);
    }
  }
  return npmCacheArgs;
};


/**
 *
 * Parses command line args and returns an object specifying which managers
 * were requested along with their command line arguments
 *
 * Ex: npm-cache install bower --allow-root --save npm --save
 *  Returns {bower: '--allow-root --save', npm: --save}
 *
 * @return {Object} managerArgs
 */
exports.getManagerArgs = function () {
  var managers = {};
  var allArguments = process.argv.slice(3); // strip off 'node', 'index.js', and 'install' from arguments list
  var availableManagers = CacheDependencyManager.getAvailableManagers();
  var currManager = null;

  // First determine which managers were requested by looking at command line arguments
  _.forEach(
    allArguments,
    function addManagerArgument (argument) {
      if (argument in availableManagers) {
        managers[argument] = '';
        currManager = argument;
      } else if (currManager !== null) {
        managers[currManager] += argument + ' ';
      }
    }
  );

  // If no managers were specified, try installing everything by default!
  if (_.isEmpty(managers)) {
    // add all keys from available managers as keys here
    _.forEach(
      CacheDependencyManager.getAvailableDefaultManagers(),
      function addManager (managerPath, manager) {
        managers[manager] = '';
      }
    );
  }

  return managers;
};

var fs = require('fs');
var path = require('path');
var logger = require('../util/logger');


function BaseCacheManager () {
  return {
    name: 'BaseCacheManager',
    getConfigPath: function () {
      logger.logError('Override getConfigPath() in subclasses!')
    },
    verifyConfigExists: function () {
      var configPath = path.resolve(__dirname, '..',  this.getConfigPath());
      return fs.existsSync(configPath);
    },
    installDependencies: function () {
      if (! this.verifyConfigExists()) {
        logger.logError('Could not find config path for ' + this.name);
        return;
      }
      logger.logInfo('installed dependencies for ' + this.name);
    }
  }
}

module.exports = BaseCacheManager;

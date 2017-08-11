'use strict';

var path = require('path');

module.exports = function(config) {
  var customConfig = require(path.resolve(process.cwd(), config.configPath));
  if(typeof customConfig == "function") {
    return customConfig(config);
  }
  return customConfig;
}

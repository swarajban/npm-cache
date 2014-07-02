'use strict';

exports.logError = function (errorMessage) {
  console.log('[npm-cache] [ERROR] ' + errorMessage);
};

exports.logInfo = function (message) {
  console.log('[npm-cache] [INFO] ' + message);
};


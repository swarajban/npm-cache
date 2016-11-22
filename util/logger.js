'use strict';

exports.logError = function (errorMessage) {
  console.log('[npm-cache] [ERROR] ' + errorMessage);
};

exports.logInfo = function (message) {
    var date = new Date();
    console.log('[npm-cache] [INFO] ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' ' + message);
};


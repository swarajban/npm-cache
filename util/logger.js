'use strict';
var logSymbols = require('log-symbols'),
		clic = require('cli-color');

exports.logError = function (errorMessage) {
  console.log(logSymbols.error, errorMessage);
};

exports.logInfo = function (message) {
  console.log(logSymbols.info, clic.blackBright( message));
};

exports.logSuccess = function (message) {
  console.log(logSymbols.success,  clic.white.bgGreen(message));
};

exports.logRunning = function (message) {
  console.log(logSymbols.success,  clic.white.bgCyan(message, '...'));
};

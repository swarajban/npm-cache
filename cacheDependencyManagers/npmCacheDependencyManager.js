'use strict';

var CacheDependencyManager = require('./baseCacheDependencyManager');
var path = require('path');
var shell = require('shelljs');

// Inherit from CacheDependencyManager
function NpmCacheDependencyManager (cacheDirectory) {
  CacheDependencyManager.call(this, cacheDirectory);
}
NpmCacheDependencyManager.prototype = Object.create(CacheDependencyManager.prototype);
NpmCacheDependencyManager.prototype.constructor = NpmCacheDependencyManager;

// Override CacheDependencyManager methods
NpmCacheDependencyManager.prototype.getName = function () {
  return 'npm';
};

NpmCacheDependencyManager.prototype.getConfigPath = function () {
  return path.resolve(process.cwd(), 'package.json');
};

NpmCacheDependencyManager.prototype.getCliName = function () {
  return 'npm';
};

NpmCacheDependencyManager.prototype.getInstalledDirectory = function () {
  return 'node_modules';
};

NpmCacheDependencyManager.prototype.installDependencies = function () {
  this.cacheLogInfo('installing npm dependencies...');
  if (shell.exec('npm install').code !== 0) {
    this.cacheLogError('error running npm install');
    return;
  }
  this.cacheLogInfo('installed npm dependencies, now archiving');
};


module.exports = NpmCacheDependencyManager;

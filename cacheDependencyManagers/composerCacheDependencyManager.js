var CacheDependencyManager = require('./baseCacheDependencyManager');
var path = require('path');
var shell = require('shelljs');

// Inherit from CacheDependencyManager
function ComposerCacheDependencyManager (cacheDirectory) {
  CacheDependencyManager.call(this, cacheDirectory);
}
ComposerCacheDependencyManager.prototype = Object.create(CacheDependencyManager.prototype);
ComposerCacheDependencyManager.prototype.constructor = ComposerCacheDependencyManager;

// Override CacheDependencyManager methods
ComposerCacheDependencyManager.prototype.getName = function () {
  return 'composer';
};

ComposerCacheDependencyManager.prototype.getConfigPath = function () {
  return path.resolve(process.cwd(), 'composer.json');
};

ComposerCacheDependencyManager.prototype.getCliName = function () {
  return 'php';
};

ComposerCacheDependencyManager.prototype.getInstalledDirectory = function () {
  return 'vendor';
};

ComposerCacheDependencyManager.prototype.installDependencies = function () {
  this.cacheLogInfo('installing php composer dependencies...');
  var composerLocation = __dirname + '/../util/composer.phar';
  if (shell.exec('php ' + composerLocation + ' install').code !== 0) {
    this.cacheLogError('error running composer');
    return;
  }
  this.cacheLogInfo('installed composer dependencies, now archiving');
};


module.exports = ComposerCacheDependencyManager;

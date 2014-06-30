var CacheDependencyManager = require('./baseCacheDependencyManager');
var path = require('path');
var fs = require('fs');
var shell = require('shelljs');

// Inherit from CacheDependencyManager
function BowerCacheDependencyManager (cacheDirectory) {
  CacheDependencyManager.call(this, cacheDirectory);
}
BowerCacheDependencyManager.prototype = Object.create(CacheDependencyManager.prototype);
BowerCacheDependencyManager.prototype.constructor = BowerCacheDependencyManager;

// Override CacheDependencyManager methods
BowerCacheDependencyManager.prototype.getName = function () {
  return 'bower';
};

BowerCacheDependencyManager.prototype.getConfigPath = function () {
  return path.resolve(process.cwd(), 'bower.json');
};

BowerCacheDependencyManager.prototype.getCliName = function () {
  return 'bower';
};

BowerCacheDependencyManager.prototype.getInstalledDirectory = function () {
  var bowerComponentLocation = 'bower_components';
  var bowerRcPath = path.resolve(process.cwd(), '.bowerrc');
  if (fs.existsSync(bowerRcPath)) {
    var bowerRcFile = fs.readFileSync(bowerRcPath);
    var bowerRc = JSON.parse(bowerRcFile);
    if (bowerRc.directory) {
      bowerComponentLocation = bowerRc.directory;
      this.cacheLogInfo('bower_components located at ' + bowerComponentLocation + ' per bowerrc');
    }
  }
  return bowerComponentLocation;
};

BowerCacheDependencyManager.prototype.installDependencies = function () {
  this.cacheLogInfo('installing bower dependencies...');
  if (shell.exec('bower install').code !== 0) {
    this.cacheLogError('error running bower install');
    return;
  }
  this.cacheLogInfo('installed bower dependencies, now archiving');
};


module.exports = BowerCacheDependencyManager;

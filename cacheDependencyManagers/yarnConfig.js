'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');
var logger = require('../util/logger');

function getYarnVersion() {
    return shell.exec('yarn --version', { silent: true }).output.trim();
}

// Returns path to configuration file for yarn. Uses
// - yarn.lock if it exists; otherwise,
// - defaults to package.json
var getYarnConfigPath = function () {
    var yarnLockPath = path.resolve(process.cwd(), 'yarn.lock');
    if (fs.existsSync(yarnLockPath)) {
        logger.logInfo('[yarn] using yarn.lock instead of package.json');
        return yarnLockPath;
    }

    return path.resolve(process.cwd(), 'package.json');
};

function getFileHash(filePath) {
    var packageJson;
    var file = fs.readFileSync(filePath);

    try {
        packageJson = JSON.parse(file);

        return md5(JSON.stringify({
            dependencies: packageJson.dependencies,
            devDependencies: packageJson.devDependencies
        }));
    } catch (e) {
        return md5(file);
    }
}

module.exports = {
    cliName: 'yarn',
    getCliVersion: getYarnVersion,
    configPath: getYarnConfigPath(),
    installDirectory: 'node_modules',
    installCommand: 'yarn install',
    getFileHash: getFileHash
};

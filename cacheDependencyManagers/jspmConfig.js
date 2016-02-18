'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');
var logger = require('../util/logger');

// call these two upfront so log messages emitted by them only show up once
var configFile = getConfigFile();
var installDirectory = getInstallDirectory();

/**
 * @param {string} filename
 * @returns {string}
 */
function getProjectFileContents(filename) {
    var file = path.resolve(process.cwd(), filename);
    return fs.readFileSync(file);
}

/**
 * @returns {{
 *   jspm?:{
 *     configFile?:string,
 *     directories?:{
 *       baseURL?:string,
 *       packages?:string
 *     }
 *   }
 * }}
 */
function getPackageJson() {
    return JSON.parse(getProjectFileContents('package.json'));
}

/**
 * @returns {string} default install directory or override from package.json (packages or baseURL)
 */
function getInstallDirectory() {
    var jspm = getPackageJson().jspm;
    var defaultPath = 'jspm_packages';

    if (jspm && jspm.directories && jspm.directories.packages) {
        var configPath = jspm.directories.packages;
        logger.logInfo('[jspm] jspm_packages located at ' + configPath + ' per package.json jspm.directories.packages');
        return configPath;
    }

    if (jspm && jspm.directories && jspm.directories.baseURL) {
        var baseUrlPath = path.join(jspm.directories.baseURL, defaultPath);
        logger.logInfo('[jspm] jspm_packages located at ' + baseUrlPath + ' per package.json jspm.directories.baseURL');
        return baseUrlPath;
    }

    return defaultPath;
}

/**
 * @returns {string} default config file or override from package.json (configFile or baseURL)
 */
function getConfigFile() {
    var jspm = getPackageJson().jspm;

    if (!jspm) {
        // return invalid filename, as "jspm" must exist inside package.json
        return 'package.json(namespace:jspm)';
    }

    if (jspm.configFile) {
        var configFile = jspm.configFile;
        logger.logInfo('[jspm] config located at ' + configFile + ' per package.json jspm.configFile');
        return configFile;
    }

    var baseURL = '';
    if (jspm.directories && jspm.directories.baseURL) {
        baseURL = jspm.directories.baseURL;
        logger.logInfo('[jspm] config located in ' + baseURL + ' per package.json jspm.directories.baseURL');
    }

    var file = {
        'jspm@0.16': path.join(baseURL, 'config.js'),
        'jspm@0.17': path.join(baseURL, 'jspm.config.js')
    };

    // jspm changed default config filename in 0.17, so check for both
    return fs.existsSync(file['jspm@0.17']) ? file['jspm@0.17'] : file['jspm@0.16'];
}

/**
 * @returns {string}
 */
function getJspmVersion() {
    var rawMultilineOutput = shell.exec('jspm --version', {silent: true}).output;
    var version = rawMultilineOutput.split('\n')[0] || 'UnknownVersion';
    return version.trim();
}

/**
 * @returns {string} md5 from jspm config file contents
 */
function getConfigurationHash() {
    return md5(JSON.stringify({
        'package.json => jspm': getPackageJson().jspm,
        'config.js': getProjectFileContents(configFile)
    }));
}

module.exports = {
    cliName: 'jspm',
    getCliVersion: getJspmVersion,
    configPath: configFile,
    installDirectory: installDirectory,
    addToArchiveAndRestore: configFile,
    installCommand: 'jspm install',
    getFileHash: getConfigurationHash
};

'use strict';

var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var md5 = require('md5');

/**
 * @param {string} filename
 * @returns {string}
 */
function getFileContents(filename) {
    var file = path.resolve(process.cwd(), filename);
    return fs.readFileSync(file);
}

module.exports = {
    cliName: 'yarn',
    getCliVersion: function () {
        return shell.exec('yarn --version', {silent: true}).output.trim();
    },
    configPath: 'yarn.lock',
    installDirectory: 'node_modules',
    addToArchiveAndRestore: 'yarn.lock',
    installCommand: 'yarn',
    getFileHash: function() {
        return md5(getFileContents('yarn.lock'));
    }
};

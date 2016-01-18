'use strict';

var mock = require('mock-fs');
var should = require('should');
var composerConfig = require('../../cacheDependencyManagers/composerConfig');

describe('composerConfig', function() {
    describe('should pass on sanity check', function() {
        it('having a name', function() {
            composerConfig.cliName.should.be.exactly('composer');
        });
    });
    describe('checks filesystem and', function() {
        afterEach(function() {
            mock.restore();
        });
        describe('without any composer file', function() {
            before(function() {
                mock(/** empty directory */);
            });
            it('should try to use composer.json', function() {
                composerConfig.configPath.should.be.exactly(process.cwd() + '/composer.json');
            });
        });
        describe('with just composer.json', function() {
            before(function() {
                mock({
                    'composer.json': ''
                });
            });
            it('should use composer.json', function() {
                composerConfig.configPath.should.be.exactly(process.cwd() + '/composer.json');
            });
        });
        describe('with just composer.lock', function() {
            before(function() {
                mock({
                    'composer.lock': ''
                });
            });
            it('should use composer.lock', function() {
                composerConfig.configPath.should.be.exactly(process.cwd() + '/composer.lock');
            });
        });
        describe('with composer.lock and composer.json', function() {
            before(function() {
                mock({
                    'composer.json': '',
                    'composer.lock': ''
                });
            });
            it('should use composer.lock', function() {
                composerConfig.configPath.should.be.exactly(process.cwd() + '/composer.lock');
            });
        });
    });
});

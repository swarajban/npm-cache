'use strict';

exports.getHomeDirectory = function () {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
};

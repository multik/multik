var path = require('path');
var async = require('async');
var fs = require('fs');

var Dependency = function (config, options) {
    this._config = config;
    this._options = options;
};

Dependency.prototype.analyse = function (callback) {

    var config = this._config;
    var options = this._options;
    var destinationPath;

    if (options.folder) {
        destinationPath =
            path.join(config.cwd, dependOptions.folder);
    } else {
        destinationPath =
            path.join(config.cwd, config.directory, options.name);
    }

    this._destinationPath = destinationPath;

    var __self = this;

    async.series([
        function (asyncCallback) {
            fs.exists(destinationPath, function (exists) {
                __self.isInstalled = exists;
                asyncCallback(null);
            });
        }
    ], function (err) {
        if (callback) {
            callback(err);
        }
    });
};

Dependency.prototype.install = function (callback) {
    if (callback){
        callback(null);
    }
}

module.exports = Dependency;

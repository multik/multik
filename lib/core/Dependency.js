var fs = require('fs');
var path = require('path');
var mout = require('mout');
var async = require('async');
var exec = require('child_process').exec;

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
    console.log('Cloning: ' + options.repo + ' [' + options.version + ']');

    var options = this._options;

    this._shell("git", ['clone', options.repo, '-b', options.version, this._destinationPath, '--progress'], {
        cwd: options.cwd
    }, function (err) {
        if (callback) {
            callback(err);
        }
    });
}

Dependency.prototype.update = function (callback) {
    console.log('Updating: ' + options.repo + ' [' + options.version + ']');

    var __self = this;
    var destinationPath = this._destinationPath;

    async.series([
        function (asyncCallback) {
            __self._shell("git", ['fetch', options.repo, options.version, '--progress'], {
                cwd: destinationPath
            }, function (err) {
                asyncCallback(err);
            });
        },
        function (asyncCallback) {
            __self._shell("git", ['checkout', options.version, '-f'], {
                cwd: destinationPath
            }, function (err) {
                asyncCallback(err);
            });
        },
        function (asyncCallback) {
            __self._shell("git", ['pull', '--rebase', options.repo, options.version, '--progress'], {
                cwd: destinationPath
            }, function (err) {
                asyncCallback(err);
            });
        }],
        function (err) {
            if (callback) {
                callback(err);
            }
        }
    );
};

Dependency.prototype._shell = function (cmd, args, options, callback) {
    if (mout.lang.isArray(args)) {
        args = args.join(' ');
    }
    cmd += ' ' + args;
    exec(cmd, options, function (err, stdout, stderr) {
        if (err) {
            console.error(stderr);
        }
        else {
            console.log(stdout);
        }
        callback(err, stdout, stderr);
    });
};

module.exports = Dependency;

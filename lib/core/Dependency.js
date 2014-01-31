var fs = require('fs');
var path = require('path');
var mout = require('mout');
var chalk = require('chalk');
var async = require('async');
var exec = require('child_process').exec;

var Dependency = function (config, options) {
    this._config = config;
    this._options = options;

    this._isInstalled = false;
    this._isLocalChanged = false;
    this._localBranch = 'master';
};

Dependency.prototype.analyse = function (callback) {
    callback = callback || function () {
    };

    var config = this._config;
    var options = this._options;
    var destinationPath;
    var _isInstalled = false;

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
                __self._isInstalled = _isInstalled = exists;
                asyncCallback(null);
            });
        },
        function (asyncCallback) {
            if (!_isInstalled) {
                return asyncCallback(null);
            }

            __self._shell('git', ['status', '-s'], {
                cwd: destinationPath
            }, function (err, stdout, stderr) {
                if (!err) {
                    __self._isLocalChanged = !mout.lang.isEmpty(stdout);
                }
                asyncCallback(err, stdout, stderr);
            });
        },
        function (asyncCallback) {
            if (!_isInstalled) {
                return asyncCallback(null);
            }

            __self._shell('git', ['branch'], {
                cwd: destinationPath
            }, function (err, stdout, stderr) {
                if (!err) {
                    var branch = mout.string.replace(stdout, '* ', '');
                    branch = mout.string.trim(branch);
                    __self._localBranch = branch;
                }
                asyncCallback(err, stdout, stderr);
            });

        }
    ], function (err, stdout, stderr) {
        if (err) {
            console.error(stderr);
        }
        callback(err);
    });
};

Dependency.prototype.install = function (callback) {
    callback = callback || function () {
    };
    var options = this._options;
    var __self = this;

    this.analyse(function(err){
        if (err){
            return callback(err);
        }

        if (__self._isInstalled) {
            __self._log(options.version, 'Already installed', 'green')
            return callback(null);
        }

        __self._shell("git", ['clone', options.repo, '-b', options.version, this._destinationPath, '--progress'], {
            cwd: options.cwd
        }, function (err, stdout, stderr) {
            if (err) {
                __self._log(options.version, 'Error in installation', 'green')
                console.error(stderr);
            } else {
                __self._log(options.version, 'Installation is complete', 'green')
            }

            if (callback) {
                callback(err);
            }
        });
    });
}

Dependency.prototype.update = function (callback) {
    callback = callback || function () {
    };

    var options = this._options;
    var __self = this;

    this.analyse(function(err){
        if (err){
            return callback(err);
        }

        var localBranch = __self._localBranch;

        if (!__self._isInstalled) {
            __self._log(localBranch, 'Not installed', 'red');
            return callback(null);
        }

        if (__self._isLocalChanged){
            __self._log(localBranch, 'There are local changes', 'red');
            return callback(null);
        }

        var destinationPath = __self._destinationPath;

        async.series([
            function (asyncCallback) {
                __self._shell("git", ['fetch', options.repo, options.version, '--progress'], {
                    cwd: destinationPath
                }, function (err, stdout, stderr) {
                    if (err){
                        console.log(stderr);
                    }
                    asyncCallback(err);
                });
            },
            function (asyncCallback) {
                __self._shell("git", ['checkout', options.version, '-f'], {
                    cwd: destinationPath
                }, function (err, stdout, stderr) {
                    if (err){
                        console.log(stderr);
                    }
                    asyncCallback(err);
                });
            },
            function (asyncCallback) {
                __self._shell("git", ['pull', '--rebase', options.repo, options.version, '--progress'], {
                    cwd: destinationPath
                }, function (err, stdout, stderr) {
                    if (err){
                        console.log(stderr);
                    }
                    asyncCallback(err);
                });
            }],
            function (err) {
                if (!err) {
                    __self._log(__self._localBranch, 'Update is done', 'green');
                }

                return callback(err);
            }
        );
    });

};

Dependency.prototype.status = function (callback) {
    callback = callback || function () {
    };

    var options = this._options;
    var __self = this;

    this.analyse(function(err){
        if (err){
            return callback(err);
        }

        if (!__self._isInstalled) {
            __self._log(options.version, 'Not installed', 'red')
            return callback(null);
        }

        var branch = __self._localBranch;

        if (__self._isLocalChanged) {
            __self._log(branch, 'Changes', 'red');
        } else {
            __self._log(branch, 'No Changes', 'green');
        }

        return callback(null);
    });

};

Dependency.prototype._log = function (branch, message, color) {
    var options = this._options;
    var config = this._config;
    var destinationPath = this._destinationPath;
    var relativePath = path.relative(config.cwd, destinationPath);

    var displayMessage = '  ';
    displayMessage += chalk.blue(mout.string.rpad(relativePath, 50, ' '));
    displayMessage += '[ ';

    var padBranch = mout.string.rpad(branch, 15, ' ')

    if (branch === 'master') {
        displayMessage += chalk.green(padBranch);
    } else {
        displayMessage += chalk.yellow(padBranch);
    }

    displayMessage += ' ] : ';
    displayMessage += chalk[color](message);

    console.log(displayMessage);
};

Dependency.prototype._shell = function (cmd, args, options, callback) {
    if (mout.lang.isArray(args)) {
        args = args.join(' ');
    }
    cmd += ' ' + args;
    exec(cmd, options, function (err, stdout, stderr) {
        callback(err, stdout, stderr);
    });
};

module.exports = Dependency;

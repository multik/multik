var fs = require('fs');
var path = require('path');
var mout = require('mout');
var chalk = require('chalk');
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
    callback = callback || function () {
    };
    var options = this._options;
    var __self = this;

    if (this.isInstalled) {
        this._log(options.version, 'Already installed', 'green')
        return callback(null);
    }

    this._shell("git", ['clone', options.repo, '-b', options.version, this._destinationPath, '--progress'], {
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
}

Dependency.prototype.update = function (callback) {
    console.log('Updating: ' + options.repo + ' [' + options.version + ']');

    var __self = this;
    var destinationPath = this._destinationPath;

    async.series([
        function (asyncCallback) {
            __self._shell("git", ['fetch', options.repo, options.version, '--progress'], {
                cwd: destinationPath
            }, function (err, stdout, stderr) {
                asyncCallback(err, stdout, stderr);
            });
        },
        function (asyncCallback) {
            __self._shell("git", ['checkout', options.version, '-f'], {
                cwd: destinationPath
            }, function (err, stdout, stderr) {
                asyncCallback(err, stdout, stderr);
            });
        },
        function (asyncCallback) {
            __self._shell("git", ['pull', '--rebase', options.repo, options.version, '--progress'], {
                cwd: destinationPath
            }, function (err, stdout, stderr) {
                asyncCallback(err, stdout, stderr);
            });
        }],
        function (err, stdout, stderr) {
            if (err) {
                console.error(stderr);
            }

            if (callback) {
                callback(err);
            }
        }
    );
};

Dependency.prototype.status = function (callback) {
    callback = callback || function () {
    };

    var options = this._options;
    var config = this._config;
    var destinationPath = this._destinationPath;
    var __self = this;
    var isChanges;
    var branch;

    if (!this.isInstalled) {
        this._log(options.version, 'Not installed', 'red')

        return callback(null);
    }

    async.series([
        function (asyncCallback) {
            __self._shell('git', ['status', '-s'], {
                cwd: destinationPath
            }, function (err, stdout, stderr) {
                if (!err) {
                    isChanges = !mout.lang.isEmpty(stdout);
                }
                asyncCallback(err, stdout, stderr);
            });
        },
        function (asyncCallback) {
            __self._shell('git', ['branch'], {
                cwd: destinationPath
            }, function (err, stdout, stderr) {
                if (!err) {
                    branch = mout.string.replace(stdout, '* ', '');
                    branch = mout.string.trim(branch);
                }
                asyncCallback(err, stdout, stderr);
            });
        },
    ], function (err, stdout, stderr) {
        if (err) {
            console.error(stderr);
        } else {
            if (isChanges) {
                __self._log(branch, 'Changes', 'red');
            } else {
                __self._log(branch, 'No Changes', 'green');
            }
        }
        return callback(err);
    })
}

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
}

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

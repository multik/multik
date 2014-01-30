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
    console.log('Cloning: ' + options.repo + ' [' + options.version + ']');

    var options = this._options;

    this._shell("git", ['clone', options.repo, '-b', options.version, this._destinationPath, '--progress'], {
        cwd: options.cwd
    }, function (err, stdout, stderr) {
        if (err) {
            console.error(stderr);
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
    var options = this._options;
    var config = this._config;
    var destinationPath = this._destinationPath;
    var __self = this;
    var isChanges;
    var branch;


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
            var relativePath = path.relative(config.cwd, destinationPath);

            var msg = '  ';
            msg += chalk.blue(mout.string.rpad(relativePath, 50, ' '));
            msg += '[ ';

            var padBranch = mout.string.rpad(branch, 15, ' ')

            if (branch === 'master') {
                msg += chalk.green(padBranch);
            } else {
                msg += chalk.yellow(padBranch);
            }

            msg += ' ] : ';

            if (isChanges) {
                msg += chalk.red('Changes');
            } else {
                msg += chalk.green('No Changes');
            }

            console.log(msg);
        }

        if (callback) {
            callback(err);
        }

    })
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

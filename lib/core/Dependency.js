'use strict';

var fs = require('fs');
var path = require('path');
var mout = require('mout');
var chalk = require('chalk');
var async = require('async');
var findup = require('findup-sync');
var resolve = require('resolve').sync;
var exec = require('child_process').exec;
var cli = require('../util/cli');

var Dependency = function (config, options) {
    this.name = options.name;
    this.group = options.group;

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
    var _isInstalled = false;

    var destinationPath =
        path.join(config.cwd, options.directory, options.folder);

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

    this.analyse(function (err) {
        if (err) {
            return callback(err);
        }

        if (__self._isInstalled) {
            __self._log(options.version, 'Already installed', 'green')
            return callback(null);
        }

        var destinationPath = __self._destinationPath;

        async.series([
            function (asyncCallback) {
                __self._shell("git", ['clone', options.repo, '-b', options.version, destinationPath, '--progress'], {
                    cwd: options.cwd
                }, function (err, stdout, stderr) {
                    if (err) {
                        __self._log(options.version, 'Installation error', 'red')
                        console.log(stderr);
                    }
                    asyncCallback(err);
                });
            },
            function (asyncCallback) {
                var packageJsonFile = path.join(destinationPath, 'package.json');

                fs.exists(packageJsonFile, function (exists) {
                    if (!exists) {
                        return asyncCallback(null);
                    }

                    __self._shell("npm", ['install'], {
                        cwd: destinationPath
                    }, function (err, stdout, stderr) {
                        if (err) {
                            __self._log(options.version, 'Error in npm install', 'red')
                            console.log(stderr);
                        }
                        asyncCallback(err);
                    });
                });
            }
        ], function (err) {
            if (!err) {
                __self._log(options.version, 'Installation is complete', 'green')
            }

            return callback(err);
        });
    });
}

Dependency.prototype.update = function (callback) {
    callback = callback || function () {
    };

    var options = this._options;
    var __self = this;

    this.analyse(function (err) {
        if (err) {
            return callback(err);
        }

        var localBranch = __self._localBranch;

        if (!__self._isInstalled) {
            __self._log(localBranch, 'Not installed', 'red');
            return callback(null);
        }

        if (__self._isLocalChanged) {
            __self._log(localBranch, 'There are local changes', 'red');
            return callback(null);
        }

        var destinationPath = __self._destinationPath;

        async.series([
            function (asyncCallback) {
                __self._shell("git", ['fetch', options.repo, options.version, '--progress'], {
                    cwd: destinationPath
                }, function (err, stdout, stderr) {
                    if (err) {
                        console.log(stderr);
                    }
                    asyncCallback(err);
                });
            },
            function (asyncCallback) {
                __self._shell("git", ['checkout', options.version, '-f'], {
                    cwd: destinationPath
                }, function (err, stdout, stderr) {
                    if (err) {
                        console.log(stderr);
                    }
                    asyncCallback(err);
                });
            },
            function (asyncCallback) {
                __self._shell("git", ['pull', '--rebase', options.repo, options.version, '--progress'], {
                    cwd: destinationPath
                }, function (err, stdout, stderr) {
                    if (err) {
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

    this.analyse(function (err) {
        if (err) {
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

Dependency.prototype.grunt = function (callback) {
    callback = callback || function () {
    };

    var options = this._options;
    var cliOptions = cli.options;
    var __self = this;

    this.analyse(function (err) {
        if (err) {
            return callback(err);
        }

        if (!__self._isInstalled) {
            __self._log(options.version, 'Not installed', 'red')
            return callback(null);
        }

        var destinationPath = __self._destinationPath;

        var tasks = cliOptions.argv.remain;
        if (cliOptions.argv.remain[0] === 'grunt') {
            tasks = cliOptions.argv.remain.slice(1);
        }

        // Local Grunt
        if (cliOptions.local) {

            __self._shell("grunt", tasks, {
                cwd: destinationPath
            }, function (err, stdout, stderr) {
                if (err) {
                    __self._log(options.version, 'Grunt error', 'red')
                    console.log(stdout);
                } else {
                    __self._log(options.version, 'Grunt ok', 'green')
                    console.log(stdout);
                }
                callback(err);
            });
        } else {

            var basedir = process.cwd();
            var gruntpath;

            try {
                gruntpath = resolve('grunt', {basedir: basedir});
            } catch (ex) {
                gruntpath = findup('lib/grunt.js');
                // No grunt install found!
                if (!gruntpath) {
                    __self._log(options.version, 'Grunt error', 'red')
                    return callback(null);
                }
            }
            var grunt = require(gruntpath);
            grunt.multik = {
                currentDependency: {
                    name: __self.name,
                    group: __self.group,
                    cwd: destinationPath
                }
            };
            var gruntOptions = {
                force: true,
                gruntfile: path.join(basedir, 'Multigrunt.js')
            };

            // TODO: hack (only hardcore)
            var oldGruntExit = grunt.util.exit;
            grunt.util.exit = function (exitCode, streams) {
                if (exitCode === 0) {
                    __self._log(options.version, 'Grunt ok', 'green')
                    return callback(null);
                }
                __self._log(options.version, 'Grunt error', 'red')
                oldGruntExit(exitCode, streams);
            };
            grunt.cli(gruntOptions);
        }
    });
};

Dependency.prototype._log = function (branch, message, color) {
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

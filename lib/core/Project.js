'use strict';

var path = require('path');
var async = require('async');
var resolve = require('resolve').sync;
var mout = require('mout');
var undersore = require('underscore');
var L = mout.lang;
var defaultConfig = require('../config');
var multikJson = require('../util/multikJson');
var Dependency = require('./Dependency');

var Project = function (options, config) {
    this._options = mout.object.mixIn({}, options || {
        filter: null
    });
    this._config = mout.object.mixIn({}, config || defaultConfig);

    this._multikJsonFile = path.join(this._config.cwd, 'multik.json');
    this._multikRepoJsonFile = path.join(this._config.cwd, 'multikrepo.json');
    this._multikRepoGlobalJsonFile = path.join(this._config.cwd, '..', 'multikrepo.json');
    this._jsonOverrideRepo = {};
};

Project.prototype.install = function (callback) {
    callback = callback || function () {
    };

    this._analyse(function (err, dependencies) {
        if (err) {
            return callback(err);
        }

        var stack = [];

        mout.array.forEach(dependencies, function (dependency) {
            stack.push(function (stackCallback) {
                dependency.install(stackCallback);
            });
        });

        // TODO: If parralell limit > 2, then error in git clone
        async.parallelLimit(stack, 1, function (err) {
            callback(err, dependencies);
        });
    });
};

Project.prototype.update = function (callback) {
    callback = callback || function () {
    };

    this._analyse(function (err, dependencies) {
        if (err) {
            return callback(err);
        }

        var stack = [];

        mout.array.forEach(dependencies, function (dependency) {
            stack.push(function (stackCallback) {
                dependency.update(stackCallback);
            });
        });

        async.parallelLimit(stack, 5, function (err) {
            callback(err, dependencies);
        });
    });
};

Project.prototype.status = function (callback) {
    callback = callback || function () {
    };

    this._analyse(function (err, dependencies) {
        if (err) {
            return callback(err);
        }

        var stack = [];

        mout.array.forEach(dependencies, function (dependency) {
            stack.push(function (stackCallback) {
                dependency.status(stackCallback);
            });
        });

        async.parallelLimit(stack, 5, function (err) {
            callback(err, dependencies);
        });
    });
};

Project.prototype.grunt = function (callback) {
    callback = callback || function () {
    };
    
    var options = this._options;

    this._analyse(function (err, dependencies) {
        if (err) {
            return callback(err);
        }

        var stack = [];

        if (!options.general) {
            mout.array.forEach(dependencies, function(dependency) {
                stack.push(function(stackCallback) {
                    dependency.grunt(stackCallback);
                });
            });
        }
        
        // execute general grunt
        if (!options.filter) {
            // necessary to optimize (make grant launch a separate function)
            stack.push(function(stackCallback) {
                var basedir = process.cwd();
                var gruntpath;

                try {
                    gruntpath = resolve('grunt', {basedir: basedir});
                } catch (ex) {
                }
                // No grunt install found!
                if (!gruntpath) {
                    console.error('Grunt not found');
                    return stackCallback(new Error('Grunt error'));
                }
                var grunt = require(gruntpath);

                // TODO: hack (only hardcore)
                var oldGruntExit = grunt.util.exit;
                grunt.util.exit = function(exitCode, streams) {
                    grunt.util.exit = oldGruntExit;
                    if (exitCode === 0) {
                        console.log('General grunt ok');
                        return stackCallback(null);
                    }
                    console.error('General grunt error');
                    oldGruntExit(exitCode, streams);
                };
                
                console.log('Run general grunt');
                grunt.cli({force: true});
            });
            
        }

        async.series(stack, function (err) {
            callback(err, dependencies);
        });
    });
};


// -----------------------

Project.prototype._analyse = function (callback) {
    var __self = this;

    async.series([
        function (asyncCallback) {
            __self._readMultikJson(asyncCallback);
        },
        function (asyncCallback) {
            __self._buildDependencies(asyncCallback);
        }
    ], function (err) {
        if (callback) {
            callback(err, __self._dependencies);
        }
    });
};

Project.prototype._readMultikJson = function (callback) {
    if (this._json) {
        return callback(null, this._json);
    }

    var jsonFile = this._multikJsonFile;
    var jsonRepoFile = this._multikRepoJsonFile;
    var jsonRepoGlobalFile = this._multikRepoGlobalJsonFile;
    var __self = this;

    var overrideRepo = {};

    var stack = [];

    stack.push (function(stackCallback){
        multikJson.read(jsonFile, function (err, json) {
            if (err) {
                console.error('File not found or syntax error in JSON file: ' + err.file);
                return stackCallback(err);
            }
            __self._json = json;

            return stackCallback(null);
        });
    });

    stack.push (function(stackCallback){
        multikJson.read(jsonRepoGlobalFile, function (err, json) {
            if (err) {
                return stackCallback(null);
            }

            overrideRepo = json;

            return stackCallback(null);
        });
    });

    stack.push (function(stackCallback){
        multikJson.read(jsonRepoFile, function (err, json) {
            if (err) {
                return stackCallback(null);
            }

            __self._jsonOverrideRepo = undersore.extend(overrideRepo, json);;

            return stackCallback(null);
        });
    });

    async.series(stack, function (err) {
        callback(err);
    });

};

Project.prototype._buildDependencies = function (callback) {
    if (this._dependencies) {
        return callback(null, this._dependencies);
    }

    var config = this._config;
    var options = this._options;
    var json = this._json;
    var jsonOverrideRepo = this._jsonOverrideRepo;
    var groups = json.groups || {};
    var dependencies = [];
    var dependencyId;

    var filter;
    if (L.isString(options.filter)) {
        filter = mout.string.trim(options.filter);
    }

    for (dependencyId in json.dependencies) {
        var dependOptions = json.dependencies[dependencyId];
        dependOptions.id = dependencyId;

        var group = {};

        if (dependOptions.group && groups[dependOptions.group]) {
            group = groups[dependOptions.group];
        }

        dependOptions.name = dependOptions.name || dependencyId;
        dependOptions.folder = dependOptions.folder || dependencyId;
        dependOptions.directory =
            dependOptions.directory || group.directory
                || json.directory || config.directory;

        if (dependOptions.repo
            && jsonOverrideRepo[dependOptions.name]
            && jsonOverrideRepo[dependOptions.name].repo){
            dependOptions.repo = jsonOverrideRepo[dependOptions.name].repo;
        }

        var dependency = new Dependency(config, dependOptions);

        if (filter) {
            // mk-grunt --filter=@<dependGroup>
            if (filter.indexOf('@') > -1) {
                var group = filter.slice(1);
                if (dependency.group !== group) {
                    continue;
                }
            }
            // mk-grunt --filter=<dependName>
            else if (filter !== dependency.name) {
                continue;
            }
        }

        dependencies.push(dependency);
    }

    this._dependencies = dependencies;

    callback(null, dependencies);
};

module.exports = Project;

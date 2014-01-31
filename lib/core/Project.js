var path = require('path');
var async = require('async');
var mout = require('mout');
var defaultConfig = require('../config');
var multikJson = require('../util/multikJson');
var Dependency = require('./Dependency');

var Project = function (config) {
    this._config = mout.object.mixIn({}, config || defaultConfig);
    this._jsonFile = path.join(this._config.cwd, 'multik.json');
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
        })

        async.parallelLimit(stack, 5, function (err) {
            callback(err, dependencies);
        });
    })
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
        })

        async.parallelLimit(stack, 5, function (err) {
            callback(err, dependencies);
        });
    })
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
        })

        async.parallelLimit(stack, 5, function (err) {
            callback(err, dependencies);
        });
    })
};


Project.prototype._analyse = function (callback) {
    var __self = this;

    async.series([
        function (asyncCallback) {
            __self._readMultikJson(asyncCallback)
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

    var jsonFile = this._jsonFile;
    var __self = this;

    multikJson.read(jsonFile, function (err, json) {
        if (err) {
            return callbac(err);
        }
        __self._json = json;

        return callback(null);
    });
};

Project.prototype._buildDependencies = function (callback) {
    if (this._dependencies) {
        return callback(null, this._dependencies);
    }

    var config = this._config;
    var json = this._json;
    var groups = json.groups || {};
    var dependencies = [];
    var stack = [];

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

        var dependency = new Dependency(config, dependOptions);
        dependencies.push(dependency);
    }

    this._dependencies = dependencies;

    callback(null, dependencies);
};

module.exports = Project;

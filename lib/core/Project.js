var path = require('path');
var async = require('async');
var mout = require('mout');
var defaultConfig = require('../config');
var multikJson = require('../util/multikJson');
var Dependency = require('./Dependency');

var Project = function (config) {
    this._config = config || defaultConfig;
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
            if (!dependency.isInstalled) {
                stack.push(function (stackCallback) {
                    dependency.install(stackCallback);
                });
            }
        })

        async.parallelLimit(stack, 5, function (err) {
            callback(err, dependencies);
        });
    })
};

Project.prototype.update = function (callback) {

};

Project.prototype.status = function (callback) {
};


Project.prototype._analyse = function (callback) {
    var __self = this;

    async.series([
        function (asyncCallback) {
            __self._readJson(asyncCallback)
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

Project.prototype._readJson = function (callback) {
    if (this._json) {
        return callback(null, this._json);
    }

    var jsonFile = this._jsonFile;
    var __self = this;

    async.series([
        function (asyncCallback) {
            multikJson.read(jsonFile, function (err, json) {
                if (!err) {
                    __self._json = json;
                }
                asyncCallback(err);
            });
        }
    ], function (err) {
        callback(err);
    });
};

Project.prototype._buildDependencies = function (callback) {
    if (this._dependencies) {
        return callback(null, this._dependencies);
    }

    var config = this._config;
    var dependencies = [];
    var stack = [];

    for (dependencyName in this._json.dependencies) {
        var dependOptions = this._json.dependencies[dependencyName];
        dependOptions.name = dependOptions.name || dependencyName;

        var dependency = new Dependency(config, dependOptions);
        dependencies.push(dependency);

        (function (dependency) {
            stack.push(function (stackCallback) {
                dependency.analyse(stackCallback);
            });
        })(dependency);
    }

    this._dependencies = dependencies;

    async.parallelLimit(stack, 5, function (err) {
        callback(err, dependencies);
    });
};

module.exports = Project;

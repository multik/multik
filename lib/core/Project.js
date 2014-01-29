var path = require('path');
var async = require('async');
var mout = require('mout');
var defaultConfig = require('../config');
var multikJson = require('../util/multikJson');

var Project = function (config) {

    this._config = config || defaultConfig;

    this._jsonFile = path.join(this._config.cwd, 'multik.json');
};

Project.prototype.install = function (options, callback) {

}

Project.prototype.update = function (callback) {

};

Project.prototype.analyse = function (callback) {
    var __self = this;

    async.series([
        function (asyncCallback) {
            __self._readJson(asyncCallback)
        }
    ], function (err) {
        if (callback) {
            callback(err);
        }
    });
}

Project.prototype._readJson = function (callback) {
    if (this._json) {
        return callback(null, this._json);
    }

    var jsonFile = this._jsonFile;
    var __self = this;

    async.series([
        function (asyncCallback) {
            multikJson.read(jsonFile, function (err, json) {
                console.log(json);
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

module.exports = Project;

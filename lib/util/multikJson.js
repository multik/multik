/*
 used from bower-json (https://github.com/bower/json)
 */

var fs = require('graceful-fs');
var path = require('path');
var deepExtend = require('deep-extend'); // TODO change (_ or mout)
var createError = require('./createError');

function read(file, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    // Check if file is a directory
    fs.stat(file, function (err, stat) {
        if (err) {
            return callback(err);
        }

        // Otherwise read it
        fs.readFile(file, function (err, contents) {
            var json;

            if (err) {
                return callback(err);
            }

            try {
                json = JSON.parse(contents.toString());
            } catch (err) {
                err.file = path.resolve(file);
                err.code = 'EMALFORMED';
                return callback(err);
            }

            // Parse it
            try {
                json = parse(json, options);
            } catch (err) {
                err.file = path.resolve(file);
                return callback(err);
            }

            callback(null, json, file);
        });
    });
}

function parse(json, options) {
    options = deepExtend({
        normalize: false,
        validate: true,
        clone: false
    }, options || {});

    // Clone
    if (options.clone) {
        json = deepExtend({}, json);
    }

    // Validate
    if (options.validate) {
        validate(json);
    }

    // Normalize
    if (options.normalize) {
        normalize(json);
    }

    return json;
}

function validate(json) {
    if (!json.name) {
        // throw createError('No name property set', 'EINVALID');
    }

    // TODO

    return json;
}

function normalize(json) {
    if (typeof json.main === 'string') {
        json.main = json.main.split(',');
    }

    // TODO

    return json;
}

module.exports = read;
module.exports.read = read;
module.exports.parse = parse;
module.exports.validate = validate;
module.exports.normalize = normalize;

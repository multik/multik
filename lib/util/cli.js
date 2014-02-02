'use strict';

var nopt = require('nopt');

// CLI options we care about.
exports.known = {help: Boolean, version: Boolean, filter: String};
exports.aliases = {h: '--help', V: '--version', f: '--filter'};

// Parse them and return an options object.
Object.defineProperty(exports, 'options', {
    get: function () {
        return nopt(exports.known, exports.aliases, process.argv, 2);
    }
});

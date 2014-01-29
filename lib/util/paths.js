/*
    used from bower-config (https://github.com/bower/config)
 */

var os = require('os');
var path = require('path');
var osenv = require('osenv');
var crypto = require('crypto');

function generateFakeUser() {
    var uid = process.pid + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    return crypto.createHash('md5').update(uid).digest('hex');
}

// Assume XDG defaults
// See: http://standards.freedesktop.org/basedir-spec/basedir-spec-latest.html
var paths = {
    config: process.env.XDG_CONFIG_HOME,
    data: process.env.XDG_DATA_HOME,
    cache: process.env.XDG_CACHE_HOME
};

// Guess some needed properties based on the user OS
var user = (osenv.user() || generateFakeUser()).replace(/\\/g, '-');
var tmp = path.join(os.tmpdir ? os.tmpdir() : os.tmpDir(), user);
var home = osenv.home();
var base;

// Fallbacks for windows
if (process.platform === 'win32') {
    base = path.resolve(process.env.APPDATA || home || tmp);
    base = path.join(base, 'multik');

    paths.config = paths.config || path.join(base, 'config');
    paths.data = paths.data || path.join(base, 'data');
    paths.cache = paths.cache || path.join(base, 'cache');
// Fallbacks for other operating systems
} else {
    base = path.resolve(home || tmp);

    paths.config = paths.config || path.join(base, '.config/multik');
    paths.data = paths.data || path.join(base, '.local/share/multik');
    paths.cache = paths.cache || path.join(base, '.cache/multik');
}

paths.tmp = path.resolve(path.join(tmp, 'multik'));

module.exports = paths;

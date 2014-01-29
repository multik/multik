var path = require('path');
var rc = require('./util/rc');
var paths = require('./util/paths');

var cwd  = process.cwd();

var defaultConfig = {
    'cwd': cwd,
    'directory': 'multik_modules',
    'tmp': paths.tmp,
    'storage': {
        packages: path.join(paths.cache, 'packages'),
        links: path.join(paths.data, 'links'),
        completion: path.join(paths.data, 'completion'),
        registry: path.join(paths.cache, 'registry'),
        empty: path.join(paths.data, 'empty')  // Empty dir, used in GIT_TEMPLATE_DIR among others
    }
};

var config = rc('multik', defaultConfig, cwd);

module.exports = config;

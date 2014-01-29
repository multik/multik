var path = require('path');
var paths = require('./util/paths');

var config = {
    'cwd': process.cwd(),
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

module.exports = config;

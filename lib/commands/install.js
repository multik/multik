var Project = require('../core/Project');

function install() {
    var project = new Project();
    project.install(function (err, dependencies) {
        console.log('Installation is done');
    });
};

module.exports = install;

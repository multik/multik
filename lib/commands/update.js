var Project = require('../core/Project');

function update() {
    var project = new Project();
    project.update(function (err, dependencies) {
        console.log('Installation is done');
    });
};

module.exports = update;

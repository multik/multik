var Project = require('../core/Project');

function status() {
    var project = new Project();
    project.analyse();
};

module.exports = status;

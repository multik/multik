var Project = require('../core/Project');

function status(options) {
    var project = new Project(options);
    project.status();
};

module.exports = status;

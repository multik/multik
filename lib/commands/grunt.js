var Project = require('../core/Project');

function grunt(options){
    var project = new Project(options);
    project.grunt();
};

module.exports = grunt;

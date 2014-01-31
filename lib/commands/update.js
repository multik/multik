var chalk = require('chalk');
var Project = require('../core/Project');

function update() {
    var project = new Project();

    // console.log('Start update');

    project.update(function (err, dependencies) {
        // console.log('Update is done');
    });
};

module.exports = update;

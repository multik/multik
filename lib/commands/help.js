var L = require('mout').lang;
var chalk = require('chalk');
var cli = require('../util/cli');

function help() {

    var options = cli.options;
    var name;

    if (options.argv.remain.length > 0){
        name = options.argv.remain[0];
    }

    if (name && L.isFunction(help[name])) {
        return help[name]();
    }

    var message = [
        '',
        'Usage:',
        '',
        '    ' + chalk.cyan('mk') + ' [--version] <command> [--help]',
        '',
        'Commands:',
        '',
        '     install                Install dependencies',
        '     grunt                  Run the task of Grunt',
        '     status                 Show the status of dependencies',
        '     update                 Update dependencies',
        '',
        'Options:',
        '',
        '     --help                 Display help information about Multik',
        '     --filter               Apply filter for dependencies',
        'See \'mk help <command>\' for more information on a specific command. '
    ];

    message.forEach(function (str) {
        console.log(str);
    });
};

help.grunt = function () {
    var message = [
        '',
        'Usage:',
        '',
        '    ' + chalk.cyan('mk-grunt') + ' [options] [task [task ...]]',
        '',
        'Options:',
        '',
        '     --help                 Display help information about Multik',
        '     --local                Run a local grant depending',
        '     --filter               Apply filter for dependencies',
        ''
    ];

    message.forEach(function (str) {
        console.log(str);
    });

};

module.exports = help;

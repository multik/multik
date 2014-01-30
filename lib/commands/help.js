var chalk = require('chalk');

function help() {
    var message = [
        '',
        'Usage:',
        '',
        '    ' + chalk.cyan('mk') + ' <command>',
        '',
        'Commands:',
        '',
        '     help                   Display help information about Multik',
        '     install                Install dependencies',
        '     status                 Show the status of dependencies',
        '     update                 Update dependencies',
        '',
    ];

    message.forEach(function (str) {
        console.log(str);
    });
};

module.exports = help;

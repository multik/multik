var chalk = require('chalk');

function help() {
    var message = [
        '',
        'Usage:',
        '',
        '    ' + chalk.cyan('mk') + ' <command> [<args>]',
        '',
        'Commands:',
        '',
        '     help                   Display help information about Multik',
        '',
    ];

    message.forEach(function (str) {
        console.log(str);
    });
};

module.exports = help;

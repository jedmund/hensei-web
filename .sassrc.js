const path = require('path');
const cwd = process.cwd();

module.exports = {
    data: '@import "globals";',
    'includePaths': [
        'node_modules',
        'assets/scss'
    ]
}
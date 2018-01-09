const inquirer = require('inquirer')

module.exports = async (msg = 'Press any key to continue') =>
  inquirer.prompt([{ type: 'input', name: 'input', message: msg }])

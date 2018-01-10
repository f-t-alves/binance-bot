import inquirer from 'inquirer'

export default async (msg = 'Press any key to continue') =>
  inquirer.prompt([{ type: 'input', name: 'input', message: msg }])

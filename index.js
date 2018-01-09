const inquirer = require('inquirer')
const chalk = require('chalk')
const clear = require('clear')
const binance = require('./src/binance')
const waitForInput = require('./src/utils/waitForInput')

binance.init()

const displayMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.yellow('What you want to do?'),
      choices: [{ name: 'See balance', value: 'balance' }, 'Exit']
    }
  ])
  switch (action.toLowerCase()) {
    case 'exit':
      return 0
    case 'balance':
      await binance.showBalances()
      break
  }
  await waitForInput('Press any key to go to the menu')
  return 1
}

const init = async () => {
  do clear()
  while ((await displayMenu()) !== 0)
}

init()

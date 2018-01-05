const inquirer = require('inquirer')
const clear = require('clear')
const binance = require('./src/binance')

binance.init()

const displayMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What you want to do?',
      choices: [{ name: 'See balance', value: 'balance' }]
    }
  ])
  switch (action) {
    case 'balance':
      await binance.showBalances()
      break
  }
}

clear()
displayMenu()

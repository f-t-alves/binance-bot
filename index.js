const inquirer = require('inquirer')
const chalk = require('chalk')
const clear = require('clear')
const binance = require('./src/binance')
const waitForInput = require('./src/utils/waitForInput')

binance.init()

const menu = {
  message: 'Menu',
  choices: [{ name: 'My Account', value: 'submenu:account' }],
  submenus: {
    account: {
      message: chalk.yellow('What you want to do?'),
      choices: [{ name: 'See balance', value: 'balance' }]
    }
  }
}

const displayMenu = async () => {
  let currentMenu = menu
  let action = null
  do {
    currentMenu = {
      type: 'list',
      name: 'action',
      ...currentMenu
    }
    currentMenu.message = chalk.yellow(currentMenu.message)
    const prompt = await inquirer.prompt(currentMenu)
    action = prompt.action
    if (action === 'go-back') {
      currentMenu = currentMenu.parent
      clear()
    } else if (action.indexOf('submenu:') >= 0) {
      const nextMenu = currentMenu.submenus[action.substring(8)]

      nextMenu.parent = currentMenu
      currentMenu = nextMenu

      if (
        currentMenu.choices[currentMenu.choices.length - 1].value !== 'go-back'
      ) {
        currentMenu.choices.push({ name: 'Go back', value: 'go-back' })
      }
    }
  } while (action.indexOf('submenu:') >= 0 || action === 'go-back')
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

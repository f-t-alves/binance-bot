const inquirer = require('inquirer')
const chalk = require('chalk')
const clear = require('clear')
const binance = require('./src/binance.js')
const waitForInput = require('./src/utils/waitForInput.js')
const menu = require('./src/menu.js')
const loadedRoutes = {}

binance.init()

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
    action = prompt.action.toLowerCase()
    if (action === 'go-back') {
      currentMenu = currentMenu.parent
      clear()
    } else if (action.indexOf('submenu:') >= 0) {
      const nextMenu = currentMenu.submenus[action.substring(8)]

      nextMenu.parent = currentMenu
      currentMenu = nextMenu

      const submenuLastOption =
        currentMenu.choices[currentMenu.choices.length - 1]

      if (submenuLastOption.value !== 'go-back') {
        currentMenu.choices.push({ name: 'Go back', value: 'go-back' })
      }
    }
  } while (action.indexOf('submenu:') >= 0 || action === 'go-back')
  if (action === 'exit') return 0
  if (action.indexOf('route:') === 0) {
    const routeName = action.substring(6)
    const routePath = routeName.replace('.', '/')
    if (!loadedRoutes[routeName]) {
      loadedRoutes[routeName] = require(`./src/routes/${routePath}.js`)
    }
    const routeMod = loadedRoutes[routeName]
    if (typeof routeMod.onBeforeAppear === 'function') {
      await routeMod.onBeforeAppear()
    }
    if (typeof routeMod.render === 'function') {
      await routeMod.render()
    } else throw new Error('Route module without "render" method: ' + routeName)
  }
  await waitForInput('Press any key to go to the menu')
}

const init = async () => {
  do {
    clear()
  } while ((await displayMenu()) !== 0)
  binance.destroy()
}

init()

module.exports = {
  message: 'Menu',
  choices: [{ name: 'My Account', value: 'submenu:account' }, { name: 'Exit' }],
  submenus: {
    account: {
      message: 'What you want to do?',
      choices: [{ name: 'See balance', value: 'route:account.balance' }]
    }
  }
}

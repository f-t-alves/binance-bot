const binance = require('../../binance')
const chalk = require('chalk')
const Table = require('cli-table2')

let accountBalances = {}

const convertedValuesCells = obj => {
  return [
    `${obj.BTC.toFixed(8)} Ƀ`,
    `${obj.ETH.toFixed(8)} E`,
    `${obj.USDB.toFixed(2)} $`,
    `${obj.USDE.toFixed(2)} $`
  ]
}

module.exports = {
  async onBeforeAppear () {
    accountBalances = await binance.getBalances()
  },
  async render () {
    const { balances, smallBalances, totals } = accountBalances

    const table = new Table({
      head: [
        'Symbol',
        'Balance',
        'In BTC',
        'In ETH',
        'In USD (btc)',
        'In USD (eth)'
      ]
    })

    for (const coin of balances) {
      table.push([
        chalk.green(coin.asset),
        `${coin.free} ${coin.asset}`,
        ...convertedValuesCells(coin.valueIn)
      ])
    }
    // If we have one or more coin balances below '0.09$',
    // display their values together
    if (smallBalances) {
      table.push([
        chalk.green('<0.09$'),
        '',
        ...convertedValuesCells(smallBalances)
      ])
    }
    table.push([chalk.yellow('Total'), '', ...convertedValuesCells(totals)])
    console.log(table.toString())
  }
}

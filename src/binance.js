const util = require('util')
const binance = require('node-binance-api')
const chalk = require('chalk')
const Table = require('cli-table2')
const config = require('../config.json')

const promisify = method => {
  method[util.promisify.custom] = pricesCallback => {
    return new Promise((resolve, reject) => {
      try {
        method(prices => resolve(prices))
      } catch (ex) {
        reject(ex)
      }
    })
  }
  return util.promisify(method)
}
let prices = {}
const getPrices = promisify(binance.prices)
const getBalances = promisify(binance.balance)

const getValueIn = baseSymbol => (symbol, n = 1) => {
  return (
    n *
    (symbol === baseSymbol ? 1 : parseFloat(prices[`${symbol}${baseSymbol}`]))
  )
}

const getValueInBTC = getValueIn('BTC')
const getValueInETH = getValueIn('ETH')
const getValueInUSDT = getValueIn('USDT')

module.exports = {
  init () {
    binance.options({
      APIKEY: config.APIKEY,
      APISECRET: config.APISECRET
    })
  },
  showBalances: async () => {
    prices = await getPrices()
    console.log(prices)
    let totalBTC = 0

    const allBalances = await getBalances()

    const relevantBalances = Object.keys(allBalances)
      .reduce((acc, symbol) => {
        const availableFunds = parseFloat(allBalances[symbol].available)
        if (availableFunds > 0) {
          let valueInBTC = getValueInBTC(symbol, allBalances[symbol].available)
          let valueInETH = getValueInETH(symbol, allBalances[symbol].available)
          let valueInUSD = getValueInUSDT('BTC', valueInBTC)

          if (!isNaN(valueInBTC)) {
            totalBTC += valueInBTC
          }

          acc.push({
            symbol,
            valueInBTC,
            valueInETH,
            valueInUSD,
            ...allBalances[symbol]
          })
        }
        return acc
      }, [])
      .sort((a, b) => {
        return b.valueInBTC - a.valueInBTC
      })

    const table = new Table({
      head: ['Symbol', 'Balance', 'Value In BTC', 'Value in USD']
    })

    for (const coin of relevantBalances) {
      table.push([
        chalk.green(coin.symbol),
        `${coin.available} ${coin.symbol}`,
        `${coin.valueInBTC} Ƀ`,
        `${coin.valueInUSD} $`
      ])
    }
    table.push([
      chalk.blue('Total'),
      '',
      `${totalBTC} Ƀ`,
      `${getValueInUSDT('BTC', totalBTC)} $`
    ])
    console.log(table.toString())
  }
}

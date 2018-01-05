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

const getValueIn = baseSymbol => (symbol, n = 1) =>
  n * (symbol === baseSymbol ? 1 : parseFloat(prices[`${symbol}${baseSymbol}`]))

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

    const allBalances = await getBalances()

    const relevantBalances = Object.keys(allBalances).reduce((acc, symbol) => {
      const availableFunds = parseFloat(allBalances[symbol].available)
      if (availableFunds > 0) {
        const valueInBTC = getValueInBTC(symbol, allBalances[symbol].available)
        const valueInETH = getValueInETH(symbol, allBalances[symbol].available)

        const valueInUSD = getValueInUSDT('BTC', valueInBTC)
        acc[symbol] = {
          valueInBTC,
          valueInETH,
          valueInUSD,
          ...allBalances[symbol]
        }
      }
      return acc
    }, {})
    const table = new Table({
      head: ['Symbol', 'Balance', 'Value In BTC', 'Value in USD']
    })
    for (const symbol of Object.keys(relevantBalances)) {
      const info = relevantBalances[symbol]
      table.push([
        chalk.blue(symbol),
        `${info.available} ${symbol}`,
        `${info.valueInBTC} Ƀ`,
        `${info.valueInUSD} $`
      ])
    }
    console.log(table.toString())
  }
}

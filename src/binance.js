const Binance = require('binance-api-node').default
const chalk = require('chalk')
const Table = require('cli-table2')
const config = require('../config.json')

let prices = {}
let binance = null

const getValueIn = baseSymbol => (symbol, n = 1) => {
  if (symbol === baseSymbol) return parseFloat(n)
  if (prices[`${symbol}${baseSymbol}`]) {
    return n * parseFloat(prices[`${symbol}${baseSymbol}`])
  }
  if (prices[`${baseSymbol}${symbol}`]) {
    return n * 1 / parseFloat(prices[`${baseSymbol}${symbol}`])
  }
  return 0
}

const getValueInBTC = getValueIn('BTC')
const getValueInETH = getValueIn('ETH')
const getValueInUSDT = getValueIn('USDT')
module.exports = {
  init () {
    binance = Binance({
      apiKey: config.APIKEY,
      apiSecret: config.APISECRET
    })
  },
  showBalances: async () => {
    prices = await binance.prices()
    let totalBTC = 0

    const accountInfo = await binance.accountInfo()
    const allBalances = accountInfo.balances

    const relevantBalances = allBalances
      .reduce((acc, item) => {
        const symbol = item.asset
        const availableFunds = parseFloat(item.free)
        if (availableFunds > 0) {
          let valueInBTC = getValueInBTC(symbol, item.free)
          let valueInETH = getValueInETH(symbol, valueInBTC)
          let valueInUSD = getValueInUSDT('BTC', valueInBTC)

          if (!isNaN(valueInBTC)) {
            totalBTC += valueInBTC
          }

          acc.push({
            valueInBTC,
            valueInETH,
            valueInUSD,
            ...item
          })
        }
        return acc
      }, [])
      .sort((a, b) => {
        return b.valueInBTC - a.valueInBTC
      })

    const table = new Table({
      head: ['Symbol', 'Balance', 'In BTC', 'In USD']
    })

    for (const coin of relevantBalances) {
      table.push([
        chalk.green(coin.asset),
        `${coin.free} ${coin.asset}`,
        `${coin.valueInBTC} Ƀ`,
        `${coin.valueInUSD} $`
      ])
    }
    table.push([
      chalk.blue('Total'),
      '',
      `${totalBTC.toFixed(8)} Ƀ`,
      `${getValueInUSDT('BTC', totalBTC)} $`
    ])
    console.log(table.toString())
  }
}

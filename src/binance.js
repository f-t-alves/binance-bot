const Binance = require('binance-api-node').default
const chalk = require('chalk')
const Table = require('cli-table2')
const config = require('../config.json')
const objectSum = require('./utils/objectSum.js')

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

const updatePriceData = async () => {
  prices = await binance.prices()
}

module.exports = {
  init () {
    binance = Binance({
      apiKey: config.APIKEY,
      apiSecret: config.APISECRET
    })
    updatePriceData()
    this.updateInterval = setInterval(updatePriceData, 5000)
  },
  destroy () {
    clearInterval(this.updateInterval)
  },
  showBalances: async () => {
    if (prices === null) await updatePriceData()

    const accountInfo = await binance.accountInfo()
    const allBalances = accountInfo.balances

    let totals, smallBalances
    const relevantBalances = allBalances
      .reduce((acc, item) => {
        const symbol = item.asset
        const availableFunds = parseFloat(item.free)
        if (availableFunds > 0) {
          // Fill an object with a coin's converted values
          // in BTC, ETH, USDT(BTC), USDT(ETH)
          const valueIn = {
            BTC: getValueInBTC(symbol, item.free),
            ETH: getValueInETH(symbol, item.free)
          }
          valueIn.USDB = getValueInUSDT('BTC', valueIn.BTC)
          valueIn.USDE = getValueInUSDT('ETH', valueIn.ETH)

          // Add the current coin transformed values to the total object
          totals = objectSum(totals, valueIn)

          // Let's get the highest USD price (between btc and eth)
          const maxUsdValue = Math.max(valueIn.USDB, valueIn.USDE)

          // Generate the parsed coin balance object
          const balanceObj = { valueIn, ...item }

          // If the max USD value is lower than 0.09
          // append its value to the smallBalances object
          if (maxUsdValue >= 0.09) {
            acc.push(balanceObj)
          } else {
            smallBalances = objectSum(smallBalances, balanceObj.valueIn)
          }
        }
        return acc
      }, [])
      // Sorting by number of coins (as binance do)
      .sort((a, b) => b.free - a.free)

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

    for (const coin of relevantBalances) {
      table.push([
        chalk.green(coin.asset),
        `${coin.free} ${coin.asset}`,
        `${coin.valueIn.BTC.toFixed(8)} Ƀ`,
        `${coin.valueIn.ETH.toFixed(8)} E`,
        `${coin.valueIn.USDB.toFixed(2)} $`,
        `${coin.valueIn.USDE.toFixed(2)} $`
      ])
    }
    // If we have one or more coin balances below '0.09$',
    // display their values together
    if (smallBalances) {
      table.push([
        chalk.green('< 0.09$'),
        '',
        `${smallBalances.BTC.toFixed(8)} Ƀ`,
        `${smallBalances.ETH.toFixed(8)} E`,
        `${smallBalances.USDB.toFixed(2)} $`,
        `${smallBalances.USDE.toFixed(2)} $`
      ])
    }
    table.push([
      chalk.yellow('Total'),
      '',
      `${totals.BTC.toFixed(8)} Ƀ`,
      `${totals.ETH.toFixed(8)} E`,
      `${totals.USDB.toFixed(2)} $`,
      `${totals.USDE.toFixed(2)} $`
    ])
    console.log(table.toString())
  }
}

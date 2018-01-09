const Binance = require('binance-api-node').default
const chalk = require('chalk')
const Table = require('cli-table2')
const config = require('../config.json')

let prices = {}
let accountInfo = {}
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
    this.doUpdateInterval()
    this.updateInterval = setInterval(this.doUpdateInterval, 5000)
  },
  async doUpdateInterval () {
    prices = await binance.prices()
    accountInfo = await binance.accountInfo()
    if (typeof this.onUpdateInterval === 'function') {
      this.onUpdateInterval({ prices, accountInfo })
    }
  },
  destroy () {
    clearInterval(this.updateInterval)
  },
  async getBalances () {
    if (prices === null || accountInfo === null) {
      await this.doUpdateInterval()
    }

    const allBalances = accountInfo.balances
    const relevantBalances = allBalances
      .reduce((acc, item) => {
        const symbol = item.asset
        const availableFunds = parseFloat(item.free)
        if (availableFunds > 0) {
          let valueInBTC = getValueInBTC(symbol, item.free)
          let valueInETH = getValueInETH(symbol, valueInBTC)
          let valueInUSD = getValueInUSDT('BTC', valueInBTC)

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

    return relevantBalances
  }
}

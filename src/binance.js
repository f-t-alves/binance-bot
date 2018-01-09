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
    let totalBTC = 0
    let totalETH = 0
    let totalUSDB = 0
	let totalUSDE = 0
	
	const accountInfo = await binance.accountInfo()
    const allBalances = accountInfo.balances

    const relevantBalances = allBalances
      .reduce((acc, item) => {
        const symbol = item.asset
        const availableFunds = parseFloat(item.free)
        if (availableFunds > 0) {
          let valueInBTC = getValueInBTC(symbol, item.free)
          let valueInETH = getValueInETH(symbol, item.free)   //correcao
          let valueInUSDB = getValueInUSDT('BTC', valueInBTC)
		  let valueInUSDE = getValueInUSDT('ETH', valueInETH) //verificando diferencas de lastros

          if (!isNaN(valueInBTC)) {
            totalBTC += valueInBTC
          }
		  
		  if (!isNaN(valueInETH)) {
            totalETH += valueInETH
          }
		  
		  if (!isNaN(valueInUSDB)) {
            totalUSDB += valueInUSDB
          }
		  
		  if (!isNaN(valueInUSDE)) {
            totalUSDE += valueInUSDE
          }

          acc.push({
            valueInBTC,
            valueInETH,
            valueInUSDB,
			valueInUSDE,
            ...item
          })
        }
        return acc
      }, [])
      .sort((a, b) => {
        return b.free - a.free
      })

    const table = new Table({
      head: ['Symbol', 'Balance', 'In BTC', 'In ETH', 'In USD (btc)', 'In USD (eth)']
    })

    for (const coin of relevantBalances) {
      table.push([
        chalk.green(coin.asset),
        `${coin.free} ${coin.asset}`,
        `${coin.valueInBTC.toFixed(8)} Ƀ`,
		`${coin.valueInETH.toFixed(8)} E`,
        `${coin.valueInUSDB.toFixed(2)} $`,
		`${coin.valueInUSDE.toFixed(2)} $`
      ])
    }	
    table.push([
      chalk.yellow('Total'),
      '',
	  `${totalBTC.toFixed(8)} Ƀ`,
	  `${totalETH.toFixed(8)} E`,
      `${totalUSDB.toFixed(2)} $`,
	  `${totalUSDE.toFixed(2)} $`
    ])
    console.log(table.toString())
  }
}

/**/

const binance = require('./src/binance.js')
const blessed = require('blessed')
blessed.contrib = require('blessed-contrib')

binance.init()

// Create a screen object.
const screen = blessed.screen({})

const grid = new blessed.contrib.grid({ rows: 12, cols: 12, screen }) // eslint-disable-line

const containerBox = grid.set(0, 0, 12, 8, blessed.box, {
  style: {
    bg: 'blue'
  }
})
const sidebarBox = grid.set(0, 8, 12, 4, blessed.layout, {
  padding: { left: 1, right: 1 },
  style: {}
})

const sidebarBalanceBox = blessed.table({
  height: 'grow',
  width: 'grow',
  scrollable: true,
  align: 'left',
  style: {
    bg: 'red',
    header: {
      bg: 'blue'
    }
  }
})

binance.onUpdateInterval = async ({ prices, accountInfo }) => {
  const balances = await binance.getBalances()
  sidebarBalanceBox.setData([
    ['SYMBOL', 'Total USD'],
    ...balances.map(item => [
      item.asset,
      `${item.valueInUSD.toFixed(2).toString()} $`
    ])
  ])
  screen.render()
}
sidebarBox.append(sidebarBalanceBox)

screen.render()

screen.key(['q', 'C-c'], function (ch, key) {
  process.exit(0)
})

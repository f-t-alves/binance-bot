const binance = require('../../binance')
module.exports = {
  async onBeforeAppear () {},
  async render () {
    await binance.showBalances()
  }
}

"use strict";

exports.__esModule = true;
exports.default = void 0;

var _binance = _interopRequireDefault(require("../../binance"));

var _chalk = _interopRequireDefault(require("chalk"));

var _cliTable = _interopRequireDefault(require("cli-table2"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let accountBalances = {};

const convertedValuesCells = obj => {
  return [`${obj.BTC.toFixed(8)} Ƀ`, `${obj.ETH.toFixed(8)} E`, `${obj.USDB.toFixed(2)} $`, `${obj.USDE.toFixed(2)} $`];
};

var _default = {
  async onBeforeAppear() {
    accountBalances = await _binance.default.getBalances();
  },

  async render() {
    const {
      balances,
      smallBalances,
      totals
    } = accountBalances;
    const table = new _cliTable.default({
      head: ['Symbol', 'Balance', 'In BTC', 'In ETH', 'In USD (btc)', 'In USD (eth)']
    });

    for (const coin of balances) {
      table.push([_chalk.default.green(coin.asset), `${coin.free} ${coin.asset}`, ...convertedValuesCells(coin.valueIn)]);
    } // If we have one or more coin balances below '0.09$',
    // display their values together


    if (smallBalances) {
      table.push([_chalk.default.green('< 0.09$'), '', ...convertedValuesCells(smallBalances)]);
    }

    table.push([_chalk.default.yellow('Total'), '', ...convertedValuesCells(totals)]);
    console.log(table.toString());
  }

};
exports.default = _default;
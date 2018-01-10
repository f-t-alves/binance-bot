"use strict";

exports.__esModule = true;
exports.default = void 0;

var _binanceApiNode = _interopRequireDefault(require("binance-api-node"));

var _config = _interopRequireDefault(require("../config.json"));

var _objectSum = _interopRequireDefault(require("./utils/objectSum.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let prices = {};
let binance = null;

const getValueIn = baseSymbol => (symbol, n = 1) => {
  if (symbol === baseSymbol) return parseFloat(n);

  if (prices[`${symbol}${baseSymbol}`]) {
    return n * parseFloat(prices[`${symbol}${baseSymbol}`]);
  }

  if (prices[`${baseSymbol}${symbol}`]) {
    return n * 1 / parseFloat(prices[`${baseSymbol}${symbol}`]);
  }

  return 0;
};

const getValueInBTC = getValueIn('BTC');
const getValueInETH = getValueIn('ETH');
const getValueInUSDT = getValueIn('USDT');

const updatePriceData = async () => {
  prices = await binance.prices();
};

var _default = {
  init() {
    binance = (0, _binanceApiNode.default)({
      apiKey: _config.default.APIKEY,
      apiSecret: _config.default.APISECRET
    });
    updatePriceData();
    this.updateInterval = setInterval(updatePriceData, 5000);
  },

  destroy() {
    clearInterval(this.updateInterval);
  },

  getBalances: async () => {
    if (prices === null) await updatePriceData();
    const accountInfo = await binance.accountInfo();
    const allBalances = accountInfo.balances;
    let totals, smallBalances;
    const balances = allBalances.reduce((acc, item) => {
      const symbol = item.asset;
      const availableFunds = parseFloat(item.free);

      if (availableFunds > 0) {
        // Fill an object with a coin's converted values
        // in BTC, ETH, USDT(BTC), USDT(ETH)
        const valueIn = {
          BTC: getValueInBTC(symbol, item.free),
          ETH: getValueInETH(symbol, item.free)
        };
        valueIn.USDB = getValueInUSDT('BTC', valueIn.BTC);
        valueIn.USDE = getValueInUSDT('ETH', valueIn.ETH); // Add the current coin transformed values to the total object

        totals = (0, _objectSum.default)(totals, valueIn); // Let's get the highest USD price (between btc and eth)

        const maxUsdValue = Math.max(valueIn.USDB, valueIn.USDE); // Generate the parsed coin balance object

        const balanceObj = {
          valueIn,
          ...item
        }; // If the max USD value is lower than 0.09
        // append its value to the smallBalances object

        if (maxUsdValue >= 0.09) {
          acc.push(balanceObj);
        } else {
          smallBalances = (0, _objectSum.default)(smallBalances, balanceObj.valueIn);
        }
      }

      return acc;
    }, []) // Sorting by number of coins (as binance do)
    .sort((a, b) => b.free - a.free);
    return {
      balances,
      totals,
      smallBalances
    };
  }
};
exports.default = _default;
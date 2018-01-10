"use strict";

exports.__esModule = true;
exports.default = void 0;

/* Add o2.key to o1.key if it's value is numeric */
var _default = (o1, o2) => Object.entries(o2).reduce((acc, [symbol, value]) => {
  if (!isNaN(value)) {
    if (acc[symbol] === undefined) {
      acc[symbol] = value;
    } else if (!isNaN(acc[symbol])) {
      acc[symbol] = acc[symbol] + value;
    }
  }

  return acc;
}, o1 || {});

exports.default = _default;
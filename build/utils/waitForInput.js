"use strict";

exports.__esModule = true;
exports.default = void 0;

var _inquirer = _interopRequireDefault(require("inquirer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = async (msg = 'Press any key to continue') => _inquirer.default.prompt([{
  type: 'input',
  name: 'input',
  message: msg
}]);

exports.default = _default;
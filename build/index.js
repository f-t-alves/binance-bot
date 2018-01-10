"use strict";

var _inquirer = _interopRequireDefault(require("inquirer"));

var _chalk = _interopRequireDefault(require("chalk"));

var _clear = _interopRequireDefault(require("clear"));

var _binance = _interopRequireDefault(require("./binance.js"));

var _waitForInput = _interopRequireDefault(require("./utils/waitForInput.js"));

var _menu = _interopRequireDefault(require("./menu.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const loadedRoutes = {};

_binance.default.init();

const displayMenu = async () => {
  let currentMenu = _menu.default;
  let action = null;

  do {
    currentMenu = {
      type: 'list',
      name: 'action',
      ...currentMenu
    };
    currentMenu.message = _chalk.default.yellow(currentMenu.message);
    const prompt = await _inquirer.default.prompt(currentMenu);
    action = prompt.action.toLowerCase();

    if (action === 'go-back') {
      currentMenu = currentMenu.parent;
      (0, _clear.default)();
    } else if (action.indexOf('submenu:') >= 0) {
      const nextMenu = currentMenu.submenus[action.substring(8)];
      nextMenu.parent = currentMenu;
      currentMenu = nextMenu;
      const submenuLastOption = currentMenu.choices[currentMenu.choices.length - 1];

      if (submenuLastOption.value !== 'go-back') {
        currentMenu.choices.push({
          name: 'Go back',
          value: 'go-back'
        });
      }
    }
  } while (action.indexOf('submenu:') >= 0 || action === 'go-back');

  if (action === 'exit') return 0;

  if (action.indexOf('route:') === 0) {
    const routeName = action.substring(6);
    const routePath = routeName.replace('.', '/');

    if (!loadedRoutes[routeName]) {
      const {
        default: routeModule
      } = await Promise.resolve().then(() => require(`./routes/${routePath}.js`));
      loadedRoutes[routeName] = routeModule;
    }

    const routeMod = loadedRoutes[routeName];

    if (typeof routeMod.onBeforeAppear === 'function') {
      await routeMod.onBeforeAppear();
    }

    if (typeof routeMod.render === 'function') {
      await routeMod.render();
    } else throw new Error('Route module without "render" method: ' + routeName);
  }

  await (0, _waitForInput.default)('Press any key to go to the menu');
};

const init = async () => {
  do {
    (0, _clear.default)();
  } while ((await displayMenu()) !== 0);

  _binance.default.destroy();
};

init();
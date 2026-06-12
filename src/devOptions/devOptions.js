const appData = require('../services/appData');
const path = require('path');
const ElectronWindow = require('../services/ElectronWindow');
const {ipcMain} = require('electron');

let windowWrapper =
	appData.isDev ?
		new ElectronWindow('Dev options', path.resolve(__dirname, 'devOptions.html'), 300, 110, false, {
			frame: false,
			thickFrame: false,
			alwaysOnTop: true,
		}) :
		null;

ipcMain.handle('dev-options', async (event, arg) => {
	switch (arg) {
		case 'close':
			let window = await windowWrapper.window;
			window.hide();
			break;
		default:
			console.error('Unknown window message:', arg);
	}
});

module.exports = windowWrapper;

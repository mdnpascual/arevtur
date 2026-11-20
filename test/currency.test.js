const {describe, it} = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Mock dependencies before requiring apiConstants
let requests = [];
let responses = {}; // substring of url -> string body
const httpRequestMock = {
	get: endpoint => {
		requests.push(endpoint);
		let key = Object.keys(responses).find(k => endpoint.includes(k));
		return Promise.resolve({string: responses[key]});
	},
};
const jsDesktopBasePath = require.resolve('js-desktop-base');
require.cache[jsDesktopBasePath] = {
	id: jsDesktopBasePath, filename: jsDesktopBasePath, loaded: true,
	exports: {httpRequest: httpRequestMock, XPromise: class {}},
};

const poeNinjaApiPath = path.resolve(__dirname, '../src/services/poeNinjaApi.js');
require.cache[poeNinjaApiPath] = {
	id: poeNinjaApiPath, filename: poeNinjaApiPath, loaded: true,
	exports: {getData: () => Promise.resolve({lines: []}), endpointsByLeague: {}},
};

const configDataPath = path.resolve(__dirname, '../src/services/config/configData.js');
require.cache[configDataPath] = {
	id: configDataPath, filename: configDataPath, loaded: true,
	exports: {config: {version2: true, league: 'TestLeague'}},
};

const apiConstants = require('../src/services/apiConstants');
const Poe2ScoutData = require('../src/services/pricer/Poe2ScoutData');
const ApiConstants = apiConstants.constructor;

const staticBody = JSON.stringify({result: [{id: 'Currency', entries: [
	{id: 'divine'}, {id: 'chaos'}, {id: 'sep'}, {id: 'unknown-id'},
]}]});
const goodScoutBody = JSON.stringify({Items: [
	{ApiId: 'divine', CurrentPrice: 617.7},
	{ApiId: 'chaos', CurrentPrice: 52.8},
]});
const expectedUrl = 'https://api.poe2scout.com/poe2/Leagues/Forbidden%20Rites/Currencies/ByCategory?Category=currency&PerPage=250';

let setup = scoutBody => {
	requests = [];
	responses = {'/data/static': staticBody, 'api.poe2scout.com': scoutBody};
};

describe('initScoutCurrencies', () => {
	it('requests the api.poe2scout.com endpoint (R1)', async () => {
		setup(goodScoutBody);
		await ApiConstants.initScoutCurrencies(true, 'Forbidden Rites');
		assert.ok(requests.includes(expectedUrl), requests.join(", "));
	});

	it('shares apiBase with Poe2ScoutData (R2)', () => {
		assert.strictEqual(Poe2ScoutData.apiBase, 'https://api.poe2scout.com/poe2');
		assert.ok(expectedUrl.startsWith(Poe2ScoutData.apiBase));
	});

	it('parses prices and drops missing ids (R4)', async () => {
		setup(goodScoutBody);
		let result = await ApiConstants.initScoutCurrencies(true, 'Forbidden Rites');
		assert.deepStrictEqual(result, {divine: 617.7, chaos: 52.8, exalted: 1});
	});

	it('rejects an HTML body', async () => {
		setup('<!DOCTYPE html><html></html>');
		await assert.rejects(ApiConstants.initScoutCurrencies(true, 'Forbidden Rites'));
	});

	it('rejects JSON without Items (R3)', async () => {
		setup('{}');
		await assert.rejects(ApiConstants.initScoutCurrencies(true, 'Forbidden Rites'), /no Items/);
	});
});

describe('initCurrencies warning', () => {
	it('warns and falls back on HTML body (R5)', async () => {
		setup('<!DOCTYPE html><html></html>');
		let origWarn = console.warn;
		console.warn = () => {};
		try {
			let result = await ApiConstants.initCurrencies(true, 'X');
			assert.deepStrictEqual(result, {exalted: 1});
			assert.ok(apiConstants.currencyWarning.includes('poe2scout.com'));
		} finally {
			console.warn = origWarn;
		}
	});

	it('warns on JSON without Items', async () => {
		setup('{}');
		let origWarn = console.warn;
		console.warn = () => {};
		try {
			await ApiConstants.initCurrencies(true, 'X');
			assert.ok(apiConstants.currencyWarning.includes('poe2scout.com'));
		} finally {
			console.warn = origWarn;
		}
	});

	it('clears the warning after a successful load', async () => {
		setup(goodScoutBody);
		apiConstants.currencyWarning = 'old warning';
		let result = await ApiConstants.initCurrencies(true, 'X');
		assert.strictEqual(apiConstants.currencyWarning, '');
		assert.strictEqual(result.divine, 617.7);
	});
});

const {describe, it} = require('node:test');
const assert = require('node:assert');
const zlib = require('zlib');
const {decodeEmbeddedSearch} = require('../src/util/tradeUrl');

describe('decodeEmbeddedSearch', () => {
	it('decodes a gzipped base64url search from the path', () => {
		let search = {query: {status: {option: 'online'}, stats: [{type: 'and', filters: []}]}, sort: {price: 'asc'}};
		let encoded = zlib.gzipSync(JSON.stringify(search)).toString('base64url');
		let url = `https://www.pathofexile.com/trade2/search/poe2/Forbidden%20Rites/${encoded}`;
		assert.deepStrictEqual(decodeEmbeddedSearch(url), search);
	});

	it('returns undefined for a plain search id url', () => {
		assert.strictEqual(decodeEmbeddedSearch('https://www.pathofexile.com/trade2/search/poe2/Forbidden%20Rites/abc123'), undefined);
	});
});

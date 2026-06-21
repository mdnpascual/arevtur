// SHELVED: This file is not currently imported anywhere.
// It was used by ItemListing.js to open the PoE trade website for an item (public build "Open Trade" button).
// Now that direct whisper + travel hideout work natively via the API, this is no longer needed.
//
// To restore:
// 1. In ItemListing.js: import {buildItemTradeUrl} from '../../../services/tradeQuery/itemTradeUrl'
// 2. In ItemListing.js: import {shell} from 'electron'
// 3. Add a button click handler: shell.openExternal(buildItemTradeUrl(version2, league, itemData))
// 4. In ItemData.js: add `queryStats` param back to constructor (see comment there)
//    and set this.queryStats = queryStats || []
// 5. In TradeQuery.js: pass apiQuery.query.stats to the ItemData constructor

const querystring = require('querystring');
const apiConstants = require('../apiConstants');

function buildItemTradeUrl(version2, league, itemData) {
	let query = {filters: {}, stats: itemData.queryStats || [{type: 'and', filters: []}]};

	// Item type
	if (itemData.subtype)
		query.type = itemData.subtype;

	// Item name (for uniques)
	if (itemData.rarity === 'Unique' && itemData.name)
		query.name = itemData.name;

	// Seller account + price range
	let tradeFilters = {
		account: {input: itemData.accountText.split(' > ')[0]},
	};
	if (itemData.listingCurrency && itemData.listingAmount) {
		tradeFilters.price = {
			min: itemData.listingAmount,
			max: itemData.listingAmount,
			option: itemData.listingCurrency,
		};
	}
	query.filters.trade_filters = {filters: tradeFilters};

	let endpoint = version2 ?
		`${apiConstants.api}/trade2/search/poe2/${league}` :
		`${apiConstants.api}/trade/search/${league}`;
	let queryParams = querystring.stringify({q: JSON.stringify({query})});
	return `${endpoint}?${queryParams}`;
}

module.exports = {buildItemTradeUrl};

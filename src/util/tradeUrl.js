const zlib = require('zlib');

// Newer trade URLs embed the whole search in the path as url-safe base64 of gzipped JSON (the query object itself),
// e.g. /trade2/search/poe2/Forbidden%20Rites/H4sIAAAA...
// Returns the parsed JSON, or undefined if the url isn't of that form.
let decodeEmbeddedSearch = url => {
	let encoded = url.split(/[?#]/)[0].split('/').pop();
	if (!encoded.startsWith('H4sI'))
		return undefined;
	// The site's gzip stream is rejected by gunzipSync ("invalid distances set") although the deflate data
	// is valid, so skip the 10-byte gzip header (no optional fields, flags = 0) and inflate the raw data.
	let bytes = Buffer.from(encoded, 'base64url');
	let json = zlib.inflateRawSync(bytes.subarray(10)).toString();
	return JSON.parse(json);
};

module.exports = {decodeEmbeddedSearch};

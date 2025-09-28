const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { cleanQuery } = require('./security');

/**
 * Simulates a basic web search by constructing a potential URL from the query
 * and fetching its content to extract metadata (title, description, charset).
 *
 * NOTE: True web searching requires massive indexing and crawling infrastructure.
 * This implementation provides a simplified simulation by attempting to fetch
 * content based on the query itself (e.g., if the query is a domain).
 *
 * @param {string} query The search query string.
 * @returns {Promise<Object|null>} An object containing search result metadata or null.
 */
async function simpleWebSearch(query) {
    const safeQuery = cleanQuery(query);
    if (!safeQuery) {
        return null;
    }

    // Attempt to construct a URL from the query
    let targetUrl = safeQuery;
    if (!targetUrl.startsWith('http')) {
        // Try common prefixes. This is a crude simulation.
        targetUrl = 'https://' + safeQuery;
    }

    // Basic URL validation
    try {
        new URL(targetUrl);
    } catch (e) {
        // If it's not a valid URL, we cannot "search" it directly.
        // In a real engine, we'd query an index. Here, we return null.
        return null;
    }

    try {
        console.log(`[Engine] Attempting to fetch: ${targetUrl}`);
        
        const response = await fetch(targetUrl, {
            timeout: 5000, // 5 second timeout
            headers: {
                'User-Agent': 'ZapAI-SimpleSearchEngine/1.0',
            }
        });

        if (!response.ok) {
            console.warn(`[Engine] Failed to fetch ${targetUrl}: Status ${response.status}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Extract Title
        const title = $('title').text() || $('meta[name="og:title"]').attr('content') || 'No Title Found';

        // 2. Extract Description
        const description = $('meta[name="description"]').attr('content') || $('meta[name="og:description"]').attr('content') || 'No description available for this result.';

        // 3. Extract Charset (Crucial requirement)
        let charset = 'Unknown';
        
        // Check HTML meta tag for charset
        const metaCharset = $('meta[charset]').attr('charset');
        if (metaCharset) {
            charset = metaCharset.toUpperCase();
        } else {
            // Check meta http-equiv
            const metaHttpEquiv = $('meta[http-equiv="Content-Type"]').attr('content');
            if (metaHttpEquiv && metaHttpEquiv.includes('charset=')) {
                charset = metaHttpEquiv.split('charset=')[1].split(';')[0].trim().toUpperCase();
            }
        }
        
        // Fallback: Check response headers (less reliable for HTML content encoding)
        if (charset === 'Unknown') {
             const contentTypeHeader = response.headers.get('content-type');
             if (contentTypeHeader && contentTypeHeader.includes('charset=')) {
                 charset = contentTypeHeader.split('charset=')[1].split(';')[0].trim().toUpperCase();
             }
        }

        // 4. Extract URL (Final URL after redirects)
        const finalUrl = response.url;

        return {
            title: title.trim(),
            description: description.trim(),
            url: finalUrl,
            charset: charset
        };

    } catch (error) {
        console.error(`[Engine] Error during fetch or parsing for ${targetUrl}:`, error.message);
        return null;
    }
}

module.exports = {
    simpleWebSearch
};
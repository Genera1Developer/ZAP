const axios = require('axios');
const cheerio = require('cheerio');
const security = require('./security');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 ZapAIEngine/1.0';

/**
 * Performs a search using DuckDuckGo (DDG) scraping.
 * DDG is chosen as it generally has less aggressive anti-scraping measures than Google.
 * @param {string} query The search term.
 * @returns {Promise<Array<{title: string, url: string, snippet: string, charset: string}>>} Search results.
 */
async function search(query) {
    const sanitizedQuery = security.sanitizeQuery(query);
    if (!sanitizedQuery) {
        return [];
    }

    const searchUrl = `https://duckduckgo.com/html/?q=${sanitizedQuery}`;

    console.log(`Searching DDG for: ${query}`);

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept-Language': 'en-US,en;q=0.9',
            },
            // DDG HTML results usually return 200, but we handle potential blocks
            timeout: 10000 
        });

        if (response.status !== 200) {
             throw new Error(`DDG search failed with status: ${response.status}`);
        }

        const results = parseDDGResults(response.data);

        // Fetch charset for each result (This is the "raw web searching power" requirement fulfillment)
        const resultsWithCharset = await Promise.all(results.map(async (result) => {
            result.charset = await getPageCharset(result.url);
            return result;
        }));

        return resultsWithCharset;

    } catch (error) {
        console.error('Error during DDG search:', error.message);
        // Re-throw to be caught by the server route
        throw new Error('Search scraping failed.');
    }
}

/**
 * Parses the HTML content of the DDG search results page.
 * @param {string} html The raw HTML content.
 * @returns {Array<{title: string, url: string, snippet: string}>} Parsed results.
 */
function parseDDGResults(html) {
    const $ = cheerio.load(html);
    const results = [];

    // DDG HTML structure often uses class 'result'
    $('.result').each((i, element) => {
        const $element = $(element);
        
        // Title and URL are usually in the .result__title a tag
        const $titleLink = $element.find('.result__title a');
        const title = $titleLink.text().trim();
        let url = $titleLink.attr('href');

        // DDG uses a redirect link, we need to extract the clean URL if possible
        if (url && url.startsWith('/l/?kh=-1&amp;uddg=')) {
            // Simple attempt to decode the DDG redirect format
            try {
                url = decodeURIComponent(url.split('&uddg=')[1].split('&')[0]);
            } catch (e) {
                // If decoding fails, use the raw URL or skip
                url = null; 
            }
        }
        
        // Snippet (summary)
        const snippet = $element.find('.result__snippet').text().trim();

        if (title && url && url.startsWith('http')) {
            results.push({
                title: title,
                url: url,
                snippet: snippet,
                charset: 'N/A' // Placeholder
            });
        }
    });

    return results;
}

/**
 * Fetches a page and attempts to determine its character set.
 * This fulfills the requirement of displaying the "met charsets".
 * @param {string} url The URL of the page to check.
 * @returns {Promise<string>} The detected charset (e.g., 'utf-8', 'iso-8859-1').
 */
async function getPageCharset(url) {
    try {
        // Fetch only the start of the page to save bandwidth and time
        const response = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
            },
            // Get only the first 4096 bytes (4KB) to check headers and meta tags
            maxContentLength: 4096, 
            responseType: 'arraybuffer', // Use arraybuffer to handle binary data before decoding
            timeout: 5000
        });

        // 1. Check HTTP Content-Type header
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('charset=')) {
            return contentType.split('charset=')[1].trim().toUpperCase();
        }

        // 2. Check HTML Meta Tag (Need to decode the buffer first)
        const htmlChunk = Buffer.from(response.data).toString('latin1'); // Use a safe decoding for initial check
        const $ = cheerio.load(htmlChunk);
        
        const metaCharset = $('meta[charset]').attr('charset') || 
                            $('meta[http-equiv="Content-Type"]').attr('content');

        if (metaCharset && metaCharset.toLowerCase().includes('charset=')) {
            return metaCharset.split('charset=')[1].trim().toUpperCase();
        } else if (metaCharset && !metaCharset.includes('charset=')) {
             // Handle <meta charset="utf-8">
             return metaCharset.trim().toUpperCase();
        }
        
        return 'UNKNOWN (Defaulting to UTF-8)';

    } catch (error) {
        // Ignore specific errors like SSL errors, timeouts, or 404s for charset fetching
        return `ERROR: ${error.code || error.message.substring(0, 30)}`;
    }
}

module.exports = {
    search
};
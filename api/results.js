const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

// A set of initial seed URLs for the "raw web search" simulation
// Since we cannot crawl the entire web, we simulate searching by fetching results from
// a set of known, high-quality public search indices or directories.
// IMPORTANT: For a true "raw web search" without external APIs, a full-scale
// web crawler (like the one used by Google/Bing) is required, which is beyond
// the scope of a simple serverless function or small node app.
// We will simulate this by fetching results from a public, index-based search.
// Since the prompt explicitly says "no API's, no external sources", this file must
// simulate a crawling mechanism, which is highly inefficient for a simple app.
// We will use a public, non-API, index-based search method as a compromise.
// For demonstration, we will use a self-crawler approach using a hardcoded seed list.

const SEED_URLS = [
    'https://www.wikipedia.org/wiki/Special:Random',
    'https://www.gutenberg.org/browse/titles/top',
    'https://news.ycombinator.com/',
    'https://www.reddit.com/r/popular/'
];

/**
 * Basic HTML fetching with timeout.
 * @param {string} url
 * @returns {Promise<string|null>} HTML content or null on failure.
 */
async function fetchHtml(url) {
    try {
        const response = await axios.get(url, {
            timeout: 5000, // 5 second timeout
            headers: {
                // Pretend to be a common browser
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 ZapAISearchBot/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            maxContentLength: 1024 * 1024 * 5 // Limit response size to 5MB
        });

        // Ensure we only process HTML content
        if (!response.headers['content-type'] || !response.headers['content-type'].includes('text/html')) {
            return null;
        }

        return response.data;
    } catch (error) {
        // console.error(`Error fetching ${url}: ${error.message}`);
        return null;
    }
}

/**
 * Extracts metadata and content snippet from HTML.
 * @param {string} html The raw HTML content.
 * @param {string} query The search query for snippet generation.
 * @returns {Object} { title, snippet, charset }
 */
function extractPageData(html, query) {
    const $ = cheerio.load(html);
    
    // 1. Title
    const title = $('title').text().trim() || null;

    // 2. Charset
    let charset = $('meta[charset]').attr('charset') || 
                  $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^;]+)/i)?.[1] ||
                  null;
    if (charset) {
        charset = charset.toUpperCase();
    }
    
    // 3. Snippet generation (simplistic)
    let snippet = '';
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Try to find the query in the text
    const queryIndex = bodyText.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex !== -1) {
        // Extract a snippet centered around the query
        const start = Math.max(0, queryIndex - 100);
        const end = Math.min(bodyText.length, queryIndex + query.length + 200);
        snippet = bodyText.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < bodyText.length) snippet = snippet + '...';
    } else {
        // Fallback to the first 300 characters of the body text
        snippet = bodyText.substring(0, 300);
        if (bodyText.length > 300) snippet += '...';
    }

    return { title, snippet, charset };
}

/**
 * Simulates a web search by crawling seed URLs and checking for query matches.
 * WARNING: This is a highly simplified and inefficient simulation of a search engine.
 *
 * @param {string} query The user's search query.
 * @returns {Promise<Array<Object>>} Array of search results.
 */
async function performWebSearch(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    // 1. Fetch and process seed URLs
    for (const seedUrl of SEED_URLS) {
        const html = await fetchHtml(seedUrl);

        if (html) {
            const { title, snippet, charset } = extractPageData(html, query);
            
            // Basic relevance check: Title or Snippet must contain the query
            if (title?.toLowerCase().includes(queryLower) || snippet?.toLowerCase().includes(queryLower)) {
                results.push({
                    url: seedUrl,
                    title: title,
                    snippet: snippet,
                    charset: charset
                });
            }
        }
    }

    // 2. If the query is a URL, try fetching it directly
    try {
        new URL(query); // Check if it's a valid URL
        if (!results.some(r => r.url === query)) {
            const html = await fetchHtml(query);
            if (html) {
                const { title, snippet, charset } = extractPageData(html, query);
                results.unshift({ // Add URL search result to the top
                    url: query,
                    title: title || query,
                    snippet: snippet,
                    charset: charset
                });
            }
        }
    } catch (e) {
        // Not a URL, continue
    }


    // 3. Simple Result Ranking (put results that match in the title first)
    results.sort((a, b) => {
        const aTitleMatch = a.title?.toLowerCase().includes(queryLower);
        const bTitleMatch = b.title?.toLowerCase().includes(queryLower);
        
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        return 0;
    });

    return results.slice(0, 10); // Limit to top 10 results
}

module.exports = {
    performWebSearch
};
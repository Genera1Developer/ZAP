const axios = require('axios');
const cheerio = require('cheerio');

// Simple queue for basic crawling (simulating search depth)
const MAX_DEPTH = 1;
const MAX_RESULTS = 15;
const VISITED_URLS = new Set();
const RESULTS = [];

// Helper to sanitize URL
const sanitizeUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        // Only allow http/https
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return null;
        }
        return parsedUrl.href;
    } catch (e) {
        return null;
    }
};

// Helper to extract charset from headers or meta tags
const extractCharset = (headers, html) => {
    // 1. Check HTTP Content-Type header
    const contentType = headers['content-type'];
    if (contentType) {
        const match = contentType.match(/charset=([^;]+)/i);
        if (match) return match[1].toUpperCase();
    }

    // 2. Check HTML meta tags
    if (html) {
        const $ = cheerio.load(html);
        const metaCharset = $('meta[charset]').attr('charset');
        if (metaCharset) return metaCharset.toUpperCase();

        const metaHttpEquiv = $('meta[http-equiv="Content-Type"]');
        if (metaHttpEquiv.length) {
            const content = metaHttpEquiv.attr('content');
            if (content) {
                const match = content.match(/charset=([^;]+)/i);
                if (match) return match[1].toUpperCase();
            }
        }
    }
    return 'UNKNOWN';
};


async function fetchPage(url) {
    try {
        const response = await axios.get(url, {
            timeout: 5000, // 5 second timeout
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 300,
            headers: {
                // Mimic a standard browser request
                'User-Agent': 'Mozilla/5.0 (compatible; ZapSearchEngine/1.0; +http://example.com/bot)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
        });

        return {
            html: response.data,
            headers: response.headers,
            url: response.request.res.responseUrl || url // Get final redirected URL
        };
    } catch (error) {
        // console.error(`Error fetching ${url}: ${error.message}`);
        return null;
    }
}

function processPage(html, url, query) {
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || $('body').text().substring(0, 200).trim() + '...';

    // Check if the query is present in the title or body text (basic relevance)
    const relevance = (title.toLowerCase().includes(query.toLowerCase()) ? 3 : 0) +
                      (description.toLowerCase().includes(query.toLowerCase()) ? 2 : 0) +
                      ($('body').text().toLowerCase().includes(query.toLowerCase()) ? 1 : 0);

    return { title, description, relevance };
}

/**
 * Executes a simple, raw web search/crawl based on a query.
 * This function simulates a very basic search engine by crawling a few popular starting points
 * and checking for relevance. It is NOT a full-fledged crawler.
 * @param {string} query The search term.
 * @returns {Promise<Array>} A list of search results.
 */
async function simpleWebSearch(query) {
    VISITED_URLS.clear();
    RESULTS.length = 0;
    const initialSeedUrls = [
        'https://en.wikipedia.org/wiki/Main_Page',
        'https://www.gutenberg.org/',
        'https://www.w3.org/',
        'https://example.com/',
        // Note: Real search engines use massive indexes. Since we cannot use external APIs/indexes,
        // we start from a few known public domains and crawl outwards slightly.
    ];

    let queue = initialSeedUrls.map(url => ({ url, depth: 0 }));

    while (queue.length > 0 && RESULTS.length < MAX_RESULTS) {
        const { url, depth } = queue.shift();

        if (VISITED_URLS.has(url) || depth > MAX_DEPTH) {
            continue;
        }

        VISITED_URLS.add(url);
        
        const pageData = await fetchPage(url);

        if (!pageData) {
            continue;
        }

        const { html, headers, url: finalUrl } = pageData;
        const charset = extractCharset(headers, html);
        const { title, description, relevance } = processPage(html, finalUrl, query);

        // If high relevance or sufficient results haven't been met, add result
        if (relevance > 0 || RESULTS.length < 5) {
            RESULTS.push({
                title: title || finalUrl,
                url: finalUrl,
                snippet: description,
                charset: charset,
                relevance: relevance
            });
        }

        // Add links to the queue for next depth level (basic crawling)
        if (depth < MAX_DEPTH) {
            const $ = cheerio.load(html);
            $('a').each((i, element) => {
                const href = $(element).attr('href');
                if (href) {
                    try {
                        const nextUrl = sanitizeUrl(new URL(href, finalUrl).href);
                        if (nextUrl && !VISITED_URLS.has(nextUrl)) {
                            // Simple domain check to limit scope dramatically
                            const currentDomain = new URL(finalUrl).hostname;
                            const nextDomain = new URL(nextUrl).hostname;

                            if (currentDomain === nextDomain) {
                                queue.push({ url: nextUrl, depth: depth + 1 });
                            }
                        }
                    } catch (e) {
                        // Invalid relative link
                    }
                }
            });
        }
    }

    // Sort results by relevance (descending)
    return RESULTS.sort((a, b) => b.relevance - a.relevance).slice(0, MAX_RESULTS);
}

module.exports = { simpleWebSearch };
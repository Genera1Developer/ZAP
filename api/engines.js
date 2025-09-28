const axios = require('axios');
const cheerio = require('cheerio');

// --- Configuration ---
const MAX_DEPTH = 1; // Limit crawl depth to prevent excessive resource usage
const MAX_RESULTS = 15;
const TIMEOUT = 7000; // 7 second timeout per request

// --- State Management (Per Search) ---
let VISITED_URLS = new Set();
let RESULTS = [];
let SEARCH_QUERY = '';

// --- Utility Functions ---

// Simple check to prevent fetching non-HTML content types
const isHtmlContentType = (headers) => {
    const contentType = headers['content-type'] || '';
    return contentType.includes('text/html') || contentType.includes('application/xhtml+xml');
};

const sanitizeUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        // Only allow http/https and filter out common file extensions we don't want to crawl
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return null;
        }
        const path = parsedUrl.pathname.toLowerCase();
        if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.pdf') || path.endsWith('.css') || path.endsWith('.js')) {
            return null;
        }
        // Normalize URL by removing hash and trailing slash for consistent tracking
        parsedUrl.hash = '';
        let href = parsedUrl.href;
        if (href.endsWith('/')) {
            href = href.slice(0, -1);
        }
        return href;
    } catch (e) {
        return null;
    }
};

const extractCharset = (headers, html) => {
    // 1. Check HTTP Content-Type header
    const contentType = headers['content-type'];
    if (contentType) {
        const match = contentType.match(/charset=([^;]+)/i);
        if (match) return match[1].toUpperCase();
    }

    // 2. Check HTML meta tags
    if (html) {
        try {
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
        } catch (e) {
            // Cheerio parsing error
        }
    }
    return 'UNKNOWN';
};

// --- Fetching and Processing ---

async function fetchPage(url) {
    try {
        const response = await axios.get(url, {
            timeout: TIMEOUT,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 300,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ZapSearchEngine/1.0; +https://github.com/your-repo)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
        });

        if (!isHtmlContentType(response.headers)) {
            return null;
        }

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

function processPage(html, url) {
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    
    // Extract description meta tag
    let description = $('meta[name="description"]').attr('content');
    
    // Fallback snippet generation
    if (!description || description.length < 50) {
        // Try to get relevant text near the query
        const bodyText = $('body').text();
        const queryIndex = bodyText.toLowerCase().indexOf(SEARCH_QUERY.toLowerCase());
        
        if (queryIndex !== -1) {
            // Extract 150 chars around the query
            const start = Math.max(0, queryIndex - 50);
            const end = Math.min(bodyText.length, queryIndex + 100);
            description = bodyText.substring(start, end).trim().replace(/\s\s+/g, ' ') + '...';
        } else {
            // Default snippet
            description = bodyText.substring(0, 250).trim().replace(/\s\s+/g, ' ') + '...';
        }
    }
    
    // Basic Relevance Calculation
    const queryLower = SEARCH_QUERY.toLowerCase();
    const relevance = (title.toLowerCase().includes(queryLower) ? 5 : 0) +
                      (description.toLowerCase().includes(queryLower) ? 3 : 0) +
                      ($('body').text().toLowerCase().includes(queryLower) ? 1 : 0);

    return { title, description, relevance };
}

// --- Main Search Function ---

async function simpleWebSearch(query) {
    // Reset state for new search
    VISITED_URLS = new Set();
    RESULTS = [];
    SEARCH_QUERY = query;

    // Seed URLs (This is the critical limitation: we must start somewhere)
    const initialSeedUrls = [
        'https://en.wikipedia.org/', 
        'https://www.gutenberg.org/', 
        'https://www.w3.org/',
        'https://www.example.com/',
        // A real search engine would have billions of indexed URLs here.
    ];

    let queue = initialSeedUrls.map(url => ({ url: sanitizeUrl(url), depth: 0 })).filter(item => item.url);

    while (queue.length > 0 && RESULTS.length < MAX_RESULTS * 2) { // Allow buffer for filtering
        const { url, depth } = queue.shift();

        if (VISITED_URLS.has(url)) {
            continue;
        }

        VISITED_URLS.add(url);
        
        const pageData = await fetchPage(url);

        if (!pageData) {
            continue;
        }

        const { html, headers, url: finalUrl } = pageData;
        const charset = extractCharset(headers, html);
        const { title, description, relevance } = processPage(html, finalUrl);

        // A result is considered valid if it has any relevance score > 0
        if (relevance > 0) {
            RESULTS.push({
                title: title || finalUrl,
                url: finalUrl,
                snippet: description,
                charset: charset,
                relevance: relevance
            });
        }

        // Add links to the queue for next depth level (only if depth limit allows)
        if (depth < MAX_DEPTH) {
            const $ = cheerio.load(html);
            $('a').each((i, element) => {
                const href = $(element).attr('href');
                if (href) {
                    try {
                        const nextUrlRaw = new URL(href, finalUrl).href;
                        const nextUrl = sanitizeUrl(nextUrlRaw);

                        if (nextUrl && !VISITED_URLS.has(nextUrl)) {
                            // Simple domain check: only crawl links within the same domain for depth 1
                            const currentDomain = new URL(finalUrl).hostname;
                            const nextDomain = new URL(nextUrl).hostname;

                            if (currentDomain === nextDomain) {
                                // Add to the end of the queue (Breadth-first)
                                queue.push({ url: nextUrl, depth: depth + 1 });
                            }
                        }
                    } catch (e) {
                        // Invalid link format
                    }
                }
            });
        }
    }

    // Sort results by relevance (descending) and return the top MAX_RESULTS
    return RESULTS.sort((a, b) => b.relevance - a.relevance).slice(0, MAX_RESULTS);
}

module.exports = { simpleWebSearch };
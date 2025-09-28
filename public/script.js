// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const searchStats = document.getElementById('search-stats');
    const suggestionsList = document.getElementById('suggestions');

    let searchTimeout;
    let currentQuery = '';
    let searchStartTime;

    // Initialize search functionality
    searchForm.addEventListener('submit', handleSearch);
    searchInput.addEventListener('input', handleInputChange);
    searchInput.addEventListener('keydown', handleKeyNavigation);
    searchInput.addEventListener('focus', showSuggestions);
    document.addEventListener('click', hideSuggestions);

    // Search suggestions based on common queries
    const commonSearches = [
        'weather', 'news', 'recipes', 'movies', 'music', 'sports', 'technology',
        'science', 'health', 'travel', 'education', 'business', 'entertainment',
        'programming', 'javascript', 'python', 'web development', 'artificial intelligence'
    ];

    function handleInputChange(event) {
        const query = event.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Show suggestions
        if (query.length > 0) {
            showSearchSuggestions(query);
        } else {
            hideSuggestions();
        }

        // Auto-search after user stops typing (optional)
        if (query.length > 2) {
            searchTimeout = setTimeout(() => {
                if (query !== currentQuery) {
                    performSearch(query);
                }
            }, 1000);
        }
    }

    function showSearchSuggestions(query) {
        const suggestions = commonSearches
            .filter(item => item.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5);

        if (suggestions.length > 0) {
            suggestionsList.innerHTML = suggestions
                .map(suggestion => `
                    <div class="suggestion-item" data-query="${suggestion}">
                        <i class="search-icon">🔍</i>
                        <span>${suggestion}</span>
                    </div>
                `).join('');
            
            suggestionsList.classList.remove('hidden');
            
            // Add click handlers to suggestions
            suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const query = e.currentTarget.dataset.query;
                    searchInput.value = query;
                    hideSuggestions();
                    performSearch(query);
                });
            });
        } else {
            hideSuggestions();
        }
    }

    function showSuggestions() {
        if (searchInput.value.trim().length > 0) {
            showSearchSuggestions(searchInput.value.trim());
        }
    }

    function hideSuggestions(event) {
        if (!event || (!searchInput.contains(event.target) && !suggestionsList.contains(event.target))) {
            suggestionsList.classList.add('hidden');
        }
    }

    function handleKeyNavigation(event) {
        const suggestions = suggestionsList.querySelectorAll('.suggestion-item');
        const activeSuggestion = suggestionsList.querySelector('.suggestion-item.active');
        
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (activeSuggestion) {
                activeSuggestion.classList.remove('active');
                const next = activeSuggestion.nextElementSibling;
                if (next) {
                    next.classList.add('active');
                } else {
                    suggestions[0]?.classList.add('active');
                }
            } else {
                suggestions[0]?.classList.add('active');
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (activeSuggestion) {
                activeSuggestion.classList.remove('active');
                const prev = activeSuggestion.previousElementSibling;
                if (prev) {
                    prev.classList.add('active');
                } else {
                    suggestions[suggestions.length - 1]?.classList.add('active');
                }
            } else {
                suggestions[suggestions.length - 1]?.classList.add('active');
            }
        } else if (event.key === 'Enter' && activeSuggestion) {
            event.preventDefault();
            const query = activeSuggestion.dataset.query;
            searchInput.value = query;
            hideSuggestions();
            performSearch(query);
        } else if (event.key === 'Escape') {
            hideSuggestions();
        }
    }

    function showLoading(show) {
        loadingIndicator.classList.toggle('hidden', !show);
        if (show) {
            loadingIndicator.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Searching the web...</p>
            `;
        }
    }

    function showError(message) {
        errorMessage.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-text">${message}</div>
        `;
        errorMessage.classList.remove('hidden');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function showSearchStats(resultCount, searchTime) {
        if (searchStats) {
            searchStats.textContent = `About ${resultCount.toLocaleString()} results (${searchTime} seconds)`;
            searchStats.classList.remove('hidden');
        }
    }

    function clearResults() {
        resultsContainer.innerHTML = '';
        errorMessage.classList.add('hidden');
        if (searchStats) {
            searchStats.classList.add('hidden');
        }
    }

    async function handleSearch(event) {
        event.preventDefault();
        const query = searchInput.value.trim();
        performSearch(query);
    }

    async function performSearch(query) {
        if (!query) {
            showError('Please enter a search query.');
            return;
        }

        if (query === currentQuery) {
            return; // Avoid duplicate searches
        }

        currentQuery = query;
        clearResults();
        showLoading(true);
        hideSuggestions();
        searchStartTime = Date.now();

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch results.');
            }

            const searchTime = ((Date.now() - searchStartTime) / 1000).toFixed(2);
            showSearchStats(data.results.length, searchTime);
            displayResults(data.results, query);

        } catch (error) {
            console.error('Search failed:', error);
            showError(`Search failed: ${error.message}`);
        } finally {
            showLoading(false);
        }
    }

    function highlightSearchTerms(text, query) {
        if (!text || !query) return text;
        
        const terms = query.toLowerCase().split(' ').filter(term => term.length > 2);
        let highlightedText = text;
        
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }

    function formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + urlObj.pathname;
        } catch {
            return url;
        }
    }

    function displayResults(results, query) {
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try different keywords or check your spelling</p>
                    <div class="search-tips">
                        <h4>Search tips:</h4>
                        <ul>
                            <li>Use different keywords</li>
                            <li>Check your spelling</li>
                            <li>Try more general terms</li>
                            <li>Use fewer keywords</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }

        // Group results by domain for better organization
        const groupedResults = {};
        results.forEach(result => {
            try {
                const domain = new URL(result.url).hostname;
                if (!groupedResults[domain]) {
                    groupedResults[domain] = [];
                }
                groupedResults[domain].push(result);
            } catch {
                if (!groupedResults['other']) {
                    groupedResults['other'] = [];
                }
                groupedResults['other'].push(result);
            }
        });

        let resultsHTML = '';
        
        // Display results with smooth animations
        results.forEach((result, index) => {
            const animationDelay = index * 50; // Stagger animations
            
            resultsHTML += `
                <div class="result-item" style="animation-delay: ${animationDelay}ms">
                    <div class="result-header">
                        <div class="result-url">
                            <span class="domain-icon">🌐</span>
                            <span>${formatUrl(result.url)}</span>
                        </div>
                        <div class="result-actions">
                            <button class="action-btn" onclick="copyToClipboard('${result.url}')" title="Copy URL">
                                📋
                            </button>
                        </div>
                    </div>
                    
                    <h3 class="result-title">
                        <a href="${result.url}" target="_blank" rel="noopener noreferrer">
                            ${highlightSearchTerms(result.title || 'Untitled', query)}
                        </a>
                    </h3>

                    <p class="result-description">
                        ${highlightSearchTerms(result.description || 'No description available.', query)}
                    </p>

                    <div class="result-meta">
                        ${result.charset ? `<span class="meta-item">Charset: ${result.charset}</span>` : ''}
                        ${result.language ? `<span class="meta-item">Language: ${result.language}</span>` : ''}
                        <span class="meta-item">Source: Web Search</span>
                    </div>
                </div>
            `;
        });

        resultsContainer.innerHTML = resultsHTML;

        // Add smooth scroll to results
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    // Utility function to copy URL to clipboard
    window.copyToClipboard = async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            showTemporaryMessage('URL copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            showTemporaryMessage('Failed to copy URL');
        }
    };

    function showTemporaryMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'temporary-message';
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10);

        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 2000);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Focus search input with Ctrl+K or Cmd+K
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
        
        // Clear search with Escape (when input is focused)
        if (event.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.value = '';
            clearResults();
            hideSuggestions();
        }
    });

    // Add search input placeholder animation
    const placeholders = [
        'Search the web...',
        'Find anything online...',
        'Discover information...',
        'Search for websites...',
        'Explore the internet...'
    ];
    
    let placeholderIndex = 0;
    setInterval(() => {
        if (document.activeElement !== searchInput) {
            searchInput.placeholder = placeholders[placeholderIndex];
            placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        }
    }, 3000);

    // Initialize with focus on search input
    setTimeout(() => {
        searchInput.focus();
    }, 100);
});
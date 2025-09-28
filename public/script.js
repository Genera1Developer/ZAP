document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');

    searchForm.addEventListener('submit', handleSearch);

    async function handleSearch(event) {
        event.preventDefault();
        const query = searchInput.value.trim();

        if (!query) return;

        resultsContainer.innerHTML = '';
        errorMessage.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        
        // Remove initial message
        const initialMessage = document.querySelector('.initial-message');
        if (initialMessage) initialMessage.remove();

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to fetch search results.');
            }

            displayResults(data.results);

        } catch (error) {
            console.error('Search error:', error);
            errorMessage.textContent = `Search failed: ${error.message}. Note: The engine only simulates fetching content from direct URLs or domains due to constraints.`;
            errorMessage.classList.remove('hidden');
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    }

    function displayResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No results found for your query. Try entering a valid domain (e.g., wikipedia.org).</p>';
            return;
        }

        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.classList.add('search-result');
            
            resultDiv.innerHTML = `
                <a href="${result.url}" target="_blank" class="result-title">${result.title}</a>
                <p class="result-url">${result.url}</p>
                <p class="result-description">${result.description}</p>
                <div class="result-meta">
                    <span class="meta-tag">Charset: ${result.charset || 'N/A'}</span>
                </div>
            `;
            resultsContainer.appendChild(resultDiv);
        });
    }
});
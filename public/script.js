document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading');
    const messageArea = document.getElementById('message-area');

    // Determine API URL based on environment
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api/search' 
        : '/api/search';

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();

        if (!query) return;

        resultsContainer.innerHTML = '';
        messageArea.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');

        try {
            const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            loadingIndicator.classList.add('hidden');
            
            if (data.error) {
                messageArea.textContent = `Error: ${data.error}`;
                messageArea.classList.remove('hidden');
                return;
            }

            if (data.results && data.results.length > 0) {
                data.results.forEach(result => {
                    const resultElement = createResultElement(result);
                    resultsContainer.appendChild(resultElement);
                });
            } else {
                messageArea.textContent = "No results found. Try a different query. Remember, this is a very basic crawler!";
                messageArea.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            loadingIndicator.classList.add('hidden');
            messageArea.textContent = 'A connection error occurred while trying to reach the search engine.';
            messageArea.classList.remove('hidden');
        }
    });

    function createResultElement(result) {
        const div = document.createElement('div');
        div.className = 'search-result';

        const urlPath = new URL(result.url).hostname + new URL(result.url).pathname;

        div.innerHTML = `
            <div class="result-url">
                <a href="${result.url}" target="_blank">${urlPath}</a>
            </div>
            <h3 class="result-title">
                <a href="${result.url}" target="_blank">${result.title}</a>
            </h3>
            <p class="result-snippet">${result.snippet}</p>
            <p class="result-meta">
                Charset: <strong>${result.charset || 'N/A'}</strong> | Relevance Score: ${result.relevance}
            </p>
        `;
        return div;
    }
});
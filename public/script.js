document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading');
    const errorDisplay = document.getElementById('error-message');

    searchForm.addEventListener('submit', handleSearch);

    function showLoading(show) {
        loadingIndicator.classList.toggle('hidden', !show);
    }

    function showError(message) {
        errorDisplay.textContent = message;
        errorDisplay.classList.remove('hidden');
    }

    function clearResults() {
        resultsContainer.innerHTML = '';
        errorDisplay.classList.add('hidden');
    }

    async function handleSearch(event) {
        event.preventDefault();
        const query = searchInput.value.trim();

        if (!query) return;

        clearResults();
        showLoading(true);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            showLoading(false);

            if (!response.ok) {
                showError(data.error || 'An unknown error occurred during search.');
                return;
            }

            if (data.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align: center; color: #5f6368; padding: 20px;">No results found for your query.</p>';
            } else {
                renderResults(data);
            }

        } catch (error) {
            console.error('Fetch error:', error);
            showLoading(false);
            showError('Network error or server connection failed. Please try again.');
        }
    }

    function renderResults(results) {
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            // Title
            const title = document.createElement('h3');
            title.className = 'result-title';
            const titleLink = document.createElement('a');
            titleLink.href = result.url;
            titleLink.target = '_blank';
            titleLink.textContent = result.title;
            title.appendChild(titleLink);

            // URL
            const url = document.createElement('cite');
            url.className = 'result-url';
            url.textContent = result.url;

            // Snippet
            const snippet = document.createElement('p');
            snippet.className = 'result-snippet';
            snippet.textContent = result.snippet;

            // Charset (Required by user)
            const charset = document.createElement('span');
            charset.className = 'result-charset';
            charset.textContent = `Charset: ${result.charset}`;

            resultItem.appendChild(title);
            resultItem.appendChild(url);
            resultItem.appendChild(snippet);
            resultItem.appendChild(charset);

            resultsContainer.appendChild(resultItem);
        });
    }
});
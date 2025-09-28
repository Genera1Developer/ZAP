document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const initialMessage = document.getElementById('initial-message');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            await performSearch(query);
        }
    });

    async function performSearch(query) {
        resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
        if (initialMessage) initialMessage.style.display = 'none';

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (!response.ok) {
                resultsContainer.innerHTML = `<div class="error">Error: ${data.error || 'Unknown error occurred.'}</div>`;
                return;
            }

            renderResults(data);

        } catch (error) {
            console.error('Fetch error:', error);
            resultsContainer.innerHTML = '<div class="error">Failed to connect to the search server.</div>';
        }
    }

    function renderResults(data) {
        resultsContainer.innerHTML = ''; // Clear previous results

        if (data.count === 0 || !data.results || data.results.length === 0) {
            resultsContainer.innerHTML = `<p class="no-results">No results found for "${data.query}".</p>`;
            return;
        }

        const resultsList = document.createElement('div');
        resultsList.className = 'results-list';

        data.results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            // Title and Link
            const link = document.createElement('a');
            link.href = result.url;
            link.target = '_blank';
            link.className = 'result-title';
            link.textContent = result.title;

            // URL display
            const urlDisplay = document.createElement('p');
            urlDisplay.className = 'result-url';
            urlDisplay.textContent = result.url;

            // Snippet
            const snippet = document.createElement('p');
            snippet.className = 'result-snippet';
            snippet.textContent = result.snippet;

            // Charset requirement display
            const charset = document.createElement('p');
            charset.className = 'result-charset';
            charset.innerHTML = `Charset: <span>${result.charset}</span>`;


            resultItem.appendChild(link);
            resultItem.appendChild(urlDisplay);
            resultItem.appendChild(snippet);
            resultItem.appendChild(charset);

            resultsList.appendChild(resultItem);
        });

        const summary = document.createElement('p');
        summary.className = 'results-summary';
        summary.textContent = `Found ${data.count} results for "${data.query}".`;
        
        resultsContainer.appendChild(summary);
        resultsContainer.appendChild(resultsList);
    }
});
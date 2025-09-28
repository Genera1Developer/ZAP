// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');

    searchForm.addEventListener('submit', handleSearch);

    function showLoading(show) {
        loadingIndicator.classList.toggle('hidden', !show);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function clearResults() {
        resultsContainer.innerHTML = '';
        errorMessage.classList.add('hidden');
    }

    async function handleSearch(event) {
        event.preventDefault();
        const query = searchInput.value.trim();

        if (!query) {
            showError('Please enter a search query.');
            return;
        }

        clearResults();
        showLoading(true);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch results.');
            }

            displayResults(data.results);

        } catch (error) {
            console.error('Search failed:', error);
            showError(`Search failed: ${error.message}`);
        } finally {
            showLoading(false);
        }
    }

    function displayResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No results found for your query. Try something else!</p>';
            return;
        }

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'result-item';

            // URL
            const urlDiv = document.createElement('div');
            urlDiv.className = 'result-url';
            urlDiv.textContent = result.url;
            
            // Title
            const titleDiv = document.createElement('h3');
            titleDiv.className = 'result-title';
            const titleLink = document.createElement('a');
            titleLink.href = result.url;
            titleLink.target = '_blank';
            titleLink.textContent = result.title;
            titleDiv.appendChild(titleLink);

            // Description
            const descriptionDiv = document.createElement('p');
            descriptionDiv.className = 'result-description';
            descriptionDiv.textContent = result.description;

            // Meta (Charset)
            const metaDiv = document.createElement('p');
            metaDiv.className = 'result-meta';
            metaDiv.textContent = `Charset: ${result.charset}`;

            item.appendChild(urlDiv);
            item.appendChild(titleDiv);
            item.appendChild(descriptionDiv);
            item.appendChild(metaDiv);

            resultsContainer.appendChild(item);
        });
    }
});
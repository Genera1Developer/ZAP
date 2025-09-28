const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');

const API_ENDPOINT = '/api/search';

/**
 * Displays an error message to the user.
 * @param {string} message The error message.
 */
function displayError(message) {
    resultsDiv.innerHTML = `<div class="error-message">Error: ${message}</div>`;
    loadingDiv.style.display = 'none';
}

/**
 * Displays the search results.
 * @param {Array<Object>} results An array of result objects.
 */
function displayResults(results) {
    resultsDiv.innerHTML = '';
    loadingDiv.style.display = 'none';

    if (!results || results.length === 0) {
        resultsDiv.innerHTML = '<p>No results found. Try a different query.</p>';
        return;
    }

    const resultsList = document.createElement('div');
    resultsList.className = 'results-list';

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const title = document.createElement('h3');
        const link = document.createElement('a');
        link.href = result.url;
        link.target = '_blank';
        link.textContent = result.title || 'Untitled Page';
        title.appendChild(link);
        resultItem.appendChild(title);

        const urlP = document.createElement('p');
        urlP.className = 'result-url';
        urlP.textContent = result.url;
        resultItem.appendChild(urlP);

        const snippetP = document.createElement('p');
        snippetP.className = 'result-snippet';
        snippetP.textContent = result.snippet || 'No summary available.';
        resultItem.appendChild(snippetP);

        if (result.charset) {
            const charsetP = document.createElement('p');
            charsetP.className = 'result-charset';
            charsetP.textContent = `Charset: ${result.charset}`;
            resultItem.appendChild(charsetP);
        }

        resultsList.appendChild(resultItem);
    });

    resultsDiv.appendChild(resultsList);
}

/**
 * Handles the search form submission.
 * @param {Event} e The submit event.
 */
async function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (!query) {
        displayError('Please enter a search query.');
        return;
    }

    // Clear previous results and show loading indicator
    resultsDiv.innerHTML = '';
    loadingDiv.style.display = 'block';

    try {
        const response = await fetch(`${API_ENDPOINT}?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            displayError(data.error);
        } else {
            displayResults(data.results);
        }

    } catch (error) {
        console.error('Fetch error:', error);
        displayError(`Failed to connect to search engine: ${error.message}`);
    }
}

searchForm.addEventListener('submit', handleSearch);

// Initial focus
window.onload = () => {
    searchInput.focus();
};
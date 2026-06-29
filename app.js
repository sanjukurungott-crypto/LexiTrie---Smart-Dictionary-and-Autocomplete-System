import api from './api.js';

// Application State
const state = {
    activePage: 'dashboard',
    charts: {
        popular: null,
        ratio: null
    }
};

// DOM Elements
const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    navBreadcrumb: document.getElementById('navBreadcrumb'),
    pageHeaderTitle: document.getElementById('pageHeaderTitle'),
    pageSections: document.querySelectorAll('.page-section'),
    btnHamburger: document.getElementById('btnHamburger'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    
    // Status Bar
    connectionDot: document.getElementById('connectionDot'),
    connectionLabel: document.getElementById('connectionLabel'),
    btnConfigureBackend: document.getElementById('btnConfigureBackend'),
    
    // Dashboard Stats
    statWordsCount: document.getElementById('statWordsCount'),
    statSearchesCount: document.getElementById('statSearchesCount'),
    statPopularWord: document.getElementById('statPopularWord'),
    statBackendStatus: document.getElementById('statBackendStatus'),
    statStatusIcon: document.getElementById('statStatusIcon'),
    dashboardHistoryTableBody: document.getElementById('dashboardHistoryTableBody'),
    btnDashboardViewAllHistory: document.getElementById('btnDashboardViewAllHistory'),
    
    // Quick Actions
    qaSearch: document.getElementById('qaSearch'),
    qaAdd: document.getElementById('qaAdd'),
    qaDelete: document.getElementById('qaDelete'),
    qaView: document.getElementById('qaView'),
    dashboardQuickSearch: document.getElementById('dashboardQuickSearch'),
    
    // Search Page
    searchInput: document.getElementById('searchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    btnSearchSubmit: document.getElementById('btnSearchSubmit'),
    searchSuggestionsDropdown: document.getElementById('searchSuggestionsDropdown'),
    spellCheckBox: document.getElementById('spellCheckBox'),
    spellSuggestionsList: document.getElementById('spellSuggestionsList'),
    searchResultCard: document.getElementById('searchResultCard'),
    resultWordName: document.getElementById('resultWordName'),
    resultWordStatusBadge: document.getElementById('resultWordStatusBadge'),
    resultWordMeaning: document.getElementById('resultWordMeaning'),
    
    // Manager Page
    formAddWord: document.getElementById('formAddWord'),
    addWordInput: document.getElementById('addWordInput'),
    addWordMeaning: document.getElementById('addWordMeaning'),
    formDeleteWord: document.getElementById('formDeleteWord'),
    deleteWordInput: document.getElementById('deleteWordInput'),
    btnDisplayDictionary: document.getElementById('btnDisplayDictionary'),
    tableFilterInput: document.getElementById('tableFilterInput'),
    dictionaryWordsTableBody: document.getElementById('dictionaryWordsTableBody'),
    
    // History Page
    historyTableBody: document.getElementById('historyTableBody'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    
    // Stats Page
    statsWordsCount: document.getElementById('statsWordsCount'),
    statsSearchesCount: document.getElementById('statsSearchesCount'),
    statsAutocompleteCount: document.getElementById('statsAutocompleteCount'),
    chartPopularWords: document.getElementById('chartPopularWords'),
    chartSearchRatio: document.getElementById('chartSearchRatio'),
    
    // Config Modal
    backendConfigModal: document.getElementById('backendConfigModal'),
    btnCloseConfigModal: document.getElementById('btnCloseConfigModal'),
    badgeCurrentMode: document.getElementById('badgeCurrentMode'),
    configConnectionMode: document.getElementById('configConnectionMode'),
    configApiUrlGroup: document.getElementById('configApiUrlGroup'),
    configApiUrl: document.getElementById('configApiUrl'),
    btnSaveConfig: document.getElementById('btnSaveConfig'),
    
    // Toasts
    toastContainer: document.getElementById('toastContainer')
};

// -------------------------------------------------------------
// Initialization & Core Router
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupNavigation();
    setupDashboard();
    setupSearchPage();
    setupManagerPage();
    setupHistoryPage();
    setupConfigModal();
    
    // Load initial dashboard stats
    refreshDashboardStats();
    
    // Populate current config view
    syncConfigUI();
}

/**
 * Handle navigation switching between sections (SPA routing)
 */
function setupNavigation() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const pageId = link.getAttribute('data-page');
            navigateTo(pageId);
            closeMobileSidebar();
        });
    });

    // Mobile Navigation triggers
    elements.btnHamburger.addEventListener('click', toggleMobileSidebar);
    elements.sidebarOverlay.addEventListener('click', closeMobileSidebar);
}

function navigateTo(pageId) {
    state.activePage = pageId;
    
    // Update navigation active states
    elements.navLinks.forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update section visibility
    elements.pageSections.forEach(section => {
        const sectionId = section.getAttribute('id');
        if (sectionId === `page-${pageId}`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Update Page Header Titles
    const pageTitles = {
        dashboard: { subtitle: "Console", title: "Overview Dashboard" },
        search: { subtitle: "Trie Lookup", title: "Search Dictionary & Autocomplete" },
        manager: { subtitle: "Operations", title: "Dictionary Manager" },
        history: { subtitle: "Logs", title: "Search Audit History" },
        statistics: { subtitle: "Analytics", title: "Dictionary Statistics" },
        about: { subtitle: "Information", title: "About Project & Trie DS" }
    };

    const header = pageTitles[pageId] || { subtitle: "LexiTrie", title: "System" };
    elements.navBreadcrumb.textContent = header.subtitle;
    elements.pageHeaderTitle.textContent = header.title;

    // Trigger page-specific data updates
    if (pageId === 'dashboard') {
        refreshDashboardStats();
    } else if (pageId === 'manager') {
        loadDictionaryRegistry();
    } else if (pageId === 'history') {
        loadSearchHistory();
    } else if (pageId === 'statistics') {
        loadStatisticsPage();
    }
}

function toggleMobileSidebar() {
    elements.sidebar.classList.toggle('open');
    elements.sidebarOverlay.classList.toggle('open');
}

function closeMobileSidebar() {
    elements.sidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('open');
}

// -------------------------------------------------------------
// Toast Notifications helper
// -------------------------------------------------------------
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'danger') {
        iconSvg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
        iconSvg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Animation timeout to remove
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3500);
}

// -------------------------------------------------------------
// Dashboard Page Controllers
// -------------------------------------------------------------
function setupDashboard() {
    // Quick Actions Event Handlers
    elements.qaSearch.addEventListener('click', () => {
        navigateTo('search');
        setTimeout(() => elements.searchInput.focus(), 150);
    });
    
    elements.qaAdd.addEventListener('click', () => {
        navigateTo('manager');
        setTimeout(() => elements.addWordInput.focus(), 150);
    });
    
    elements.qaDelete.addEventListener('click', () => {
        navigateTo('manager');
        setTimeout(() => elements.deleteWordInput.focus(), 150);
    });
    
    elements.qaView.addEventListener('click', () => {
        navigateTo('manager');
    });

    elements.btnDashboardViewAllHistory.addEventListener('click', () => {
        navigateTo('history');
    });

    // Fast search input on dashboard
    elements.dashboardQuickSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = elements.dashboardQuickSearch.value.trim();
            if (query) {
                elements.dashboardQuickSearch.value = '';
                navigateTo('search');
                elements.searchInput.value = query;
                executeDictionarySearch(query);
            }
        }
    });
}

async function refreshDashboardStats() {
    try {
        const response = await api.getStatistics();
        if (response.success && response.stats) {
            const s = response.stats;
            elements.statWordsCount.textContent = s.totalWords;
            elements.statSearchesCount.textContent = s.totalSearches;
            elements.statPopularWord.textContent = s.mostSearchedRaw || "None";
            
            // Format status state based on connection
            if (api.useMock) {
                elements.statBackendStatus.textContent = "Sandbox Mode";
                elements.statStatusIcon.className = "stat-icon";
                elements.statStatusIcon.style.color = "var(--primary)";
                elements.statStatusIcon.style.backgroundColor = "var(--primary-light)";
            } else {
                elements.statBackendStatus.textContent = "C++ Connected";
                elements.statStatusIcon.className = "stat-icon";
                elements.statStatusIcon.style.color = "var(--success-text)";
                elements.statStatusIcon.style.backgroundColor = "var(--success-bg)";
            }
        }
        
        // Load recent history table
        const histResponse = await api.getSearchHistory();
        if (histResponse.success) {
            renderDashboardHistoryTable(histResponse.history.slice(0, 5));
        }
    } catch (err) {
        console.error("Dashboard stats failed to fetch:", err);
    }
}

function renderDashboardHistoryTable(historyItems) {
    const tbody = elements.dashboardHistoryTableBody;
    tbody.innerHTML = '';
    
    if (historyItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: var(--text-muted); font-size: 13px;">
                    No search events found in log.
                </td>
            </tr>
        `;
        return;
    }
    
    historyItems.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.status === 'Found' ? 'badge-success' : 'badge-danger';
        
        // Format timestamp cleanly
        const dateObj = new Date(item.time);
        const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        tr.innerHTML = `
            <td style="font-weight: 600; text-transform: capitalize;">${item.word}</td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td style="color: var(--text-secondary); font-size: 12px;">${timeFormatted}</td>
        `;
        tbody.appendChild(tr);
    });
}

// -------------------------------------------------------------
// Search Dictionary Page Controllers
// -------------------------------------------------------------
function setupSearchPage() {
    const input = elements.searchInput;
    const dropdown = elements.searchSuggestionsDropdown;
    let selectedSuggestionIndex = -1;
    let suggestionsList = [];

    // Trigger autocomplete on typing
    input.addEventListener('input', async () => {
        const query = input.value;
        
        if (query.trim() === '') {
            hideAutocompleteDropdown();
            elements.btnClearSearch.style.display = 'none';
            return;
        }

        elements.btnClearSearch.style.display = 'flex';
        
        try {
            const res = await api.getAutocompleteSuggestions(query);
            if (res.success && res.suggestions.length > 0) {
                suggestionsList = res.suggestions;
                renderAutocompleteSuggestions(query, res.suggestions);
                showAutocompleteDropdown();
            } else {
                suggestionsList = [];
                hideAutocompleteDropdown();
            }
        } catch (err) {
            console.error("Autocomplete failed:", err);
        }
    });

    // Keyboard navigation within suggestions
    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.suggestion-item');
        
        if (dropdown.style.display === 'flex' && items.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
                highlightSuggestion(items, selectedSuggestionIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
                highlightSuggestion(items, selectedSuggestionIndex);
            } else if (e.key === 'Enter') {
                if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < items.length) {
                    e.preventDefault();
                    const chosenWord = suggestionsList[selectedSuggestionIndex];
                    input.value = chosenWord;
                    hideAutocompleteDropdown();
                    executeDictionarySearch(chosenWord);
                }
            } else if (e.key === 'Escape') {
                hideAutocompleteDropdown();
            }
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.searchBoxContainer.contains(e.target)) {
            hideAutocompleteDropdown();
        }
    });

    // Trigger Search Submit
    elements.btnSearchSubmit.addEventListener('click', () => {
        const query = input.value.trim();
        if (query) {
            hideAutocompleteDropdown();
            executeDictionarySearch(query);
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && dropdown.style.display !== 'flex') {
            const query = input.value.trim();
            if (query) {
                executeDictionarySearch(query);
            }
        }
    });

    // Clear Search Input
    elements.btnClearSearch.addEventListener('click', () => {
        input.value = '';
        input.focus();
        elements.btnClearSearch.style.display = 'none';
        hideAutocompleteDropdown();
        elements.searchResultCard.style.display = 'none';
        elements.spellCheckBox.style.display = 'none';
    });
}

function renderAutocompleteSuggestions(prefix, suggestions) {
    const dropdown = elements.searchSuggestionsDropdown;
    dropdown.innerHTML = '';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        
        // Highlight matching prefix portion
        const regex = new RegExp(`^(${escapeRegExp(prefix)})`, 'i');
        const highlightedText = suggestion.replace(regex, `<span class="suggestion-highlight">$1</span>`);
        
        item.innerHTML = `
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>${highlightedText}</span>
        `;
        
        item.addEventListener('click', () => {
            elements.searchInput.value = suggestion;
            hideAutocompleteDropdown();
            executeDictionarySearch(suggestion);
        });
        
        dropdown.appendChild(item);
    });
}

function highlightSuggestion(items, index) {
    items.forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('keyboard-focus');
            // Ensure scrolled into view
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('keyboard-focus');
        }
    });
}

function showAutocompleteDropdown() {
    elements.searchSuggestionsDropdown.style.display = 'flex';
}

function hideAutocompleteDropdown() {
    elements.searchSuggestionsDropdown.style.display = 'none';
    selectedSuggestionIndex = -1;
}

/**
 * Execute actual Dictionary Lookup
 */
async function executeDictionarySearch(word) {
    elements.searchResultCard.style.display = 'none';
    elements.spellCheckBox.style.display = 'none';
    
    // Add temporary loading indicator
    const searchWrapper = document.querySelector('.search-bar-wrapper');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.style.width = '18px';
    loadingSpinner.style.height = '18px';
    loadingSpinner.style.marginRight = '8px';
    
    const submitBtn = elements.btnSearchSubmit;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Searching...';
    
    try {
        const res = await api.searchWord(word);
        
        if (res.success) {
            if (res.found) {
                // Word exists!
                elements.resultWordName.textContent = res.word;
                elements.resultWordMeaning.textContent = res.meaning;
                
                // Style badge
                elements.resultWordStatusBadge.className = 'badge badge-success';
                elements.resultWordStatusBadge.textContent = 'Found';
                
                elements.searchResultCard.style.display = 'block';
            } else {
                // Word not found. Present spelling suggestion if exists
                if (res.suggestions && res.suggestions.length > 0) {
                    elements.spellSuggestionsList.innerHTML = '';
                    res.suggestions.forEach((suggest, index) => {
                        const link = document.createElement('span');
                        link.className = 'spell-link';
                        link.textContent = suggest;
                        link.addEventListener('click', () => {
                            elements.searchInput.value = suggest;
                            executeDictionarySearch(suggest);
                        });
                        
                        elements.spellSuggestionsList.appendChild(link);
                        if (index < res.suggestions.length - 1) {
                            elements.spellSuggestionsList.appendChild(document.createTextNode(', '));
                        }
                    });
                    elements.spellCheckBox.style.display = 'flex';
                } else {
                    // Zero spelling alternatives
                    elements.resultWordName.textContent = word;
                    elements.resultWordMeaning.textContent = `No spelling suggestions or meaning found for "${word}" in the Trie Prefix tree. You can insert it via the Dictionary Manager.`;
                    
                    elements.resultWordStatusBadge.className = 'badge badge-danger';
                    elements.resultWordStatusBadge.textContent = 'Not Found';
                    
                    elements.searchResultCard.style.display = 'block';
                }
            }
        } else {
            showToast(res.message || "Failed to search word.", "danger");
        }
    } catch (err) {
        showToast("Backend connection issue encountered.", "danger");
        console.error(err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Search';
    }
}

// -------------------------------------------------------------
// Dictionary Manager Page Controllers
// -------------------------------------------------------------
function setupManagerPage() {
    // Add Word Form
    elements.formAddWord.addEventListener('submit', async (e) => {
        e.preventDefault();
        const word = elements.addWordInput.value.trim();
        const meaning = elements.addWordMeaning.value.trim();

        if (!word || !meaning) return;

        try {
            const res = await api.addWord(word, meaning);
            if (res.success) {
                showToast(res.message || `Word "${word}" added!`, 'success');
                elements.addWordInput.value = '';
                elements.addWordMeaning.value = '';
                loadDictionaryRegistry();
            } else {
                showToast(res.message || "Failed to add word.", 'danger');
            }
        } catch (err) {
            showToast("Failed to insert word: Backend unavailable.", 'danger');
        }
    });

    // Delete Word Form
    elements.formDeleteWord.addEventListener('submit', async (e) => {
        e.preventDefault();
        const word = elements.deleteWordInput.value.trim();

        if (!word) return;

        try {
            const res = await api.deleteWord(word);
            if (res.success) {
                showToast(res.message || `Word "${word}" removed!`, 'success');
                elements.deleteWordInput.value = '';
                loadDictionaryRegistry();
            } else {
                showToast(res.message || "Failed to delete word.", 'danger');
            }
        } catch (err) {
            showToast("Failed to delete word: Backend unavailable.", 'danger');
        }
    });

    // Refresh Table Registry
    elements.btnDisplayDictionary.addEventListener('click', () => {
        loadDictionaryRegistry();
    });

    // Filter list input
    elements.tableFilterInput.addEventListener('input', () => {
        filterDictionaryTable(elements.tableFilterInput.value);
    });
}

async function loadDictionaryRegistry() {
    const tbody = elements.dictionaryWordsTableBody;
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center;">
                <div class="loading-spinner-wrapper">
                    <div class="loading-spinner"></div>
                </div>
            </td>
        </tr>
    `;

    try {
        const res = await api.displayDictionary();
        if (res.success) {
            renderDictionaryTable(res.dictionary);
        } else {
            showToast("Failed to retrieve registry catalog.", 'danger');
        }
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: var(--danger-text); font-weight: 500;">
                    Unable to contact the backend service. Check C++ settings.
                </td>
            </tr>
        `;
    }
}

function renderDictionaryTable(dictionary) {
    const tbody = elements.dictionaryWordsTableBody;
    tbody.innerHTML = '';
    const keys = Object.keys(dictionary).sort();

    if (keys.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: var(--text-muted);">
                    Dictionary Trie is empty. Add some words to start.
                </td>
            </tr>
        `;
        return;
    }

    keys.forEach(word => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-word', word);
        
        tr.innerHTML = `
            <td style="font-weight: 600; text-transform: capitalize;">${word}</td>
            <td><span class="badge badge-success">Loaded in Trie</span></td>
            <td style="text-align: right;">
                <button class="btn btn-danger btn-sm btn-delete-row" data-word="${word}">
                    <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete
                </button>
            </td>
        `;

        // Bind delete action
        tr.querySelector('.btn-delete-row').addEventListener('click', async () => {
            if (confirm(`Are you sure you want to remove "${word}" from the Trie database?`)) {
                try {
                    const deleteRes = await api.deleteWord(word);
                    if (deleteRes.success) {
                        showToast(`Word "${word}" deleted.`, 'success');
                        loadDictionaryRegistry();
                    } else {
                        showToast(deleteRes.message, 'danger');
                    }
                } catch (e) {
                    showToast("Error processing deletion request.", 'danger');
                }
            }
        });

        tbody.appendChild(tr);
    });
}

function filterDictionaryTable(query) {
    const cleanQuery = query.toLowerCase().trim();
    const rows = elements.dictionaryWordsTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const word = row.getAttribute('data-word');
        if (!word) return;
        
        if (word.includes(cleanQuery)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// -------------------------------------------------------------
// Search History Page Controllers
// -------------------------------------------------------------
function setupHistoryPage() {
    elements.btnClearHistory.addEventListener('click', async () => {
        if (confirm("Reset search audit logs? This cannot be undone.")) {
            try {
                const res = await api.clearSearchHistory();
                if (res.success) {
                    showToast("Logs successfully wiped.", 'success');
                    loadSearchHistory();
                }
            } catch (err) {
                showToast("Failed to empty logs.", 'danger');
            }
        }
    });
}

async function loadSearchHistory() {
    const tbody = elements.historyTableBody;
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center;">
                <div class="loading-spinner-wrapper"><div class="loading-spinner"></div></div>
            </td>
        </tr>
    `;

    try {
        const res = await api.getSearchHistory();
        if (res.success) {
            tbody.innerHTML = '';
            
            if (res.history.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center; color: var(--text-muted);">
                            No recent logs found. Search some words to fill this database.
                        </td>
                    </tr>
                `;
                return;
            }

            res.history.forEach(item => {
                const tr = document.createElement('tr');
                const badgeClass = item.status === 'Found' ? 'badge-success' : 'badge-danger';
                
                const timeStr = new Date(item.time).toLocaleString();

                tr.innerHTML = `
                    <td style="color: var(--text-secondary); font-size: 13px;">${timeStr}</td>
                    <td style="font-weight: 600; text-transform: capitalize;">${item.word}</td>
                    <td><span class="badge ${badgeClass}">${item.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: var(--danger-text);">
                    Unable to fetch history: backend offline.
                </td>
            </tr>
        `;
    }
}

// -------------------------------------------------------------
// Statistics Page (Dynamic Charts)
// -------------------------------------------------------------
async function loadStatisticsPage() {
    try {
        const res = await api.getStatistics();
        if (res.success && res.stats) {
            const s = res.stats;
            elements.statsWordsCount.textContent = s.totalWords;
            elements.statsSearchesCount.textContent = s.totalSearches;
            elements.statsAutocompleteCount.textContent = s.autocompleteRequests;
            
            // Build Charts
            renderCharts(s);
        }
    } catch (e) {
        console.error("Failed statistics render", e);
    }
}

function renderCharts(stats) {
    // 1. Popular Words Bar Chart
    const popularCtx = elements.chartPopularWords.getContext('2d');
    
    // Sort and grab top 5 searches
    const sortedSearches = Object.entries(stats.searchFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    const labels = sortedSearches.map(item => item[0]);
    const data = sortedSearches.map(item => item[1]);
    
    if (state.charts.popular) {
        state.charts.popular.destroy();
    }
    
    state.charts.popular = new Chart(popularCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Search Count',
                data: data,
                backgroundColor: 'rgba(37, 99, 235, 0.7)',
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    // 2. Found / Not Found ratio Chart
    const ratioCtx = elements.chartSearchRatio.getContext('2d');
    
    // Fetch statistics to figure out Found vs Not Found
    api.getSearchHistory().then(res => {
        let found = 0;
        let notFound = 0;
        
        if (res.success && res.history) {
            res.history.forEach(item => {
                if (item.status === 'Found') found++;
                else notFound++;
            });
        }
        
        // Default placeholders if history empty
        if (found === 0 && notFound === 0) {
            found = 5;
            notFound = 2;
        }
        
        if (state.charts.ratio) {
            state.charts.ratio.destroy();
        }
        
        state.charts.ratio = new Chart(ratioCtx, {
            type: 'doughnut',
            data: {
                labels: ['Word Found', 'Word Not Found'],
                datasets: [{
                    data: [found, notFound],
                    backgroundColor: [
                        'rgba(22, 163, 74, 0.7)', // Green
                        'rgba(220, 38, 38, 0.7)'  // Red
                    ],
                    borderColor: [
                        'rgb(22, 163, 74)',
                        'rgb(220, 38, 38)'
                    ],
                    borderWidth: 1.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 16
                        }
                    }
                },
                cutout: '65%'
            }
        });
    });
}

// -------------------------------------------------------------
// Backend Connector Configuration Modal
// -------------------------------------------------------------
function setupConfigModal() {
    const triggerBtn = elements.btnConfigureBackend;
    const modal = elements.backendConfigModal;
    const closeBtn = elements.btnCloseConfigModal;
    const modeSelect = elements.configConnectionMode;
    const saveBtn = elements.btnSaveConfig;

    triggerBtn.addEventListener('click', () => {
        modal.classList.add('active');
        syncConfigUI();
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    modeSelect.addEventListener('change', () => {
        if (modeSelect.value === 'api') {
            elements.configApiUrlGroup.style.display = 'block';
        } else {
            elements.configApiUrlGroup.style.display = 'none';
        }
    });

    saveBtn.addEventListener('click', () => {
        const mode = modeSelect.value;
        if (mode === 'api') {
            const url = elements.configApiUrl.value.trim();
            if (!url) {
                showToast("Please enter a valid C++ server address", "danger");
                return;
            }
            api.useMock = false;
            api.baseUrl = url;
            showToast(`Connected to C++ Backend at ${url}`, 'success');
        } else {
            api.useMock = true;
            showToast("Switched to Local Sandbox simulation", 'success');
        }
        
        // Update general status displays
        syncConfigUI();
        refreshDashboardStats();
        
        modal.classList.remove('active');
    });
}

function syncConfigUI() {
    if (api.useMock) {
        elements.connectionDot.classList.remove('disconnected');
        elements.connectionLabel.textContent = "Sandbox Mode Active";
        elements.badgeCurrentMode.className = "badge badge-success";
        elements.badgeCurrentMode.textContent = "Sandbox Active";
        elements.configConnectionMode.value = "mock";
        elements.configApiUrlGroup.style.display = "none";
    } else {
        elements.connectionDot.classList.add('disconnected'); // Green animation off, custom check
        elements.connectionDot.style.backgroundColor = "var(--warning-text)";
        elements.connectionDot.style.boxShadow = "0 0 0 3px var(--warning-border)";
        elements.connectionLabel.textContent = "C++ Backend Configured";
        elements.badgeCurrentMode.className = "badge badge-warning";
        elements.badgeCurrentMode.textContent = "C++ REST Active";
        elements.configConnectionMode.value = "api";
        elements.configApiUrlGroup.style.display = "block";
        elements.configApiUrl.value = api.baseUrl;
    }
}

// -------------------------------------------------------------
// Utilities
// -------------------------------------------------------------
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

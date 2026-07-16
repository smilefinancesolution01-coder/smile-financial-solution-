/**
 * search.js – Smile Financial Solution
 * Production-ready search module with voice support, suggestions, and keyboard navigation
 * Pure Vanilla ES6 Module
 */

(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================
    const SEARCH_CONFIG = {
        // DOM IDs
        popupId: 'searchPopup',
        inputId: 'searchInput',
        resultsId: 'searchResults',
        suggestionsId: 'searchSuggestions',
        recentId: 'searchRecent',

        // Data
        allPages: [
            { label: 'Personal Loan', url: 'personal-loan.html', category: 'Loans' },
            { label: 'Business Loan', url: 'business-loan.html', category: 'Loans' },
            { label: 'Home Loan', url: 'home-loan.html', category: 'Loans' },
            { label: 'Vehicle Loan', url: 'vehicle-loan.html', category: 'Loans' },
            { label: 'Education Loan', url: 'education-loan.html', category: 'Loans' },
            { label: 'Mudra Loan', url: 'mudra-loan.html', category: 'Loans' },
            { label: 'PMEGP', url: 'pmegp-loan-assistance.html', category: 'Loans' },
            { label: 'Working Capital', url: 'working-capital-loan.html', category: 'Loans' },
            { label: 'Loan Against Property', url: 'loan-against-property.html', category: 'Loans' },
            { label: 'Become Agent', url: 'become-agent.html', category: 'Pages' },
            { label: 'Dashboard', url: 'dashboard.html', category: 'Pages' },
            { label: 'Calculator', url: 'calculator.html', category: 'Pages' },
            { label: 'About', url: 'about.html', category: 'Pages' },
            { label: 'Services', url: 'services.html', category: 'Pages' },
            { label: 'Contact', url: 'contact.html', category: 'Pages' },
            { label: 'Register', url: 'register.html', category: 'Pages' },
            { label: 'Login', url: 'login.html', category: 'Pages' },
            { label: 'Government Schemes', url: 'government-schemes.html', category: 'Pages' },
            { label: 'Membership', url: 'membership.html', category: 'Pages' },
            { label: 'FAQ', url: 'faq.html', category: 'Pages' },
            { label: 'Privacy Policy', url: 'privacy-policy.html', category: 'Pages' },
            { label: 'Terms', url: 'terms.html', category: 'Pages' },
            { label: 'Blogs', url: 'blogs.html', category: 'Pages' },
        ],

        popularSearches: [
            'Personal Loan', 'Business Loan', 'Mudra Loan',
            'PMEGP', 'Become Agent', 'Dashboard', 'Calculator'
        ],

        storageKey: 'smile_search_history',
        maxHistory: 10,
        debounceDelay: 150,
    };

    // ============================================================
    // STATE
    // ============================================================
    const searchState = {
        isOpen: false,
        query: '',
        results: [],
        selectedIndex: -1,
        history: [],
        isVoiceSearch: false,
    };

    // ============================================================
    // DOM CACHE
    // ============================================================
    let dom = {};

    const cacheDom = () => {
        dom = {
            popup: document.getElementById(SEARCH_CONFIG.popupId),
            input: document.getElementById(SEARCH_CONFIG.inputId),
            results: document.getElementById(SEARCH_CONFIG.resultsId),
            suggestions: document.getElementById(SEARCH_CONFIG.suggestionsId),
            recent: document.getElementById(SEARCH_CONFIG.recentId),
            closeBtn: null,
            searchTriggers: [],
        };

        if (dom.popup) {
            dom.closeBtn = dom.popup.querySelector('.close');
        }

        // Find all search triggers
        dom.searchTriggers = [
            ...document.querySelectorAll('[aria-label="Search"]'),
            ...document.querySelectorAll('button:has(> 🔍)'),
            ...document.querySelectorAll('[onclick*="openSearch"]'),
        ];
    };

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    const debounce = (fn, delay) => {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    const getHistory = () => {
        try {
            const data = localStorage.getItem(SEARCH_CONFIG.storageKey);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    };

    const saveHistory = (term) => {
        if (!term || term.trim().length < 2) return;
        let history = getHistory();
        history = history.filter(item => item.toLowerCase() !== term.toLowerCase());
        history.unshift(term);
        if (history.length > SEARCH_CONFIG.maxHistory) {
            history = history.slice(0, SEARCH_CONFIG.maxHistory);
        }
        try {
            localStorage.setItem(SEARCH_CONFIG.storageKey, JSON.stringify(history));
        } catch (e) { /* ignore */ }
        searchState.history = history;
    };

    const normalizeText = (text) => {
        return text.toLowerCase().trim().replace(/\s+/g, ' ');
    };

    const isVisible = (el) => {
        if (!el) return false;
        return el.offsetParent !== null || el.getBoundingClientRect().height > 0;
    };

    const getFocusable = (container) => {
        const selectors = 'a[href], button, input, [tabindex]:not([tabindex="-1"])';
        return [...container.querySelectorAll(selectors)].filter(el => isVisible(el) && !el.disabled);
    };

    // ============================================================
    // NAVIGATION
    // ============================================================
    const navigateTo = (url) => {
        if (!url || url === '#') return;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('active');
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    };

    // ============================================================
    // RENDER FUNCTIONS
    // ============================================================
    const renderResults = (results, query) => {
        if (!dom.results) return;

        if (!results.length) {
            dom.results.innerHTML = `
                <div class="search-empty" style="text-align:center;padding:40px 20px;color:#6b7a93;">
                    <div style="font-size:3rem;margin-bottom:12px;">🔍</div>
                    <p style="font-size:1.1rem;font-weight:500;">No results found for "<strong>${query}</strong>"</p>
                    <p style="font-size:0.9rem;margin-top:8px;color:#8a9aa8;">Try different keywords or browse our popular searches below.</p>
                </div>
            `;
            return;
        }

        dom.results.innerHTML = results.map((item, index) => `
            <div class="search-result-item" data-index="${index}" data-url="${item.url}" 
                 style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f0f3f8;cursor:pointer;transition:0.15s;border-radius:8px;${searchState.selectedIndex === index ? 'background:#f5f7fa;' : ''}"
                 onmouseenter="this.style.background='#f5f7fa'" 
                 onmouseleave="this.style.background='transparent'">
                <div>
                    <span style="font-weight:500;">${highlightMatch(item.label, query)}</span>
                    <span style="font-size:0.75rem;color:#8a9aa8;margin-left:10px;">${item.category || 'Page'}</span>
                </div>
                <span style="color:#8a9aa8;font-size:0.8rem;">→</span>
            </div>
        `).join('');

        // Add click events
        dom.results.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('click', function() {
                const url = this.dataset.url;
                const label = this.querySelector('span')?.textContent || '';
                if (url) {
                    saveHistory(label);
                    closeSearch();
                    navigateTo(url);
                }
            });
        });

        // Update selected index
        const items = dom.results.querySelectorAll('.search-result-item');
        items.forEach((el, idx) => {
            if (idx === searchState.selectedIndex) {
                el.style.background = '#f5f7fa';
                el.scrollIntoView({ block: 'nearest' });
            } else {
                el.style.background = 'transparent';
            }
        });
    };

    const highlightMatch = (text, query) => {
        if (!query || !text) return text;
        const normalizedQuery = normalizeText(query);
        const normalizedText = normalizeText(text);
        const index = normalizedText.indexOf(normalizedQuery);
        if (index === -1) return text;
        const start = text.substr(0, index);
        const match = text.substr(index, query.length);
        const end = text.substr(index + query.length);
        return `${start}<strong style="color:#0b1a33;">${match}</strong>${end}`;
    };

    const renderSuggestions = (query) => {
        if (!dom.suggestions) return;
        if (query && query.length > 1) {
            dom.suggestions.style.display = 'none';
            return;
        }

        const popular = SEARCH_CONFIG.popularSearches;
        dom.suggestions.innerHTML = `
            <div style="padding:8px 16px;font-size:0.75rem;color:#8a9aa8;text-transform:uppercase;letter-spacing:0.5px;">Popular Searches</div>
            ${popular.map(term => `
                <div class="popular-search-item" style="padding:10px 16px;cursor:pointer;border-radius:8px;transition:0.15s;display:flex;align-items:center;gap:10px;"
                     onmouseenter="this.style.background='#f5f7fa'" 
                     onmouseleave="this.style.background='transparent'"
                     data-term="${term}">
                    <span style="color:#8a9aa8;">🔥</span>
                    <span>${term}</span>
                </div>
            `).join('')}
        `;

        dom.suggestions.querySelectorAll('.popular-search-item').forEach(el => {
            el.addEventListener('click', function() {
                const term = this.dataset.term;
                if (dom.input) {
                    dom.input.value = term;
                    dom.input.dispatchEvent(new Event('input'));
                    dom.input.focus();
                }
            });
        });
        dom.suggestions.style.display = 'block';
    };

    const renderRecent = () => {
        if (!dom.recent) return;
        const history = getHistory();
        if (!history.length) {
            dom.recent.style.display = 'none';
            return;
        }
        dom.recent.innerHTML = `
            <div style="padding:8px 16px;font-size:0.75rem;color:#8a9aa8;text-transform:uppercase;letter-spacing:0.5px;display:flex;justify-content:space-between;align-items:center;">
                <span>Recent Searches</span>
                <span style="cursor:pointer;color:#f5b041;font-weight:500;font-size:0.7rem;" onclick="clearSearchHistory()">Clear</span>
            </div>
            ${history.map(term => `
                <div class="recent-search-item" style="padding:10px 16px;cursor:pointer;border-radius:8px;transition:0.15s;display:flex;align-items:center;gap:10px;"
                     onmouseenter="this.style.background='#f5f7fa'" 
                     onmouseleave="this.style.background='transparent'"
                     data-term="${term}">
                    <span style="color:#8a9aa8;">🕐</span>
                    <span>${term}</span>
                </div>
            `).join('')}
        `;
        dom.recent.style.display = 'block';

        dom.recent.querySelectorAll('.recent-search-item').forEach(el => {
            el.addEventListener('click', function() {
                const term = this.dataset.term;
                if (dom.input) {
                    dom.input.value = term;
                    dom.input.dispatchEvent(new Event('input'));
                    dom.input.focus();
                }
            });
        });
    };

    // ============================================================
    // SEARCH LOGIC
    // ============================================================
    const performSearch = (query) => {
        const normalizedQuery = normalizeText(query);
        searchState.query = query;
        searchState.selectedIndex = -1;

        if (!query || query.length < 1) {
            dom.results.innerHTML = '';
            renderSuggestions('');
            renderRecent();
            return;
        }

        // Filter results
        const results = SEARCH_CONFIG.allPages.filter(item => {
            const labelMatch = normalizeText(item.label).includes(normalizedQuery);
            const categoryMatch = normalizeText(item.category || '').includes(normalizedQuery);
            return labelMatch || categoryMatch;
        });

        searchState.results = results;
        renderResults(results, query);
        dom.suggestions.style.display = 'none';
        dom.recent.style.display = 'none';

        // If exactly one result and it's an exact match, save to history
        if (results.length === 1 && normalizeText(results[0].label) === normalizedQuery) {
            saveHistory(results[0].label);
        }
    };

    const debouncedSearch = debounce(performSearch, SEARCH_CONFIG.debounceDelay);

    // ============================================================
    // VOICE SEARCH
    // ============================================================
    const voiceSearch = {
        isSupported: false,
        recognition: null,
        isListening: false,

        init() {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) {
                this.isSupported = false;
                return;
            }
            this.isSupported = true;
            this.recognition = new SR();
            this.recognition.lang = 'en-IN';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (dom.input) {
                    dom.input.value = transcript;
                    dom.input.dispatchEvent(new Event('input'));
                    dom.input.focus();
                }
                this.isListening = false;
                // Update microphone icon
                this.updateMicIcon(false);
            };

            this.recognition.onerror = () => {
                this.isListening = false;
                this.updateMicIcon(false);
                // Show a small hint
                if (dom.input) {
                    dom.input.placeholder = 'Try typing your search...';
                    setTimeout(() => {
                        dom.input.placeholder = 'Search loans, schemes, services...';
                    }, 2000);
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateMicIcon(false);
            };
        },

        start() {
            if (!this.isSupported || !this.recognition) {
                alert('Voice search is not supported in this browser. Please use Chrome or Edge.');
                return;
            }
            if (this.isListening) {
                this.recognition.stop();
                this.isListening = false;
                this.updateMicIcon(false);
                return;
            }
            try {
                this.recognition.start();
                this.isListening = true;
                this.updateMicIcon(true);
                if (dom.input) {
                    dom.input.placeholder = '🎤 Listening...';
                }
            } catch (e) {
                // Already started or error
                this.isListening = false;
                this.updateMicIcon(false);
            }
        },

        updateMicIcon(isActive) {
            const micBtn = document.querySelector('[aria-label="Voice Search"], button:has(> 🎤)');
            if (micBtn) {
                micBtn.style.color = isActive ? '#f5b041' : '';
                micBtn.textContent = isActive ? '🔴' : '🎤';
            }
        }
    };

    // ============================================================
    // SEARCH CONTROLS
    // ============================================================
    const openSearch = () => {
        if (searchState.isOpen) {
            if (dom.input) dom.input.focus();
            return;
        }
        if (!dom.popup) return;

        dom.popup.classList.add('open');
        searchState.isOpen = true;
        document.body.style.overflow = 'hidden';

        // Load recent
        renderRecent();

        setTimeout(() => {
            if (dom.input) {
                dom.input.focus();
                dom.input.select();
                dom.input.placeholder = 'Search loans, schemes, services...';
            }
            // Focus trap
            const focusable = getFocusable(dom.popup);
            if (focusable.length) focusable[0].focus();
        }, 300);

        // Add keyboard listener for focus trap
        dom.popup.addEventListener('keydown', handlePopupKeydown);
    };

    const closeSearch = () => {
        if (!dom.popup) return;
        dom.popup.classList.remove('open');
        searchState.isOpen = false;
        searchState.selectedIndex = -1;
        document.body.style.overflow = '';
        if (dom.input) {
            dom.input.value = '';
            dom.input.dispatchEvent(new Event('input'));
        }
        if (dom.results) dom.results.innerHTML = '';
        dom.popup.removeEventListener('keydown', handlePopupKeydown);
    };

    const toggleSearch = () => {
        searchState.isOpen ? closeSearch() : openSearch();
    };

    const handlePopupKeydown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeSearch();
            return;
        }

        if (e.key === 'Tab') {
            const focusable = getFocusable(dom.popup);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
            return;
        }

        // Arrow keys for navigation
        const items = dom.results?.querySelectorAll('.search-result-item') || [];
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            searchState.selectedIndex = Math.min(searchState.selectedIndex + 1, items.length - 1);
            renderResults(searchState.results, searchState.query);
            items[searchState.selectedIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            searchState.selectedIndex = Math.max(searchState.selectedIndex - 1, 0);
            renderResults(searchState.results, searchState.query);
            items[searchState.selectedIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (searchState.selectedIndex >= 0 && searchState.selectedIndex < items.length) {
                const selected = items[searchState.selectedIndex];
                const url = selected.dataset.url;
                const label = selected.querySelector('span')?.textContent || '';
                if (url) {
                    saveHistory(label);
                    closeSearch();
                    navigateTo(url);
                }
            } else if (searchState.results && searchState.results.length === 1) {
                // Auto-select the only result
                const item = searchState.results[0];
                saveHistory(item.label);
                closeSearch();
                navigateTo(item.url);
            }
        }
    };

    // ============================================================
    // CLEAR HISTORY (exposed globally)
    // ============================================================
    window.clearSearchHistory = function() {
        try {
            localStorage.removeItem(SEARCH_CONFIG.storageKey);
        } catch (e) { /* ignore */ }
        searchState.history = [];
        renderRecent();
    };

    // ============================================================
    // INITIALIZATION
    // ============================================================
    const initializeSearch = () => {
        cacheDom();
        if (!dom.popup) {
            console.warn('Search popup not found in DOM.');
            return;
        }

        // Close button
        if (dom.closeBtn) {
            dom.closeBtn.addEventListener('click', closeSearch);
        }

        // Popup overlay click
        dom.popup.addEventListener('click', (e) => {
            if (e.target === dom.popup) closeSearch();
        });

        // Input events
        if (dom.input) {
            dom.input.addEventListener('input', function() {
                const query = this.value;
                if (query.length > 1) {
                    // Add to history only on enter or selection
                }
                debouncedSearch(query);
            });

            dom.input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeSearch();
                }
                // Handle Enter if no results selected
                if (e.key === 'Enter') {
                    const items = dom.results?.querySelectorAll('.search-result-item') || [];
                    if (searchState.selectedIndex === -1 && items.length === 1) {
                        // Auto-select the only result
                        const item = searchState.results[0];
                        if (item) {
                            saveHistory(item.label);
                            closeSearch();
                            navigateTo(item.url);
                        }
                    }
                }
            });

            // Focus on open
            dom.input.addEventListener('focus', () => {
                if (dom.input.value.length < 2) {
                    renderSuggestions('');
                    renderRecent();
                }
            });
        }

        // Search triggers
        dom.searchTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                openSearch();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleSearch();
                return;
            }
            // / key (but not in input fields)
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                e.preventDefault();
                openSearch();
                return;
            }
            // Escape closes search (handled in popup)
        });

        // Voice search trigger
        const micBtn = document.querySelector('[aria-label="Voice Search"], button:has(> 🎤)');
        if (micBtn) {
            micBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!searchState.isOpen) openSearch();
                setTimeout(() => {
                    voiceSearch.start();
                }, 300);
            });
        }

        // Initialize voice search
        voiceSearch.init();

        // Pre-load recent
        searchState.history = getHistory();

        // Expose API
        window.searchAPI = {
            open: openSearch,
            close: closeSearch,
            toggle: toggleSearch,
            voice: voiceSearch,
            clearHistory: window.clearSearchHistory,
            performSearch: performSearch,
        };

        console.log('Search module initialized. Press Ctrl+K or / to search.');
    };

    // ============================================================
    // AUTO-INIT ON DOM READY
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSearch);
    } else {
        initializeSearch();
    }

    // ============================================================
    // EXPOSE FOR TESTING
    // ============================================================
    window.__SmileSearch = {
        initializeSearch,
        openSearch,
        closeSearch,
        toggleSearch,
        voiceSearch,
        performSearch,
        renderResults,
        renderSuggestions,
        renderRecent,
        getHistory,
        saveHistory,
        SEARCH_CONFIG,
        searchState,
    };

})();

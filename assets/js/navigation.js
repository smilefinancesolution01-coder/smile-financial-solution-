/**
 * navigation.js – Smile Financial Solution
 * Pure Vanilla ES6 Module – Production Ready
 */
(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================
    const CONFIG = {
        drawerId: 'mobileDrawer',
        drawerOverlayId: 'drawerOverlay',
        megaMenuId: 'megaMenu',
        megaTriggerClass: 'mega-trigger',
        searchPopupId: 'searchPopup',
        searchInputId: 'searchInput',
        searchResultsId: 'searchResults',
        notificationPopupId: 'notificationPopup',
        loanPopupId: 'loanPopup',
        loanFormId: 'loanForm',
        loanSubmitId: 'loanSubmitBtn',
        body: document.body,
        html: document.documentElement,
    };

    // ============================================================
    // STATE
    // ============================================================
    const state = {
        drawerOpen: false,
        megaOpen: false,
        searchOpen: false,
        notificationOpen: false,
        loanOpen: false,
        currentPage: '',
        focusableElements: [],
        lastFocused: null,
    };

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

    const isElementVisible = (el) => {
        if (!el) return false;
        return el.offsetParent !== null || el.getBoundingClientRect().height > 0;
    };

    const getFocusable = (container) => {
        const selectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        return [...container.querySelectorAll(selectors)].filter(el => !el.disabled && isElementVisible(el));
    };

    const trapFocus = (container, event) => {
        const focusable = getFocusable(container);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.key === 'Tab') {
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    };

    const closeAllPopups = () => {
        closeDrawer();
        closeMegaMenu();
        closeSearch();
        closeNotification();
        closeLoanPopup();
    };

    // ============================================================
    // NAVIGATION HELPERS
    // ============================================================
    const navigateTo = (url, event) => {
        if (event) event.preventDefault();
        if (!url || url === '#') return;
        // Show loading if available
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('active');
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    };

    const getCurrentPage = () => {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.toLowerCase();
    };

    // ============================================================
    // DRAWER (Mobile Hamburger)
    // ============================================================
    const drawer = {
        el: null,
        overlay: null,

        init() {
            this.el = document.getElementById(CONFIG.drawerId);
            this.overlay = document.getElementById(CONFIG.drawerOverlay);
            if (!this.el) return;

            // Close button inside drawer
            const closeBtn = this.el.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }

            // Overlay click
            if (this.overlay) {
                this.overlay.addEventListener('click', () => this.close());
            }

            // ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.drawerOpen) {
                    this.close();
                }
            });

            // Menu trigger (hamburger)
            const triggers = $$('[aria-label="Menu"], .mega-trigger');
            triggers.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.innerWidth < 768) {
                        this.toggle();
                    } else {
                        // On desktop, toggle mega menu
                        toggleMegaMenu(e);
                    }
                });
            });

            // Handle resize
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (window.innerWidth >= 768 && state.drawerOpen) {
                        this.close();
                    }
                }, 200);
            });

            // Populate drawer links
            this.populateLinks();
        },

        populateLinks() {
            if (!this.el) return;
            const links = [
                { href: 'index.html', label: 'Home' },
                { href: 'about.html', label: 'About' },
                { href: 'services.html', label: 'Services' },
                { href: 'government-schemes.html', label: 'Govt Schemes' },
                { href: 'membership.html', label: 'Membership' },
                { href: 'become-agent.html', label: 'Become Agent' },
                { href: 'contact.html', label: 'Contact' },
                { href: 'login.html', label: 'Login' },
                { href: 'register.html', label: 'Register' },
                { href: 'dashboard.html', label: 'Dashboard' },
            ];
            // Only add if not already populated
            const existing = this.el.querySelectorAll('a:not(.close-btn)');
            if (existing.length > 1) return;

            const closeBtn = this.el.querySelector('.close-btn');
            const container = document.createElement('div');
            container.className = 'drawer-links';
            links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.href;
                a.textContent = link.label;
                a.addEventListener('click', (e) => {
                    this.close();
                    navigateTo(link.href, e);
                });
                container.appendChild(a);
            });
            if (closeBtn) {
                closeBtn.after(container);
            } else {
                this.el.prepend(container);
            }
        },

        open() {
            if (!this.el) return;
            this.el.classList.add('open');
            if (this.overlay) this.overlay.classList.add('open');
            state.drawerOpen = true;
            CONFIG.body.style.overflow = 'hidden';
            // Focus trap
            setTimeout(() => {
                const focusable = getFocusable(this.el);
                if (focusable.length) focusable[0].focus();
            }, 100);
        },

        close() {
            if (!this.el) return;
            this.el.classList.remove('open');
            if (this.overlay) this.overlay.classList.remove('open');
            state.drawerOpen = false;
            CONFIG.body.style.overflow = '';
        },

        toggle() {
            state.drawerOpen ? this.close() : this.open();
        }
    };

    // ============================================================
    // MEGA MENU (Desktop)
    // ============================================================
    const megaMenu = {
        el: null,
        trigger: null,

        init() {
            this.el = document.getElementById(CONFIG.megaMenuId);
            this.trigger = document.querySelector(`.${CONFIG.megaTriggerClass}`);
            if (!this.el || !this.trigger) return;

            // Toggle on trigger click
            this.trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.innerWidth >= 768) {
                    this.toggle();
                }
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (state.megaOpen && !this.el.contains(e.target) && !this.trigger.contains(e.target)) {
                    this.close();
                }
            });

            // ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.megaOpen) {
                    this.close();
                }
            });

            // Hover support for desktop
            let hoverTimer;
            this.trigger.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimer);
                if (window.innerWidth >= 1024) {
                    this.open();
                }
            });
            this.trigger.addEventListener('mouseleave', () => {
                hoverTimer = setTimeout(() => {
                    if (!this.el.matches(':hover') && window.innerWidth >= 1024) {
                        this.close();
                    }
                }, 200);
            });
            this.el.addEventListener('mouseleave', () => {
                hoverTimer = setTimeout(() => {
                    if (!this.trigger.matches(':hover') && window.innerWidth >= 1024) {
                        this.close();
                    }
                }, 200);
            });
            this.el.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimer);
            });
        },

        open() {
            if (!this.el) return;
            this.el.classList.add('open');
            state.megaOpen = true;
        },

        close() {
            if (!this.el) return;
            this.el.classList.remove('open');
            state.megaOpen = false;
        },

        toggle() {
            state.megaOpen ? this.close() : this.open();
        }
    };

    // ============================================================
    // SEARCH
    // ============================================================
    const search = {
        el: null,
        input: null,
        results: null,

        init() {
            this.el = document.getElementById(CONFIG.searchPopupId);
            this.input = document.getElementById(CONFIG.searchInputId);
            this.results = document.getElementById(CONFIG.searchResultsId);
            if (!this.el) return;

            // Close button
            const closeBtn = this.el.querySelector('.close');
            if (closeBtn) closeBtn.addEventListener('click', () => this.close());

            // Overlay click (background)
            this.el.addEventListener('click', (e) => {
                if (e.target === this.el) this.close();
            });

            // ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.searchOpen) {
                    this.close();
                }
            });

            // Search input
            if (this.input) {
                this.input.addEventListener('input', () => this.handleSearch());
                this.input.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') this.close();
                });
            }

            // Search icon triggers
            const triggers = $$('[aria-label="Search"], button:has(> 🔍)');
            triggers.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.open();
                });
            });
        },

        open() {
            if (!this.el) return;
            this.el.classList.add('open');
            state.searchOpen = true;
            setTimeout(() => {
                if (this.input) {
                    this.input.focus();
                    this.input.value = '';
                    this.input.dispatchEvent(new Event('input'));
                }
            }, 300);
        },

        close() {
            if (!this.el) return;
            this.el.classList.remove('open');
            state.searchOpen = false;
        },

        handleSearch() {
            if (!this.input || !this.results) return;
            const q = this.input.value.toLowerCase().trim();
            if (!q) { this.results.innerHTML = ''; return; }

            const items = [
                'Personal Loan', 'Business Loan', 'Home Loan', 'Vehicle Loan',
                'Education Loan', 'Mudra Loan', 'PMEGP', 'Working Capital',
                'Loan Against Property', 'Startup India', 'CGTMSE',
                'GST Filing', 'ITR Filing', 'Digital Marketing',
                'AI Automation', 'Website Development', 'App Development',
                'Insurance', 'Credit Card', 'Membership', 'Become Agent'
            ];
            const matches = items.filter(item => item.toLowerCase().includes(q));
            this.results.innerHTML = matches.length ?
                matches.map(m => `<div style="padding:10px 0;border-bottom:1px solid #f0f3f8;cursor:pointer;" onclick="window.location.href='services.html'">${m}</div>`).join('') :
                '<div style="padding:10px 0;color:#999;">No results found</div>';
        }
    };

    // ============================================================
    // NOTIFICATION
    // ============================================================
    const notification = {
        el: null,

        init() {
            this.el = document.getElementById(CONFIG.notificationPopupId);
            if (!this.el) return;

            const closeBtn = this.el.querySelector('.close');
            if (closeBtn) closeBtn.addEventListener('click', () => this.close());

            this.el.addEventListener('click', (e) => {
                if (e.target === this.el) this.close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.notificationOpen) {
                    this.close();
                }
            });

            const triggers = $$('[aria-label="Notifications"], button:has(> 🔔)');
            triggers.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggle();
                });
            });
        },

        open() {
            if (!this.el) return;
            this.el.classList.add('open');
            state.notificationOpen = true;
        },

        close() {
            if (!this.el) return;
            this.el.classList.remove('open');
            state.notificationOpen = false;
        },

        toggle() {
            state.notificationOpen ? this.close() : this.open();
        }
    };

    // ============================================================
    // LOAN POPUP
    // ============================================================
    const loanPopup = {
        el: null,
        form: null,
        submitBtn: null,

        init() {
            this.el = document.getElementById(CONFIG.loanPopupId);
            this.form = document.getElementById(CONFIG.loanFormId);
            this.submitBtn = document.getElementById(CONFIG.loanSubmitId);
            if (!this.el) return;

            const closeBtn = this.el.querySelector('.close');
            if (closeBtn) closeBtn.addEventListener('click', () => this.close());

            this.el.addEventListener('click', (e) => {
                if (e.target === this.el) this.close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.loanOpen) {
                    this.close();
                }
            });

            // Form submission
            if (this.form) {
                this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            }

            // Trigger: Apply Loan buttons
            const triggers = $$('[href*="service-details"], .apply-float, [onclick*="openLoanPopup"]');
            triggers.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.open();
                });
            });

            // Also handle any button with text "Apply Loan" or "Apply Now"
            const applyBtns = $$('a, button');
            applyBtns.forEach(btn => {
                const text = btn.textContent.trim().toLowerCase();
                if ((text.includes('apply loan') || text.includes('apply now')) && !btn.closest('.popup-card')) {
                    btn.addEventListener('click', (e) => {
                        if (!btn.href || btn.href === '#' || btn.href.includes('javascript')) {
                            e.preventDefault();
                            this.open();
                        }
                    });
                }
            });
        },

        open() {
            if (!this.el) return;
            this.el.classList.add('open');
            state.loanOpen = true;
            CONFIG.body.style.overflow = 'hidden';
            setTimeout(() => {
                const firstInput = this.el.querySelector('input, select, textarea');
                if (firstInput) firstInput.focus();
            }, 100);
        },

        close() {
            if (!this.el) return;
            this.el.classList.remove('open');
            state.loanOpen = false;
            CONFIG.body.style.overflow = '';
            if (this.form) this.form.reset();
        },

        handleSubmit(e) {
            e.preventDefault();
            if (!this.form) return;

            const data = {
                fullName: document.getElementById('loanFullName')?.value || '',
                mobile: document.getElementById('loanMobile')?.value || '',
                email: document.getElementById('loanEmail')?.value || '',
                state: document.getElementById('loanState')?.value || '',
                city: document.getElementById('loanCity')?.value || '',
                loanType: document.getElementById('loanType')?.value || '',
                loanAmount: document.getElementById('loanAmountInput')?.value || '',
                business: document.getElementById('loanBusiness')?.value || '',
                turnover: document.getElementById('loanTurnover')?.value || '',
                timestamp: new Date().toISOString()
            };

            // Validate required fields
            if (!data.fullName || !data.mobile || !data.email || !data.state || !data.city || !data.loanType || !data
                .loanAmount) {
                alert('Please fill all required fields.');
                return;
            }

            const consent = document.getElementById('loanConsent');
            if (consent && !consent.checked) {
                alert('Please agree to the terms & privacy policy.');
                return;
            }

            // Show loading
            if (this.submitBtn) {
                this.submitBtn.classList.add('loading');
                this.submitBtn.textContent = 'Submitting...';
            }

            console.log('Loan Application (Firebase Ready):', data);

            // Simulate submission
            setTimeout(() => {
                if (this.submitBtn) {
                    this.submitBtn.classList.remove('loading');
                    this.submitBtn.textContent = 'Submit Application';
                }
                this.close();
                // Show success modal
                showSuccessModal('Thank you. Our Relationship Manager will contact you shortly.');
            }, 1200);
        }
    };

    // ============================================================
    // SUCCESS MODAL
    // ============================================================
    function showSuccessModal(message) {
        const existing = document.querySelector('.success-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'success-modal-overlay popup-overlay open';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.2);backdrop-filter:blur(6px);z-index:600;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div class="popup-card" style="background:white;max-width:480px;width:90%;padding:32px 28px;border-radius:44px;box-shadow:0 40px 60px rgba(0,0,0,0.1);position:relative;">
                <button class="close" style="position:absolute;top:16px;right:20px;font-size:1.8rem;background:transparent;border:none;cursor:pointer;" onclick="this.closest('.success-modal-overlay').remove()">✕</button>
                <h2 style="color:#0b1a33;">✅ Success</h2>
                <p style="font-size:1.1rem;margin:16px 0;">${message}</p>
                <button class="btn" style="background:#0b1a33;color:white;padding:14px 28px;border-radius:60px;border:none;font-weight:600;cursor:pointer;width:100%;" onclick="this.closest('.success-modal-overlay').remove()">OK</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // Close on ESC
        const handler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handler);
            }
        };
        document.addEventListener('keydown', handler);
    }

    // ============================================================
    // BOTTOM NAVIGATION
    // ============================================================
    const bottomNav = {
        init() {
            const current = getCurrentPage();
            const nav = document.querySelector('.bottom-nav');
            if (!nav) return;

            const links = nav.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.toLowerCase() === current) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }

                // Ensure navigation works
                link.addEventListener('click', (e) => {
                    const url = link.getAttribute('href');
                    if (url && !url.startsWith('#')) {
                        e.preventDefault();
                        navigateTo(url);
                    }
                });
            });
        }
    };

    // ============================================================
    // GLOBAL KEYBOARD SHORTCUTS
    // ============================================================
    const keyboardShortcuts = {
        init() {
            document.addEventListener('keydown', (e) => {
                // Ctrl + / to open search
                if (e.ctrlKey && e.key === '/') {
                    e.preventDefault();
                    search.open();
                }
                // Escape is handled per component
            });
        }
    };

    // ============================================================
    // INITIALIZATION
    // ============================================================
    const init = () => {
        // Set current page
        state.currentPage = getCurrentPage();

        // Initialize all modules
        drawer.init();
        megaMenu.init();
        search.init();
        notification.init();
        loanPopup.init();
        bottomNav.init();
        keyboardShortcuts.init();

        // Expose closeAll for any use case
        window.closeAllPopups = closeAllPopups;

        console.log('Smile Financial Navigation initialized.');
    };

    // ============================================================
    // AUTO-INIT ON DOM READY
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================================
    // EXPOSE FOR TESTING / DEBUGGING
    // ============================================================
    window.__SmileNav = {
        drawer,
        megaMenu,
        search,
        notification,
        loanPopup,
        navigateTo,
        closeAllPopups,
        state
    };

})();

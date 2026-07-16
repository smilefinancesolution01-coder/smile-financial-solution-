/**
 * popup.js – Smile Financial Solution
 * Universal Popup System – Production Ready
 * Pure Vanilla ES6 Module
 */

(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================
    const POPUP_CONFIG = {
        // Popup selectors
        popupSelector: '.popup-overlay',
        closeSelector: '.close',
        triggerAttribute: 'data-popup',

        // Form IDs
        loanFormId: 'loanForm',
        agentFormId: 'agentForm',
        contactFormId: 'contactForm',
        callbackFormId: 'callbackForm',

        // Button IDs
        loanSubmitId: 'loanSubmitBtn',
        agentSubmitId: 'agentSubmitBtn',
        contactSubmitId: 'contactSubmitBtn',
        callbackSubmitId: 'callbackSubmitBtn',

        // Validation
        mobileRegex: /^[6-9]\d{9}$/,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        amountRegex: /^\d+$/,

        // Animation
        animationDuration: 300,
        successDuration: 2000,
    };

    // ============================================================
    // STATE
    // ============================================================
    const popupState = {
        activePopup: null,
        isOpen: false,
        focusableElements: [],
        lastFocused: null,
        isSubmitting: false,
    };

    // ============================================================
    // DOM CACHE
    // ============================================================
    let dom = {};

    const cacheDom = () => {
        dom = {
            popups: document.querySelectorAll(POPUP_CONFIG.popupSelector),
            triggers: document.querySelectorAll(`[${POPUP_CONFIG.triggerAttribute}]`),
            body: document.body,
            html: document.documentElement,
        };
    };

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

    const isVisible = (el) => {
        if (!el) return false;
        return el.offsetParent !== null || el.getBoundingClientRect().height > 0;
    };

    const getFocusable = (container) => {
        const selectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        return [...container.querySelectorAll(selectors)]
            .filter(el => !el.disabled && isVisible(el) && el.offsetParent !== null);
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

    const showLoading = (btn) => {
        if (!btn) return;
        btn.classList.add('loading');
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.dataset.originalText = originalText;
        btn.textContent = 'Submitting...';
    };

    const hideLoading = (btn) => {
        if (!btn) return;
        btn.classList.remove('loading');
        btn.disabled = false;
        if (btn.dataset.originalText) {
            btn.textContent = btn.dataset.originalText;
        }
    };

    // ============================================================
    // VALIDATION FUNCTIONS
    // ============================================================
    const validateField = (field) => {
        if (!field) return true;
        const value = field.value.trim();
        const type = field.type;
        const name = field.name || field.id || '';

        // Required
        if (field.hasAttribute('required') && !value) {
            field.classList.add('error');
            return false;
        }

        // Email
        if (type === 'email' && value && !POPUP_CONFIG.emailRegex.test(value)) {
            field.classList.add('error');
            return false;
        }

        // Mobile/Phone
        if ((type === 'tel' || name.toLowerCase().includes('phone') || name.toLowerCase().includes('mobile')) &&
            value && !POPUP_CONFIG.mobileRegex.test(value)) {
            field.classList.add('error');
            return false;
        }

        // Amount numeric
        if ((name.toLowerCase().includes('amount') || name.toLowerCase().includes('income') ||
                name.toLowerCase().includes('turnover')) &&
            value && !POPUP_CONFIG.amountRegex.test(value)) {
            field.classList.add('error');
            return false;
        }

        field.classList.remove('error');
        return true;
    };

    const validateForm = (form) => {
        if (!form) return false;
        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        fields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        return isValid;
    };

    // ============================================================
    // FIREBASE READY FUNCTIONS (Placeholders)
    // ============================================================
    const saveLead = (data) => {
        // Firebase ready – placeholder
        console.log('💾 saveLead (Firebase Ready):', data);
        return Promise.resolve({ id: 'lead_' + Date.now(), ...data });
    };

    const saveAgent = (data) => {
        console.log('💾 saveAgent (Firebase Ready):', data);
        return Promise.resolve({ id: 'agent_' + Date.now(), ...data });
    };

    const saveContact = (data) => {
        console.log('💾 saveContact (Firebase Ready):', data);
        return Promise.resolve({ id: 'contact_' + Date.now(), ...data });
    };

    // ============================================================
    // SUCCESS SCREEN
    // ============================================================
    const showSuccessScreen = (popup, message = 'Thank you! We will get back to you shortly.') => {
        const card = popup.querySelector('.popup-card');
        if (!card) return;

        const originalContent = card.innerHTML;

        card.innerHTML = `
            <div style="text-align:center;padding:20px 0;">
                <div style="font-size:4rem;margin-bottom:16px;">✅</div>
                <h2 style="color:#0b1a33;margin-bottom:8px;">Success!</h2>
                <p style="color:#4f658d;font-size:1.05rem;line-height:1.6;">${message}</p>
                <button class="btn close-success" style="background:#0b1a33;color:white;padding:12px 32px;border-radius:60px;border:none;font-weight:600;cursor:pointer;margin-top:20px;">
                    Close
                </button>
            </div>
        `;

        const closeBtn = card.querySelector('.close-success');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closePopup(popup);
                // Restore content after close animation
                setTimeout(() => {
                    card.innerHTML = originalContent;
                    // Re-bind form events
                    const form = card.querySelector('form');
                    if (form) {
                        form.addEventListener('submit', (e) => handleFormSubmit(e, popup));
                    }
                    // Re-bind close button
                    const closeBtn2 = card.querySelector('.close');
                    if (closeBtn2) {
                        closeBtn2.addEventListener('click', () => closePopup(popup));
                    }
                }, 300);
            });
        }

        // Auto close after delay
        setTimeout(() => {
            const btn = card.querySelector('.close-success');
            if (btn) btn.click();
        }, POPUP_CONFIG.successDuration);
    };

    // ============================================================
    // FORM HANDLERS
    // ============================================================
    const handleFormSubmit = async (event, popup) => {
        event.preventDefault();
        if (popupState.isSubmitting) return;

        const form = event.target;
        if (!form) return;

        // Validate
        if (!validateForm(form)) {
            // Scroll to first error
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            return;
        }

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value.trim();
        });
        data.timestamp = new Date().toISOString();

        // Get submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        popupState.isSubmitting = true;
        showLoading(submitBtn);

        try {
            let result;
            const formId = form.id;

            // Route to appropriate save function
            if (formId === POPUP_CONFIG.loanFormId) {
                result = await saveLead(data);
            } else if (formId === POPUP_CONFIG.agentFormId) {
                result = await saveAgent(data);
            } else if (formId === POPUP_CONFIG.contactFormId || formId === POPUP_CONFIG.callbackFormId) {
                result = await saveContact(data);
            } else {
                // Generic fallback
                console.log('Form data:', data);
                result = { success: true, data };
            }

            hideLoading(submitBtn);
            popupState.isSubmitting = false;

            // Show success
            const messages = {
                [POPUP_CONFIG.loanFormId]: 'Thank you. Our Relationship Manager will contact you shortly.',
                [POPUP_CONFIG.agentFormId]: 'Thank you! We will review your application and get back to you soon.',
                [POPUP_CONFIG.contactFormId]: 'Thank you for reaching out. We will respond within 24 hours.',
                [POPUP_CONFIG.callbackFormId]: 'Thank you! We will call you at your preferred time.',
            };
            const message = messages[formId] || 'Thank you! We will get back to you shortly.';
            showSuccessScreen(popup, message);

            // Reset form after success screen close
            setTimeout(() => {
                form.reset();
                form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            }, 500);

        } catch (error) {
            console.error('Form submission error:', error);
            hideLoading(submitBtn);
            popupState.isSubmitting = false;
            alert('Something went wrong. Please try again.');
        }
    };

    // ============================================================
    // POPUP CONTROLS
    // ============================================================
    const openPopup = (popup) => {
        if (!popup) return;
        if (popupState.isOpen && popupState.activePopup === popup) return;

        // Close any open popup first
        if (popupState.isOpen) {
            closePopup(popupState.activePopup);
        }

        popup.classList.add('open');
        popupState.isOpen = true;
        popupState.activePopup = popup;
        popupState.lastFocused = document.activeElement;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus trap
        setTimeout(() => {
            const focusable = getFocusable(popup);
            if (focusable.length) {
                focusable[0].focus();
            }
            // Add focus trap listener
            popup.addEventListener('keydown', focusTrapHandler);
        }, 100);

        // Add escape listener
        popup._escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closePopup(popup);
            }
        };
        document.addEventListener('keydown', popup._escapeHandler);

        // Outside click handler
        popup._outsideHandler = (e) => {
            if (e.target === popup) {
                closePopup(popup);
            }
        };
        popup.addEventListener('click', popup._outsideHandler);
    };

    const closePopup = (popup) => {
        if (!popup) return;
        if (popupState.activePopup && popupState.activePopup !== popup) return;

        popup.classList.remove('open');
        popupState.isOpen = false;
        popupState.activePopup = null;
        document.body.style.overflow = '';

        // Remove listeners
        popup.removeEventListener('keydown', focusTrapHandler);
        if (popup._escapeHandler) {
            document.removeEventListener('keydown', popup._escapeHandler);
            delete popup._escapeHandler;
        }
        if (popup._outsideHandler) {
            popup.removeEventListener('click', popup._outsideHandler);
            delete popup._outsideHandler;
        }

        // Restore focus
        if (popupState.lastFocused && document.body.contains(popupState.lastFocused)) {
            popupState.lastFocused.focus();
        }
        popupState.lastFocused = null;
    };

    const togglePopup = (popup) => {
        if (!popup) return;
        if (popupState.isOpen && popupState.activePopup === popup) {
            closePopup(popup);
        } else {
            openPopup(popup);
        }
    };

    const focusTrapHandler = (e) => {
        if (!popupState.activePopup) return;
        trapFocus(popupState.activePopup, e);
    };

    // ============================================================
    // CLOSE ALL POPUPS
    // ============================================================
    const closeAllPopups = () => {
        document.querySelectorAll(POPUP_CONFIG.popupSelector + '.open').forEach(popup => {
            closePopup(popup);
        });
    };

    // ============================================================
    // INITIALIZE POPUP TRIGGERS
    // ============================================================
    const initTriggers = () => {
        dom.triggers.forEach(trigger => {
            const popupId = trigger.getAttribute(POPUP_CONFIG.triggerAttribute);
            if (!popupId) return;

            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const popup = document.getElementById(popupId);
                if (popup) {
                    openPopup(popup);
                } else {
                    console.warn(`Popup with ID "${popupId}" not found.`);
                }
            });
        });

        // Also handle buttons with onclick="openPopup('id')"
        document.querySelectorAll('[onclick*="openPopup"]').forEach(el => {
            // Extract popup ID from onclick
            const onclick = el.getAttribute('onclick');
            if (!onclick) return;
            const match = onclick.match(/openPopup\s*\(\s*['"]([^'"]+)['"]\s*\)/);
            if (match) {
                const popupId = match[1];
                // Replace onclick with our handler
                el.removeAttribute('onclick');
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const popup = document.getElementById(popupId);
                    if (popup) openPopup(popup);
                });
            }
        });
    };

    // ============================================================
    // INITIALIZE POPUP CLOSE BUTTONS
    // ============================================================
    const initCloseButtons = () => {
        document.querySelectorAll(POPUP_CONFIG.closeSelector).forEach(btn => {
            const popup = btn.closest(POPUP_CONFIG.popupSelector);
            if (!popup) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closePopup(popup);
            });
        });
    };

    // ============================================================
    // INITIALIZE FORMS
    // ============================================================
    const initForms = () => {
        const formIds = [
            POPUP_CONFIG.loanFormId,
            POPUP_CONFIG.agentFormId,
            POPUP_CONFIG.contactFormId,
            POPUP_CONFIG.callbackFormId,
        ];

        formIds.forEach(id => {
            const form = document.getElementById(id);
            if (!form) return;

            // Remove existing submit listeners
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            // Add submit handler
            newForm.addEventListener('submit', (e) => {
                const popup = newForm.closest(POPUP_CONFIG.popupSelector);
                if (popup) {
                    handleFormSubmit(e, popup);
                } else {
                    // Fallback: just prevent default
                    e.preventDefault();
                    console.warn('Form not inside a popup:', newForm.id);
                }
            });

            // Real-time validation on blur
            newForm.querySelectorAll('input, select, textarea').forEach(field => {
                field.addEventListener('blur', () => {
                    validateField(field);
                });
                field.addEventListener('focus', () => {
                    field.classList.remove('error');
                });
                // Clear error on input
                field.addEventListener('input', () => {
                    if (field.classList.contains('error')) {
                        validateField(field);
                    }
                });
            });
        });
    };

    // ============================================================
    // INITIALIZE POPUP INSTANCES
    // ============================================================
    const initPopups = () => {
        dom.popups.forEach(popup => {
            // Ensure popup has close button
            if (!popup.querySelector(POPUP_CONFIG.closeSelector)) {
                // Add default close behavior: click on overlay
                popup.addEventListener('click', (e) => {
                    if (e.target === popup) {
                        closePopup(popup);
                    }
                });
            }

            // ESC is handled globally per popup
            // Set initial state
            popup.classList.remove('open');
        });
    };

    // ============================================================
    // KEYBOARD SHORTCUTS
    // ============================================================
    const initKeyboard = () => {
        document.addEventListener('keydown', (e) => {
            // Escape closes all popups
            if (e.key === 'Escape' && popupState.isOpen) {
                closePopup(popupState.activePopup);
                e.preventDefault();
            }
        });
    };

    // ============================================================
    // MAIN INITIALIZATION
    // ============================================================
    const initializePopup = () => {
        cacheDom();

        if (!dom.popups.length) {
            console.warn('No popups found in DOM.');
            return;
        }

        initPopups();
        initCloseButtons();
        initTriggers();
        initForms();
        initKeyboard();

        // Expose API globally
        window.popupAPI = {
            open: openPopup,
            close: closePopup,
            toggle: togglePopup,
            closeAll: closeAllPopups,
            saveLead,
            saveAgent,
            saveContact,
            validateForm,
            showSuccessScreen,
        };

        // Also expose individual open functions for compatibility
        window.openPopup = openPopup;
        window.closePopup = closePopup;
        window.closeAllPopups = closeAllPopups;

        console.log('Popup system initialized.');
    };

    // ============================================================
    // AUTO-INIT ON DOM READY
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePopup);
    } else {
        // DOM already loaded, but we might need to wait for forms
        if (document.readyState === 'complete') {
            initializePopup();
        } else {
            document.addEventListener('readystatechange', () => {
                if (document.readyState === 'complete') {
                    initializePopup();
                }
            });
        }
    }

    // ============================================================
    // EXPOSE FOR TESTING
    // ============================================================
    window.__SmilePopup = {
        initializePopup,
        openPopup,
        closePopup,
        togglePopup,
        closeAllPopups,
        saveLead,
        saveAgent,
        saveContact,
        validateForm,
        validateField,
        showSuccessScreen,
        POPUP_CONFIG,
        popupState,
    };

})();

/**
 * auth.js – Smile Financial Solution
 * Authentication Module – Production Ready
 * Pure Vanilla ES6 Module
 */

(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================
    const AUTH_CONFIG = {
        // Storage keys
        sessionKey: 'smile_auth_session',
        rememberKey: 'smile_auth_remember',
        userKey: 'smile_auth_user',

        // Form IDs
        loginFormId: 'loginForm',
        registerFormId: 'registerForm',
        forgotFormId: 'forgotForm',
        resetFormId: 'resetForm',

        // Validation
        mobileRegex: /^[6-9]\d{9}$/,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        passwordMinLength: 8,
        passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,

        // Pages
        loginPage: 'login.html',
        registerPage: 'register.html',
        dashboardPage: 'dashboard.html',
        homePage: 'index.html',
        profilePage: 'profile.html',

        // Session duration (days)
        sessionDuration: 7,
    };

    // ============================================================
    // STATE
    // ============================================================
    const authState = {
        user: null,
        isAuthenticated: false,
        isRemembered: false,
        sessionExpiry: null,
        isLoaded: false,
    };

    // ============================================================
    // DOM CACHE
    // ============================================================
    let dom = {};

    const cacheDom = () => {
        dom = {
            loginForm: document.getElementById(AUTH_CONFIG.loginFormId),
            registerForm: document.getElementById(AUTH_CONFIG.registerFormId),
            forgotForm: document.getElementById(AUTH_CONFIG.forgotFormId),
            resetForm: document.getElementById(AUTH_CONFIG.resetFormId),
            loginBtn: document.getElementById('loginBtn'),
            registerBtn: document.getElementById('registerBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            googleBtn: document.getElementById('googleLoginBtn'),
            facebookBtn: document.getElementById('facebookLoginBtn'),
            appleBtn: document.getElementById('appleLoginBtn'),
            userDisplay: document.getElementById('userDisplay'),
            userName: document.getElementById('userName'),
            userEmail: document.getElementById('userEmail'),
            userPhoto: document.getElementById('userPhoto'),
            userMembership: document.getElementById('userMembership'),
            userWallet: document.getElementById('userWallet'),
            userCommission: document.getElementById('userCommission'),
            userReferral: document.getElementById('userReferral'),
            userRole: document.getElementById('userRole'),
            rememberMe: document.getElementById('rememberMe'),
            termsCheck: document.getElementById('termsCheck'),
            referralInput: document.getElementById('referralCode'),
            membershipSelect: document.getElementById('membershipPlan'),
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
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Loading...';
    };

    const hideLoading = (btn) => {
        if (!btn) return;
        btn.classList.remove('loading');
        btn.disabled = false;
        if (btn.dataset.originalText) {
            btn.textContent = btn.dataset.originalText;
        }
    };

    const showError = (field, message) => {
        if (!field) return;
        field.classList.add('error');
        const errorEl = field.closest('.form-group')?.querySelector('.error-message') ||
            field.parentElement?.querySelector('.error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    };

    const clearError = (field) => {
        if (!field) return;
        field.classList.remove('error');
        const errorEl = field.closest('.form-group')?.querySelector('.error-message') ||
            field.parentElement?.querySelector('.error-message');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }
    };

    const clearAllErrors = (form) => {
        if (!form) return;
        form.querySelectorAll('.error').forEach(el => clearError(el));
    };

    // ============================================================
    // VALIDATION FUNCTIONS
    // ============================================================
    const validateEmail = (email) => {
        if (!email) return false;
        return AUTH_CONFIG.emailRegex.test(email.trim());
    };

    const validateMobile = (mobile) => {
        if (!mobile) return false;
        return AUTH_CONFIG.mobileRegex.test(mobile.trim());
    };

    const validatePassword = (password) => {
        if (!password || password.length < AUTH_CONFIG.passwordMinLength) return false;
        return AUTH_CONFIG.passwordRegex.test(password);
    };

    const validateField = (field) => {
        if (!field) return true;
        const value = field.value.trim();
        const type = field.type;
        const name = field.name || field.id || '';

        // Required
        if (field.hasAttribute('required') && !value) {
            showError(field, 'This field is required');
            return false;
        }

        // Email
        if (type === 'email' && value && !validateEmail(value)) {
            showError(field, 'Please enter a valid email address');
            return false;
        }

        // Mobile/Phone
        if ((type === 'tel' || name.toLowerCase().includes('phone') || name.toLowerCase().includes('mobile')) &&
            value && !validateMobile(value)) {
            showError(field, 'Please enter a valid 10-digit mobile number');
            return false;
        }

        // Password
        if (type === 'password' && value && !validatePassword(value)) {
            showError(field, 'Password must be at least 8 characters with uppercase, lowercase and number');
            return false;
        }

        clearError(field);
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

        // Special: confirm password check
        const password = form.querySelector('input[type="password"][name="password"], input[type="password"][id*="password"]');
        const confirm = form.querySelector('input[type="password"][name*="confirm"], input[type="password"][id*="confirm"]');
        if (password && confirm && confirm.value && password.value !== confirm.value) {
            showError(confirm, 'Passwords do not match');
            isValid = false;
        }

        // Terms check
        const terms = form.querySelector('input[type="checkbox"][id*="terms"], input[type="checkbox"][name*="terms"]');
        if (terms && terms.hasAttribute('required') && !terms.checked) {
            showError(terms, 'You must agree to the terms and conditions');
            isValid = false;
        }

        return isValid;
    };

    // ============================================================
    // FIREBASE READY FUNCTIONS (Placeholders)
    // ============================================================
    const loginUser = (credentials) => {
        console.log('🔐 loginUser (Firebase Ready):', credentials);
        return new Promise((resolve) => {
            setTimeout(() => {
                // Demo user
                const user = {
                    uid: 'demo_' + Date.now(),
                    displayName: credentials.email?.split('@')[0] || 'User',
                    email: credentials.email || 'user@example.com',
                    phone: credentials.mobile || '',
                    photoURL: null,
                    membership: 'Free',
                    wallet: 0,
                    commission: 0,
                    referralCode: 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                    role: 'customer',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                };
                resolve(user);
            }, 800);
        });
    };

    const registerUser = (userData) => {
        console.log('📝 registerUser (Firebase Ready):', userData);
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    uid: 'user_' + Date.now(),
                    displayName: userData.fullName || userData.name || 'User',
                    email: userData.email || '',
                    phone: userData.mobile || '',
                    photoURL: null,
                    membership: userData.membership || 'Free',
                    wallet: 0,
                    commission: 0,
                    referralCode: 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                    role: 'customer',
                    referralApplied: userData.referralCode || '',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                };
                resolve(user);
            }, 800);
        });
    };

    const logoutUser = () => {
        console.log('🚪 logoutUser (Firebase Ready)');
        return Promise.resolve();
    };

    const resetPassword = (email) => {
        console.log('🔑 resetPassword (Firebase Ready):', email);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: 'Password reset email sent' });
            }, 800);
        });
    };

    const verifyOTP = (email, otp) => {
        console.log('📧 verifyOTP (Firebase Ready):', { email, otp });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, verified: true });
            }, 600);
        });
    };

    const updatePassword = (email, newPassword) => {
        console.log('🔒 updatePassword (Firebase Ready):', { email, newPassword });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 600);
        });
    };

    // Social login placeholders
    const loginWithGoogle = () => {
        console.log('🔵 loginWithGoogle (Firebase Ready)');
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    uid: 'google_' + Date.now(),
                    displayName: 'Google User',
                    email: 'google.user@example.com',
                    phone: '',
                    photoURL: 'https://ui-avatars.com/api/?name=Google+User&background=0b1a33&color=fff',
                    membership: 'Free',
                    wallet: 0,
                    commission: 0,
                    referralCode: 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                    role: 'customer',
                    provider: 'google',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                };
                resolve(user);
            }, 800);
        });
    };

    const loginWithFacebook = () => {
        console.log('🔵 loginWithFacebook (Firebase Ready)');
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    uid: 'fb_' + Date.now(),
                    displayName: 'Facebook User',
                    email: 'fb.user@example.com',
                    phone: '',
                    photoURL: 'https://ui-avatars.com/api/?name=FB+User&background=0b1a33&color=fff',
                    membership: 'Free',
                    wallet: 0,
                    commission: 0,
                    referralCode: 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                    role: 'customer',
                    provider: 'facebook',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                };
                resolve(user);
            }, 800);
        });
    };

    const loginWithApple = () => {
        console.log('🔵 loginWithApple (Firebase Ready)');
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    uid: 'apple_' + Date.now(),
                    displayName: 'Apple User',
                    email: 'apple.user@example.com',
                    phone: '',
                    photoURL: 'https://ui-avatars.com/api/?name=Apple+User&background=0b1a33&color=fff',
                    membership: 'Free',
                    wallet: 0,
                    commission: 0,
                    referralCode: 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                    role: 'customer',
                    provider: 'apple',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                };
                resolve(user);
            }, 800);
        });
    };

    // ============================================================
    // SESSION MANAGEMENT
    // ============================================================
    const saveSession = (user, remember = false) => {
        const session = {
            user: user,
            timestamp: new Date().toISOString(),
            expiry: new Date(Date.now() + AUTH_CONFIG.sessionDuration * 24 * 60 * 60 * 1000).toISOString(),
        };
        try {
            localStorage.setItem(AUTH_CONFIG.sessionKey, JSON.stringify(session));
            if (remember) {
                localStorage.setItem(AUTH_CONFIG.rememberKey, 'true');
            } else {
                localStorage.removeItem(AUTH_CONFIG.rememberKey);
            }
            sessionStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
        } catch (e) { /* ignore */ }
        authState.user = user;
        authState.isAuthenticated = true;
        authState.isRemembered = remember;
        authState.sessionExpiry = session.expiry;
    };

    const loadSession = () => {
        try {
            // Check session storage first (current session)
            const userData = sessionStorage.getItem(AUTH_CONFIG.userKey);
            if (userData) {
                const user = JSON.parse(userData);
                authState.user = user;
                authState.isAuthenticated = true;
                return user;
            }

            // Check localStorage for persistent session
            const sessionData = localStorage.getItem(AUTH_CONFIG.sessionKey);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                const expiry = new Date(session.expiry);
                if (expiry > new Date()) {
                    authState.user = session.user;
                    authState.isAuthenticated = true;
                    authState.isRemembered = true;
                    authState.sessionExpiry = session.expiry;
                    // Restore to session storage
                    sessionStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(session.user));
                    return session.user;
                } else {
                    // Session expired
                    clearSession();
                }
            }
        } catch (e) { /* ignore */ }
        return null;
    };

    const clearSession = () => {
        try {
            localStorage.removeItem(AUTH_CONFIG.sessionKey);
            localStorage.removeItem(AUTH_CONFIG.rememberKey);
            sessionStorage.removeItem(AUTH_CONFIG.userKey);
        } catch (e) { /* ignore */ }
        authState.user = null;
        authState.isAuthenticated = false;
        authState.isRemembered = false;
        authState.sessionExpiry = null;
    };

    const checkAuth = () => {
        const user = loadSession();
        if (user) {
            updateUI(user);
            return true;
        }
        updateUI(null);
        return false;
    };

    const isAuthenticated = () => {
        return authState.isAuthenticated && authState.user !== null;
    };

    const getUser = () => {
        return authState.user;
    };

    // ============================================================
    // UI UPDATE FUNCTIONS
    // ============================================================
    const updateUI = (user) => {
        const isLoggedIn = !!user;

        // Update navigation links
        const loginLinks = document.querySelectorAll('.nav-actions a[href*="login"], .bottom-nav a[href*="login"]');
        const registerLinks = document.querySelectorAll('.nav-actions a[href*="register"], .bottom-nav a[href*="register"]');
        const dashboardLinks = document.querySelectorAll('.nav-actions a[href*="dashboard"], .bottom-nav a[href*="dashboard"]');
        const logoutLinks = document.querySelectorAll('[data-auth="logout"]');

        if (isLoggedIn) {
            loginLinks.forEach(el => {
                el.textContent = user.displayName || 'Account';
                el.href = AUTH_CONFIG.profilePage;
            });
            registerLinks.forEach(el => el.style.display = 'none');
            dashboardLinks.forEach(el => el.style.display = 'inline-flex');
            logoutLinks.forEach(el => el.style.display = 'inline-flex');

            // Update user display elements
            if (dom.userName) dom.userName.textContent = user.displayName || 'User';
            if (dom.userEmail) dom.userEmail.textContent = user.email || '';
            if (dom.userPhoto) {
                dom.userPhoto.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user
                .displayName || 'User') + '&background=0b1a33&color=fff';
                dom.userPhoto.alt = user.displayName || 'User';
            }
            if (dom.userMembership) dom.userMembership.textContent = user.membership || 'Free';
            if (dom.userWallet) dom.userWallet.textContent = '₹' + (user.wallet || 0);
            if (dom.userCommission) dom.userCommission.textContent = '₹' + (user.commission || 0);
            if (dom.userReferral) dom.userReferral.textContent = user.referralCode || '';
            if (dom.userRole) dom.userRole.textContent = user.role || 'customer';

        } else {
            loginLinks.forEach(el => {
                el.textContent = 'Login';
                el.href = AUTH_CONFIG.loginPage;
            });
            registerLinks.forEach(el => el.style.display = 'inline-flex');
            dashboardLinks.forEach(el => el.style.display = 'none');
            logoutLinks.forEach(el => el.style.display = 'none');
        }

        // Update any user display in header
        const userDisplay = document.querySelector('.user-display');
        if (userDisplay) {
            userDisplay.style.display = isLoggedIn ? 'flex' : 'none';
        }
        const guestDisplay = document.querySelector('.guest-display');
        if (guestDisplay) {
            guestDisplay.style.display = isLoggedIn ? 'none' : 'flex';
        }
    };

    // ============================================================
    // AUTHENTICATION FUNCTIONS
    // ============================================================
    const login = async (credentials, remember = false) => {
        try {
            const user = await loginUser(credentials);
            saveSession(user, remember);
            updateUI(user);
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const user = await registerUser(userData);
            saveSession(user, false);
            updateUI(user);
            return user;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
            clearSession();
            updateUI(null);
            // Redirect to home
            window.location.href = AUTH_CONFIG.homePage;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const forgotPassword = async (email) => {
        try {
            const result = await resetPassword(email);
            return result;
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    };

    const verifyAndResetPassword = async (email, otp, newPassword) => {
        try {
            const verified = await verifyOTP(email, otp);
            if (verified.success) {
                const result = await updatePassword(email, newPassword);
                return result;
            }
            throw new Error('OTP verification failed');
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    };

    const socialLogin = async (provider) => {
        try {
            let user;
            switch (provider) {
                case 'google':
                    user = await loginWithGoogle();
                    break;
                case 'facebook':
                    user = await loginWithFacebook();
                    break;
                case 'apple':
                    user = await loginWithApple();
                    break;
                default:
                    throw new Error('Unsupported provider');
            }
            saveSession(user, true);
            updateUI(user);
            return user;
        } catch (error) {
            console.error('Social login error:', error);
            throw error;
        }
    };

    // ============================================================
    // FORM HANDLERS
    // ============================================================
    const handleLogin = async (event) => {
        event.preventDefault();
        const form = event.target;
        if (!form) return;

        clearAllErrors(form);

        if (!validateForm(form)) {
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            return;
        }

        const formData = new FormData(form);
        const credentials = {
            email: formData.get('email') || formData.get('mobile') || '',
            mobile: formData.get('mobile') || formData.get('email') || '',
            password: formData.get('password') || '',
        };
        const remember = dom.rememberMe ? dom.rememberMe.checked : false;

        const submitBtn = form.querySelector('button[type="submit"]');
        showLoading(submitBtn);

        try {
            const user = await login(credentials, remember);
            hideLoading(submitBtn);
            // Redirect to dashboard
            window.location.href = AUTH_CONFIG.dashboardPage;
        } catch (error) {
            hideLoading(submitBtn);
            const errorField = form.querySelector('input[type="email"], input[type="tel"]');
            if (errorField) {
                showError(errorField, error.message || 'Invalid credentials. Please try again.');
            }
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        const form = event.target;
        if (!form) return;

        clearAllErrors(form);

        if (!validateForm(form)) {
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            return;
        }

        const formData = new FormData(form);
        const userData = {
            fullName: formData.get('fullName') || formData.get('name') || '',
            mobile: formData.get('mobile') || '',
            email: formData.get('email') || '',
            password: formData.get('password') || '',
            referralCode: formData.get('referralCode') || '',
            membership: formData.get('membership') || 'Free',
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        showLoading(submitBtn);

        try {
            const user = await register(userData);
            hideLoading(submitBtn);
            window.location.href = AUTH_CONFIG.dashboardPage;
        } catch (error) {
            hideLoading(submitBtn);
            const errorField = form.querySelector('input[type="email"]');
            if (errorField) {
                showError(errorField, error.message || 'Registration failed. Please try again.');
            }
        }
    };

    const handleForgotPassword = async (event) => {
        event.preventDefault();
        const form = event.target;
        if (!form) return;

        clearAllErrors(form);

        const emailInput = form.querySelector('input[type="email"]');
        if (!emailInput || !validateField(emailInput)) {
            if (emailInput) emailInput.focus();
            return;
        }

        const email = emailInput.value.trim();
        const submitBtn = form.querySelector('button[type="submit"]');
        showLoading(submitBtn);

        try {
            const result = await forgotPassword(email);
            hideLoading(submitBtn);
            // Show success
            const successDiv = form.querySelector('.success-message') || document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.style.cssText =
                'padding:12px;background:#e8f5e9;border-radius:8px;color:#2e7d32;margin-top:12px;text-align:center;';
            successDiv.textContent = 'Password reset link sent to your email.';
            if (!form.querySelector('.success-message')) {
                form.appendChild(successDiv);
            }
            // Clear after a while
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        } catch (error) {
            hideLoading(submitBtn);
            showError(emailInput, error.message || 'Failed to send reset link. Please try again.');
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        const form = event.target;
        if (!form) return;

        clearAllErrors(form);

        if (!validateForm(form)) {
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            return;
        }

        const formData = new FormData(form);
        const email = formData.get('email') || '';
        const otp = formData.get('otp') || '';
        const newPassword = formData.get('password') || '';

        const submitBtn = form.querySelector('button[type="submit"]');
        showLoading(submitBtn);

        try {
            const result = await verifyAndResetPassword(email, otp, newPassword);
            hideLoading(submitBtn);
            // Show success
            const successDiv = form.querySelector('.success-message') || document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.style.cssText =
                'padding:12px;background:#e8f5e9;border-radius:8px;color:#2e7d32;margin-top:12px;text-align:center;';
            successDiv.textContent = 'Password reset successfully! Redirecting to login...';
            if (!form.querySelector('.success-message')) {
                form.appendChild(successDiv);
            }
            setTimeout(() => {
                window.location.href = AUTH_CONFIG.loginPage;
            }, 2000);
        } catch (error) {
            hideLoading(submitBtn);
            const errorField = form.querySelector('input[type="email"]');
            if (errorField) {
                showError(errorField, error.message || 'Failed to reset password. Please try again.');
            }
        }
    };

    // ============================================================
    // SOCIAL LOGIN HANDLERS
    // ============================================================
    const handleSocialLogin = async (provider) => {
        const btn = document.getElementById(provider + 'LoginBtn');
        showLoading(btn);

        try {
            const user = await socialLogin(provider);
            hideLoading(btn);
            window.location.href = AUTH_CONFIG.dashboardPage;
        } catch (error) {
            hideLoading(btn);
            alert('Social login failed. Please try again.');
        }
    };

    // ============================================================
    // INITIALIZATION
    // ============================================================
    const initializeAuth = () => {
        cacheDom();

        // Check auth state
        const user = loadSession();
        authState.isLoaded = true;
        updateUI(user);

        // Login form
        if (dom.loginForm) {
            dom.loginForm.addEventListener('submit', handleLogin);
            // Real-time validation
            dom.loginForm.querySelectorAll('input').forEach(field => {
                field.addEventListener('blur', () => validateField(field));
                field.addEventListener('focus', () => clearError(field));
                field.addEventListener('input', () => {
                    if (field.classList.contains('error')) {
                        validateField(field);
                    }
                });
            });
        }

        // Register form
        if (dom.registerForm) {
            dom.registerForm.addEventListener('submit', handleRegister);
            dom.registerForm.querySelectorAll('input, select').forEach(field => {
                field.addEventListener('blur', () => validateField(field));
                field.addEventListener('focus', () => clearError(field));
                field.addEventListener('input', () => {
                    if (field.classList.contains('error')) {
                        validateField(field);
                    }
                });
                // Special: confirm password
                if (field.type === 'password' && field.id && field.id.toLowerCase().includes('confirm')) {
                    field.addEventListener('input', () => {
                        const password = dom.registerForm.querySelector(
                            'input[type="password"][id*="password"]:not([id*="confirm"])');
                        if (password && field.value && password.value !== field.value) {
                            showError(field, 'Passwords do not match');
                        } else {
                            clearError(field);
                        }
                    });
                }
            });
        }

        // Forgot password form
        if (dom.forgotForm) {
            dom.forgotForm.addEventListener('submit', handleForgotPassword);
            dom.forgotForm.querySelectorAll('input').forEach(field => {
                field.addEventListener('blur', () => validateField(field));
                field.addEventListener('focus', () => clearError(field));
            });
        }

        // Reset password form
        if (dom.resetForm) {
            dom.resetForm.addEventListener('submit', handleResetPassword);
            dom.resetForm.querySelectorAll('input').forEach(field => {
                field.addEventListener('blur', () => validateField(field));
                field.addEventListener('focus', () => clearError(field));
            });
        }

        // Logout buttons
        document.querySelectorAll('[data-auth="logout"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        });

        // Social login buttons
        if (dom.googleBtn) {
            dom.googleBtn.addEventListener('click', () => handleSocialLogin('google'));
        }
        if (dom.facebookBtn) {
            dom.facebookBtn.addEventListener('click', () => handleSocialLogin('facebook'));
        }
        if (dom.appleBtn) {
            dom.appleBtn.addEventListener('click', () => handleSocialLogin('apple'));
        }

        // Auto-redirect to dashboard if already logged in and on login/register page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (isAuthenticated() && (currentPage === AUTH_CONFIG.loginPage || currentPage === AUTH_CONFIG.registerPage)) {
            // Optional: redirect to dashboard
            // window.location.href = AUTH_CONFIG.dashboardPage;
        }

        // Expose API
        window.authAPI = {
            login,
            register,
            logout,
            forgotPassword,
            resetPassword: verifyAndResetPassword,
            socialLogin,
            loginWithGoogle,
            loginWithFacebook,
            loginWithApple,
            isAuthenticated,
            getUser,
            checkAuth,
            saveSession,
            clearSession,
            loadSession,
            updateUI,
            validateForm,
            validateField,
        };

        // Also expose individual functions for compatibility
        window.isLoggedIn = isAuthenticated;
        window.getCurrentUser = getUser;
        window.logoutUser = logout;

        console.log('Auth module initialized.');
    };

    // ============================================================
    // AUTO-INIT ON DOM READY
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuth);
    } else {
        initializeAuth();
    }

    // ============================================================
    // EXPOSE FOR TESTING
    // ============================================================
    window.__SmileAuth = {
        initializeAuth,
        login,
        register,
        logout,
        forgotPassword,
        verifyAndResetPassword,
        socialLogin,
        loginWithGoogle,
        loginWithFacebook,
        loginWithApple,
        isAuthenticated,
        getUser,
        checkAuth,
        saveSession,
        clearSession,
        loadSession,
        updateUI,
        validateForm,
        validateField,
        AUTH_CONFIG,
        authState,
    };

})();

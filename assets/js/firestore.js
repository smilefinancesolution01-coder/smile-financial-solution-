/**
 * firestore.js – Smile Financial Solution
 * Firebase v10 Modular SDK – Production Ready Firestore Service
 * Pure Vanilla ES6 Module
 */

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDemoKey1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    authDomain: "smile-financial-demo.firebaseapp.com",
    projectId: "smile-financial-demo",
    storageBucket: "smile-financial-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890",
    measurementId: "G-ABCDEFGHIJ"
};

// ============================================================
// COLLECTION NAMES
// ============================================================
const COLLECTIONS = {
    USERS: 'users',
    AGENTS: 'agents',
    MEMBERSHIPS: 'memberships',
    LEADS: 'leads',
    LOAN_APPLICATIONS: 'loanApplications',
    NOTIFICATIONS: 'notifications',
    WALLET: 'wallet',
    TRANSACTIONS: 'transactions',
    SUPPORT_TICKETS: 'supportTickets',
    SERVICES: 'services',
    FRANCHISE: 'franchise',
    SETTINGS: 'settings',
    BLOGS: 'blogs',
    TESTIMONIALS: 'testimonials',
};

// ============================================================
// STATE
// ============================================================
let firebaseApp = null;
let firestoreDb = null;
let auth = null;
let isInitialized = false;
let initPromise = null;

// ============================================================
// INITIALIZATION
// ============================================================
/**
 * Initialize Firebase and Firestore
 * @param {Object} config - Firebase config (optional, uses default if not provided)
 * @returns {Promise<Object>} - { db, auth, app }
 */
const initializeFirebase = async (config = null) => {
    if (isInitialized && firestoreDb) {
        return { db: firestoreDb, auth, app: firebaseApp };
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = new Promise(async (resolve, reject) => {
        try {
            const cfg = config || FIREBASE_CONFIG;

            // Import Firebase v10 Modular SDK
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js');
            const { getFirestore, enableIndexedDbPersistence, initializeFirestore: initFirestore, 
                   connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js');
            const { getAuth, connectAuthEmulator } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js');

            // Initialize app
            firebaseApp = initializeApp(cfg);

            // Initialize Firestore
            firestoreDb = initFirestore(firebaseApp);

            // Enable offline persistence
            try {
                await enableIndexedDbPersistence(firestoreDb);
                console.log('🔥 Firestore offline persistence enabled.');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Multiple tabs open, persistence disabled in this tab.');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Browser does not support offline persistence.');
                } else {
                    console.warn('⚠️ Persistence error:', err);
                }
            }

            // Initialize Auth
            auth = getAuth(firebaseApp);

            isInitialized = true;
            console.log('✅ Firebase & Firestore initialized successfully.');
            resolve({ db: firestoreDb, auth, app: firebaseApp });
        } catch (error) {
            console.error('❌ Firebase initialization error:', error);
            reject(error);
        }
    });

    return initPromise;
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const getDb = () => {
    if (!firestoreDb) {
        throw new Error('Firestore not initialized. Call initializeFirebase() first.');
    }
    return firestoreDb;
};

const getAuth = () => {
    if (!auth) {
        throw new Error('Auth not initialized. Call initializeFirebase() first.');
    }
    return auth;
};

const handleError = (error, context = '') => {
    console.error(`❌ Firestore Error ${context}:`, error);
    throw new Error(error.message || 'An error occurred');
};

const getTimestamp = () => {
    return new Date().toISOString();
};

const createId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// ============================================================
// GENERIC CRUD OPERATIONS
// ============================================================
const { getFirestore, collection, doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, 
        query, where, orderBy, limit, startAt, endAt, onSnapshot, addDoc, 
        serverTimestamp, runTransaction, writeBatch, arrayUnion, arrayRemove,
        increment, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js');

/**
 * Create a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID (optional, auto-generate if not provided)
 * @param {Object} data - Document data
 * @returns {Promise<Object>} - { id, data }
 */
const createDocument = async (collectionName, docId, data) => {
    try {
        const db = getDb();
        const ref = docId ? doc(db, collectionName, docId) : doc(collection(db, collectionName));
        const finalData = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            _id: docId || ref.id,
        };
        await setDoc(ref, finalData);
        return { id: ref.id, data: finalData };
    } catch (error) {
        return handleError(error, 'createDocument');
    }
};

/**
 * Update a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} - Updated document
 */
const updateDocument = async (collectionName, docId, data) => {
    try {
        const db = getDb();
        const ref = doc(db, collectionName, docId);
        const updateData = {
            ...data,
            updatedAt: serverTimestamp(),
        };
        await updateDoc(ref, updateData);
        const snapshot = await getDoc(ref);
        return { id: docId, ...snapshot.data() };
    } catch (error) {
        return handleError(error, 'updateDocument');
    }
};

/**
 * Get a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} - Document data
 */
const getDocument = async (collectionName, docId) => {
    try {
        const db = getDb();
        const ref = doc(db, collectionName, docId);
        const snapshot = await getDoc(ref);
        if (!snapshot.exists()) {
            return null;
        }
        return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
        return handleError(error, 'getDocument');
    }
};

/**
 * Delete a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteDocument = async (collectionName, docId) => {
    try {
        const db = getDb();
        const ref = doc(db, collectionName, docId);
        await deleteDoc(ref);
        return true;
    } catch (error) {
        return handleError(error, 'deleteDocument');
    }
};

/**
 * Get all documents from a collection
 * @param {string} collectionName - Collection name
 * @param {Array} conditions - Query conditions [{field, operator, value}]
 * @param {Object} options - { orderBy, limit, startAt, endAt }
 * @returns {Promise<Array>} - Array of documents
 */
const getDocuments = async (collectionName, conditions = [], options = {}) => {
    try {
        const db = getDb();
        let q = collection(db, collectionName);

        // Apply conditions
        conditions.forEach(cond => {
            q = query(q, where(cond.field, cond.operator || '==', cond.value));
        });

        // Apply ordering
        if (options.orderBy) {
            q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
        }

        // Apply limit
        if (options.limit) {
            q = query(q, limit(options.limit));
        }

        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
        });
        return results;
    } catch (error) {
        return handleError(error, 'getDocuments');
    }
};

/**
 * Real-time listener for a collection
 * @param {string} collectionName - Collection name
 * @param {Function} callback - Callback function (data) => void
 * @param {Array} conditions - Query conditions
 * @param {Object} options - { orderBy, limit }
 * @returns {Function} - Unsubscribe function
 */
const listenToCollection = (collectionName, callback, conditions = [], options = {}) => {
    try {
        const db = getDb();
        let q = collection(db, collectionName);

        conditions.forEach(cond => {
            q = query(q, where(cond.field, cond.operator || '==', cond.value));
        });

        if (options.orderBy) {
            q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
        }

        if (options.limit) {
            q = query(q, limit(options.limit));
        }

        return onSnapshot(q, (snapshot) => {
            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            callback(results);
        }, (error) => {
            console.error('Listener error:', error);
        });
    } catch (error) {
        console.error('Listener setup error:', error);
        return () => {};
    }
};

/**
 * Real-time listener for a single document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Function} callback - Callback function (data) => void
 * @returns {Function} - Unsubscribe function
 */
const listenToDocument = (collectionName, docId, callback) => {
    try {
        const db = getDb();
        const ref = doc(db, collectionName, docId);
        return onSnapshot(ref, (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Document listener error:', error);
        });
    } catch (error) {
        console.error('Document listener setup error:', error);
        return () => {};
    }
};

// ============================================================
// USERS COLLECTION
// ============================================================
const createUser = async (userData) => {
    const docId = userData.uid || userData.email || createId();
    return createDocument(COLLECTIONS.USERS, docId, {
        ...userData,
        role: userData.role || 'customer',
        membership: userData.membership || 'Free',
        wallet: userData.wallet || 0,
        commission: userData.commission || 0,
        referralCode: userData.referralCode || 'REF' + createId().substring(0, 6).toUpperCase(),
        isActive: true,
        lastLogin: serverTimestamp(),
    });
};

const updateUser = async (userId, data) => {
    return updateDocument(COLLECTIONS.USERS, userId, data);
};

const getUser = async (userId) => {
    return getDocument(COLLECTIONS.USERS, userId);
};

const getUserByEmail = async (email) => {
    const results = await getDocuments(COLLECTIONS.USERS, [
        { field: 'email', value: email }
    ]);
    return results.length > 0 ? results[0] : null;
};

const deleteUser = async (userId) => {
    return deleteDocument(COLLECTIONS.USERS, userId);
};

const getUsers = async (limitCount = 100) => {
    return getDocuments(COLLECTIONS.USERS, [], { limit: limitCount });
};

const listenUsers = (callback) => {
    return listenToCollection(COLLECTIONS.USERS, callback);
};

// ============================================================
// AGENTS COLLECTION
// ============================================================
const createAgent = async (agentData) => {
    const docId = agentData.agentId || createId();
    return createDocument(COLLECTIONS.AGENTS, docId, {
        ...agentData,
        status: agentData.status || 'pending',
        commissionRate: agentData.commissionRate || 0,
        totalCommission: agentData.totalCommission || 0,
        leadsCount: agentData.leadsCount || 0,
        isActive: true,
        createdAt: serverTimestamp(),
    });
};

const updateAgent = async (agentId, data) => {
    return updateDocument(COLLECTIONS.AGENTS, agentId, data);
};

const getAgent = async (agentId) => {
    return getDocument(COLLECTIONS.AGENTS, agentId);
};

const getAgentByUserId = async (userId) => {
    const results = await getDocuments(COLLECTIONS.AGENTS, [
        { field: 'userId', value: userId }
    ]);
    return results.length > 0 ? results[0] : null;
};

const getAgents = async (status = null) => {
    const conditions = [];
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    return getDocuments(COLLECTIONS.AGENTS, conditions);
};

const listenAgents = (callback, status = null) => {
    const conditions = [];
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    return listenToCollection(COLLECTIONS.AGENTS, callback, conditions);
};

// ============================================================
// LEADS COLLECTION
// ============================================================
const createLead = async (leadData) => {
    const docId = leadData.leadId || createId();
    return createDocument(COLLECTIONS.LEADS, docId, {
        ...leadData,
        status: leadData.status || 'new',
        source: leadData.source || 'website',
        assignedTo: leadData.assignedTo || null,
        notes: leadData.notes || '',
        isConverted: leadData.isConverted || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

const updateLead = async (leadId, data) => {
    return updateDocument(COLLECTIONS.LEADS, leadId, data);
};

const getLead = async (leadId) => {
    return getDocument(COLLECTIONS.LEADS, leadId);
};

const getLeads = async (status = null, assignedTo = null) => {
    const conditions = [];
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    if (assignedTo) {
        conditions.push({ field: 'assignedTo', value: assignedTo });
    }
    return getDocuments(COLLECTIONS.LEADS, conditions, { orderBy: { field: 'createdAt', direction: 'desc' } });
};

const deleteLead = async (leadId) => {
    return deleteDocument(COLLECTIONS.LEADS, leadId);
};

const listenLeads = (callback, status = null, assignedTo = null) => {
    const conditions = [];
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    if (assignedTo) {
        conditions.push({ field: 'assignedTo', value: assignedTo });
    }
    return listenToCollection(COLLECTIONS.LEADS, callback, conditions, 
        { orderBy: { field: 'createdAt', direction: 'desc' } });
};

// ============================================================
// LOAN APPLICATIONS COLLECTION
// ============================================================
const createLoanApplication = async (loanData) => {
    const docId = loanData.applicationId || createId();
    return createDocument(COLLECTIONS.LOAN_APPLICATIONS, docId, {
        ...loanData,
        status: loanData.status || 'pending',
        stage: loanData.stage || 'application_received',
        amount: loanData.amount || 0,
        interestRate: loanData.interestRate || 0,
        tenure: loanData.tenure || 12,
        assignedTo: loanData.assignedTo || null,
        documents: loanData.documents || [],
        notes: loanData.notes || '',
        isApproved: loanData.isApproved || false,
        approvedAmount: loanData.approvedAmount || null,
        disbursementDate: loanData.disbursementDate || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

const updateLoanApplication = async (applicationId, data) => {
    return updateDocument(COLLECTIONS.LOAN_APPLICATIONS, applicationId, data);
};

const updateLoanStatus = async (applicationId, status, notes = '') => {
    return updateDocument(COLLECTIONS.LOAN_APPLICATIONS, applicationId, {
        status,
        notes: notes,
        updatedAt: serverTimestamp(),
    });
};

const getLoanApplication = async (applicationId) => {
    return getDocument(COLLECTIONS.LOAN_APPLICATIONS, applicationId);
};

const getLoanApplications = async (status = null, userId = null) => {
    const conditions = [];
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    if (userId) {
        conditions.push({ field: 'userId', value: userId });
    }
    return getDocuments(COLLECTIONS.LOAN_APPLICATIONS, conditions, 
        { orderBy: { field: 'createdAt', direction: 'desc' } });
};

const listenLoanApplications = (callback, status = null, userId = null) => {
    const conditions = [];
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    if (userId) {
        conditions.push({ field: 'userId', value: userId });
    }
    return listenToCollection(COLLECTIONS.LOAN_APPLICATIONS, callback, conditions,
        { orderBy: { field: 'createdAt', direction: 'desc' } });
};

// ============================================================
// MEMBERSHIPS COLLECTION
// ============================================================
const saveMembership = async (membershipData) => {
    const docId = membershipData.membershipId || membershipData.userId || createId();
    return createDocument(COLLECTIONS.MEMBERSHIPS, docId, {
        ...membershipData,
        plan: membershipData.plan || 'Free',
        price: membershipData.price || 0,
        status: membershipData.status || 'active',
        startDate: membershipData.startDate || serverTimestamp(),
        expiryDate: membershipData.expiryDate || null,
        autoRenew: membershipData.autoRenew || false,
        paymentId: membershipData.paymentId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

const updateMembership = async (membershipId, data) => {
    return updateDocument(COLLECTIONS.MEMBERSHIPS, membershipId, data);
};

const getMembership = async (membershipId) => {
    return getDocument(COLLECTIONS.MEMBERSHIPS, membershipId);
};

const getMembershipByUser = async (userId) => {
    const results = await getDocuments(COLLECTIONS.MEMBERSHIPS, [
        { field: 'userId', value: userId }
    ], { orderBy: { field: 'createdAt', direction: 'desc' } });
    return results.length > 0 ? results[0] : null;
};

const getMemberships = async (status = null) => {
    const conditions = [];
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    return getDocuments(COLLECTIONS.MEMBERSHIPS, conditions);
};

// ============================================================
// NOTIFICATIONS COLLECTION
// ============================================================
const saveNotification = async (notificationData) => {
    const docId = notificationData.notificationId || createId();
    return createDocument(COLLECTIONS.NOTIFICATIONS, docId, {
        ...notificationData,
        isRead: notificationData.isRead || false,
        type: notificationData.type || 'info',
        userId: notificationData.userId || null,
        link: notificationData.link || null,
        createdAt: serverTimestamp(),
    });
};

const getNotifications = async (userId = null, isRead = null) => {
    const conditions = [];
    if (userId) {
        conditions.push({ field: 'userId', value: userId });
    }
    if (isRead !== null) {
        conditions.push({ field: 'isRead', value: isRead });
    }
    return getDocuments(COLLECTIONS.NOTIFICATIONS, conditions, 
        { orderBy: { field: 'createdAt', direction: 'desc' } });
};

const markNotificationRead = async (notificationId) => {
    return updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
        isRead: true,
        readAt: serverTimestamp(),
    });
};

const markAllNotificationsRead = async (userId) => {
    const notifications = await getNotifications(userId, false);
    const db = getDb();
    const batch = writeBatch(db);
    notifications.forEach(notif => {
        const ref = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
        batch.update(ref, { isRead: true, readAt: serverTimestamp() });
    });
    await batch.commit();
    return notifications.length;
};

const listenNotifications = (callback, userId = null) => {
    const conditions = [];
    if (userId) {
        conditions.push({ field: 'userId', value: userId });
    }
    return listenToCollection(COLLECTIONS.NOTIFICATIONS, callback, conditions,
        { orderBy: { field: 'createdAt', direction: 'desc' } });
};

// ============================================================
// WALLET COLLECTION
// ============================================================
const saveWallet = async (walletData) => {
    const docId = walletData.walletId || walletData.userId || createId();
    return createDocument(COLLECTIONS.WALLET, docId, {
        ...walletData,
        balance: walletData.balance || 0,
        currency: walletData.currency || 'INR',
        isActive: true,
        updatedAt: serverTimestamp(),
    });
};

const updateWallet = async (walletId, data) => {
    return updateDocument(COLLECTIONS.WALLET, walletId, data);
};

const getWallet = async (walletId) => {
    return getDocument(COLLECTIONS.WALLET, walletId);
};

const getWalletByUser = async (userId) => {
    const results = await getDocuments(COLLECTIONS.WALLET, [
        { field: 'userId', value: userId }
    ]);
    return results.length > 0 ? results[0] : null;
};

// ============================================================
// TRANSACTIONS COLLECTION
// ============================================================
const saveTransaction = async (transactionData) => {
    const docId = transactionData.transactionId || createId();
    return createDocument(COLLECTIONS.TRANSACTIONS, docId, {
        ...transactionData,
        type: transactionData.type || 'credit',
        status: transactionData.status || 'pending',
        amount: transactionData.amount || 0,
        currency: transactionData.currency || 'INR',
        description: transactionData.description || '',
        referenceId: transactionData.referenceId || null,
        userId: transactionData.userId || null,
        metadata: transactionData.metadata || {},
        createdAt: serverTimestamp(),
    });
};

const getTransactions = async (userId = null, type = null, status = null, limitCount = 50) => {
    const conditions = [];
    if (userId) {
        conditions.push({ field: 'userId', value: userId });
    }
    if (type) {
        conditions.push({ field: 'type', value: type });
    }
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    return getDocuments(COLLECTIONS.TRANSACTIONS, conditions, 
        { orderBy: { field: 'createdAt', direction: 'desc' }, limit: limitCount });
};

const listenTransactions = (callback, userId = null) => {
    const conditions = [];
    if (userId) {
        conditions.push({ field: 'userId', value: userId });
    }
    return listenToCollection(COLLECTIONS.TRANSACTIONS, callback, conditions,
        { orderBy: { field: 'createdAt', direction: 'desc' } });
};

// ============================================================
// SUPPORT TICKETS COLLECTION
// ============================================================
const createSupportTicket = async (ticketData) => {
    const docId = ticketData.ticketId || createId();
    return createDocument(COLLECTIONS.SUPPORT_TICKETS, docId, {
        ...ticketData,
        status: ticketData.status || 'open',
        priority: ticketData.priority || 'medium',
        category: ticketData.category || 'general',
        messages: ticketData.messages || [],
        assignedTo: ticketData.assignedTo || null,
        resolvedAt: ticketData.resolvedAt || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

const updateSupportTicket = async (ticketId, data) => {
    return updateDocument(COLLECTIONS.SUPPORT_TICKETS, ticketId, data);
};

const getSupportTicket = async (ticketId) => {
    return getDocument(COLLECTIONS.SUPPORT_TICKETS, ticketId);
};

const getSupportTickets = async (userId = null, status = null) => {
    const conditions = [];
    if (userId) {
        conditions.push({ field: 'userId', value: userId });
    }
    if (status) {
        conditions.push({ field: 'status', value: status });
    }
    return getDocuments(COLLECTIONS.SUPPORT_TICKETS, conditions,
        { orderBy: { field: 'createdAt', direction: 'desc' } });
};

// ============================================================
// SERVICES COLLECTION
// ============================================================
const createService = async (serviceData) => {
    const docId = serviceData.serviceId || createId();
    return createDocument(COLLECTIONS.SERVICES, docId, {
        ...serviceData,
        isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
        category: serviceData.category || 'general',
        price: serviceData.price || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

const updateService = async (serviceId, data) => {
    return updateDocument(COLLECTIONS.SERVICES, serviceId, data);
};

const getService = async (serviceId) => {
    return getDocument(COLLECTIONS.SERVICES, serviceId);
};

const getServices = async (category = null, isActive = true) => {
    const conditions = [];
    if (category) {
        conditions.push({ field: 'category', value: category });
    }
    if (isActive !== null) {
        conditions.push({ field: 'isActive', value: isActive });
    }
    return getDocuments(COLLECTIONS.SERVICES, conditions);
};

// ============================================================
// BATCH OPERATIONS
// ============================================================
const batchWrite = async (operations) => {
    try {
        const db = getDb();
        const batch = writeBatch(db);
        operations.forEach(op => {
            const ref = doc(db, op.collection, op.docId);
            if (op.type === 'set') {
                batch.set(ref, op.data);
            } else if (op.type === 'update') {
                batch.update(ref, op.data);
            } else if (op.type === 'delete') {
                batch.delete(ref);
            }
        });
        await batch.commit();
        return true;
    } catch (error) {
        return handleError(error, 'batchWrite');
    }
};

// ============================================================
// TRANSACTION (Atomic) OPERATIONS
// ============================================================
const runTransactionOp = async (transactionFn) => {
    try {
        const db = getDb();
        const result = await runTransaction(db, transactionFn);
        return result;
    } catch (error) {
        return handleError(error, 'runTransaction');
    }
};

// ============================================================
// EXPORT ALL FUNCTIONS
// ============================================================
const firestore = {
    // Initialization
    initializeFirebase,
    getDb,
    getAuth,

    // Generic CRUD
    createDocument,
    updateDocument,
    getDocument,
    deleteDocument,
    getDocuments,
    listenToCollection,
    listenToDocument,

    // Users
    createUser,
    updateUser,
    getUser,
    getUserByEmail,
    deleteUser,
    getUsers,
    listenUsers,

    // Agents
    createAgent,
    updateAgent,
    getAgent,
    getAgentByUserId,
    getAgents,
    listenAgents,

    // Leads
    createLead,
    updateLead,
    getLead,
    getLeads,
    deleteLead,
    listenLeads,

    // Loan Applications
    createLoanApplication,
    updateLoanApplication,
    updateLoanStatus,
    getLoanApplication,
    getLoanApplications,
    listenLoanApplications,

    // Memberships
    saveMembership,
    updateMembership,
    getMembership,
    getMembershipByUser,
    getMemberships,

    // Notifications
    saveNotification,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    listenNotifications,

    // Wallet
    saveWallet,
    updateWallet,
    getWallet,
    getWalletByUser,

    // Transactions
    saveTransaction,
    getTransactions,
    listenTransactions,

    // Support Tickets
    createSupportTicket,
    updateSupportTicket,
    getSupportTicket,
    getSupportTickets,

    // Services
    createService,
    updateService,
    getService,
    getServices,

    // Batch & Transaction
    batchWrite,
    runTransactionOp,

    // Constants
    COLLECTIONS,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    Timestamp,
};

// ============================================================
// AUTO-INITIALIZE
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeFirebase().catch(console.warn);
    });
} else {
    initializeFirebase().catch(console.warn);
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.firestore = firestore;
window.__SmileFirestore = firestore;

export default firestore;
export {
    // Initialization
    initializeFirebase,
    getDb,
    getAuth,

    // Generic CRUD
    createDocument,
    updateDocument,
    getDocument,
    deleteDocument,
    getDocuments,
    listenToCollection,
    listenToDocument,

    // Users
    createUser,
    updateUser,
    getUser,
    getUserByEmail,
    deleteUser,
    getUsers,
    listenUsers,

    // Agents
    createAgent,
    updateAgent,
    getAgent,
    getAgentByUserId,
    getAgents,
    listenAgents,

    // Leads
    createLead,
    updateLead,
    getLead,
    getLeads,
    deleteLead,
    listenLeads,

    // Loan Applications
    createLoanApplication,
    updateLoanApplication,
    updateLoanStatus,
    getLoanApplication,
    getLoanApplications,
    listenLoanApplications,

    // Memberships
    saveMembership,
    updateMembership,
    getMembership,
    getMembershipByUser,
    getMemberships,

    // Notifications
    saveNotification,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    listenNotifications,

    // Wallet
    saveWallet,
    updateWallet,
    getWallet,
    getWalletByUser,

    // Transactions
    saveTransaction,
    getTransactions,
    listenTransactions,

    // Support Tickets
    createSupportTicket,
    updateSupportTicket,
    getSupportTicket,
    getSupportTickets,

    // Services
    createService,
    updateService,
    getService,
    getServices,

    // Batch & Transaction
    batchWrite,
    runTransactionOp,

    // Constants
    COLLECTIONS,
};

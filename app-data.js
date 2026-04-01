// ============================================
// PUBG CARDS - Core Data Layer
// ============================================
//
// TABLE OF CONTENTS:
// 1.  Configuration & Constants
// 2.  Card Data & Sorting
// 3.  SHA-256 Hashing
// 4.  Session & Image Utilities
// 5.  General Utilities (showToast, timeAgo, copyToClipboard)
// 6.  Activity Logging & Reports
// 7.  Card Loading & Initialization (initApp)
// 8.  Card Operations
// 9.  User Cards Operations
// 10. User Authentication (create, login)
// 11. Trade Operations
// 12. Trade Matching
// 13. Admin Operations
// 14. Chat Operations
// 15. Admin Message
// 16. Push Notifications
// 17. Global Error Handler
// ============================================

// ============================================
// SECTION 1: CONFIGURATION & CONSTANTS
// ============================================
// Supabase connection credentials and local storage keys
// used throughout the application for API calls and session management.

const SB_URL = 'https://jbjsfwkmnjzanbzjkbuv.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpianNmd2ttbmp6YW5iemprYnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDE2NTAsImV4cCI6MjA5MDI3NzY1MH0._voRlHP-my4wUQLzTEq_-hLgrqw5r0EgpMnQNjbIk4c';

const SESSION_KEY = 'cth_session';
const IMG_BASE_KEY = 'cth_img_base_url';

let sb = null;

const DB = {
    cards: [],
    users: [],
    userCards: [],
    trades: [],
    tradeHistory: []
};

// ============================================
// SECTION 2: CARD DATA & SORTING
// ============================================
// Defines card categories (card sets) and the canonical sort order
// used to display cards in a consistent sequence.

const CARD_CATEGORIES = [
    { id: 'evolving_universe', name: 'Evolving Universe', shortName: 'Evolving Universe' },
    { id: 'jujutsu_kaisen', name: 'Jujutsu Kaisen', shortName: 'Jujutsu Kaisen' },
    { id: 'anniversary', name: 'Anniversary 2025', shortName: 'Anniversary 2025' },
    { id: 'pmgc_2025', name: 'PMGC', shortName: 'PMGC' },
    { id: 'playful_battleground', name: 'Playful Background', shortName: 'Playful Background' }
];

const CARD_SORT_ORDER = [
    'EU_evacuation_master_golden','EU_melody_strongest_team_golden','EU_raging_rush_strongest_team_golden',
    'EU_music_hall_silver','EU_racing_hall_silver','EU_dynamic_slide_hall_silver','EU_rail_parachute_challenge_silver','EU_racing_challenge_silver','EU_s_rank_vault_silver',
    'EU_a_rank_vault_basic','EU_b_rank_vault_basic','EU_anniversary_lucky_spin_basic','EU_energy_shield_basic','EU_spatial_distribution_zone_1_basic','EU_spatial_distribution_zone_2_basic','EU_floating_thruster_basic',
    'JK_jujutsu_kaisen_golden','JK_ryomen_sukuna_golden','JK_suguru_geto_golden',
    'JK_sataro_gojo_silver','JK_yuji_itadori_silver','JK_megumi_fushigoro_silver','JK_nue_silver','JK_nobara_kugisaki_silver',
    'JK_cathy_basic','JK_cursed_corpse_spear_basic','JK_inverted_spear_of_heaven_basic',
    'ANN_legendary_journey_golden','ANN_elite_collector_golden',
    'ANN_golden_age_silver','ANN_arcade_time_silver','ANN_rhythm_hero_silver','ANN_vibrant_world_silver','ANN_dino_ground_silver','ANN_ocean_odyssey_silver','ANN_golden_dynasty_silver','ANN_temporal_vault_silver',
    'PMG_champion_a7_golden','PMG_bangkok_thailand_golden','PMG_fmvp_apg_top_golden','PMG_2nd_place_ulf_golden','PMG_3rd_place_apg_golden',
    'PMG_tt_silver','PMG_dk_silver','PMG_drx_silver','PMG_dk_r_silver','PMG_ae_silver','PMG_ae_rosemary_silver','PMG_r8_amoori_silver','PMG_kara_ceo_silver','PMG_ulf_kecth_silver',
    'PMG_goat_basic','PMG_reg_basic','PMG_mad_basic','PMG_ea_basic','PMG_r8_basic','PMG_kara_basic','PMG_vpe_basic','PMG_fl_basic',
    'PB_mrbeast_golden','PB_ray_silver','PB_garand_basic','PB_tracked_amphicarrier_basic'
];

// Sorts an array of card objects according to the predefined CARD_SORT_ORDER
// @param {Array} cards - Array of card objects, each with a card_id property
// @returns {Array} - New sorted array; cards not in CARD_SORT_ORDER are placed last; returns empty array for invalid input
function sortCardsByOrder(cards) {
    if (!cards || !Array.isArray(cards)) return [];
    return cards.slice().sort((a, b) => {
        const idxA = CARD_SORT_ORDER.indexOf(a.card_id);
        const idxB = CARD_SORT_ORDER.indexOf(b.card_id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
}

// ============================================
// SECTION 3: SHA-256 HASHING
// ============================================
// Pure JavaScript implementation of the SHA-256 cryptographic hash function.
// Used for password hashing before storing in the database.

// Computes the SHA-256 hash of an ASCII string
// @param {string} ascii - The input string to hash
// @returns {string} - Hexadecimal representation of the SHA-256 hash (64 characters), or empty string if input contains non-ASCII characters
function sha256(ascii) {
    var maxWord = Math.pow(2, 32);
    var result = '';

    var words = [];
    var asciiBitLength = ascii.length * 8;

    var hash = [];
    var k = [];

    var isComposite = {};
    for (var candidate = 2; hash.length < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (var i = 0; i < 313; i += candidate) isComposite[i] = candidate;
            hash.push((Math.pow(candidate, 0.5) * maxWord) | 0);
            k.push((Math.pow(candidate, 1 / 3) * maxWord) | 0);
        }
    }

    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (var i = 0; i < ascii.length; i++) {
        var j = ascii.charCodeAt(i);
        if (j >> 8) return '';
        words[i >> 2] = (words[i >> 2] || 0) | j << ((3 - i) % 4) * 8;
    }
    words.push((asciiBitLength / maxWord) | 0);
    words.push(asciiBitLength | 0);

    for (var j = 0; j < words.length;) {
        var w = words.slice(j, j += 16);
        var oldHash = hash.slice(0, 8);
        for (var i = 0; i < 64; i++) {
            var w15 = w[i - 15] || 0, w2 = w[i - 2] || 0;
            var a = hash[0], e = hash[4];
            var sigma0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
            var sigma1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
            var maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
            var ch = (e & hash[5]) ^ (~e & hash[6]);
            if (w[i] === undefined) {
                w[i] = (w[i - 16] + (((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3))
                    + w[i - 7] + (((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10))) | 0;
            }
            var temp1 = (hash[7] + sigma1 + ((e & hash[5]) ^ (~e & hash[6])) + k[i] + (w[i] || 0)) | 0;
            var temp2 = (sigma0 + maj) | 0;
            hash = [temp1 + temp2, a, hash[1], hash[2], hash[3] + temp1, hash[4], hash[5], hash[6]];
        }
        for (var i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }

    for (var i = 0; i < 8; i++) {
        for (var j = 3; j >= 0; j--) {
            var b = (hash[i] >> (j * 8)) & 255;
            result += (b < 16 ? '0' : '') + b.toString(16);
        }
    }
    return result;
}

// ============================================
// SECTION 4: SESSION & IMAGE UTILITIES
// ============================================
// Functions for managing user sessions (localStorage), constructing
// card image URLs, and retrieving user contact information.

// Retrieves the custom image base URL from localStorage
// @returns {string} - The stored base URL or empty string if not set
function getImgBaseUrl() {
    return localStorage.getItem(IMG_BASE_KEY) || '';
}

// Stores a custom image base URL in localStorage
// @param {string} url - The base URL to store for card images
// @returns {void}
// @side effect - Writes to localStorage
function setImgBaseUrl(url) {
    localStorage.setItem(IMG_BASE_KEY, url);
}

// Constructs the full image URL for a card object
// @param {object} card - Card object with an image_filename property
// @returns {string} - Full URL to the card image (uses custom base if set, otherwise Supabase storage URL with .webp extension)
function getCardImageUrl(card) {
    // Check for manually set URL first
    const base = getImgBaseUrl();
    if (base) return base.replace(/\/$/, '') + '/' + card.image_filename;
    
    // Auto-construct Supabase Storage URL
    // Convert .png filename to .webp (or use as-is)
    const filename = card.image_filename.replace(/\.png$/, '.webp');
    return `${SB_URL}/storage/v1/object/public/card-images/${filename}`;
}

// Retrieves the currently logged-in user from localStorage
// @returns {object|null} - Parsed user session object with username and is_admin, or null if not logged in / parse error
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

// Saves a user session object to localStorage
// @param {object} user - The user session object to persist (typically contains username and is_admin)
// @returns {void}
// @side effect - Writes to localStorage
function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// Clears the current user session from localStorage
// @returns {void}
// @side effect - Removes session data from localStorage
function logout() {
    localStorage.removeItem(SESSION_KEY);
}

// Fetches contact info (WhatsApp, Discord) for a given username from the database
// @param {string} username - The username to look up contact info for
// @returns {Promise<object>} - Object with whatsapp, discord, and username properties; returns default empty strings if not found or offline
async function getUserContact(username) {
    if (!sb) return { whatsapp: '', discord: '', username };
    try {
        const { data } = await sb.from('users').select('whatsapp, discord, username').eq('username', username).maybeSingle();
        return data || { whatsapp: '', discord: '', username };
    } catch {
        return { whatsapp: '', discord: '', username };
    }
}

// ============================================
// SECTION 5: GENERAL UTILITIES + FAVORABILITY
// ============================================
// Utility functions for UI feedback (toasts, loading), favorability scoring,
// time formatting, and clipboard operations.

// Retrieves a user's favorability score from the database
// @param {string} username - The username to look up
// @returns {Promise<number>} - The favorability score (defaults to 100 if not found or offline)
async function getUserFavorability(username) {
    if (!sb) return 100;
    try {
        const { data } = await sb.from('users').select('favorability').eq('username', username).maybeSingle();
        return data?.favorability || 100;
    } catch { return 100; }
}

// Maps a favorability score to a display badge with color, label, and icon
// @param {number} score - The favorability score (0+)
// @returns {object} - Badge object with color (hex), label (string), and icon (string); tiers: Elite (>=150), Trusted (>=120), Standard (>=80), New (>=50), Risky (<50)
function getFavorabilityBadge(score) {
    if (score >= 150) return { color: '#f0c040', label: 'Elite', icon: '★' };
    if (score >= 120) return { color: '#00d4aa', label: 'Trusted', icon: '◆' };
    if (score >= 80) return { color: '#8b90b0', label: 'Standard', icon: '●' };
    if (score >= 50) return { color: '#ff8c42', label: 'New', icon: '○' };
    return { color: '#ff4d6a', label: 'Risky', icon: '!' };
}

// Displays a toast notification to the user, falling back to console.log if window.showToast is unavailable
// @param {string} msg - The message to display
// @param {string} [type='info'] - The toast type/severity (e.g. 'success', 'error', 'info')
// @returns {void}
// @side effect - Shows a UI toast or logs to console
function showToast(msg, type) {
    if (typeof window.showToast === 'function') {
        window.showToast(msg, type);
    } else {
        console.log(`[${type || 'info'}] ${msg}`);
    }
}

// Adds a 'loading' CSS class to a DOM element to indicate loading state
// @param {HTMLElement} el - The DOM element to mark as loading
// @returns {void}
// @side effect - Modifies the element's classList
function showLoading(el) {
    if (el) {
        el.classList.add('loading');
    }
}

// Converts a date string into a human-readable relative time string
// @param {string} dateStr - ISO date string or any date-parseable string
// @returns {string} - Relative time label (e.g. 'just now', '5m ago', '3h ago', '2d ago') or locale date string for older dates; empty string if input is falsy
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString();
}

// Copies text to the system clipboard and shows a toast notification
// @param {string} text - The text to copy
// @returns {Promise<void>}
// @side effect - Writes to clipboard and shows a success/error toast
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    } catch {
        showToast('Failed to copy', 'error');
    }
}

// ============================================
// SECTION 6: ACTIVITY LOGGING & REPORTS
// ============================================
// Functions for recording user activity events, submitting and managing
// user reports/feedback, and admin response handling.

// Logs a user activity event to the activity_log table
// @param {string} username - The username performing the activity
// @param {string} activityType - The type/category of activity (e.g. 'login', 'register', 'trade_sent')
// @param {string} details - Human-readable description of the activity
// @returns {Promise<void>}
// @side effect - Inserts a row into the activity_log table
async function logActivity(username, activityType, details) {
    if (!sb) return;
    try {
        await sb.from('activity_log').insert({
            username: username,
            activity_type: activityType,
            details: details
        });
    } catch {}
}

// Retrieves recent activity log entries, ordered newest first
// @param {number} [limit=50] - Maximum number of entries to return
// @returns {Promise<Array>} - Array of activity log objects, or empty array if offline/error
async function getActivityLog(limit = 50) {
    if (!sb) return [];
    try {
        const { data } = await sb.from('activity_log').select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        return data || [];
    } catch { return []; }
}

// Submits a user report or feedback entry to the database
// @param {string} username - The username submitting the report
// @param {string} type - Report type, either 'report' or 'feedback'
// @param {string} subject - The subject line of the report
// @param {string} content - The full body text of the report
// @returns {Promise<object>} - Result object with success (boolean) and error (string) on failure
// @side effect - Inserts into reports table and logs the activity
async function submitReport(username, type, subject, content) {
    if (!sb) return { success: false, error: 'Not connected' };
    try {
        const { error } = await sb.from('reports').insert({
            username: username,
            report_type: type,
            subject: subject,
            content: content
        });
        if (error) return { success: false, error: error.message };
        logActivity(username, type === 'report' ? 'report_sent' : 'feedback_sent', username + ' sent ' + type + ': ' + subject);
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
}

// Retrieves all reports/feedback entries ordered newest first (admin use)
// @returns {Promise<Array>} - Array of report objects, or empty array if offline/error
async function getAllReports() {
    if (!sb) return [];
    try {
        const { data } = await sb.from('reports').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
}

// Updates the status and optional admin response for a report (admin use)
// @param {string|number} reportId - The ID of the report to update
// @param {string} status - The new status value (e.g. 'resolved', 'dismissed')
// @param {string} [adminResponse=''] - Optional response message from the admin
// @returns {Promise<void>}
// @side effect - Updates a row in the reports table
async function updateReportStatus(reportId, status, adminResponse = '') {
    if (!sb) return;
    try {
        await sb.from('reports').update({ status, admin_response: admin_response }).eq('id', reportId);
    } catch {}
}

// ============================================
// SECTION 7: CARD LOADING & INITIALIZATION + CACHING
// ============================================
// Handles loading card data from Supabase (with localStorage caching),
// initializing the Supabase client, and bootstrapping the application.

// Card cache for performance
const CARD_CACHE_KEY = 'cth_cards_cache';
const CARD_CACHE_TIME_KEY = 'cth_cards_cache_time';
const CARD_CACHE_DURATION = 3600000; // 1 hour

// Loads active cards from Supabase into DB.cards, using localStorage cache if still valid
// @returns {Promise<void>}
// @side effect - Populates DB.cards and writes to localStorage cache on fresh load
async function loadCardsFromSB() {
    // Check cache first
    const cached = localStorage.getItem(CARD_CACHE_KEY);
    const cacheTime = localStorage.getItem(CARD_CACHE_TIME_KEY);
    if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CARD_CACHE_DURATION) {
        try {
            DB.cards = JSON.parse(cached);
            console.log('Cards loaded from cache:', DB.cards.length);
            return;
        } catch {}
    }
    
    if (!sb) return;
    try {
        const { data } = await sb.from('cards').select('*').eq('is_active', true).order('card_id');
        if (data) {
            DB.cards = data;
            localStorage.setItem(CARD_CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CARD_CACHE_TIME_KEY, Date.now().toString());
            console.log('Cards loaded from Supabase:', data.length);
        }
    } catch (e) {
        console.warn('Load cards failed:', e);
    }
}

// Clears the card cache from localStorage, forcing a fresh fetch on next load
// @returns {void}
// @side effect - Removes card cache entries from localStorage
function clearCardCache() {
    localStorage.removeItem(CARD_CACHE_KEY);
    localStorage.removeItem(CARD_CACHE_TIME_KEY);
}

// Initializes the application: waits for Supabase CDN, creates the client, loads cards,
// ensures the admin account exists, and loads the logged-in user's data
// @returns {Promise<void>}
// @side effect - Initializes global sb client, populates DB.cards/DB.userCards/DB.trades, creates admin user if missing, clears old chats
async function initApp() {
    // Wait for Supabase CDN to load (max 5 seconds)
    for (let i = 0; i < 50; i++) {
        if (window.supabase) break;
        await new Promise(r => setTimeout(r, 100));
    }
    
    if (window.supabase && !sb) {
        sb = window.supabase.createClient(SB_URL, SB_KEY);
        window.sbClient = sb; // Make available globally for other scripts
        console.log('SB: Client initialized');
    }
    
    await loadCardsFromSB();
    console.log('SB: Cards loaded:', DB.cards.length);
    
    if (sb) {
        try {
            // Create admin if not exists
            const { data: adminUser } = await sb.from('users').select('username').eq('username', 'CatLover78').maybeSingle();
            if (!adminUser) {
                const hash = sha256('Ilovecutecats.75');
                await sb.from('users').insert({ username: 'CatLover78', password_hash: hash, is_admin: true, favorability: 100 });
                console.log('SB: Admin account created');
            }

            // If user is logged in, load their data (with cache check)
            const session = getCurrentUser();
            if (session) {
                const userCacheTime = parseInt(localStorage.getItem('cth_user_cache_time') || '0');
                const cacheAge = Date.now() - userCacheTime;
                
                if (cacheAge > 15000 || DB.userCards.length === 0) {
                    const { data: sbCards } = await sb.from('user_cards').select('*').eq('username', session.username);
                    if (sbCards) {
                        DB.userCards = DB.userCards.filter(uc => uc.username !== session.username);
                        DB.userCards.push(...sbCards);
                        console.log('SB: Loaded', sbCards.length, 'cards for', session.username);
                    }
                    const { data: sbTrades } = await sb.from('trades').select('*')
                        .or(`requester.eq.${session.username},receiver.eq.${session.username}`);
                    if (sbTrades) {
                        DB.trades = DB.trades.filter(t => t.requester !== session.username && t.receiver !== session.username);
                        DB.trades.push(...sbTrades);
                    }
                    localStorage.setItem('cth_user_cache_time', Date.now().toString());
                }
            }
            // Auto-clear chats older than 5 days (fire and forget)
            clearOldChats();
            console.log('SB: Init complete');
        } catch (e) {
            console.warn('SB Init error:', e);
        }
    } else {
        console.warn('SB: Supabase client not available');
    }
}

// ============================================
// SECTION 8: CARD OPERATIONS
// ============================================
// Read-only accessors for the locally cached card catalog.

// Returns all cards from the local cache
// @returns {Array} - Array of all card objects in DB.cards
function getAllCards() {
    return DB.cards;
}

// Returns only active cards from the local cache
// @returns {Array} - Array of card objects where is_active is true
function getActiveCards() {
    return DB.cards.filter(c => c.is_active);
}

// Filters cards by both category and type
// @param {string} cat - The category ID to filter by (e.g. 'evolving_universe')
// @param {string} type - The card type to filter by (e.g. 'golden', 'silver', 'basic')
// @returns {Array} - Array of matching card objects
function getCardsByCategoryAndType(cat, type) {
    return DB.cards.filter(c => c.category === cat && c.type === type);
}

// Finds a single card by its card_id
// @param {string} id - The card_id to search for
// @returns {object|null} - The matching card object, or null if not found
function getCardById(id) {
    return DB.cards.find(c => c.card_id === id) || null;
}

// ============================================
// SECTION 9: USER CARDS OPERATIONS
// ============================================
// CRUD operations for user card collections, syncing between
// the local DB cache and Supabase.

// Fetches all cards owned by a specific user from Supabase and updates the local cache
// @param {string} username - The username whose cards to retrieve
// @returns {Promise<Array>} - Array of user card objects with card_id and quantity, or empty array on failure
// @side effect - Updates DB.userCards with fresh data for the user
async function getUserCards(username) {
    if (!sb) return [];
    try {
        const { data, error } = await sb.from('user_cards').select('*').eq('username', username);
        if (!error && data) {
            DB.userCards = DB.userCards.filter(uc => uc.username !== username);
            DB.userCards.push(...data);
            return data;
        }
    } catch (e) {
        console.warn('Failed to get user cards:', e);
    }
    return [];
}

// Gets the quantity of a specific card owned by a user
// @param {string} username - The username to check
// @param {string} cardId - The card_id to look up
// @returns {Promise<number>} - The quantity owned (0 if none, offline, or error)
async function getUserCardQuantity(username, cardId) {
    if (!sb) return 0;
    try {
        const { data } = await sb.from('user_cards').select('quantity').eq('username', username).eq('card_id', cardId).maybeSingle();
        return data ? data.quantity : 0;
    } catch {
        return 0;
    }
}

// Bulk-upserts multiple card entries for a user, replacing their entire collection
// @param {string} username - The username whose cards to set
// @param {Array<{card_id: string, quantity: number}>} entries - Array of card entries to upsert
// @returns {Promise<void>}
// @side effect - Upserts rows in user_cards table, rebuilds DB.userCards for the user, invalidates local cache, logs activity
async function setUserCards(username, entries) {
    if (!sb) return;
    const now = new Date().toISOString();
    for (const entry of entries) {
        if (entry.quantity > 0) {
            await sb.from('user_cards').upsert({
                username: username,
                card_id: entry.card_id,
                quantity: entry.quantity,
                last_updated: now
            }, { onConflict: 'username,card_id' });
        }
    }
    
    DB.userCards = DB.userCards.filter(uc => uc.username !== username);
    entries.forEach(entry => {
        if (entry.quantity > 0) {
            DB.userCards.push({
                username: username,
                card_id: entry.card_id,
                quantity: entry.quantity,
                last_updated: now
            });
        }
    });
    localStorage.setItem('cth_user_cache_time', '0'); // invalidate cache
    logActivity(username, 'cards_updated', username + ' updated collection');
}

// Updates a single card quantity for a user, deleting the entry if quantity <= 0
// @param {string} username - The username whose card to update
// @param {string} cardId - The card_id to update
// @param {number} qty - The new quantity (deletes entry if <= 0)
// @returns {Promise<void>}
// @side effect - Upserts or deletes a row in user_cards table and updates DB.userCards accordingly
async function updateUserCardQty(username, cardId, qty) {
    if (!sb) return;
    const now = new Date().toISOString();
    
    if (qty <= 0) {
        await sb.from('user_cards').delete().eq('username', username).eq('card_id', cardId);
        DB.userCards = DB.userCards.filter(uc => !(uc.username === username && uc.card_id === cardId));
    } else {
        await sb.from('user_cards').upsert({
            username: username,
            card_id: cardId,
            quantity: qty,
            last_updated: now
        }, { onConflict: 'username,card_id' });
        
        const idx = DB.userCards.findIndex(uc => uc.username === username && uc.card_id === cardId);
        if (idx >= 0) {
            DB.userCards[idx].quantity = qty;
            DB.userCards[idx].last_updated = now;
        } else {
            DB.userCards.push({ username, card_id: cardId, quantity: qty, last_updated: now });
        }
    }
}

// Checks whether a user has completed their initial card setup
// @param {string} username - The username to check
// @returns {boolean} - True if the user has at least one card entry in the local cache
function hasCompletedSetup(username) {
    return DB.userCards.filter(uc => uc.username === username).length > 0;
}

// ============================================
// SECTION 10: USER AUTHENTICATION
// ============================================
// User registration and login functions, handling password hashing,
// session creation, and initial data loading.

// Creates a new user account with hashed password and optional contact info
// @param {string} username - Desired username (cannot be 'admin')
// @param {string} password - Plain-text password (will be SHA-256 hashed)
// @param {string} contactType - Type of contact: 'whatsapp' or 'discord'
// @param {string} contactValue - The contact handle/number
// @returns {Promise<object>} - Result object with success (boolean), user (object on success), or error (string on failure)
// @side effect - Inserts into users table, sets session, logs registration activity
async function createUser(username, password, contactType, contactValue) {
    if (!sb) return { success: false, error: 'Supabase not initialized' };
    if (username.toLowerCase() === 'admin') return { success: false, error: 'Reserved username' };
    
    try {
        const { data: existing } = await sb.from('users').select('username').ilike('username', username).maybeSingle();
        if (existing) {
            return { success: false, error: 'Username already taken' };
        }
    } catch (e) {
        console.warn('Check existing:', e);
    }
    
    const passwordHash = sha256(password);
    const now = new Date().toISOString();
    
    try {
        const { data, error } = await sb.from('users').insert({
            username: username,
            password_hash: passwordHash,
            whatsapp: contactType === 'whatsapp' ? contactValue : '',
            discord: contactType === 'discord' ? contactValue : '',
            favorability: 100,
            created_at: now,
            last_login: now,
            is_admin: false
        }).select().single();
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        const user = data;
        DB.users.push(user);
        
        setSession({ username: user.username, is_admin: user.is_admin });
        logActivity(username, 'register', username + ' created account');
        
        // Tag OneSignal with username
        try {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
                OneSignal.login(user.username);
                OneSignal.User.addTag('username', user.username);
            });
        } catch (e) {}
        
        return { success: true, user: { username: user.username, is_admin: user.is_admin } };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// Authenticates a user by username and password, loading their cards and trades on success
// @param {string} username - The username to log in (case-insensitive lookup)
// @param {string} password - Plain-text password (compared via SHA-256 hash)
// @returns {Promise<object>} - Result object with success (boolean), user (object on success), or error (string on failure)
// @side effect - Updates last_login in DB, sets session, populates DB.userCards and DB.trades, logs login activity
async function loginUser(username, password) {
    if (!sb) return { success: false, error: 'Supabase not initialized' };
    
    try {
        const { data: user, error } = await sb.from('users').select('*').ilike('username', username).maybeSingle();
        if (error || !user) {
            return { success: false, error: 'User not found' };
        }
        
        const passwordHash = sha256(password);
        if (user.password_hash !== passwordHash) {
            return { success: false, error: 'Invalid password' };
        }
        
        user.last_login = new Date().toISOString();
        await sb.from('users').update({ last_login: user.last_login }).eq('username', user.username);
        
        const idx = DB.users.findIndex(u => u.username === user.username);
        if (idx >= 0) {
            DB.users[idx] = user;
        } else {
            DB.users.push(user);
        }
        
        const { data: sbCards } = await sb.from('user_cards').select('*').eq('username', user.username);
        if (sbCards) {
            DB.userCards = DB.userCards.filter(uc => uc.username !== user.username);
            DB.userCards.push(...sbCards);
        }
        
        const { data: sbTrades } = await sb.from('trades').select('*')
            .or(`requester.eq.${user.username},receiver.eq.${user.username}`);
        if (sbTrades) {
            DB.trades = DB.trades.filter(t => t.requester !== user.username && t.receiver !== user.username);
            DB.trades.push(...sbTrades);
        }
        
        setSession({ username: user.username, is_admin: user.is_admin });
        logActivity(username, 'login', username + ' logged in');
        
        // Tag OneSignal with username for push notifications
        try {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
                OneSignal.login(user.username);
                OneSignal.User.addTag('username', user.username);
            });
        } catch (e) {}
        
        return { success: true, user: { username: user.username, is_admin: user.is_admin } };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// ============================================
// SECTION 11: TRADE OPERATIONS
// ============================================
// Functions for creating, querying, confirming, and rejecting trades
// between users, including favorability adjustments.

// Fetches all pending incoming trades for a user (where they are the receiver)
// @param {string} username - The username to get incoming trades for
// @returns {Promise<Array>} - Array of pending trade objects, or empty array on failure
async function getIncomingTrades(username) {
    if (!sb) return [];
    try {
        const { data } = await sb.from('trades').select('*').eq('receiver', username).eq('status', 'pending');
        return data || [];
    } catch {
        return [];
    }
}

// Fetches all outgoing trades发起 by a user (where they are the requester)
// @param {string} username - The username to get outgoing trades for
// @returns {Promise<Array>} - Array of trade objects, or empty array on failure
async function getOutgoingTrades(username) {
    if (!sb) return [];
    try {
        const { data } = await sb.from('trades').select('*').eq('requester', username);
        return data || [];
    } catch {
        return [];
    }
}

// Fetches all trades involving a user (as requester or receiver), newest first
// @param {string} username - The username to get trades for
// @returns {Promise<Array>} - Array of trade objects ordered by created_at descending, or empty array on failure
async function getTradesForUser(username) {
    if (!sb) return [];
    try {
        const { data } = await sb.from('trades').select('*')
            .or(`requester.eq.${username},receiver.eq.${username}`)
            .order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
}

// Checks for an existing pending or accepted trade between two users
// @param {string} user1 - First username
// @param {string} user2 - Second username
// @returns {Promise<object|null>} - The existing trade object if found, or null
async function getExistingTradeBetween(user1, user2) {
    if (!sb) return null;
    try {
        const { data } = await sb.from('trades').select('*')
            .or(`and(requester.eq.${user1},receiver.eq.${user2}),and(requester.eq.${user2},receiver.eq.${user1})`)
            .in('status', ['pending', 'accepted'])
            .maybeSingle();
        return data || null;
    } catch { return null; }
}

// Cancels a trade by setting its status to 'rejected' with a cancellation reason
// @param {string} tradeId - The trade_id to cancel
// @param {string} username - The username requesting the cancellation
// @returns {Promise<boolean>} - Success/failure from updateTradeStatus
async function cancelTradeAsReject(tradeId, username) {
    await updateTradeStatus(tradeId, 'rejected', 'Cancelled by ' + username);
}

// Creates a new trade request, checking for duplicates and 3-day cooldown on same card pairs
// @param {string} requester - The username initiating the trade
// @param {string} receiver - The username receiving the trade request
// @param {string} requesterCardId - The card_id the requester is offering
// @param {string} receiverCardId - The card_id the requester wants in return
// @param {string} cardType - The type of the cards being traded (e.g. 'golden', 'silver')
// @returns {Promise<object>} - Result object with success (boolean), trade (object on success), or error (string on failure)
// @side effect - Inserts into trades table, updates DB.trades, logs trade_sent activity
async function createTrade(requester, receiver, requesterCardId, receiverCardId, cardType) {
    if (!sb) return { success: false, error: 'Supabase not initialized' };
    
    try {
        // Check for existing pending trade between these users
        const { data: existing } = await sb.from('trades').select('*')
            .eq('status', 'pending')
            .or(`and(requester.eq.${requester},receiver.eq.${receiver}),and(requester.eq.${receiver},receiver.eq.${requester})`)
            .maybeSingle();
        
        if (existing) {
            return { success: false, error: 'You already have a pending trade with this user' };
        }

        // 3-day cooldown for same card pair
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentTrades } = await sb.from('trades').select('*')
            .or(`and(requester.eq.${requester},receiver.eq.${receiver}),and(requester.eq.${receiver},receiver.eq.${requester})`)
            .gte('created_at', threeDaysAgo)
            .in('status', ['completed', 'rejected']);

        if (recentTrades && recentTrades.length > 0) {
            const hasSamePair = recentTrades.some(t =>
                (t.requester_card_id === requesterCardId && t.receiver_card_id === receiverCardId) ||
                (t.requester_card_id === receiverCardId && t.receiver_card_id === requesterCardId)
            );
            if (hasSamePair) {
                return { success: false, error: 'This card pair was already traded recently. Wait 3 days.' };
            }
        }
    } catch {}
    
    const now = new Date().toISOString();
    const tradeId = 'T' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    try {
        const { data, error } = await sb.from('trades').insert({
            trade_id: tradeId,
            requester: requester,
            receiver: receiver,
            requester_card_id: requesterCardId,
            receiver_card_id: receiverCardId,
            card_type: cardType,
            status: 'pending',
            created_at: now,
            updated_at: now,
            reject_reason: '',
            confirmed_by_requester: false,
            confirmed_by_receiver: false
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        DB.trades.push(data);
        logActivity(requester, 'trade_sent', requester + ' sent trade to ' + receiver);
        
        // Send push notification to receiver
        try {
            sendPushNotification(receiver, 'New Trade Request', `${requester} wants to trade with you!`);
        } catch (e) {}
        
        return { success: true, trade: data };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// Updates a trade's status in Supabase and the local cache, adjusting favorability on rejection
// @param {string} tradeId - The trade_id to update
// @param {string} status - The new status value (e.g. 'rejected', 'completed')
// @param {string} [reason=''] - Optional rejection reason
// @returns {Promise<boolean>} - True if update succeeded, false otherwise
// @side effect - Updates trades table, modifies DB.trades, adjusts requester's favorability on rejection, logs activity
async function updateTradeStatus(tradeId, status, reason = '') {
    if (!sb) return false;
    
    const now = new Date().toISOString();
    
    try {
        const updateObj = { status, updated_at: now };
        if (reason) updateObj.reject_reason = reason;
        
        const { error } = await sb.from('trades').update(updateObj).eq('trade_id', tradeId);
        if (error) return false;
        
        const idx = DB.trades.findIndex(t => t.trade_id === tradeId);
        if (idx >= 0) {
            DB.trades[idx].status = status;
            DB.trades[idx].updated_at = now;
            if (reason) DB.trades[idx].reject_reason = reason;
        }
        
        if (status === 'rejected' && DB.trades[idx]) {
            const requester = DB.trades[idx].requester;
            await adjustFavorability(requester, -10);
        }
        
        // Notify requester when trade is accepted
        if (status === 'accepted' && DB.trades[idx]) {
            const requester = DB.trades[idx].requester;
            const receiver = DB.trades[idx].receiver;
            try {
                sendPushNotification(requester, 'Trade Accepted!', `${receiver} accepted your trade!`);
            } catch (e) {}
        }
        
        logActivity('system', 'trade_status', tradeId + ' -> ' + status);
        return true;
    } catch {
        return false;
    }
}

// Adjusts a user's favorability score by a delta value (clamped to minimum 0)
// @param {string} username - The username whose favorability to adjust
// @param {number} delta - The amount to add (can be negative); result is clamped to 0 minimum
// @returns {Promise<void>}
// @side effect - Updates favorability column in the users table
async function adjustFavorability(username, delta) {
    if (!sb) return;
    try {
        const { data: user } = await sb.from('users').select('favorability').eq('username', username).maybeSingle();
        if (user) {
            const newFav = Math.max(0, (user.favorability || 100) + delta);
            await sb.from('users').update({ favorability: newFav }).eq('username', username);
        }
    } catch {}
}

// Confirms a trade by calling the atomic RPC function; executes the swap when both parties confirm
// @param {string} tradeId - The trade_id to confirm
// @param {string} username - The username confirming the trade
// @returns {Promise<boolean>} - True if the confirmation succeeded, false on error
// @side effect - Calls confirm_and_execute_trade RPC, updates DB.trades status, refreshes DB.userCards on completion, logs activity
async function confirmTrade(tradeId, username) {
    if (!sb) return false;
    
    try {
        // Call the atomic RPC function
        const { data, error } = await sb.rpc('confirm_and_execute_trade', {
            p_trade_id: tradeId,
            p_confirming_user: username
        });
        
        console.log('RPC result:', data, 'error:', error);
        
        if (error) {
            console.warn('Confirm trade RPC error:', error.message);
            console.timeEnd('confirmTrade');
            return false;
        }
        
        if (!data) {
            console.warn('RPC returned null data');
            console.timeEnd('confirmTrade');
            return false;
        }
        
        // Update local cache
        const idx = DB.trades.findIndex(t => t.trade_id === tradeId);
        if (idx >= 0) {
            if (data.both_confirmed) {
                DB.trades[idx].status = 'completed';
            } else {
                const { data: updated } = await sb.from('trades').select('*').eq('trade_id', tradeId).maybeSingle();
                if (updated) DB.trades[idx] = updated;
            }
        }
        
        // If trade completed, refresh user cards from DB
        if (data.both_confirmed) {
            console.log('Both confirmed - refreshing cards');
            const session = getCurrentUser();
            if (session) {
                const { data: freshCards } = await sb.from('user_cards').select('*').eq('username', session.username);
                if (freshCards) {
                    DB.userCards = DB.userCards.filter(uc => uc.username !== session.username);
                    DB.userCards.push(...freshCards);
                    console.log('Cards refreshed:', freshCards.length);
                }
            }
            logActivity(username, 'trade_completed', 'Trade ' + tradeId + ' completed');
        }
        
        console.timeEnd('confirmTrade');
        return true;
    } catch (e) {
        console.warn('Confirm trade failed:', e);
        return false;
    }
}

// Fetches the complete trade history ordered by completion date descending
// @returns {Promise<Array>} - Array of trade history objects, or empty array on failure
async function getTradeHistory() {
    if (!sb) return [];
    try {
        const { data } = await sb.from('trade_history').select('*').order('completed_at', { ascending: false });
        return data || [];
    } catch {
        return [];
    }
}

// Fetches a single trade by its trade_id
// @param {string} tradeId - The trade_id to look up
// @returns {Promise<object|null>} - The trade object if found, or null
async function getTradeById(tradeId) {
    if (!sb) return null;
    try {
        const { data } = await sb.from('trades').select('*').eq('trade_id', tradeId).maybeSingle();
        return data;
    } catch { return null; }
}

// ============================================
// SECTION 12: TRADE MATCHING
// ============================================
// Algorithm for finding potential trade partners based on card wants/needs
// and mutual benefit scoring.

// Finds users who have a wanted card (qty >= 2) and scores them by mutual trade potential and favorability
// @param {string} username - The username searching for matches
// @param {string} wantedCardId - The card_id the user wants to acquire
// @returns {Promise<Array>} - Array of match objects sorted by mutual_score desc then favorability proximity to 100; each has username, they_have, they_need, mutual_score, favorability
async function findMatches(username, wantedCardId) {
    if (!sb) return [];
    
    const wantedCard = getCardById(wantedCardId);
    if (!wantedCard) return [];
    
    try {
        console.time('findMatches');
        
        // BULK QUERY 1: Get ALL extra cards from ALL users (quantity >= 2)
        const { data: globalPool } = await sb.from('user_cards')
            .select('username, card_id, quantity')
            .gte('quantity', 2)
            .neq('username', username);
        
        if (!globalPool || globalPool.length === 0) {
            console.timeEnd('findMatches');
            return [];
        }
        
        // BULK QUERY 2: Get my cards
        const { data: myCards } = await sb.from('user_cards')
            .select('card_id, quantity')
            .eq('username', username);
        
        const myCardsList = myCards || [];
        
        // In-memory processing (takes < 5ms)
        // Find who has the wanted card (quantity >= 2)
        const owners = globalPool.filter(uc => uc.card_id === wantedCardId);
        
        if (owners.length === 0) {
            console.timeEnd('findMatches');
            return [];
        }
        
        // Build lookup: which cards does each owner have?
        const ownerCardsMap = {};
        for (const uc of globalPool) {
            if (!ownerCardsMap[uc.username]) ownerCardsMap[uc.username] = new Set();
            ownerCardsMap[uc.username].add(uc.card_id);
        }
        
        // My extra cards of the same type
        const myExtraSameType = myCardsList.filter(mc => {
            const card = getCardById(mc.card_id);
            return card && card.type === wantedCard.type && mc.quantity >= 2;
        }).map(mc => mc.card_id);
        
        // BULK QUERY 3: Get favorability for all owners
        const ownerUsernames = [...new Set(owners.map(o => o.username))];
        const { data: ownerUsers } = await sb.from('users')
            .select('username, favorability')
            .in('username', ownerUsernames);
        const favorabilityMap = {};
        if (ownerUsers) {
            ownerUsers.forEach(u => { favorabilityMap[u.username] = u.favorability || 100; });
        }

        // Score each owner
        const matches = [];
        const seenUsers = new Set();
        
        for (const owner of owners) {
            if (seenUsers.has(owner.username)) continue;
            seenUsers.add(owner.username);
            
            const ownerCards = ownerCardsMap[owner.username] || new Set();
            const mutualNeeds = myExtraSameType.filter(cardId => !ownerCards.has(cardId));
            const favorability = favorabilityMap[owner.username] || 100;
            
            matches.push({
                username: owner.username,
                wanted_card_id: wantedCardId,
                they_have: wantedCardId,
                they_need: mutualNeeds,
                mutual_score: mutualNeeds.length,
                favorability: favorability
            });
        }
        
        // Sort: mutual score desc, then favorability proximity to 100 (closer = better)
        matches.sort((a, b) => {
            if (b.mutual_score !== a.mutual_score) return b.mutual_score - a.mutual_score;
            return Math.abs(a.favorability - 100) - Math.abs(b.favorability - 100);
        });
        
        console.timeEnd('findMatches');
        return matches;
    } catch (e) {
        console.warn('Find matches failed:', e);
        return [];
    }
}

// ============================================
// SECTION 13: ADMIN OPERATIONS
// ============================================
// Administrative functions for user management, statistics,
// data export, and account maintenance.

// Retrieves all users with aggregated card counts and trade statistics (admin use)
// @returns {Promise<Array>} - Array of enriched user objects with cards_owned and trades_completed counts, or empty array on failure
async function adminGetAllUsers() {
    if (!sb) return [];
    try {
        const { data: users } = await sb.from('users').select('*');
        if (!users) return [];
        
        const result = [];
        for (const user of users) {
            const { data: cards } = await sb.from('user_cards').select('quantity').eq('username', user.username);
            const { count: tradesCount } = await sb.from('trade_history').select('id', { count: 'exact' })
                .or(`requester.eq.${user.username},receiver.eq.${user.username}`);
            
            result.push({
                username: user.username,
                whatsapp: user.whatsapp,
                discord: user.discord,
                created_at: user.created_at,
                last_login: user.last_login,
                is_admin: user.is_admin,
                favorability: user.favorability,
                cards_owned: (cards || []).reduce((sum, c) => sum + c.quantity, 0),
                trades_completed: tradesCount || 0
            });
        }
        
        return result;
    } catch {
        return [];
    }
}

// Retrieves aggregate platform statistics (admin dashboard use)
// @returns {Promise<object>} - Stats object with total_users, total_cards, total_trades, success_rate, trades_completed, trades_rejected, trades_pending, and most_owned (top 5 cards)
async function adminGetStats() {
    if (!sb) return { total_users: 0, total_cards: 0, total_trades: 0, success_rate: 0, trades_completed: 0, trades_rejected: 0, trades_pending: 0, most_owned: [] };
    
    try {
        const { count: userCount } = await sb.from('users').select('*', { count: 'exact', head: true });
        const { count: tradeCount } = await sb.from('trades').select('*', { count: 'exact', head: true });
        const { count: pendingCount } = await sb.from('trades').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: completedCount } = await sb.from('trades').select('*', { count: 'exact', head: true }).eq('status', 'completed');
        const { count: rejectedCount } = await sb.from('trades').select('*', { count: 'exact', head: true }).eq('status', 'rejected');
        
        const successRate = tradeCount > 0 ? Math.round((completedCount / tradeCount) * 100) : 0;
        
        // Get most owned cards
        const { data: cardCounts } = await sb.from('user_cards').select('card_id, quantity');
        const cardMap = {};
        if (cardCounts) {
            cardCounts.forEach(c => { cardMap[c.card_id] = (cardMap[c.card_id] || 0) + c.quantity; });
        }
        const mostOwned = Object.entries(cardMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cardId, count]) => ({ card: getCardById(cardId), count }));
        
        return {
            total_users: userCount || 0,
            total_cards: getActiveCards().length,
            total_trades: tradeCount || 0,
            success_rate: successRate,
            trades_completed: completedCount || 0,
            trades_rejected: rejectedCount || 0,
            trades_pending: pendingCount || 0,
            most_owned: mostOwned
        };
    } catch (e) {
        console.warn('Stats error:', e);
        return { total_users: 0, total_cards: 0, total_trades: 0, success_rate: 0, trades_completed: 0, trades_rejected: 0, trades_pending: 0, most_owned: [] };
    }
}

// Deletes all card entries for a user (admin reset operation)
// @param {string} username - The username whose cards to reset
// @returns {Promise<void>}
// @side effect - Deletes rows from user_cards table and removes entries from DB.userCards
async function adminResetUserCards(username) {
    if (!sb) return;
    await sb.from('user_cards').delete().eq('username', username);
    DB.userCards = DB.userCards.filter(uc => uc.username !== username);
}

// Toggles the admin status of a user (admin use)
// @param {string} username - The username whose admin status to toggle
// @returns {Promise<void>}
// @side effect - Updates is_admin column in the users table
async function adminToggleAdmin(username) {
    if (!sb) return;
    try {
        const { data: user } = await sb.from('users').select('is_admin').eq('username', username).maybeSingle();
        if (user) {
            await sb.from('users').update({ is_admin: !user.is_admin }).eq('username', username);
        }
    } catch {}
}

// Adjusts a user's favorability score by a delta (admin convenience wrapper)
// @param {string} username - The username whose favorability to adjust
// @param {number} delta - The amount to add to the favorability score
// @returns {Promise<void>}
// @side effect - Delegates to adjustFavorability which updates the users table
async function adminUpdateFavorability(username, delta) {
    await adjustFavorability(username, delta);
}

// Exports all database tables as a single JSON object (admin backup use)
// @returns {Promise<object|null>} - Object containing users, cards, user_cards, trades, trade_history, and exported_at timestamp; null on failure
async function exportAllData() {
    if (!sb) return null;
    
    try {
        const { data: users } = await sb.from('users').select('*');
        const { data: cards } = await sb.from('cards').select('*');
        const { data: userCards } = await sb.from('user_cards').select('*');
        const { data: trades } = await sb.from('trades').select('*');
        const { data: tradeHistory } = await sb.from('trade_history').select('*');
        
        return {
            users,
            cards,
            user_cards: userCards,
            trades,
            trade_history: tradeHistory,
            exported_at: new Date().toISOString()
        };
    } catch (e) {
        console.warn('Export failed:', e);
        return null;
    }
}

// ============================================
// SECTION 14: CHAT OPERATIONS
// ============================================
// Functions for managing direct messaging between users,
// including conversations, messages, and read tracking.

// Generates a deterministic conversation ID from two usernames (alphabetical order)
// @param {string} user1 - First username
// @param {string} user2 - Second username
// @returns {string} - Conversation ID in the format 'smallerUsername_largerUsername'
function getConversationId(user1, user2) {
    return [user1, user2].sort().join('_');
}

// Fetches all conversations involving a user, ordered by most recent activity
// @param {string} username - The username to get conversations for
// @returns {Promise<Array>} - Array of conversation objects, or empty array on failure
async function getConversations(username) {
    if (!sb) return [];
    try {
        const { data } = await sb.from('conversations').select('*')
            .or(`user1.eq.${username},user2.eq.${username}`)
            .order('updated_at', { ascending: false });
        return data || [];
    } catch { return []; }
}

// Fetches all messages in a conversation, ordered chronologically oldest first
// @param {string} conversationId - The conversation ID to retrieve messages for
// @returns {Promise<Array>} - Array of message objects, or empty array on failure
async function getMessages(conversationId) {
    if (!sb) return [];
    try {
        const { data } = await sb.from('messages').select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        return data || [];
    } catch { return []; }
}

// Sends a message in a conversation, creating/updating the conversation record and clearing deleted flags
// @param {string} conversationId - The conversation ID to send the message in
// @param {string} sender - The username sending the message
// @param {string} receiver - The username receiving the message
// @param {string} content - The message text content
// @param {string} [messageType='text'] - The message type (e.g. 'text', 'trade_offer')
// @param {string|null} [tradeId=null] - Optional associated trade_id for trade-related messages
// @returns {Promise<object|null>} - The inserted message object, or null on failure
// @side effect - Upserts conversation record, clears localStorage deleted-chat flags, inserts message row, logs activity
async function sendMessage(conversationId, sender, receiver, content, messageType = 'text', tradeId = null) {
    if (!sb) return null;
    try {
        await sb.from('conversations').upsert({
            id: conversationId,
            user1: sender < receiver ? sender : receiver,
            user2: sender < receiver ? receiver : sender,
            last_message: content.substring(0, 100),
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        // Clear deleted flag for both users when a new message is sent
        for (const u of [sender, receiver]) {
            const key = 'cth_deleted_chats_' + u;
            const deleted = JSON.parse(localStorage.getItem(key) || '[]');
            const filtered = deleted.filter(id => id !== conversationId);
            if (filtered.length !== deleted.length) {
                localStorage.setItem(key, JSON.stringify(filtered));
            }
        }

        const { data, error } = await sb.from('messages').insert({
            conversation_id: conversationId,
            sender: sender,
            content: content,
            message_type: messageType,
            trade_id: tradeId
        }).select().single();

        if (error) { console.warn('Send msg error:', error); return null; }

        // Send push notification to receiver
        if (sender !== receiver && messageType === 'text') {
            try {
                sendPushNotification(receiver, 'New Message', `${sender}: ${content.substring(0, 50)}`);
            } catch (e) {}
        }

        logActivity(sender, 'message_sent', sender + ' -> ' + receiver);
        return data;
    } catch (e) { console.warn('Send msg error:', e); return null; }
}

// Counts total unread messages across all conversations for a user
// @param {string} username - The username to count unread messages for
// @returns {Promise<number>} - Total count of unread messages from other users, or 0 on failure
async function getUnreadCount(username) {
    if (!sb) return 0;
    try {
        const conversations = await getConversations(username);
        let total = 0;
        for (const conv of conversations) {
            const { count } = await sb.from('messages').select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .neq('sender', username)
                .eq('is_read', false);
            total += (count || 0);
        }
        return total;
    } catch { return 0; }
}

// Marks all unread messages in a conversation as read for a specific user
// @param {string} conversationId - The conversation ID to mark messages in
// @param {string} username - The username whose read status to update (marks messages NOT sent by this user)
// @returns {Promise<void>}
// @side effect - Updates is_read column in the messages table
async function markMessagesRead(conversationId, username) {
    if (!sb) return;
    try {
        await sb.from('messages').update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender', username)
            .eq('is_read', false);
    } catch {}
}

// Deletes messages and conversations older than 5 days to keep the database lean
// @returns {Promise<void>}
// @side effect - Deletes old rows from messages and conversations tables
async function clearOldChats() {
    if (!sb) return;
    try {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        // Delete old messages
        await sb.from('messages').delete().lt('created_at', fiveDaysAgo);
        // Delete old conversations with no recent messages
        await sb.from('conversations').delete().lt('updated_at', fiveDaysAgo);
    } catch (e) {
        console.warn('Clear old chats:', e.message);
    }
}

// ============================================
// SECTION 15: ADMIN MESSAGE
// ============================================
// Functions for managing a global admin broadcast message displayed to all users.

// Retrieves the current admin broadcast message from the app_config table
// @returns {Promise<object>} - Object with heading (string), message (string), and mode ('once' or 'always'); defaults to empty values if not set
async function getAdminMessage() {
    if (!sb) return { heading: '', message: '', mode: 'once' };
    try {
        const { data: headingData } = await sb.from('app_config').select('value').eq('key', 'admin_msg_heading').maybeSingle();
        const { data: msgData } = await sb.from('app_config').select('value').eq('key', 'admin_message').maybeSingle();
        const { data: modeData } = await sb.from('app_config').select('value').eq('key', 'admin_message_mode').maybeSingle();
        return {
            heading: headingData?.value || '',
            message: msgData?.value || '',
            mode: modeData?.value || 'once'
        };
    } catch { return { heading: '', message: '', mode: 'once' }; }
}

// Sets or updates the global admin broadcast message
// @param {string} heading - The heading/title of the broadcast message
// @param {string} message - The body text of the broadcast message
// @param {string} mode - Display mode: 'once' (show once per user) or 'always' (show every session)
// @returns {Promise<void>}
// @side effect - Upserts three rows in the app_config table
async function setAdminMessage(heading, message, mode) {
    if (!sb) return;
    try {
        await sb.from('app_config').upsert({ key: 'admin_msg_heading', value: heading }, { onConflict: 'key' });
        await sb.from('app_config').upsert({ key: 'admin_message', value: message }, { onConflict: 'key' });
        await sb.from('app_config').upsert({ key: 'admin_message_mode', value: mode }, { onConflict: 'key' });
    } catch {}
}

// ============================================
// SECTION 16: PUSH NOTIFICATIONS
// ============================================
// Push notifications are handled by OneSignal (initialized in shared-components.js).
// The following functions provide compatibility with the existing notification toggle.

// Checks whether the user has enabled notifications
// @returns {boolean} - True if notifications are enabled
function getNotificationPref() {
    return isOneSignalSubscribed();
}

// Stores the user's notification preference
// @param {boolean} enabled - Whether to enable or disable notifications
function setNotificationPref(enabled) {
    setOneSignalSubscribed(enabled);
}

// ============================================
// SECTION 17: GLOBAL ERROR HANDLER
// ============================================
// Catches runtime errors caused by cached stale scripts and displays
// a user-friendly refresh prompt.

window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('is not defined')) {
        var app = document.getElementById('app');
        if (app && !app.querySelector('.cache-error')) {
            app.innerHTML = '<div class="cache-error" style="text-align:center;padding:40px;color:var(--text-dim);"><p style="margin-bottom:12px;">Your browser has cached an old version.</p><button onclick="location.href=location.pathname+\'?v=\'+Date.now()" class="btn btn-teal" style="padding:12px 24px;border:none;border-radius:12px;background:var(--teal);color:var(--bg);font-weight:700;cursor:pointer;font-family:Rajdhani,sans-serif;letter-spacing:0.05em;">REFRESH NOW</button></div>';
        }
    }
});

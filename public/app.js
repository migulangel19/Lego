// --- State Management ---
let legoSets = [];
let filteredSets = [];
let minifigures = [];
let filteredMinifigures = [];
let activeThemeFilter = 'all';
let activeView = 'sets'; // 'sets' or 'minifigs'
let editingLegoId = null;
let deletingLegoId = null;
let currentSetMinifigs = [];

// --- Helpers ---
// Escape text for safe insertion into HTML (names, notes...)
function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Encode a value as a JS argument inside an inline handler: onclick="fn(${jsArg(x)})"
function jsArg(value) {
    return esc(JSON.stringify(String(value ?? '')));
}

// Normalise a theme name into one of the category keys used by the UI
function themeKey(theme) {
    const t = (theme || '').toLowerCase();
    if (t.includes('star wars') || t.includes('starwars')) return 'starwars';
    if (t.includes('batman')) return 'batman';
    if (t.includes('pirate') || t.includes('pirata')) return 'pirates';
    if (t.includes('harry potter') || t.includes('harrypotter')) return 'harrypotter';
    return 'other';
}

// Map the category card data-theme value to a theme key
const THEME_FILTER_KEYS = {
    'Star Wars': 'starwars',
    'Batman': 'batman',
    'Pirates of the Caribbean': 'pirates',
    'Harry Potter': 'harrypotter',
    'other': 'other'
};

function matchesThemeFilter(theme) {
    if (activeThemeFilter === 'all') return true;
    return themeKey(theme) === THEME_FILTER_KEYS[activeThemeFilter];
}

const STATUS_INFO = {
    needed: { label: 'Necesitada', badge: 'badge-needed' },
    ordered: { label: 'Pedida', badge: 'badge-ordered' },
    received: { label: 'Recibida', badge: 'badge-received' }
};

// --- Star Wars minifigure factions ---
// Only Star Wars figures are classified. Computed on the fly from the figure's name, never
// stored: any new figure is classified automatically. Order matters, first match wins (e.g. Sith before Jedi so
// Darth Vader isn't a Jedi; bounty hunters before Mandalorians so Boba Fett is a hunter).
// A figure whose name matches no keyword falls into "Otros": add the keyword here.
const FACTIONS = [
    { key: 'pirates', label: 'Piratas', icon: '🏴‍☠️',
      words: ['pirate', 'pirata', 'hondo', 'kragan', 'brutus'] },
    { key: 'sith', label: 'Sith', icon: '🔴',
      words: ['darth', 'vader', 'sidious', 'palpatine', 'emperor', 'dooku', 'maul', 'ventress', 'savage opress',
              'inquisitor', 'sith', 'drk-1', 'kylo ren'] },
    { key: 'bountyhunters', label: 'Cazarrecompensas', icon: '🎯',
      words: ['bounty hunter', 'boba fett', 'jango fett', 'bossk', 'ig-88', 'ig-11', 'dengar', 'greedo',
              'cad bane', 'aurra sing', 'embo', 'zuckuss', '4-lom', 'fennec', 'bazine'] },
    { key: 'commanders', label: 'Comandantes', icon: '🎖️',
      words: ['commander', 'captain rex', 'cody', 'wolffe', 'bly', 'gree', 'bacara', 'fox', 'neyo', 'appo',
              'echo', 'fives', 'hevy', 'kix', 'jesse', 'clone captain', 'arc trooper', 'arf trooper'] },
    { key: 'clones', label: 'Clones', icon: '🪖', words: ['clone', 'bad batch'] },
    { key: 'jedi', label: 'Jedi', icon: '🟢',
      words: ['jedi', 'obi-wan', 'anakin', 'ahsoka', 'mace windu', 'yoda', 'plo koon', 'qui-gon', 'luke skywalker',
              'kit fisto', 'shaak ti', 'ki-adi-mundi', 'saesee tiin', 'eeth koth', 'luminara', 'barriss',
              'aayla', 'kelleran beq', 'even piell', 'adi gallia', 'agen kolar', 'depa billaba', 'cal kestis',
              'rey', 'ezra', 'kanan'] },
    { key: 'astromechs', label: 'Astromecánicos', icon: '🔵',
      words: ['astromech', 'r2-d2', 'r2-', 'r4-', 'r5-', 'r7-', 'r8-', 'bb-8', 'chopper'] },
    { key: 'separatists', label: 'Droides separatistas', icon: '🤖',
      words: ['battle droid', 'droideka', 'destroyer droid', 'spider droid', 'commando droid', 'tactical droid',
              'buzz droid', 'grievous', 'magnaguard', 'nute gunray', 'separatist'] },
    { key: 'empire', label: 'Imperio', icon: '⚫',
      words: ['stormtrooper', 'snowtrooper', 'sandtrooper', 'scout trooper', 'shadow trooper', 'tie pilot',
              'tie fighter pilot', 'imperial', 'death star', 'sentry droid', 'tarkin', 'death trooper'] },
    { key: 'mandalorians', label: 'Mandalorianos', icon: '🛡️',
      words: ['mandalorian', 'death watch', 'pre vizsla', 'bo-katan', 'din djarin', 'din grogu', 'grogu',
              'the child', 'armorer', 'sabine'] },
    { key: 'senators', label: 'Senadores', icon: '🏛️',
      words: ['senator', 'senate', 'chancellor', 'amidala', 'padmé', 'padme', 'bail organa', 'mon mothma',
              'jar jar', 'mas amedda', 'riyo chuchi', 'onaconda farr'] },
    { key: 'rebels', label: 'Rebeldes', icon: '✊',
      words: ['rebel', 'resistance', 'leia', 'han solo', 'chewbacca', 'lando', 'wedge', 'biggs', 'ackbar',
              'x-wing pilot', 'y-wing pilot', 'a-wing pilot', 'hoth', 'cassian', 'jyn erso', 'hera', 'c-3po',
              'poe dameron', 'finn'] }
];
const OTHER_FACTION = { key: 'other', label: 'Otros', icon: '🧩' };

// Returns the faction key for a Star Wars figure, or null for any other theme
function minifigFaction(name, theme) {
    if (themeKey(theme) !== 'starwars') return null;
    // "Clone Wars" is an era, not a faction (e.g. "Obi-Wan Kenobi - Clone Wars")
    const n = (name || '').toLowerCase().replace(/clone wars/g, '');
    // Match whole words/phrases so "fox" doesn't match "foxtrot" and "rey" doesn't match "grey".
    // Boundaries only apply on letter edges, so prefixes like "r2-" still match "r2-d2".
    const hasWord = (w) => {
        const body = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const start = /^[a-z]/.test(w) ? '(^|[^a-z])' : '';
        const end = /[a-z]$/.test(w) ? '($|[^a-z])' : '';
        return new RegExp(start + body + end).test(n);
    };
    const match = FACTIONS.find(f => f.words.some(hasWord));
    return match ? match.key : OTHER_FACTION.key;
}

let activeFactionFilter = 'all';
let activeSubthemeFilter = 'all';

// External catalogue links for a minifigure. Codes come from two catalogues: Rebrickable
// ("fig-XXXXXX") or BrickLink ("sw0001c"...). Link straight to the item where the code is
// native, and fall back to a name search on the other sites.
function minifigCatalogLinks(code, name) {
    const isRebrickable = code.startsWith('fig-');
    const c = encodeURIComponent(code);
    const n = encodeURIComponent(name);
    return {
        bricklink: isRebrickable
            ? `https://www.bricklink.com/v2/search.page?q=${n}`
            : `https://www.bricklink.com/v2/catalog/catalogitem.page?M=${c}`,
        rebrickable: isRebrickable
            ? `https://rebrickable.com/minifigs/${c}/`
            : `https://rebrickable.com/search/?show_printed=on&search_type=minifig&q=${n}`,
        brickeconomy: `https://www.brickeconomy.com/search?query=${isRebrickable ? n : c}`
    };
}

function pluralSets(n) {
    return `${n} ${n === 1 ? 'set' : 'sets'}`;
}


// --- DOM Elements ---
const setsGrid = document.getElementById('sets-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const themeTabs = document.getElementById('theme-tabs');
const filterGoalSelect = document.getElementById('filter-goal');
const sortSelect = document.getElementById('sort-select');

// Navigation & View containers
const navSets = document.getElementById('nav-sets');
const navMinifigs = document.getElementById('nav-minifigs');
const navShoppingList = document.getElementById('nav-shopping-list');
const navGoals = document.getElementById('nav-goals');
const setsKpis = document.getElementById('sets-kpis');
const minifigsKpis = document.getElementById('minifigs-kpis');
const shoppingListKpis = document.getElementById('shopping-list-kpis');
const minifigsGrid = document.getElementById('minifigs-grid');
const shoppingListView = document.getElementById('shopping-list-view');
const goalsView = document.getElementById('goals-view');
const goalsFoldersContainer = document.getElementById('goals-folders-container');
const goalsSearchResults = document.getElementById('goals-search-results');
const goalsSearchInput = document.getElementById('goals-search-input');
const btnSearchGoals = document.getElementById('btn-search-goals');
const shoppingListContainer = document.getElementById('shopping-list-container');

// KPI elements for Shopping List
const valTotalMissingParts = document.getElementById('val-total-missing-parts');
const valMissingPartsTypes = document.getElementById('val-missing-parts-types');
const valOrderedMissingParts = document.getElementById('val-ordered-missing-parts');
const valReceivedMissingParts = document.getElementById('val-received-missing-parts');
const valShoppingPartsCost = document.getElementById('val-shopping-parts-cost');
const valPartsCost = document.getElementById('val-parts-cost');
const valPartsCostSub = document.getElementById('val-parts-cost-sub');
const btnGroupBySet = document.getElementById('btn-group-by-set');
const btnGroupByPart = document.getElementById('btn-group-by-part');

// Add Piece Modal elements
const btnAddPiece = document.getElementById('btn-add-piece');
const pieceModal = document.getElementById('piece-modal');
const pieceForm = document.getElementById('piece-form');
const btnClosePieceModal = document.getElementById('btn-close-piece-modal');
const btnCancelPiece = document.getElementById('btn-cancel-piece');

// Piece Detail Modal elements (Ficha Completa)
const pieceDetailModal = document.getElementById('piece-detail-modal');
const btnClosePieceDetail = document.getElementById('btn-close-piece-detail');
const btnClosePieceDetailFooter = document.getElementById('btn-close-piece-detail-footer');
const pieceDetailTitle = document.getElementById('piece-detail-title');
const pieceDetailBadge = document.getElementById('piece-detail-badge');
const pieceDetailQtyDisplay = document.getElementById('piece-detail-qty-display');
const pieceDetailImage = document.getElementById('piece-detail-image');
const pieceDetailImgBadge = document.getElementById('piece-detail-img-badge');
const pieceDetailImgLink = document.getElementById('piece-detail-img-link');
const pieceDetailPartNum = document.getElementById('piece-detail-part-num');
const pieceDetailColorName = document.getElementById('piece-detail-color-name');
const pieceDetailColorDot = document.getElementById('piece-detail-color-swatch');
const pieceDetailColorId = document.getElementById('piece-detail-color-id');
const pieceDetailSetInfo = document.getElementById('piece-detail-set-info');
const pieceDetailSetBox = document.getElementById('piece-detail-set-box');
const pieceDetailMultisetContainer = document.getElementById('piece-detail-multiset-container');
const pieceDetailMultisetList = document.getElementById('piece-detail-multiset-list');
const pieceDetailStatusSelect = document.getElementById('piece-detail-status-select');
const pieceDetailQtyField = document.getElementById('piece-detail-qty-field');
const pieceDetailQtyInput = document.getElementById('piece-detail-qty-input');
const btnPieceQtyDec = document.getElementById('btn-piece-qty-dec');
const btnPieceQtyInc = document.getElementById('btn-piece-qty-inc');
const pieceLinkBricklink = document.getElementById('piece-link-bricklink');
const pieceLinkLego = document.getElementById('piece-link-lego');
const pieceLinkBrickowl = document.getElementById('piece-link-brickowl');
const pieceLinkToypro = document.getElementById('piece-link-toypro');
const pieceLinkRebrickable = document.getElementById('piece-link-rebrickable');
const btnCopyPartNum = document.getElementById('btn-copy-part-num');
const pieceDetailBtnDelete = document.getElementById('piece-detail-btn-delete');
let activeInspectedPiece = null;
let activeInspectedMultiPieces = null;

// Parts Modal Elements
const partsModal = document.getElementById('parts-modal');
const partsModalSetTitle = document.getElementById('parts-modal-set-title');
const btnClosePartsModal = document.getElementById('btn-close-parts-modal');
const btnClosePartsModalFooter = document.getElementById('btn-close-parts-modal-footer');
const tabCurrentMissing = document.getElementById('tab-current-missing');
const tabOfficialInventory = document.getElementById('tab-official-inventory');
const tabManualAdd = document.getElementById('tab-manual-add');
const paneCurrentMissing = document.getElementById('pane-current-missing');
const paneOfficialInventory = document.getElementById('pane-official-inventory');
const paneManualAdd = document.getElementById('pane-manual-add');
const currentMissingList = document.getElementById('current-missing-list');
const officialInventoryGrid = document.getElementById('official-inventory-grid');
const officialInventoryLoading = document.getElementById('official-inventory-loading');
const inventorySearchInput = document.getElementById('inventory-search-input');
const manualPartForm = document.getElementById('manual-part-form');

// KPI elements for Sets
const valTotalSpent = document.getElementById('val-total-spent');
const subSpentExtra = document.getElementById('sub-spent-extra');
const valTotalSaved = document.getElementById('val-total-saved');
const valAvgSavingPct = document.getElementById('val-avg-saving-pct');
const valInvestmentProfit = document.getElementById('val-investment-profit');
const valInvestmentRoiPct = document.getElementById('val-investment-roi-pct');
const valPortfolioEquity = document.getElementById('val-portfolio-equity');
const valCollectionSetsCount = document.getElementById('val-collection-sets-count');
const valLegacyCount = document.getElementById('val-legacy-count');

// KPI elements for Minifigures
const valTotalMinifigs = document.getElementById('val-total-minifigs');
const valUniqueMinifigs = document.getElementById('val-unique-minifigs');
const valArmyLeader = document.getElementById('val-army-leader');
const valArmyLeaderSub = document.getElementById('val-army-leader-sub');

// Modals and Forms
const btnAddSet = document.getElementById('btn-add-set');
const btnAddMinifig = document.getElementById('btn-add-minifig');
const setModal = document.getElementById('set-modal');
const setModalContainer = setModal ? setModal.querySelector('.modal-container') : null;
const setForm = document.getElementById('set-form');
const modalTitle = document.getElementById('modal-title');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');

const deleteModal = document.getElementById('delete-modal');
const deleteSetName = document.getElementById('delete-set-name');
const deleteSetId = document.getElementById('delete-set-id');
const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// Form fields
const fieldId = document.getElementById('field-id');
const fieldName = document.getElementById('field-name');
const fieldTheme = document.getElementById('field-theme');
const fieldSubcategory = document.getElementById('field-subcategory');
const fieldOfficialUrl = document.getElementById('field-official-url');
const fieldReleaseDate = document.getElementById('field-release-date');
const fieldRetirementDate = document.getElementById('field-retirement-date');
const fieldPurchaseDate = document.getElementById('field-purchase-date');
const fieldRetailPrice = document.getElementById('field-retail-price');
const fieldPurchasePrice = document.getElementById('field-purchase-price');
const fieldMarketPrice = document.getElementById('field-market-price');
const fieldExtraCosts = document.getElementById('field-extra-costs');
const fieldPartsCost = document.getElementById('field-parts-cost');
const fieldPurchaseStore = document.getElementById('field-purchase-store');
const fieldPurchaseLocation = document.getElementById('field-purchase-location');
const fieldCondition = document.getElementById('field-condition');
const fieldGoal = document.getElementById('field-goal');
const fieldNotes = document.getElementById('field-notes');
const fieldImageUrl = document.getElementById('field-image-url');

// Category Hero Banner Elements
const categoryHero = document.getElementById('category-hero');
const heroLogo = document.getElementById('hero-logo');
const heroTitle = document.getElementById('hero-title');
const heroSubtitle = document.getElementById('hero-subtitle');

// Visual Category Count Elements
const countAll = document.getElementById('count-all');
const countSw = document.getElementById('count-sw');
const countBat = document.getElementById('count-bat');
const countPir = document.getElementById('count-pir');
const countHp = document.getElementById('count-hp');
const countOther = document.getElementById('count-other');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetchLegoSets();
    fetchMissingPieces();
    setupEventListeners();
});


// --- API Functions ---
async function fetchLegoSets() {
    try {
        const response = await fetch('/api/legos');
        if (!response.ok) throw new Error('Error al cargar la base de datos de Lego');
        legoSets = await response.json();
        applyFiltersAndSort();
    } catch (error) {
        showError('No se pudo comunicar con el servidor backend. Asegúrate de iniciar FastAPI con uvicorn.', error);
    }
}

async function fetchMinifigures() {
    try {
        minifigsGrid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Extrayendo y procesando minifiguras de forma automática...</p>
                <p class="loading-sub">Esto puede tardar unos segundos la primera vez para limpiar los fondos de las fotos.</p>
            </div>
        `;
        minifigsGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        const response = await fetch('/api/minifigs');
        if (!response.ok) throw new Error('Error al cargar la colección de minifiguras');
        minifigures = await response.json();
        applyFiltersAndSort();
    } catch (error) {
        showError('No se pudieron obtener las minifiguras desde el backend.', error);
    }
}


async function saveLegoSet(event) {
    event.preventDefault();

    const setPayload = {
        id: fieldId.value.trim(),
        name: fieldName.value.trim(),
        theme: fieldTheme.value.trim(),
        subcategory: fieldSubcategory.value.trim(),
        purchase_date: fieldPurchaseDate.value || "",
        release_date: fieldReleaseDate.value,
        retirement_date: fieldRetirementDate.value.trim(),
        official_url: fieldOfficialUrl.value.trim(),
        retail_price: parseFloat(fieldRetailPrice.value) || 0.0,
        purchase_price: parseFloat(fieldPurchasePrice.value) || 0.0,
        market_price: parseFloat(fieldMarketPrice.value) || 0.0,
        extra_costs: parseFloat(fieldExtraCosts.value) || 0.0,
        parts_cost: parseFloat(fieldPartsCost ? fieldPartsCost.value : 0) || 0.0,
        purchase_store: fieldPurchaseStore.value.trim(),
        purchase_location: fieldPurchaseLocation.value.trim(),
        condition: fieldCondition.value,
        goal: fieldGoal.value,
        notes: fieldNotes.value.trim(),
        image_url: fieldImageUrl.value.trim()
    };

    try {
        let response;
        if (editingLegoId) {
            response = await fetch(`/api/legos/${editingLegoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(setPayload)
            });
        } else {
            response = await fetch('/api/legos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(setPayload)
            });
        }

        const data = await response.json();
        
        if (!response.ok) {
            // Check for validation error detail
            const errorMsg = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : 'Error en la validación de campos';
            throw new Error(errorMsg);
        }

        // Add any unchecked minifigures to missing pieces
        const missingFigs = currentSetMinifigs.filter(f => !f.present);
        for (const fig of missingFigs) {
            const payload = {
                set_id: setPayload.id,
                part_num: fig.fig_num,
                name: fig.name,
                color_id: 0,
                color_name: 'N/A',
                quantity: fig.quantity,
                status: 'needed',
                image_url: fig.img_url
            };
            try {
                await fetch('/api/missing-pieces', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                console.error('Error adding missing minifig:', e);
            }
        }

        closeModalFunc();
        fetchLegoSets();
        showNotification(editingLegoId ? '¡Set actualizado con éxito!' : '¡Set guardado con éxito!');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function deleteLegoSet() {
    if (!deletingLegoId) return;

    try {
        const response = await fetch(`/api/legos/${deletingLegoId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'No se pudo eliminar el set');
        }

        closeDeleteModalFunc();
        fetchLegoSets();
        showNotification('Set de Lego eliminado con éxito');
    } catch (error) {
        alert(`Error al eliminar: ${error.message}`);
    }
}

// --- KPI calculations ---
function updateKPIs() {
    // 1. Calculate overall portfolio spent & savings (across all sets in the database, excluding loose minifigures)
    let totalInvested = 0;
    let totalSpentExtra = 0;
    let totalPartsCost = 0;
    let totalRetailVal = 0;
    let totalPaidVal = 0;

    legoSets.forEach(s => {
        if (s.subcategory === 'Loose Minifigure') return; // Exclude loose minifigures
        
        const setParts = parseFloat(s.parts_cost) || 0.0;
        const setExtra = parseFloat(s.extra_costs) || 0.0;
        const spentOnSet = s.purchase_price + setExtra + setParts;
        totalInvested += spentOnSet;
        totalSpentExtra += setExtra;
        totalPartsCost += setParts;
        
        // Exclude legacy sets from savings calculations
        // Also exclude sets purchased more than 5 years after their retirement date
        let shouldCountSaving = s.goal !== 'legacy';
        if (shouldCountSaving && s.purchase_date && s.retirement_date && s.retirement_date !== 'Active') {
            try {
                const purDt = new Date(s.purchase_date);
                const retDt = new Date(s.retirement_date);
                if (!isNaN(purDt) && !isNaN(retDt)) {
                    if ((purDt - retDt) / (1000 * 60 * 60 * 24 * 365.25) > 5.0) {
                        shouldCountSaving = false;
                    }
                }
            } catch (e) {
                console.error('Error comparing dates for saving KPI:', e);
            }
        }

        if (shouldCountSaving) {
            totalRetailVal += s.retail_price;
            totalPaidVal += s.purchase_price;
        }
    });

    const totalSaved = totalRetailVal - totalPaidVal;
    const avgSavingPct = totalRetailVal > 0 ? (totalSaved / totalRetailVal) * 100 : 0;

    // 2. Calculate investment speculation profits and ROI (only goal === 'investment' and not loose minifigures)
    const investments = legoSets.filter(s => s.subcategory !== 'Loose Minifigure' && s.goal === 'investment');
    let totalInvestedSpeculation = 0;
    let totalMarketValInvestment = 0;

    investments.forEach(s => {
        totalInvestedSpeculation += (s.purchase_price + (parseFloat(s.extra_costs) || 0.0) + (parseFloat(s.parts_cost) || 0.0));
        totalMarketValInvestment += s.market_price;
    });

    const investmentProfit = totalMarketValInvestment - totalInvestedSpeculation;
    const investmentRoi = totalInvestedSpeculation > 0 ? (investmentProfit / totalInvestedSpeculation) * 100 : 0;

    // Set Investment/Overall Values
    valTotalSpent.innerText = `${totalInvested.toFixed(2)} €`;
    subSpentExtra.innerText = `(incl. ${(totalSpentExtra + totalPartsCost).toFixed(2)} € costes extra y piezas)`;
    
    valTotalSaved.innerText = `${totalSaved.toFixed(2)} €`;
    valTotalSaved.className = `kpi-value ${totalSaved > 0 ? 'value-saved' : ''}`;
    valAvgSavingPct.innerText = `${avgSavingPct.toFixed(1)}% ahorro medio`;

    valInvestmentProfit.innerText = `${investmentProfit >= 0 ? '+' : ''}${investmentProfit.toFixed(2)} €`;
    valInvestmentProfit.className = `kpi-value ${investmentProfit > 0 ? 'value-gain' : (investmentProfit < 0 ? 'value-loss' : '')}`;
    valInvestmentRoiPct.innerText = `${investmentRoi.toFixed(1)}% ROI estimado`;

    // 2. Filter by collection (excluding loose minifigures)
    const collectionSets = legoSets.filter(s => s.subcategory !== 'Loose Minifigure' && (s.goal === 'collection' || s.goal === 'legacy'));
    let portfolioEquity = 0;
    let legacyCount = 0;

    collectionSets.forEach(s => {
        portfolioEquity += s.market_price;
        if (s.goal === 'legacy') {
            legacyCount++;
        }
    });

    // Set Collection Values
    valPortfolioEquity.innerText = `${portfolioEquity.toFixed(2)} €`;
    valCollectionSetsCount.innerText = `${collectionSets.length} sets registrados en colección`;
    valLegacyCount.innerText = `${legacyCount} ${legacyCount === 1 ? 'set' : 'sets'}`;

    if (valPartsCost) {
        valPartsCost.innerText = `${totalPartsCost.toFixed(2)} €`;
    }
    if (valPartsCostSub) {
        const countWithParts = legoSets.filter(s => (parseFloat(s.parts_cost) || 0) > 0).length;
        valPartsCostSub.innerText = `En ${countWithParts} ${countWithParts === 1 ? 'set' : 'sets'} con repuestos`;
    }
}

// --- Category Selector & Hero Banner updates ---
function updateCategoryCounts() {
    // Only count actual sets, excluding loose minifigures
    const actualSets = legoSets.filter(s => s.subcategory !== 'Loose Minifigure');
    const counts = { starwars: 0, batman: 0, pirates: 0, harrypotter: 0, other: 0 };
    actualSets.forEach(set => counts[themeKey(set.theme)]++);

    if (countAll) countAll.innerText = pluralSets(actualSets.length);
    if (countSw) countSw.innerText = pluralSets(counts.starwars);
    if (countBat) countBat.innerText = pluralSets(counts.batman);
    if (countPir) countPir.innerText = pluralSets(counts.pirates);
    if (countHp) countHp.innerText = pluralSets(counts.harrypotter);
    if (countOther) countOther.innerText = pluralSets(counts.other);
}

function updateHeroBanner() {
    if (!categoryHero || !heroLogo || !heroTitle || !heroSubtitle) return;
    
    if (activeThemeFilter === 'all') {
        categoryHero.classList.add('hidden');
    } else {
        categoryHero.classList.remove('hidden');
        
        if (activeThemeFilter === 'Star Wars') {
            categoryHero.style.backgroundImage = "url('images/sw_bg.jpg')";
            heroLogo.src = "images/sw_logo.svg";
            heroLogo.classList.remove('hidden');
            heroTitle.innerText = "Colección Star Wars";
            heroSubtitle.innerText = "Que la Fuerza acompañe a tus inversiones y recuerdos galácticos";
        } else if (activeThemeFilter === 'Batman') {
            categoryHero.style.backgroundImage = "url('images/batman.jpg')";
            heroLogo.src = "images/bat_logo.svg";
            heroLogo.classList.remove('hidden');
            heroTitle.innerText = "Colección Batman";
            heroSubtitle.innerText = "Protegiendo el valor de Gotham, una pieza de coleccionista a la vez";
        } else if (activeThemeFilter === 'Pirates of the Caribbean') {
            categoryHero.style.backgroundImage = "url('images/Piratas_del_Caribe.webp')";
            heroLogo.src = "images/pir_logo.svg";
            heroLogo.classList.remove('hidden');
            heroTitle.innerText = "Piratas del Caribe";
            heroSubtitle.innerText = "Tesoros legendarios y navíos de los siete mares listos para revalorizarse";
        } else if (activeThemeFilter === 'Harry Potter') {
            categoryHero.style.backgroundImage = "url('images/harry potter.png')";
            heroLogo.classList.add('hidden');
            heroTitle.innerText = "Colección Harry Potter";
            heroSubtitle.innerText = "Magia y aventura en cada ladrillo";
        } else {
            categoryHero.style.backgroundImage = "url('images/lego_bg.jpg')";
            heroLogo.src = "";
            heroLogo.classList.add('hidden');
            heroTitle.innerText = "Otros Temas de Lego";
            heroSubtitle.innerText = "Diversidad de sets, colecciones exclusivas y tesoros ocultos de la cartera";
        }
    }
}

// --- Set helpers (shared by the cards and the set detail modal) ---
const CONDITION_LABELS = {
    sealed: '📦 Precintado',
    complete_mib: '🗃️ Completo con caja',
    complete_loose: '🧱 Completo sin caja',
    no_manual: '📖 Sin instrucciones',
    no_box_no_manual: '🧱 Sin caja ni manual',
    no_minifigs: '👥 Sin minifiguras',
    incomplete_with_minifigs: '⚠️ Incompleto (con figuras)',
    incomplete_no_minifigs: '⚠️ Incompleto'
};

const GOAL_LABELS = {
    investment: '📈 Inversión',
    collection: '✨ Colección',
    legacy: '👑 Legado'
};

const eurFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
function fmtEur(value) {
    return eurFormatter.format(Number(value) || 0);
}

function setImageUrl(set) {
    // Local processed image when empty or pointing to Brickset
    return (!set.image_url || set.image_url.includes('brickset.com')) ? `images/${set.id}.png` : set.image_url;
}

function setLinks(set) {
    return {
        brickeconomy: `https://www.brickeconomy.com/search?query=${encodeURIComponent(set.id)}`,
        bricklink: `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${encodeURIComponent(set.id)}-1`,
        lego: set.official_url || `https://www.lego.com/es-es/search?q=${encodeURIComponent(set.id)}`
    };
}

// Money breakdown and the "result" line shown on the card:
// legacy -> family heirloom, investment -> gain vs total cost, collection -> saving vs RRP
function setFinancials(set) {
    const extra = parseFloat(set.extra_costs) || 0;
    const parts = parseFloat(set.parts_cost) || 0;
    const totalCost = set.purchase_price + extra + parts;
    const saved = set.retail_price - set.purchase_price;
    const savingPct = set.retail_price > 0 ? (saved / set.retail_price) * 100 : 0;
    const profit = set.market_price - totalCost;
    const roiPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    // Bought more than 5 years after retirement: comparing with the original RRP is meaningless
    let boughtRetired = false;
    if (set.purchase_date && set.retirement_date && set.retirement_date !== 'Active') {
        const purDt = new Date(set.purchase_date);
        const retDt = new Date(set.retirement_date);
        if (!isNaN(purDt) && !isNaN(retDt)) {
            boughtRetired = (purDt - retDt) / (1000 * 60 * 60 * 24 * 365.25) > 5.0;
        }
    }

    const sign = (v) => (v > 0 ? '+' : '');
    let result;
    if (set.goal === 'legacy') {
        result = { cls: 'legacy', text: '👑 Joya familiar · sin coste de compra' };
    } else if (set.goal === 'investment') {
        result = { cls: profit > 0 ? 'gain' : (profit < 0 ? 'loss' : 'neutral'),
                   text: `Plusvalía ${sign(profit)}${fmtEur(profit)} (${sign(roiPct)}${roiPct.toFixed(0)}%)` };
    } else if (boughtRetired) {
        result = { cls: 'neutral', text: '🕰️ Comprado descatalogado' };
    } else if (set.retail_price > 0) {
        result = { cls: saved > 0 ? 'gain' : (saved < 0 ? 'loss' : 'neutral'),
                   text: saved >= 0 ? `Ahorro ${fmtEur(saved)} (${savingPct.toFixed(0)}%) vs PVP`
                                    : `${fmtEur(-saved)} por encima del PVP` };
    } else {
        result = { cls: 'neutral', text: 'Sin PVP registrado' };
    }

    return { extra, parts, totalCost, saved, savingPct, profit, roiPct, boughtRetired, result };
}

// --- Card Rendering ---
function renderCards() {
    setsGrid.innerHTML = '';

    if (filteredSets.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    filteredSets.forEach(set => {
        const card = document.createElement('article');
        card.className = `set-card${set.goal === 'legacy' ? ' is-legacy' : ''}`;
        card.dataset.setId = set.id;

        const fin = setFinancials(set);
        const links = setLinks(set);
        const imgUrl = setImageUrl(set);
        const year = (set.release_date || '').slice(0, 4);
        const sub = set.subcategory ? `${set.theme} · ${set.subcategory}` : set.theme;

        card.innerHTML = `
            <div class="set-card-stage" data-action="detail" title="Ver ficha del set">
                <div class="set-card-tools">
                    <button type="button" class="set-tool" data-action="parts" title="Piezas faltantes">🔧</button>
                    <button type="button" class="set-tool" data-action="edit" title="Editar">✏️</button>
                    <button type="button" class="set-tool danger" data-action="delete" title="Borrar">🗑️</button>
                </div>
                ${year ? `<span class="set-card-year">${esc(year)}</span>` : ''}
                <img class="set-card-img" src="${esc(imgUrl)}" alt="${esc(set.name)}" loading="lazy" onerror="if (this.src.includes('.png')) { this.src = 'images/${esc(set.id)}.jpg'; } else { this.style.display='none'; this.nextElementSibling.style.display='flex'; }">
                <div class="set-card-fallback">
                    <img src="images/logo.png" alt="">
                    <span>#${esc(set.id)}</span>
                </div>
            </div>

            <span class="set-card-id">#${esc(set.id)}</span>
            <h3 class="set-card-name" data-action="detail" title="${esc(set.name)}">${esc(set.name)}</h3>
            <span class="set-card-sub" title="${esc(sub)}">${esc(sub)}</span>

            <div class="set-card-tags">
                <span class="set-tag condition-${esc(set.condition)}">${CONDITION_LABELS[set.condition] || esc(set.condition)}</span>
                <span class="set-tag goal-tag goal-${esc(set.goal)}">${GOAL_LABELS[set.goal] || esc(set.goal)}</span>
            </div>

            <div class="set-card-figures">
                <div>
                    <span class="set-figure-label">Valor mercado</span>
                    <span class="set-figure-value market">${fmtEur(set.market_price)}</span>
                </div>
                <div>
                    <span class="set-figure-label">${set.goal === 'legacy' ? 'Adquisición' : 'Coste total'}</span>
                    <span class="set-figure-value">${set.goal === 'legacy' ? 'Legado' : fmtEur(fin.totalCost)}</span>
                </div>
                <div class="set-card-result ${fin.result.cls}">${esc(fin.result.text)}</div>
            </div>

            <div class="set-card-links">
                <a href="${esc(links.brickeconomy)}" target="_blank" rel="noopener" class="set-link link-be" title="Ver valor en BrickEconomy">📈 BrickEconomy</a>
                <a href="${esc(links.bricklink)}" target="_blank" rel="noopener" class="set-link link-bl">BrickLink</a>
                <a href="${esc(links.lego)}" target="_blank" rel="noopener" class="set-link link-lego">LEGO</a>
            </div>
        `;
        setsGrid.appendChild(card);
    });
}


// --- Set detail modal (ficha del set) ---
let activeDetailSetId = null;

function closeSetDetail() {
    document.getElementById('set-detail-modal')?.classList.add('hidden');
    activeDetailSetId = null;
}

async function openSetDetail(id) {
    const set = legoSets.find(s => s.id === id);
    if (!set) return;
    activeDetailSetId = id;

    const fin = setFinancials(set);
    const links = setLinks(set);
    const isLegacy = set.goal === 'legacy';

    document.getElementById('set-detail-kicker').textContent = set.subcategory
        ? `${set.theme} · ${set.subcategory}`.toUpperCase()
        : set.theme.toUpperCase();
    document.getElementById('set-detail-title').textContent = set.name;
    document.getElementById('set-detail-id-badge').textContent = `#${set.id}`;

    const img = document.getElementById('set-detail-image');
    img.onerror = () => {
        if (img.src.includes('.png')) { img.src = `images/${set.id}.jpg`; }
        else { img.onerror = null; img.src = 'images/placeholder.png'; }
    };
    img.src = setImageUrl(set);

    document.getElementById('set-detail-tags').innerHTML = `
        <span class="set-tag condition-${esc(set.condition)}">${CONDITION_LABELS[set.condition] || esc(set.condition)}</span>
        <span class="set-tag goal-tag goal-${esc(set.goal)}">${GOAL_LABELS[set.goal] || esc(set.goal)}</span>`;

    document.getElementById('set-detail-links').innerHTML = `
        <a href="${esc(links.brickeconomy)}" target="_blank" rel="noopener" class="set-link link-be">📈 BrickEconomy</a>
        <a href="${esc(links.bricklink)}" target="_blank" rel="noopener" class="set-link link-bl">BrickLink</a>
        <a href="${esc(links.lego)}" target="_blank" rel="noopener" class="set-link link-lego">LEGO</a>`;

    // Money breakdown
    const row = (label, value, cls = '') => `
        <div class="set-detail-row ${cls}"><span>${label}</span><strong>${value}</strong></div>`;
    document.getElementById('set-detail-money').innerHTML =
        row('Valor de mercado', fmtEur(set.market_price), 'highlight') +
        row('PVP oficial', set.retail_price > 0 ? fmtEur(set.retail_price) : '—') +
        row('Precio de compra', isLegacy ? 'Legado (sin coste)' : fmtEur(set.purchase_price)) +
        (fin.extra > 0 ? row('Envío / costes extra', `+${fmtEur(fin.extra)}`) : '') +
        (fin.parts > 0 ? row('Piezas sueltas / repuestos', `+${fmtEur(fin.parts)}`) : '') +
        (!isLegacy ? row('Coste total', fmtEur(fin.totalCost), 'total') : '') +
        `<div class="set-card-result ${fin.result.cls}">${esc(fin.result.text)}</div>`;

    // General info
    const missing = missingPieces.filter(p => p.set_id === set.id && p.status !== 'received');
    const missingQty = missing.reduce((sum, p) => sum + p.quantity, 0);
    const info = (label, value) => `
        <div class="piece-spec-item"><span class="spec-label">${label}</span><span class="spec-value">${value}</span></div>`;
    document.getElementById('set-detail-info').innerHTML =
        info('Salida', esc(set.release_date || '—')) +
        info('Retirada', set.retirement_date === 'Active' ? 'A la venta' : esc(set.retirement_date || '—')) +
        info('Fecha de compra', esc(set.purchase_date || '—')) +
        info('Tienda', esc([set.purchase_store, set.purchase_location].filter(Boolean).join(' · ') || '—')) +
        info('Piezas pendientes', missingQty > 0 ? `${missingQty} en la lista de compras` : 'Ninguna');

    const notesCard = document.getElementById('set-detail-notes-card');
    document.getElementById('set-detail-notes').textContent = set.notes || '';
    notesCard.classList.toggle('hidden', !set.notes);

    document.getElementById('set-detail-modal').classList.remove('hidden');

    // Minifigures of this set (from the collection aggregate; loaded once on demand)
    const figsBox = document.getElementById('set-detail-figs');
    const figsCard = document.getElementById('set-detail-figs-card');
    figsCard.classList.remove('hidden');
    if (minifigures.length === 0) {
        figsBox.innerHTML = '<div class="spinner"></div>';
        try {
            const res = await fetch('/api/minifigs');
            if (res.ok) minifigures = await res.json();
        } catch (e) {
            console.error('Error loading minifigures for set detail:', e);
        }
        if (activeDetailSetId !== id) return;
    }
    const figs = minifigures.filter(f => f.sets.some(s => s.id === set.id));
    if (figs.length === 0) {
        figsCard.classList.add('hidden');
        return;
    }
    figsBox.innerHTML = figs.map(f => {
        const inSet = f.sets.find(s => s.id === set.id);
        return `
            <div class="set-detail-fig" title="${esc(f.name)}">
                <div class="set-detail-fig-img">
                    <img src="${esc(f.image_url || `https://img.bricklink.com/ItemImage/MN/0/${encodeURIComponent(f.code)}.png`)}" alt="${esc(f.name)}" loading="lazy" onerror="this.onerror=null; this.src='images/placeholder.png'">
                    ${inSet && inSet.qty_in_set > 1 ? `<span class="set-detail-fig-qty">x${inSet.qty_in_set}</span>` : ''}
                </div>
                <span class="set-detail-fig-code">${esc(f.code)}</span>
                <span class="set-detail-fig-name">${esc(f.name.split(' - ')[0])}</span>
            </div>`;
    }).join('');
}


// --- Spending breakdown (opened from the "Total gastado" KPI) ---
// Uses the same scope as the KPI (loose minifigures excluded) so the totals match.
function openSpendBreakdown() {
    const rows = legoSets
        .filter(s => s.subcategory !== 'Loose Minifigure')
        .map(s => {
            const extra = parseFloat(s.extra_costs) || 0;
            const parts = parseFloat(s.parts_cost) || 0;
            return { set: s, price: s.purchase_price, extra, parts, total: s.purchase_price + extra + parts };
        })
        .sort((a, b) => b.total - a.total || a.set.id.localeCompare(b.set.id, undefined, { numeric: true }));

    const sum = (key) => rows.reduce((acc, r) => acc + r[key], 0);
    const totals = { price: sum('price'), extra: sum('extra'), parts: sum('parts'), total: sum('total') };
    const paidSets = rows.filter(r => r.total > 0).length;

    const tile = (label, value, sub, cls = '') => `
        <div class="spend-tile ${cls}">
            <span class="spend-tile-label">${label}</span>
            <span class="spend-tile-value">${value}</span>
            <span class="spend-tile-sub">${sub}</span>
        </div>`;
    const pct = (v) => totals.total > 0 ? `${((v / totals.total) * 100).toFixed(0)}% del total` : '—';
    document.getElementById('spend-summary').innerHTML =
        tile('Total gastado', fmtEur(totals.total), `${paidSets} de ${rows.length} sets con gasto`, 'main') +
        tile('Precio de los sets', fmtEur(totals.price), pct(totals.price)) +
        tile('Envíos y comisiones', fmtEur(totals.extra), pct(totals.extra)) +
        tile('Piezas y repuestos', fmtEur(totals.parts), pct(totals.parts));

    // Spending per store
    const stores = {};
    rows.filter(r => r.total > 0).forEach(r => {
        const store = r.set.purchase_store || 'Sin tienda';
        stores[store] = stores[store] || { total: 0, count: 0 };
        stores[store].total += r.total;
        stores[store].count += 1;
    });
    const storeList = Object.entries(stores).sort((a, b) => b[1].total - a[1].total);
    const maxStore = storeList.length ? storeList[0][1].total : 0;
    document.getElementById('spend-stores').innerHTML = storeList.length ? `
        <h3 class="piece-card-heading">🛍️ Por tienda</h3>
        ${storeList.map(([store, info]) => `
            <div class="spend-store-row">
                <span class="spend-store-name">${esc(store)} <small>${info.count} ${info.count === 1 ? 'set' : 'sets'}</small></span>
                <div class="spend-store-bar"><div style="width: ${maxStore > 0 ? (info.total / maxStore) * 100 : 0}%"></div></div>
                <strong>${fmtEur(info.total)}</strong>
            </div>`).join('')}` : '';

    // Per set table
    const money = (v, dimZero = true) => v > 0 || !dimZero ? fmtEur(v) : '<span class="spend-zero">—</span>';
    document.getElementById('spend-table-body').innerHTML = rows.map(r => `
        <tr class="${r.set.goal === 'legacy' ? 'is-legacy' : ''}">
            <td>
                <button type="button" class="spend-set" data-set-id="${esc(r.set.id)}" title="Ver ficha del set">
                    <img src="${esc(setImageUrl(r.set))}" alt="" loading="lazy" onerror="this.onerror=null; this.src='images/placeholder.png'">
                    <span><small>#${esc(r.set.id)}</small>${esc(r.set.name)}</span>
                </button>
            </td>
            <td class="muted">${esc(r.set.purchase_date || '—')}</td>
            <td class="muted">${esc(r.set.purchase_store || '—')}</td>
            <td class="num">${r.set.goal === 'legacy' && r.price === 0 ? '<span class="spend-legacy">👑 Legado</span>' : money(r.price, false)}</td>
            <td class="num">${money(r.extra)}</td>
            <td class="num">${money(r.parts)}</td>
            <td class="num total">${fmtEur(r.total)}</td>
        </tr>`).join('');
    document.getElementById('spend-table-foot').innerHTML = `
        <tr>
            <td colspan="3">Total (${rows.length} sets)</td>
            <td class="num">${fmtEur(totals.price)}</td>
            <td class="num">${fmtEur(totals.extra)}</td>
            <td class="num">${fmtEur(totals.parts)}</td>
            <td class="num total">${fmtEur(totals.total)}</td>
        </tr>`;

    document.getElementById('spend-modal').classList.remove('hidden');
}

// Clicking a set in the breakdown opens its detail sheet
document.getElementById('spend-table-body')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.spend-set');
    if (!btn) return;
    document.getElementById('spend-modal').classList.add('hidden');
    openSetDetail(btn.dataset.setId);
});


function updateMinifigKPIs() {
    let totalMinifigs = 0;
    let uniqueMinifigs = minifigures.length;
    
    // Count totals per theme to find army leader
    const themeCounts = {};
    minifigures.forEach(m => {
        totalMinifigs += m.quantity;
        themeCounts[m.theme] = (themeCounts[m.theme] || 0) + m.quantity;
    });
    
    let topTheme = 'Ninguno';
    let maxQty = 0;
    for (const [theme, qty] of Object.entries(themeCounts)) {
        if (qty > maxQty) {
            maxQty = qty;
            topTheme = theme;
        }
    }
    
    valTotalMinifigs.innerText = totalMinifigs;
    valUniqueMinifigs.innerText = uniqueMinifigs;
    valArmyLeader.innerText = topTheme;
    valArmyLeaderSub.innerText = maxQty > 0 ? `${maxQty} figuras en total` : 'Sin registros';
}


function renderMinifigCards() {
    minifigsGrid.innerHTML = '';
    
    if (filteredMinifigures.length === 0) {
        emptyState.classList.remove('hidden');
        // Update empty state text dynamically for minifigures
        const emptyTitle = emptyState.querySelector('h3');
        const emptyText = emptyState.querySelector('p');
        if (emptyTitle) emptyTitle.innerText = "No se encontraron minifiguras";
        if (emptyText) emptyText.innerText = "Prueba a cambiar tus filtros de búsqueda o el tema seleccionado.";
        return;
    }
    
    emptyState.classList.add('hidden');
    
    filteredMinifigures.forEach(fig => {
        const card = document.createElement('div');
        card.className = 'minifig-card';
        
        // Add theme class for border accents and neon glows
        const tKey = themeKey(fig.theme);
        card.classList.add(tKey === 'harrypotter' ? 'theme-other' : `theme-${tKey}`);

        // Resolve image URL
        const bricklinkImg = `https://img.bricklink.com/ItemImage/MN/0/${encodeURIComponent(fig.code)}.png`;
        const imgUrl = fig.image_url || bricklinkImg;
        const links = minifigCatalogLinks(fig.code, fig.name);
        const isLoose = fig.sets.some(s => s.id === 'Loose');
        const factionKey = minifigFaction(fig.name, fig.theme);
        const faction = factionKey
            ? (FACTIONS.find(f => f.key === factionKey) || OTHER_FACTION)
            : null;

        // Build Sets Origin List
        const setsHtml = fig.sets.map(s => `
            <div class="origin-set-item">
                <span class="origin-set-id">#${esc(s.id)}</span>
                <span class="origin-set-name">${esc(s.name)}</span>
                <span class="origin-set-qty">x${s.qty_in_set} ${s.qty_owned > 1 ? `<small class="qty-owned-label">(${s.qty_owned}x sets)</small>` : ''}</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="minifig-image-wrapper" style="cursor:pointer;" title="Ver en qué sets aparece" onclick="openGoalDetail(${jsArg(fig.code)}, ${jsArg(fig.name)}, ${jsArg(imgUrl)}, 'minifig')">
                <span class="minifig-qty-badge">x${fig.quantity}</span>
                ${isLoose ? `
                <div class="minifig-loose-tools">
                    <button type="button" class="minifig-tool" title="Editar figura suelta" onclick="event.stopPropagation(); openEditModal(${jsArg(fig.code)})">✏️</button>
                    <button type="button" class="minifig-tool danger" title="Borrar figura suelta" onclick="event.stopPropagation(); openDeleteModal(${jsArg(fig.code)}, ${jsArg(fig.name)})">🗑️</button>
                </div>` : ''}
                <img class="minifig-image" src="${esc(imgUrl)}" alt="${esc(fig.name)}" loading="lazy" onerror="if(!this.src.startsWith('https://img.bricklink.com/')) { this.src='${esc(bricklinkImg)}'; } else { this.style.display='none'; this.nextElementSibling.style.display='flex'; }">
                <div class="minifig-fallback" style="display:none;">
                    <span>👥</span>
                    <small>${esc(fig.code)}</small>
                </div>
            </div>

            <div class="minifig-header">
                <span class="minifig-code-label">#${esc(fig.code)}</span>
                <h3 class="minifig-name-label" title="${esc(fig.name)}">${esc(fig.name)}</h3>
                <div class="minifig-meta-row">
                    <span class="minifig-theme-label">${esc(fig.theme)}</span>
                    ${faction ? `<button type="button" class="minifig-faction-badge faction-${faction.key}" data-faction="${faction.key}" title="Filtrar por ${esc(faction.label)}">${faction.icon} ${esc(faction.label)}</button>` : ''}
                </div>
            </div>
            
            <div class="minifig-origins">
                <h4 class="origins-title">📍 Incluida en:</h4>
                <div class="origins-list">
                    ${setsHtml}
                </div>
            </div>
            
            <div class="minifig-links">
                <a href="${esc(links.brickeconomy)}" target="_blank" rel="noopener" class="minifig-link link-be" title="Ver valor en BrickEconomy">📈 BrickEconomy</a>
                <a href="${esc(links.bricklink)}" target="_blank" rel="noopener" class="minifig-link link-bl" title="Buscar en BrickLink">BrickLink</a>
                <a href="${esc(links.rebrickable)}" target="_blank" rel="noopener" class="minifig-link link-rb" title="Buscar en Rebrickable">Rebrickable</a>
            </div>
        `;
        minifigsGrid.appendChild(card);
    });
}


function applyFiltersAndSort() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (activeView === 'minifigs') {
        // --- MINIFIGURES VIEW FILTERING & SORTING ---
        filteredMinifigures = minifigures.filter(fig => {
            // 1. Search Query Filter
            const matchesSearch = 
                fig.code.toLowerCase().includes(query) ||
                fig.name.toLowerCase().includes(query) ||
                fig.theme.toLowerCase().includes(query);

            // 2. Theme Filter
            return matchesSearch && matchesThemeFilter(fig.theme);
        });

        // 3. Faction filter (chips show counts for the current search + theme)
        renderFactionChips(filteredMinifigures);
        if (activeFactionFilter !== 'all') {
            filteredMinifigures = filteredMinifigures.filter(fig => minifigFaction(fig.name, fig.theme) === activeFactionFilter);
        }

        // 3. Sorting
        const sortVal = sortSelect.value;
        filteredMinifigures.sort((a, b) => {
            if (sortVal === 'faction_asc') {
                // Same order as the faction chips; non Star Wars figures go last
                const rank = (fig) => {
                    const key = minifigFaction(fig.name, fig.theme);
                    if (!key) return FACTIONS.length + 1;
                    const idx = FACTIONS.findIndex(f => f.key === key);
                    return idx === -1 ? FACTIONS.length : idx;
                };
                return rank(a) - rank(b) || a.name.localeCompare(b.name);
            }
            if (sortVal === 'qty_desc') {
                return b.quantity - a.quantity;
            }
            if (sortVal === 'qty_asc') {
                return a.quantity - b.quantity;
            }
            if (sortVal === 'name_asc') {
                return a.name.localeCompare(b.name);
            }
            if (sortVal === 'code_asc') {
                return a.code.localeCompare(b.code, undefined, { numeric: true });
            }
            if (sortVal === 'set_asc') {
                const getFirstSetId = (fig) => {
                    const setObj = fig.sets.find(s => s.id !== 'Loose') || fig.sets[0];
                    return setObj ? setObj.id : 'ZZZZZZ';
                };
                return getFirstSetId(a).localeCompare(getFirstSetId(b), undefined, { numeric: true });
            }
            return 0;
        });

        updateMinifigKPIs();
        updateCategoryCounts();
        updateHeroBanner();
        
        // Hide sets grid and show minifigs grid
        setsGrid.classList.add('hidden');
        shoppingListView.classList.add('hidden');
        minifigsGrid.classList.remove('hidden');
        
        renderMinifigCards();
        return;
    }

    // --- SETS VIEW FILTERING & SORTING ---
    filteredSets = legoSets.filter(set => {
        // Exclude loose minifigures from sets view
        if (set.subcategory === 'Loose Minifigure') return false;
        
        // Search matches
        const matchesSearch = 
            set.id.toLowerCase().includes(query) ||
            set.name.toLowerCase().includes(query) ||
            set.theme.toLowerCase().includes(query) ||
            set.subcategory.toLowerCase().includes(query) ||
            set.purchase_store.toLowerCase().includes(query) ||
            set.purchase_location.toLowerCase().includes(query) ||
            set.notes.toLowerCase().includes(query);

        // Theme filter matches
        const matchesTheme = matchesThemeFilter(set.theme);

        // Goal Filter matches
        let matchesGoal = true;
        const goalValue = filterGoalSelect.value;
        if (goalValue !== 'all') {
            matchesGoal = (set.goal === goalValue);
        }

        return matchesSearch && matchesTheme && matchesGoal;
    });

    // Subtheme chips (counts for the current search + theme + goal), then apply the subtheme filter
    renderSubthemeChips(filteredSets);
    if (activeSubthemeFilter !== 'all') {
        filteredSets = filteredSets.filter(set => (set.subcategory || 'Sin subtema') === activeSubthemeFilter);
    }

    // 2. Sorting
    const sortVal = sortSelect.value;
    filteredSets.sort((a, b) => {
        if (sortVal === 'id_asc') {
            return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
        }
        
        if (sortVal === 'purchase_date_desc') {
            if (!a.purchase_date) return 1;
            if (!b.purchase_date) return -1;
            return b.purchase_date.localeCompare(a.purchase_date);
        }

        if (sortVal === 'purchase_date_asc') {
            if (!a.purchase_date) return 1;
            if (!b.purchase_date) return -1;
            return a.purchase_date.localeCompare(b.purchase_date);
        }

        if (sortVal === 'saving_desc') {
            const saveA = a.retail_price > 0 ? ((a.retail_price - a.purchase_price) / a.retail_price) : 0;
            const saveB = b.retail_price > 0 ? ((b.retail_price - b.purchase_price) / b.retail_price) : 0;
            return saveB - saveA;
        }

        if (sortVal === 'profit_desc') {
            const profitA = a.market_price - (a.purchase_price + a.extra_costs);
            const profitB = b.market_price - (b.purchase_price + b.extra_costs);
            return profitB - profitA;
        }

        if (sortVal === 'market_price_desc') {
            return b.market_price - a.market_price;
        }

        return 0;
    });

    updateKPIs();
    updateCategoryCounts();
    updateHeroBanner();
    
    if (activeView === 'shopping-list') {
        setsGrid.classList.add('hidden');
        minifigsGrid.classList.add('hidden');
        shoppingListView.classList.remove('hidden');
        renderShoppingList();
        return;
    }

    // Hide minifigs and shopping list grids, and show sets grid
    minifigsGrid.classList.add('hidden');
    shoppingListView.classList.add('hidden');
    setsGrid.classList.remove('hidden');
    
    renderCards();
}

function renderFactionChips(figs) {
    const container = document.getElementById('faction-chips');
    if (!container) return;

    const counts = {};
    let starWarsTotal = 0;
    figs.forEach(fig => {
        const key = minifigFaction(fig.name, fig.theme);
        if (!key) return; // not Star Wars
        counts[key] = (counts[key] || 0) + fig.quantity;
        starWarsTotal += fig.quantity;
    });
    const total = figs.reduce((sum, fig) => sum + fig.quantity, 0);

    // Factions only exist within Star Wars: show the row for "Todos" or "Star Wars" only
    const row = document.getElementById('faction-filter');
    const showRow = (activeThemeFilter === 'all' || activeThemeFilter === 'Star Wars') && starWarsTotal > 0;
    if (row) row.classList.toggle('hidden', !showRow);
    if (!showRow) activeFactionFilter = 'all';

    // If the active faction has no figures left (e.g. after changing theme), fall back to "all"
    if (activeFactionFilter !== 'all' && !counts[activeFactionFilter]) activeFactionFilter = 'all';

    const chip = (key, label, count) => `
        <button type="button" class="filter-chip ${activeFactionFilter === key ? 'active' : ''}" data-faction="${key}">
            ${label} <span class="chip-count">${count}</span>
        </button>`;

    container.innerHTML = chip('all', 'Todas', total) +
        [...FACTIONS, OTHER_FACTION]
            .filter(f => counts[f.key])
            .map(f => chip(f.key, `${f.icon} ${esc(f.label)}`, counts[f.key]))
            .join('');
}

function renderSubthemeChips(sets) {
    const row = document.getElementById('subtheme-filter');
    const container = document.getElementById('subtheme-chips');
    if (!row || !container) return;

    const counts = {};
    sets.forEach(set => {
        const key = set.subcategory || 'Sin subtema';
        counts[key] = (counts[key] || 0) + 1;
    });
    if (activeSubthemeFilter !== 'all' && !counts[activeSubthemeFilter]) activeSubthemeFilter = 'all';

    // Only worth showing when there is more than one subtheme to choose from
    const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    row.classList.toggle('hidden', keys.length < 2);

    const chip = (key, label, count) => `
        <button type="button" class="filter-chip ${activeSubthemeFilter === key ? 'active' : ''}" data-subtheme="${esc(key)}">
            ${esc(label)} <span class="chip-count">${count}</span>
        </button>`;
    container.innerHTML = chip('all', 'Todos', sets.length) + keys.map(k => chip(k, k, counts[k])).join('');
}

// Main search/filter toolbar (the first .toolbar-section; Goals has its own inside its view)
function setMainToolbarVisible(visible) {
    const toolbar = document.querySelector('.toolbar-section');
    if (toolbar) toolbar.classList.toggle('hidden', !visible);
}

// --- Event Listeners ---
function setupEventListeners() {
    // Tab Navigation
    if (navSets && navMinifigs && navShoppingList) {
        navSets.addEventListener('click', () => {
            if (activeView === 'sets') return;
            activeView = 'sets';
            
            navSets.classList.add('active');
        if(navGoals) navGoals.classList.remove('active');
        if(goalsView) goalsView.classList.add('hidden');
        document.querySelector('.stats-section').classList.remove('hidden');
        document.querySelector('.category-selection-section').classList.remove('hidden');
        setMainToolbarVisible(true);
            navMinifigs.classList.remove('active');
            navShoppingList.classList.remove('active');
            
            minifigsKpis.classList.add('hidden');
            shoppingListKpis.classList.add('hidden');
            setsKpis.classList.remove('hidden');
            
            if (btnAddSet) btnAddSet.classList.remove('hidden');
            if (btnAddMinifig) btnAddMinifig.classList.add('hidden');
            if (btnAddPiece) btnAddPiece.classList.add('hidden');
            
            const goalWrapper = filterGoalSelect.closest('.select-wrapper');
            if (goalWrapper) goalWrapper.classList.remove('hidden');
            
            // Restore sort options for sets
            sortSelect.innerHTML = `
                <option value="purchase_date_desc">Fecha Compra: Más reciente</option>
                <option value="purchase_date_asc">Fecha Compra: Más antiguo</option>
                <option value="id_asc">ID: Ascendente</option>
                <option value="saving_desc">Ahorro %: Mayor primero</option>
                <option value="profit_desc">Plusvalía (€): Mayor primero</option>
                <option value="market_price_desc">Valor Mercado: Mayor primero</option>
            `;
            sortSelect.value = 'purchase_date_desc';
            document.getElementById('faction-filter')?.classList.add('hidden');
            searchInput.placeholder = 'Buscar por ID, nombre, subcategoría, tienda, notas...';
            
            // Restore empty state text
            const emptyTitle = emptyState.querySelector('h3');
            const emptyText = emptyState.querySelector('p');
            if (emptyTitle) emptyTitle.innerText = "No se encontraron sets de Lego";
            if (emptyText) emptyText.innerText = "Prueba a cambiar tus filtros de búsqueda o añade un nuevo set de Lego para empezar.";
            
            applyFiltersAndSort();
        });
        
        navMinifigs.addEventListener('click', () => {
            if (activeView === 'minifigs') return;
            activeView = 'minifigs';
            
            navMinifigs.classList.add('active');
        if(navGoals) navGoals.classList.remove('active');
        if(goalsView) goalsView.classList.add('hidden');
        document.querySelector('.stats-section').classList.remove('hidden');
        document.querySelector('.category-selection-section').classList.remove('hidden');
        setMainToolbarVisible(true);
            navSets.classList.remove('active');
            navShoppingList.classList.remove('active');
            
            setsKpis.classList.add('hidden');
            shoppingListKpis.classList.add('hidden');
            minifigsKpis.classList.remove('hidden');
            
            if (btnAddSet) btnAddSet.classList.add('hidden');
            if (btnAddMinifig) btnAddMinifig.classList.remove('hidden');
            if (btnAddPiece) btnAddPiece.classList.add('hidden');
            
            const goalWrapper = filterGoalSelect.closest('.select-wrapper');
            if (goalWrapper) goalWrapper.classList.add('hidden');
            
            // Update sort options for minifigs
            sortSelect.innerHTML = `
                <option value="faction_asc">Bando (Star Wars)</option>
                <option value="qty_desc">Cantidad: Mayor primero</option>
                <option value="qty_asc">Cantidad: Menor primero</option>
                <option value="name_asc">Nombre: A-Z</option>
                <option value="code_asc">Código: A-Z</option>
                <option value="set_asc">Set: Por número de set</option>
            `;
            sortSelect.value = 'qty_desc';
            document.getElementById('faction-filter')?.classList.remove('hidden');
            document.getElementById('subtheme-filter')?.classList.add('hidden');
            searchInput.placeholder = 'Buscar minifigura por código, nombre o temática...';
            
            if (minifigures.length === 0) {
                fetchMinifigures();
            } else {
                applyFiltersAndSort();
            }
        });

        navShoppingList.addEventListener('click', () => {
            if (activeView === 'shopping-list') return;
            activeView = 'shopping-list';
            
            navShoppingList.classList.add('active');
        if(navGoals) navGoals.classList.remove('active');
        if(goalsView) goalsView.classList.add('hidden');
        document.querySelector('.stats-section').classList.remove('hidden');
        document.querySelector('.category-selection-section').classList.add('hidden');
        // Search & sort only apply to sets/minifigs, not to the shopping list
        setMainToolbarVisible(false);
            navSets.classList.remove('active');
            navMinifigs.classList.remove('active');
            
            setsKpis.classList.add('hidden');
            minifigsKpis.classList.add('hidden');
            shoppingListKpis.classList.remove('hidden');
            
            if (btnAddSet) btnAddSet.classList.add('hidden');
            if (btnAddMinifig) btnAddMinifig.classList.add('hidden');
            if (btnAddPiece) btnAddPiece.classList.remove('hidden');
            
            const goalWrapper = filterGoalSelect.closest('.select-wrapper');
            if (goalWrapper) goalWrapper.classList.add('hidden');
            
            // Hide category selection for shopping list
            categoryHero.classList.add('hidden');
            
            fetchMissingPieces().then(() => {
                applyFiltersAndSort();
            });
        });
    }

    // Search
    searchInput.addEventListener('input', applyFiltersAndSort);

    // Minifigure faction chips
    const factionChips = document.getElementById('faction-chips');
    if (factionChips) {
        factionChips.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-faction]');
            if (!chip) return;
            activeFactionFilter = chip.dataset.faction;
            applyFiltersAndSort();
        });
    }

    // Subtheme chips (sets view)
    const subthemeChips = document.getElementById('subtheme-chips');
    if (subthemeChips) {
        subthemeChips.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-subtheme]');
            if (!chip) return;
            activeSubthemeFilter = chip.dataset.subtheme;
            applyFiltersAndSort();
        });
    }

    // Set cards: photo/name open the detail sheet, overlay icons run their action
    setsGrid.addEventListener('click', (e) => {
        const actionEl = e.target.closest('[data-action]');
        const card = e.target.closest('.set-card');
        if (!actionEl || !card) return;
        const set = legoSets.find(s => s.id === card.dataset.setId);
        if (!set) return;
        const action = actionEl.dataset.action;
        if (action === 'detail') openSetDetail(set.id);
        else if (action === 'parts') openPartsModal(set.id);
        else if (action === 'edit') openEditModal(set.id);
        else if (action === 'delete') openDeleteModal(set.id, set.name);
    });

    // Set detail sheet buttons (close the sheet first so the next modal isn't stacked behind it)
    document.getElementById('btn-close-set-detail')?.addEventListener('click', closeSetDetail);
    const fromDetail = (fn) => () => {
        const id = activeDetailSetId;
        if (!id) return;
        const set = legoSets.find(s => s.id === id);
        closeSetDetail();
        fn(id, set);
    };
    document.getElementById('set-detail-btn-edit')?.addEventListener('click', fromDetail(id => openEditModal(id)));
    document.getElementById('set-detail-btn-parts')?.addEventListener('click', fromDetail(id => openPartsModal(id)));
    document.getElementById('set-detail-btn-delete')?.addEventListener('click', fromDetail((id, set) => openDeleteModal(id, set ? set.name : id)));

    // Faction badge on a minifigure card: filter by that faction
    minifigsGrid.addEventListener('click', (e) => {
        const badge = e.target.closest('.minifig-faction-badge');
        if (!badge) return;
        activeFactionFilter = badge.dataset.faction;
        applyFiltersAndSort();
        document.getElementById('faction-filter')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    
    // Theme Cards
    themeTabs.addEventListener('click', (e) => {
        const card = e.target.closest('.category-card');
        if (card) {
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeThemeFilter = card.dataset.theme;
            applyFiltersAndSort();
        }
    });

    // Goal Filter Dropdown
    filterGoalSelect.addEventListener('change', applyFiltersAndSort);

    // KPI "Total gastado": opens the spending breakdown (KPIs no longer act as hidden filters)
    const kpiTotalSpent = document.getElementById('kpi-total-spent');
    if (kpiTotalSpent) {
        kpiTotalSpent.classList.add('kpi-clickable');
        kpiTotalSpent.title = 'Ver desglose de gastos';
        kpiTotalSpent.addEventListener('click', openSpendBreakdown);
    }
    document.getElementById('btn-close-spend')?.addEventListener('click', () => {
        document.getElementById('spend-modal').classList.add('hidden');
    });

    // Sorting Dropdown
    sortSelect.addEventListener('change', applyFiltersAndSort);

    // Autocomplete / Lookup set by ID
    const btnLookupSet = document.getElementById('btn-lookup-set');
    if (btnLookupSet) {
        btnLookupSet.addEventListener('click', async () => {
            const setNum = fieldId.value.trim();
            if (!setNum) {
                showNotification('Por favor, introduce un ID de set primero.');
                return;
            }
            
            console.log('Buscando información del set:', setNum);
            showNotification('Buscando información del set ' + setNum + ' en LEGO databases...');
            
            btnLookupSet.disabled = true;
            const originalHtml = btnLookupSet.innerHTML;
            btnLookupSet.innerHTML = '⌛';
            
            try {
                const response = await fetch(`/api/sets/lookup/${setNum}`);
                if (!response.ok) {
                    throw new Error('No se encontraron datos para este set.');
                }
                const data = await response.json();
                
                // Populate fields
                fieldName.value = data.name || '';
                fieldTheme.value = data.theme || '';
                fieldSubcategory.value = data.subcategory || '';
                fieldReleaseDate.value = data.release_date || '';
                fieldRetirementDate.value = data.retirement_date || 'Active';
                fieldRetailPrice.value = data.retail_price ? data.retail_price.toFixed(2) : '0.00';
                fieldMarketPrice.value = data.market_price ? data.market_price.toFixed(2) : '0.00';
                fieldImageUrl.value = data.image_url || '';
                if (data.official_url) {
                    fieldOfficialUrl.value = data.official_url;
                }
                
                showNotification('¡Datos de set autocompletados con éxito!');
                
                // Load minifigs list to check off
                await loadSetMinifigsChecklist(setNum);
            } catch (err) {
                showNotification('Error al autocompletar: ' + err.message);
            } finally {
                btnLookupSet.disabled = false;
                btnLookupSet.innerHTML = originalHtml;
            }
        });
    }

    // Add Set Modal Open
    btnAddSet.addEventListener('click', () => {
        editingLegoId = null;
        modalTitle.innerText = "Añadir Set de Lego";
        setForm.reset();
        fieldId.disabled = false;
        if (setModalContainer) setModalContainer.classList.remove('mode-minifig');

        // Re-enable required on set-only fields
        [fieldTheme, fieldReleaseDate, fieldRetirementDate, fieldRetailPrice, fieldMarketPrice, fieldGoal].forEach(f => {
            if (f) f.required = true;
        });
        
        // Setup initial default values
        fieldRetirementDate.value = "Active";
        fieldExtraCosts.value = "0.00";
        if (fieldPartsCost) fieldPartsCost.value = "0.00";

        // Reset condition checkboxes to default (MIB)
        setCheckboxesFromCondition('complete_mib');
        const sealedWrap = document.getElementById('cond-sealed-wrap');
        if (sealedWrap) sealedWrap.style.display = 'inline-flex';

        // Clear and hide minifig checklist
        const panel = document.getElementById('minifig-checklist-panel');
        if (panel) panel.classList.add('hidden');
        document.getElementById('minifig-checklist-grid').innerHTML = '';
        currentSetMinifigs = [];
        
        setModal.classList.remove('hidden');
    });

    // Add Minifig Modal Open
    if (btnAddMinifig) {
        btnAddMinifig.addEventListener('click', () => {
            editingLegoId = null;
            modalTitle.innerText = "Añadir Minifigura Suelta";
            setForm.reset();
            fieldId.disabled = false;
            if (setModalContainer) setModalContainer.classList.add('mode-minifig');

            // Remove required from set-only fields so form submits
            [fieldTheme, fieldReleaseDate, fieldRetirementDate, fieldRetailPrice, fieldMarketPrice, fieldGoal].forEach(f => {
                if (f) f.required = false;
            });

            // Pre-set sensible defaults for a loose minifig
            fieldRetirementDate.value = "Active";
            fieldExtraCosts.value = "0.00";
            if (fieldPartsCost) fieldPartsCost.value = "0.00";
            if (fieldGoal) fieldGoal.value = "collection";
            if (fieldTheme) fieldTheme.value = "Star Wars";
            if (fieldSubcategory) fieldSubcategory.value = "Loose Minifigure";

            // Reset condition checkboxes to complete_loose
            setCheckboxesFromCondition('complete_loose');
            const sealedWrap = document.getElementById('cond-sealed-wrap');
            if (sealedWrap) sealedWrap.style.display = 'none';

            // Clear and hide minifig checklist
            const panel = document.getElementById('minifig-checklist-panel');
            if (panel) panel.classList.add('hidden');
            document.getElementById('minifig-checklist-grid').innerHTML = '';
            currentSetMinifigs = [];

            setModal.classList.remove('hidden');
        });
    }

    // Condition checkboxes logic
    const condCheckboxes = ['cond-sealed', 'cond-box', 'cond-manual', 'cond-minifigs', 'cond-complete'];
    condCheckboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (id === 'cond-sealed' && el.checked) {
                    document.getElementById('cond-box').checked = true;
                    document.getElementById('cond-manual').checked = true;
                    document.getElementById('cond-minifigs').checked = true;
                    document.getElementById('cond-complete').checked = true;
                }
                updateConditionFromCheckboxes();
            });
        }
    });

    // Modal Close
    btnCloseModal.addEventListener('click', closeModalFunc);
    btnCancelModal.addEventListener('click', closeModalFunc);
    
    // Form submission
    setForm.addEventListener('submit', saveLegoSet);

    // Delete Modal Close
    btnCloseDeleteModal.addEventListener('click', closeDeleteModalFunc);
    btnCancelDelete.addEventListener('click', closeDeleteModalFunc);
    btnConfirmDelete.addEventListener('click', deleteLegoSet);

    // Shopping List Grouping Buttons
    if (btnGroupBySet && btnGroupByPart) {
        btnGroupBySet.addEventListener('click', () => {
            if (shoppingListGroupBy === 'set') return;
            shoppingListGroupBy = 'set';
            btnGroupBySet.classList.add('active');
            btnGroupByPart.classList.remove('active');
            renderShoppingList();
        });
        
        btnGroupByPart.addEventListener('click', () => {
            if (shoppingListGroupBy === 'part') return;
            shoppingListGroupBy = 'part';
            btnGroupByPart.classList.add('active');
            btnGroupBySet.classList.remove('active');
            renderShoppingList();
        });
    }

    // Missing Piece Detail Modal (Ficha Completa) Event Listeners
    if (btnClosePieceDetail) btnClosePieceDetail.addEventListener('click', closePieceDetailModal);
    if (btnClosePieceDetailFooter) btnClosePieceDetailFooter.addEventListener('click', closePieceDetailModal);
    // Generic modal closing: Escape closes the top-most open modal, clicking the backdrop
    // closes read-only modals (forms are excluded so typed data isn't lost by accident)
    const FORM_MODALS = ['set-modal', 'piece-modal'];
    const closeOverlay = (overlay) => {
        const btn = overlay.querySelector('.modal-close-btn');
        if (btn) btn.click();
        else overlay.classList.add('hidden');
    };
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        if (FORM_MODALS.includes(overlay.id)) return;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeOverlay(overlay);
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const open = [...document.querySelectorAll('.modal-overlay:not(.hidden)')];
        if (open.length === 0) return;
        // Highest z-index wins; on ties the last one in the DOM is on top
        const top = open.reduce((a, b) =>
            (parseInt(getComputedStyle(b).zIndex) || 0) >= (parseInt(getComputedStyle(a).zIndex) || 0) ? b : a);
        closeOverlay(top);
    });

    if (pieceDetailStatusSelect) {
        pieceDetailStatusSelect.addEventListener('change', async (e) => {
            if (!activeInspectedPiece) return;
            const newStatus = e.target.value;
            if (activeInspectedMultiPieces && activeInspectedMultiPieces.length > 1) {
                for (const mp of activeInspectedMultiPieces) {
                    await changePieceStatus(mp.set_id, mp.part_num, mp.color_id, newStatus);
                }
            } else {
                await changePieceStatus(activeInspectedPiece.set_id, activeInspectedPiece.part_num, activeInspectedPiece.color_id, newStatus);
            }
            updateModalStatusBadge(newStatus);
        });
    }

    if (pieceDetailQtyInput) {
        pieceDetailQtyInput.addEventListener('change', async (e) => {
            if (!activeInspectedPiece) return;
            const qty = parseInt(e.target.value, 10);
            if (isNaN(qty) || qty < 1) return;
            await changePieceQuantity(activeInspectedPiece.set_id, activeInspectedPiece.part_num, activeInspectedPiece.color_id, qty);
        });
    }

    if (btnPieceQtyInc && pieceDetailQtyInput) {
        btnPieceQtyInc.addEventListener('click', async () => {
            if (!activeInspectedPiece) return;
            const cur = parseInt(pieceDetailQtyInput.value, 10) || 1;
            const next = cur + 1;
            await changePieceQuantity(activeInspectedPiece.set_id, activeInspectedPiece.part_num, activeInspectedPiece.color_id, next);
        });
    }

    if (btnPieceQtyDec && pieceDetailQtyInput) {
        btnPieceQtyDec.addEventListener('click', async () => {
            if (!activeInspectedPiece) return;
            const cur = parseInt(pieceDetailQtyInput.value, 10) || 1;
            if (cur <= 1) return;
            const next = cur - 1;
            await changePieceQuantity(activeInspectedPiece.set_id, activeInspectedPiece.part_num, activeInspectedPiece.color_id, next);
        });
    }

    if (pieceDetailBtnDelete) {
        pieceDetailBtnDelete.addEventListener('click', async () => {
            if (!activeInspectedPiece) return;
            if (activeInspectedMultiPieces && activeInspectedMultiPieces.length > 1) {
                if (!(await confirmDialog({ title: '¿Eliminar pieza?', message: `Se eliminará la pieza ${activeInspectedPiece.part_num} de los ${activeInspectedMultiPieces.length} sets que la necesitan.` }))) return;
                // Already confirmed once above: don't ask again for every set
                const toDelete = activeInspectedMultiPieces;
                closePieceDetailModal();
                for (const mp of toDelete) {
                    await deletePiece(mp.set_id, mp.part_num, mp.color_id, true);
                }
            } else {
                const sId = activeInspectedPiece.set_id;
                const pNum = activeInspectedPiece.part_num;
                const cId = activeInspectedPiece.color_id;
                // deletePiece asks for confirmation and closes this modal on success
                await deletePiece(sId, pNum, cId);
            }
        });
    }

    if (btnCopyPartNum) {
        btnCopyPartNum.addEventListener('click', () => {
            if (!activeInspectedPiece) return;
            const cleanCode = activeInspectedPiece.part_num.replace(/\[.*?\]/g, '').trim();
            navigator.clipboard.writeText(cleanCode).then(() => {
                showNotification(`📋 Código #${cleanCode} copiado al portapapeles`);
            }).catch(() => {
                showNotification(`Código de pieza: ${cleanCode}`);
            });
        });
    }

    // Delegation for clicking missing piece cards in Shopping List
    if (shoppingListContainer) {
        shoppingListContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.missing-piece-card');
            if (!card) return;
            if (e.target.closest('select, input, button, a')) return;

            const setId = card.dataset.setId;
            const partNum = card.dataset.partNum;
            const colorId = parseInt(card.dataset.colorId, 10);

            if (setId) {
                const piece = missingPieces.find(p => p.set_id === setId && p.part_num === partNum && p.color_id === colorId);
                if (piece) openPieceDetailModal(piece);
            } else {
                const matching = missingPieces.filter(p => p.part_num === partNum && p.color_id === colorId);
                if (matching.length > 0) openPieceDetailModal(matching[0], matching);
            }
        });
    }

    // Delegation for clicking missing piece cards in Parts Modal
    if (currentMissingList) {
        currentMissingList.addEventListener('click', (e) => {
            const card = e.target.closest('.missing-piece-card');
            if (!card) return;
            if (e.target.closest('select, input, button, a')) return;

            const setId = card.dataset.setId;
            const partNum = card.dataset.partNum;
            const colorId = parseInt(card.dataset.colorId, 10);
            const piece = missingPieces.find(p => p.set_id === setId && p.part_num === partNum && p.color_id === colorId);
            if (piece) openPieceDetailModal(piece);
        });
    }

    // Populate owned-sets dropdown when modal opens
    function populatePieceOwnedSets() {
        const sel = document.getElementById('piece-owned-set-select');
        if (!sel) return;
        // Remove old dynamic options
        while (sel.options.length > 1) sel.remove(1);
        legoSets
            .filter(s => s.subcategory !== 'Loose Minifigure' && !s.id.startsWith('sw') && !s.id.startsWith('fig'))
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
            .forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.text = `${s.id} — ${s.name}`;
                sel.appendChild(opt);
            });
    }

    // Add Piece Button — open modal
    if (btnAddPiece) {
        btnAddPiece.addEventListener('click', () => {
            const pieceModalTitle = document.getElementById('piece-modal-title');
            if (pieceModalTitle) pieceModalTitle.innerHTML = `🧩 Añadir Pieza a Lista de Compras`;
            if (pieceForm) pieceForm.reset();
            const qtyEl = document.getElementById('piece-qty');
            if (qtyEl) qtyEl.value = '1';
            // Clear browser panel
            const browser = document.getElementById('piece-set-browser');
            const grid = document.getElementById('piece-set-parts-grid');
            const toolbar = document.getElementById('piece-set-browser-search-wrap');
            if (browser) browser.classList.add('hidden');
            if (grid) grid.innerHTML = '';
            if (toolbar) toolbar.classList.add('hidden');
            loadedSetPartsData = [];
            activeCatFilter = '';
            // Sync owned-sets dropdown
            populatePieceOwnedSets();
            const ownedSel = document.getElementById('piece-owned-set-select');
            if (ownedSel) ownedSel.value = '';
            const setIdInput = document.getElementById('piece-set-id');
            if (setIdInput) setIdInput.value = '';
            pieceModal.classList.remove('hidden');
        });
    }

    // Direct helper to open Add Piece Modal pre-searched for a specific set
    window.openAddPieceModalForSet = async function(setId) {
        if (!setId) return;

        const setObj = legoSets.find(s => s.id === setId);
        const setName = setObj ? setObj.name : `Set #${setId}`;

        if (pieceForm) pieceForm.reset();
        const qtyEl = document.getElementById('piece-qty');
        if (qtyEl) qtyEl.value = '1';

        // Prepopulate owned set select & set ID input
        populatePieceOwnedSets();
        const ownedSel = document.getElementById('piece-owned-set-select');
        if (ownedSel) {
            ownedSel.value = setId;
            if (ownedSel.value !== setId) ownedSel.value = '';
        }

        const setIdInput = document.getElementById('piece-set-id');
        if (setIdInput) setIdInput.value = setId;

        // Customise modal title
        const pieceModalTitle = document.getElementById('piece-modal-title');
        if (pieceModalTitle) {
            pieceModalTitle.innerHTML = `🧩 Añadir Piezas al Set: <span style="color: var(--accent-primary); font-weight: 700;">#${setId} - ${esc(setName)}</span>`;
        }

        // Open modal
        if (pieceModal) pieceModal.classList.remove('hidden');

        // Automatically load and search parts of this set
        await loadSetPartsBrowser(setId);
    };
    if (btnClosePieceModal) btnClosePieceModal.addEventListener('click', () => pieceModal.classList.add('hidden'));
    if (btnCancelPiece) btnCancelPiece.addEventListener('click', () => pieceModal.classList.add('hidden'));
    if (pieceForm) pieceForm.addEventListener('submit', addPieceFromList);

    // State for piece browser filters
    let loadedSetPartsData = [];
    let activeCatFilter = '';

    // Owned-set dropdown → auto-fill ID input
    const ownedSetSelect = document.getElementById('piece-owned-set-select');
    if (ownedSetSelect) {
        ownedSetSelect.addEventListener('change', () => {
            const val = ownedSetSelect.value;
            const setIdInput = document.getElementById('piece-set-id');
            if (setIdInput) setIdInput.value = val;
        });
    }

    // Load set parts browser button
    const btnLoadSetParts = document.getElementById('btn-load-set-parts');
    if (btnLoadSetParts) {
        btnLoadSetParts.addEventListener('click', async () => {
            const val = (document.getElementById('piece-set-id').value || '').trim()
                     || (ownedSetSelect ? ownedSetSelect.value : '');
            if (!val || val.toUpperCase() === 'MOC') {
                showNotification('Selecciona un set o introduce un ID para ver sus piezas.');
                return;
            }
            await loadSetPartsBrowser(val);
        });
    }

    // Enter key on ID input
    const pieceSetIdInput = document.getElementById('piece-set-id');
    if (pieceSetIdInput) {
        pieceSetIdInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = pieceSetIdInput.value.trim();
                if (val && val.toUpperCase() !== 'MOC') await loadSetPartsBrowser(val);
            }
        });
    }

    // Search input + clear button
    const pieceSetSearch = document.getElementById('piece-set-search');
    const btnClearPieceSearch = document.getElementById('btn-clear-piece-search');
    if (pieceSetSearch) {
        pieceSetSearch.addEventListener('input', () => applyPieceBrowserFilters());
    }
    if (btnClearPieceSearch) {
        btnClearPieceSearch.addEventListener('click', () => {
            if (pieceSetSearch) pieceSetSearch.value = '';
            applyPieceBrowserFilters();
        });
    }

    // Color filter
    const pieceColorFilter = document.getElementById('piece-color-filter');
    if (pieceColorFilter) {
        pieceColorFilter.addEventListener('change', () => applyPieceBrowserFilters());
    }

    // ---- Core functions ----

    async function loadSetPartsBrowser(setId) {
        const browser = document.getElementById('piece-set-browser');
        const loading = document.getElementById('piece-set-browser-loading');
        const grid = document.getElementById('piece-set-parts-grid');
        const toolbar = document.getElementById('piece-set-browser-search-wrap');

        browser.classList.remove('hidden');
        loading.classList.remove('hidden');
        grid.innerHTML = '';
        if (toolbar) toolbar.classList.add('hidden');
        activeCatFilter = '';

        try {
            const response = await fetch(`/api/legos/${setId}/parts`);
            if (!response.ok) throw new Error('No se pudo cargar el inventario. ¿Tienes clave de Rebrickable?');
            loadedSetPartsData = await response.json();
            loading.classList.add('hidden');
            if (toolbar) toolbar.classList.remove('hidden');
            if (pieceSetSearch) pieceSetSearch.value = '';
            buildCategoryChips(loadedSetPartsData);
            buildColorFilter(loadedSetPartsData);
            renderSetPartsBrowser(loadedSetPartsData);
        } catch (err) {
            loading.classList.add('hidden');
            grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:1.5rem 1rem;">${err.message}</p>`;
        }
    }

    function getCategoryFromName(name) {
        const prefixes = ['Plate', 'Brick', 'Tile', 'Technic', 'Bar', 'Slope', 'Wedge',
                          'Panel', 'Minifig', 'Hinge', 'Clip', 'Cone', 'Cylinder',
                          'Door', 'Window', 'Wheel', 'Arch', 'Pin', 'Axle', 'Beam'];
        for (const p of prefixes) {
            if (name.startsWith(p)) return p;
        }
        return 'Otros';
    }

    function buildCategoryChips(parts) {
        const container = document.getElementById('piece-cat-chips');
        if (!container) return;
        // Count by category
        const catCount = {};
        parts.forEach(p => {
            const cat = getCategoryFromName(p.name);
            catCount[cat] = (catCount[cat] || 0) + 1;
        });
        container.innerHTML = '';
        // "Todos" chip
        const allChip = document.createElement('span');
        allChip.className = 'filter-chip active';
        allChip.textContent = 'Todos';
        allChip.dataset.cat = '';
        allChip.addEventListener('click', () => { activeCatFilter = ''; updateChips(allChip); applyPieceBrowserFilters(); });
        container.appendChild(allChip);
        // One chip per category, sorted by count desc
        Object.entries(catCount)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, cnt]) => {
                const chip = document.createElement('span');
                chip.className = 'filter-chip';
                chip.textContent = `${cat} (${cnt})`;
                chip.dataset.cat = cat;
                chip.addEventListener('click', () => {
                    activeCatFilter = cat;
                    updateChips(chip);
                    applyPieceBrowserFilters();
                });
                container.appendChild(chip);
            });
    }

    function updateChips(activeChip) {
        document.querySelectorAll('#piece-cat-chips .filter-chip').forEach(c => c.classList.remove('active'));
        activeChip.classList.add('active');
    }

    function buildColorFilter(parts) {
        const sel = document.getElementById('piece-color-filter');
        if (!sel) return;
        while (sel.options.length > 1) sel.remove(1);
        const colors = [...new Set(parts.map(p => p.color_name).filter(Boolean))].sort();
        colors.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.text = c;
            sel.appendChild(opt);
        });
        sel.value = '';
    }

    function applyPieceBrowserFilters() {
        const q = pieceSetSearch ? pieceSetSearch.value.toLowerCase() : '';
        const colorVal = pieceColorFilter ? pieceColorFilter.value : '';
        const filtered = loadedSetPartsData.filter(p => {
            const matchQ = !q || p.name.toLowerCase().includes(q) || p.part_num.toLowerCase().includes(q);
            const matchCat = !activeCatFilter || getCategoryFromName(p.name) === activeCatFilter;
            const matchColor = !colorVal || p.color_name === colorVal;
            return matchQ && matchCat && matchColor;
        });
        renderSetPartsBrowser(filtered);
    }

    function renderSetPartsBrowser(parts) {
        const grid = document.getElementById('piece-set-parts-grid');
        const countLabel = document.getElementById('piece-count-label');
        const setId = (document.getElementById('piece-set-id').value || '').trim() || 'MOC';
        grid.innerHTML = '';
        if (countLabel) countLabel.textContent = `${parts.length} pieza${parts.length !== 1 ? 's' : ''}`;

        if (!parts.length) {
            grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:1rem;">No se encontraron piezas.</p>';
            return;
        }

        parts.forEach(part => {
            const isAlreadyMissing = missingPieces.some(x => x.set_id === setId && x.part_num === part.part_num && x.color_id === (part.color_id || 0));
            const card = document.createElement('div');
            card.className = `piece-inventory-card ${isAlreadyMissing ? 'selected' : ''}`;
            const imgSrc = part.image_url || 'https://cdn.rebrickable.com/static/img/nil.png';
            card.innerHTML = `
                <div class="part-add-badge">${isAlreadyMissing ? '✓' : '+'}</div>
                <img src="${imgSrc}" alt="${esc(part.name)}" onerror="this.src='https://cdn.rebrickable.com/static/img/nil.png'">
                <span class="part-code">${part.part_num}</span>
                <span class="part-name">${esc(part.name)}</span>
                <span class="part-color-badge">${esc(part.color_name || 'Sin color')}</span>
            `;
            card.addEventListener('click', async () => {
                const payload = {
                    set_id: setId,
                    part_num: part.part_num,
                    name: part.name,
                    color_id: part.color_id || 0,
                    color_name: part.color_name || '',
                    quantity: 1,
                    status: 'needed',
                    image_url: part.image_url || ''
                };
                try {
                    const response = await fetch('/api/missing-pieces', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!response.ok) throw new Error('Error al añadir pieza');
                    const data = await response.json();
                    const idx = missingPieces.findIndex(x => x.set_id === setId && x.part_num === part.part_num && x.color_id === (part.color_id || 0));
                    if (idx !== -1) missingPieces[idx] = data;
                    else missingPieces.push(data);
                    updateShoppingListKPIs();
                    renderShoppingList();
                    card.classList.add('selected');
                    card.querySelector('.part-add-badge').textContent = '✓';
                    showNotification(`✅ "${part.name}" añadida a la lista`);
                } catch (err) {
                    alert(`Error: ${err.message}`);
                }
            });
            grid.appendChild(card);
        });
    }

    // Parts Modal Event Listeners
    if (btnClosePartsModal) btnClosePartsModal.addEventListener('click', () => partsModal.classList.add('hidden'));
    if (btnClosePartsModalFooter) btnClosePartsModalFooter.addEventListener('click', () => partsModal.classList.add('hidden'));
    
    if (tabCurrentMissing) tabCurrentMissing.addEventListener('click', () => switchPartsTab('current-missing'));
    if (tabOfficialInventory) tabOfficialInventory.addEventListener('click', () => switchPartsTab('official-inventory'));
    if (tabManualAdd) tabManualAdd.addEventListener('click', () => switchPartsTab('manual-add'));
    
    if (inventorySearchInput) {
        inventorySearchInput.addEventListener('input', () => {
            renderOfficialInventory();
        });
    }
    
    if (manualPartForm) {
        manualPartForm.addEventListener('submit', addManualPart);
    }
}

function closeModalFunc() {
    setModal.classList.add('hidden');
    editingLegoId = null;
    // Always reset to set mode
    if (setModalContainer) setModalContainer.classList.remove('mode-minifig');
    [fieldTheme, fieldReleaseDate, fieldRetirementDate, fieldRetailPrice, fieldMarketPrice, fieldGoal].forEach(f => {
        if (f) f.required = true;
    });
}

function closeDeleteModalFunc() {
    deleteModal.classList.add('hidden');
    deletingLegoId = null;
}

// --- Global helper triggers (bound to window for card clicks) ---
window.openEditModal = function(id) {
    const set = legoSets.find(s => s.id === id);
    if (!set) return;

    editingLegoId = id;
    modalTitle.innerText = `Editar Set #${set.id}`;

    // Fill form
    fieldId.value = set.id;
    fieldId.disabled = true; // Lock ID in edit mode
    fieldName.value = set.name;
    fieldTheme.value = set.theme;
    fieldSubcategory.value = set.subcategory || '';
    fieldOfficialUrl.value = set.official_url || '';
    fieldReleaseDate.value = set.release_date;
    fieldRetirementDate.value = set.retirement_date;
    fieldPurchaseDate.value = set.purchase_date || '';
    fieldRetailPrice.value = set.retail_price;
    fieldPurchasePrice.value = set.purchase_price;
    fieldMarketPrice.value = set.market_price;
    fieldExtraCosts.value = set.extra_costs;
    if (fieldPartsCost) fieldPartsCost.value = (set.parts_cost !== undefined ? set.parts_cost : 0.0);
    fieldPurchaseStore.value = set.purchase_store || '';
    fieldPurchaseLocation.value = set.purchase_location || '';
    fieldCondition.value = set.condition;
    fieldGoal.value = set.goal;
    fieldNotes.value = set.notes || '';
    fieldImageUrl.value = set.image_url || '';

    // Set condition checkboxes
    setCheckboxesFromCondition(set.condition);
    const sealedWrap = document.getElementById('cond-sealed-wrap');
    if (sealedWrap) {
        if (set.subcategory === 'Loose Minifigure') {
            sealedWrap.style.display = 'none';
            if (setModalContainer) setModalContainer.classList.add('mode-minifig');
        } else {
            sealedWrap.style.display = 'inline-flex';
            if (setModalContainer) setModalContainer.classList.remove('mode-minifig');
        }
    }

    // Hide minifig checklist for editing
    const panel = document.getElementById('minifig-checklist-panel');
    if (panel) panel.classList.add('hidden');
    document.getElementById('minifig-checklist-grid').innerHTML = '';
    currentSetMinifigs = [];

    // Ensure modal validation requires correct fields if not a loose minifig
    if (set.subcategory !== 'Loose Minifigure') {
        [fieldTheme, fieldReleaseDate, fieldRetirementDate, fieldRetailPrice, fieldMarketPrice, fieldGoal].forEach(f => {
            if (f) f.required = true;
        });
    } else {
        [fieldTheme, fieldReleaseDate, fieldRetirementDate, fieldRetailPrice, fieldMarketPrice, fieldGoal].forEach(f => {
            if (f) f.required = false;
        });
    }

    setModal.classList.remove('hidden');
};

window.openDeleteModal = function(id, name) {
    deletingLegoId = id;
    deleteSetName.innerText = name;
    deleteSetId.innerText = id;
    deleteModal.classList.remove('hidden');
};

// --- Notification Banner ---
function showNotification(message) {
    const banner = document.createElement('div');
    banner.className = 'notification-banner';
    banner.innerText = message;
    document.body.appendChild(banner);
    
    // Slide in
    setTimeout(() => banner.classList.add('show'), 10);
    
    // Fade out and remove
    setTimeout(() => {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 300);
    }, 3000);
}

function showError(title, error) {
    console.error(title, error);
    const banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.innerHTML = `
        <button type="button" class="error-banner-close" aria-label="Cerrar">&times;</button>
        <strong>⚠️ ${esc(title)}</strong><br><small>${esc(error && error.message)}</small>`;
    banner.querySelector('.error-banner-close').addEventListener('click', () => banner.remove());
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 8000);
}

// --- Missing Pieces & Shopping List Logic ---

let missingPieces = [];
let officialInventory = [];
let partsActiveTab = 'current-missing'; // 'current-missing', 'official-inventory', 'manual-add'
let shoppingListGroupBy = 'set'; // 'set', 'part'
let activePartsSetId = null;

async function fetchMissingPieces() {
    try {
        const response = await fetch('/api/missing-pieces');
        if (!response.ok) throw new Error('Error al cargar piezas faltantes');
        missingPieces = await response.json();
        updateShoppingListKPIs();
    } catch (error) {
        showError('No se pudieron obtener las piezas faltantes.', error);
    }
}

function updateShoppingListKPIs() {
    if (!valTotalMissingParts) return;
    
    let totalQty = 0;
    let orderedQty = 0;
    let receivedQty = 0;
    
    missingPieces.forEach(p => {
        if (p.status === 'needed') totalQty += p.quantity;
        else if (p.status === 'ordered') orderedQty += p.quantity;
        else if (p.status === 'received') receivedQty += p.quantity;
    });
    
    valTotalMissingParts.innerText = totalQty;
    valMissingPartsTypes.innerText = `${missingPieces.filter(p => p.status === 'needed').length} tipos`;
    valOrderedMissingParts.innerText = orderedQty;
    valReceivedMissingParts.innerText = receivedQty;

    if (valShoppingPartsCost) {
        const totalParts = legoSets.reduce((sum, s) => sum + (parseFloat(s.parts_cost) || 0), 0);
        valShoppingPartsCost.innerText = `${totalParts.toFixed(2)} €`;
    }
}

function renderShoppingList() {
    if (!shoppingListContainer) return;
    shoppingListContainer.innerHTML = '';
    
    if (missingPieces.length === 0) {
        shoppingListContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Tu lista de compras está vacía</h3>
                <p>Ve a tus sets de Lego y usa el botón "🔧 Piezas" para registrar piezas faltantes.</p>
            </div>
        `;
        return;
    }
    
    if (shoppingListGroupBy === 'set') {
        // Group by set_id
        const grouped = {};
        missingPieces.forEach(p => {
            if (!grouped[p.set_id]) grouped[p.set_id] = [];
            grouped[p.set_id].push(p);
        });
        
        for (const setId in grouped) {
            const setObj = legoSets.find(s => s.id === setId);
            const setName = setObj ? setObj.name : (setId === 'Loose' ? 'Minifiguras sueltas' : `Set #${setId}`);
            
            const section = document.createElement('div');
            section.className = 'shopping-set-section';
            
            const partsHtml = grouped[setId].map(p => {
                const statusClass = `status-${p.status}`;
                const statusLabel = p.status === 'needed' ? 'Necesitada' : (p.status === 'ordered' ? 'Pedida' : 'Recibida');
                const badgeClass = p.status === 'needed' ? 'badge-needed' : (p.status === 'ordered' ? 'badge-ordered' : 'badge-received');
                
                return `
                    <div class="missing-piece-card ${statusClass}" data-set-id="${p.set_id}" data-part-num="${esc(p.part_num)}" data-color-id="${p.color_id}" title="Haz clic para ver la ficha completa y ampliar imagen">
                        <div class="missing-piece-image-wrapper">
                            <img class="missing-piece-img" src="${p.image_url || 'images/placeholder.png'}" alt="${esc(p.name)}" onerror="this.onerror=null; this.src='images/placeholder.png';">
                        </div>
                        <div class="missing-piece-details">
                            <h4 class="missing-piece-name" title="${esc(p.name)}">${esc(p.name)}</h4>
                            <span class="missing-piece-meta">ID: ${esc(p.part_num)} | Color: ${esc(p.color_name)}</span>
                            <div>
                                <span class="badge-status ${badgeClass}">${statusLabel}</span>
                                <span class="missing-piece-qty-label">x<input type="number" class="input-qty-inline" value="${p.quantity}" min="1" onchange="changePieceQuantity('${p.set_id}', '${esc(p.part_num)}', ${p.color_id}, this.value)"></span>
                            </div>
                        </div>
                        <div class="missing-piece-actions">
                            <select class="select-status" onchange="changePieceStatus('${p.set_id}', '${esc(p.part_num)}', ${p.color_id}, this.value)">
                                <option value="needed" ${p.status === 'needed' ? 'selected' : ''}>Necesitada</option>
                                <option value="ordered" ${p.status === 'ordered' ? 'selected' : ''}>Pedida</option>
                                <option value="received" ${p.status === 'received' ? 'selected' : ''}>Recibida</option>
                            </select>
                            <button class="btn-delete-part" onclick="deletePiece('${p.set_id}', '${esc(p.part_num)}', ${p.color_id})" title="Eliminar de la lista">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            section.innerHTML = `
                <div class="shopping-set-title">
                    <div class="shopping-set-title-info">
                        <span>🧱 ${esc(setName)}</span>
                        <span class="shopping-set-id">#${setId}</span>
                        ${setObj && (parseFloat(setObj.parts_cost) || 0) > 0 ? `<span class="badge-parts-cost" title="Gasto en piezas sueltas de este set">🧩 ${(parseFloat(setObj.parts_cost)).toFixed(2)} € en piezas</span>` : ''}
                    </div>
                    <button type="button" class="btn-add-parts-set" onclick="openAddPieceModalForSet('${setId}')" title="Buscar y añadir piezas al Set #${setId}">
                        <span class="btn-add-icon">➕</span> Añadir Piezas
                    </button>
                </div>
                <div class="shopping-parts-grid">
                    ${partsHtml}
                </div>
            `;
            shoppingListContainer.appendChild(section);
        }
    } else {
        // Group by part_num + color_id (consolidate across all sets)
        const consolidated = {};
        missingPieces.forEach(p => {
            const key = `${p.part_num}_${p.color_id}`;
            if (!consolidated[key]) {
                consolidated[key] = {
                    part_num: p.part_num,
                    name: p.name,
                    color_id: p.color_id,
                    color_name: p.color_name,
                    image_url: p.image_url,
                    quantity: 0,
                    status: p.status,
                    sets: []
                };
            }
            consolidated[key].quantity += p.quantity;
            consolidated[key].sets.push({
                set_id: p.set_id,
                qty: p.quantity,
                status: p.status
            });
        });
        
        const grid = document.createElement('div');
        grid.className = 'global-parts-grid';
        
        for (const key in consolidated) {
            const p = consolidated[key];
            const setsListHtml = p.sets.map(s => {
                const setObj = legoSets.find(set => set.id === s.set_id);
                const name = setObj ? setObj.name : `Set #${s.set_id}`;
                return `<div style="font-size: 0.72rem; color: var(--text-secondary);">• #${s.set_id} - ${esc(name)} (x${s.qty})</div>`;
            }).join('');
            
            // Show the least advanced status across all sets (any "needed" wins over "ordered", etc.)
            const statuses = p.sets.map(s => s.status);
            const aggStatus = statuses.includes('needed') ? 'needed' : (statuses.includes('ordered') ? 'ordered' : 'received');
            const badgeClass = STATUS_INFO[aggStatus].badge;
            const statusLabel = STATUS_INFO[aggStatus].label;

            grid.innerHTML += `
                <div class="missing-piece-card" data-part-num="${esc(p.part_num)}" data-color-id="${p.color_id}" style="flex-direction: column; align-items: stretch; gap: 0.5rem;" title="Haz clic para ver la ficha completa y ampliar imagen">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div class="missing-piece-image-wrapper">
                            <img class="missing-piece-img" src="${p.image_url || 'images/placeholder.png'}" alt="${esc(p.name)}" onerror="this.onerror=null; this.src='images/placeholder.png';">
                        </div>
                        <div class="missing-piece-details">
                            <h4 class="missing-piece-name" title="${esc(p.name)}">${esc(p.name)}</h4>
                            <span class="missing-piece-meta">ID: ${esc(p.part_num)} | Color: ${esc(p.color_name)}</span>
                            <div>
                                <span class="badge-status ${badgeClass}">${statusLabel}</span>
                                <span class="missing-piece-qty-label" style="font-size: 0.9rem;">Total: x${p.quantity}</span>
                            </div>
                        </div>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem;">
                        <span style="font-size: 0.72rem; font-weight: bold; color: #FFF; display: block; margin-bottom: 0.2rem;">Requerido por:</span>
                        ${setsListHtml}
                    </div>
                </div>
            `;
        }
        shoppingListContainer.appendChild(grid);
    }
}

async function changePieceStatus(setId, partNum, colorId, newStatus) {
    const p = missingPieces.find(x => x.set_id === setId && x.part_num === partNum && x.color_id === colorId);
    if (!p) return;
    
    const updated = { ...p, status: newStatus };
    try {
        const response = await fetch(`/api/missing-pieces/${setId}/${partNum}/${colorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (!response.ok) throw new Error('Error al actualizar estado');
        const data = await response.json();
        
        // Update local state
        const idx = missingPieces.findIndex(x => x.set_id === setId && x.part_num === partNum && x.color_id === colorId);
        if (idx !== -1) missingPieces[idx] = data;
        
        updateShoppingListKPIs();
        renderShoppingList();
        if (activePartsSetId === setId) {
            renderCurrentMissing();
        }
        if (activeInspectedPiece && activeInspectedPiece.set_id === setId && activeInspectedPiece.part_num === partNum && activeInspectedPiece.color_id === colorId) {
            activeInspectedPiece.status = newStatus;
            updateModalStatusBadge(newStatus);
            if (pieceDetailStatusSelect) pieceDetailStatusSelect.value = newStatus;
        }
        showNotification('Estado de pieza actualizado');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
window.changePieceStatus = changePieceStatus;

async function changePieceQuantity(setId, partNum, colorId, newQty) {
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty < 1) {
        alert('La cantidad debe ser un número entero mayor o igual a 1');
        return;
    }
    
    const p = missingPieces.find(x => x.set_id === setId && x.part_num === partNum && x.color_id === colorId);
    if (!p) return;
    
    const updated = { ...p, quantity: qty };
    try {
        const response = await fetch(`/api/missing-pieces/${setId}/${partNum}/${colorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (!response.ok) throw new Error('Error al actualizar la cantidad');
        const data = await response.json();
        
        // Update local state
        const idx = missingPieces.findIndex(x => x.set_id === setId && x.part_num === partNum && x.color_id === colorId);
        if (idx !== -1) missingPieces[idx] = data;
        
        updateShoppingListKPIs();
        renderShoppingList();
        if (activePartsSetId === setId) {
            renderCurrentMissing();
        }
        if (activeInspectedPiece && activeInspectedPiece.set_id === setId && activeInspectedPiece.part_num === partNum && activeInspectedPiece.color_id === colorId) {
            activeInspectedPiece.quantity = qty;
            if (pieceDetailQtyDisplay) pieceDetailQtyDisplay.textContent = `x${qty}`;
            if (pieceDetailQtyInput) pieceDetailQtyInput.value = qty;
        }
        showNotification('Cantidad de pieza actualizada');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
window.changePieceQuantity = changePieceQuantity;

async function deletePiece(setId, partNum, colorId, skipConfirm = false) {
    if (!skipConfirm && !(await confirmDialog({ title: '¿Eliminar pieza?', message: 'Se quitará esta pieza de la lista de compras.' }))) return;
    
    try {
        const response = await fetch(`/api/missing-pieces/${setId}/${partNum}/${colorId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar pieza');
        
        // Update local state
        missingPieces = missingPieces.filter(x => !(x.set_id === setId && x.part_num === partNum && x.color_id === colorId));
        
        updateShoppingListKPIs();
        renderShoppingList();
        if (activePartsSetId) {
            renderCurrentMissing();
        }
        if (activeInspectedPiece && activeInspectedPiece.set_id === setId && activeInspectedPiece.part_num === partNum && activeInspectedPiece.color_id === colorId) {
            closePieceDetailModal();
        }
        showNotification('Pieza eliminada con éxito');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
window.deletePiece = deletePiece;

// --- Missing Piece Detail Modal (Ficha Completa) Functions ---

function getLegoColorHex(colorName) {
    if (!colorName) return '#94A3B8';
    const c = colorName.toLowerCase();
    if (c.includes('black')) return '#1E293B';
    if (c.includes('white')) return '#FFFFFF';
    if (c.includes('dark bluish gray') || c.includes('dark gray')) return '#475569';
    if (c.includes('light bluish gray') || c.includes('light gray')) return '#94A3B8';
    if (c.includes('dark red')) return '#881337';
    if (c.includes('red')) return '#DC2626';
    if (c.includes('dark blue')) return '#1E3A8A';
    if (c.includes('blue')) return '#2563EB';
    if (c.includes('yellow')) return '#EAB308';
    if (c.includes('dark green')) return '#14532D';
    if (c.includes('green') || c.includes('lime')) return '#16A34A';
    if (c.includes('tan') && !c.includes('dark tan')) return '#D4B996';
    if (c.includes('dark tan')) return '#958A73';
    if (c.includes('brown')) return '#78350F';
    if (c.includes('orange')) return '#EA580C';
    if (c.includes('pearl gold') || c.includes('gold')) return '#EAB308';
    if (c.includes('trans')) return 'rgba(147, 197, 253, 0.7)';
    return '#64748B';
}

function updateModalStatusBadge(status) {
    if (!pieceDetailBadge) return;
    const badgeClass = status === 'needed' ? 'badge-needed' : (status === 'ordered' ? 'badge-ordered' : 'badge-received');
    const statusLabel = status === 'needed' ? 'Necesitada' : (status === 'ordered' ? 'Pedida' : 'Recibida');
    pieceDetailBadge.className = `badge-status ${badgeClass}`;
    pieceDetailBadge.textContent = statusLabel;
}

function openPieceDetailModal(piece, multiPieces = null) {
    if (!piece || !pieceDetailModal) return;
    activeInspectedPiece = piece;
    activeInspectedMultiPieces = multiPieces;

    // Header & Titles
    if (pieceDetailTitle) pieceDetailTitle.textContent = piece.name || 'Pieza Lego';
    if (pieceDetailPartNum) pieceDetailPartNum.textContent = piece.part_num;
    if (pieceDetailColorName) pieceDetailColorName.textContent = piece.color_name || 'Desconocido';
    if (pieceDetailColorId) pieceDetailColorId.textContent = `#${piece.color_id !== undefined ? piece.color_id : 0}`;
    
    if (pieceDetailColorDot) {
        pieceDetailColorDot.style.backgroundColor = getLegoColorHex(piece.color_name);
    }

    // Large Image
    const imgSrc = piece.image_url || 'images/placeholder.png';
    if (pieceDetailImage) {
        pieceDetailImage.src = imgSrc;
        pieceDetailImage.onerror = () => { pieceDetailImage.src = 'images/placeholder.png'; };
    }
    if (pieceDetailImgBadge) pieceDetailImgBadge.textContent = `#${piece.part_num}`;
    
    if (pieceDetailImgLink) {
        if (piece.image_url && piece.image_url.startsWith('http')) {
            pieceDetailImgLink.href = piece.image_url;
            pieceDetailImgLink.style.display = 'inline-flex';
        } else {
            pieceDetailImgLink.style.display = 'none';
        }
    }

    // Status & Quantity
    updateModalStatusBadge(piece.status || 'needed');
    if (pieceDetailStatusSelect) pieceDetailStatusSelect.value = piece.status || 'needed';

    const totalQty = (multiPieces && multiPieces.length > 0)
        ? multiPieces.reduce((acc, p) => acc + (p.quantity || 1), 0)
        : (piece.quantity || 1);
        
    if (pieceDetailQtyDisplay) pieceDetailQtyDisplay.textContent = `x${totalQty}`;
    if (pieceDetailQtyInput) pieceDetailQtyInput.value = piece.quantity || 1;

    // Set Info or Multi-set List
    if (multiPieces && multiPieces.length > 1) {
        if (pieceDetailSetBox) pieceDetailSetBox.classList.add('hidden');
        if (pieceDetailMultisetContainer) pieceDetailMultisetContainer.classList.remove('hidden');
        if (pieceDetailQtyField) pieceDetailQtyField.classList.add('hidden');
        
        if (pieceDetailMultisetList) {
            pieceDetailMultisetList.innerHTML = multiPieces.map(mp => {
                const sObj = legoSets.find(s => s.id === mp.set_id);
                const sName = sObj ? sObj.name : (mp.set_id === 'Loose' ? 'Minifiguras sueltas' : `Set #${mp.set_id}`);
                const badgeClass = mp.status === 'needed' ? 'badge-needed' : (mp.status === 'ordered' ? 'badge-ordered' : 'badge-received');
                const statusLabel = mp.status === 'needed' ? 'Necesitada' : (mp.status === 'ordered' ? 'Pedida' : 'Recibida');
                return `
                    <div class="piece-multiset-item">
                        <div>
                            <strong style="color:#FFF;">#${mp.set_id}</strong>
                            <span class="piece-multiset-item-name"> — ${esc(sName)}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <span class="badge-status ${badgeClass}" style="font-size:0.7rem;">${statusLabel}</span>
                            <span class="piece-multiset-item-qty">x${mp.quantity}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } else {
        if (pieceDetailSetBox) pieceDetailSetBox.classList.remove('hidden');
        if (pieceDetailMultisetContainer) pieceDetailMultisetContainer.classList.add('hidden');
        if (pieceDetailQtyField) pieceDetailQtyField.classList.remove('hidden');
        
        const setObj = legoSets.find(s => s.id === piece.set_id);
        const setName = setObj ? setObj.name : (piece.set_id === 'Loose' ? 'Minifiguras sueltas' : `Set #${piece.set_id}`);
        const themeTag = setObj && setObj.theme ? ` [${setObj.theme}]` : '';
        if (pieceDetailSetInfo) pieceDetailSetInfo.textContent = `#${piece.set_id} — ${setName}${themeTag}`;
    }

    // External Catalog & Direct Purchase Store Links
    const cleanPartNum = encodeURIComponent(piece.part_num.replace(/\[.*?\]/g, '').trim());
    if (pieceLinkBricklink) {
        pieceLinkBricklink.href = `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${cleanPartNum}#T=S`;
    }
    if (pieceLinkLego) {
        pieceLinkLego.href = `https://www.lego.com/es-es/pick-and-build/pick-a-brick?query=${cleanPartNum}`;
    }
    if (pieceLinkBrickowl) {
        pieceLinkBrickowl.href = `https://www.brickowl.com/search/catalog?query=${cleanPartNum}`;
    }
    if (pieceLinkToypro) {
        pieceLinkToypro.href = `https://www.toypro.com/en/list/parts?part_number_search=${cleanPartNum}`;
    }
    if (pieceLinkRebrickable) {
        pieceLinkRebrickable.href = `https://rebrickable.com/parts/${cleanPartNum}/`;
    }

    pieceDetailModal.classList.remove('hidden');
}
window.openPieceDetailModal = openPieceDetailModal;

function closePieceDetailModal() {
    if (pieceDetailModal) pieceDetailModal.classList.add('hidden');
    activeInspectedPiece = null;
    activeInspectedMultiPieces = null;
}
window.closePieceDetailModal = closePieceDetailModal;


// --- Parts Modal Functions ---

window.openPartsModal = function(setId) {
    const set = legoSets.find(s => s.id === setId);
    const setName = set ? set.name : (setId === 'Loose' ? 'Minifiguras sueltas' : `Set #${setId}`);
    
    activePartsSetId = setId;
    partsModalSetTitle.innerText = `${setName} (#${setId})`;
    
    const partsCostEl = document.getElementById('parts-modal-cost-val');
    if (partsCostEl) {
        const cost = set ? (parseFloat(set.parts_cost) || 0.0) : 0.0;
        partsCostEl.innerText = `${cost.toFixed(2)} €`;
    }
    
    // Reset tab and panes
    switchPartsTab('current-missing');
    
    // Render current missing
    renderCurrentMissing();
    
    partsModal.classList.remove('hidden');
};

window.quickEditPartsCost = async function() {
    if (!activePartsSetId) return;
    const set = legoSets.find(s => s.id === activePartsSetId);
    const currentCost = set ? (parseFloat(set.parts_cost) || 0.0) : 0.0;
    const input = prompt(`Introduce el nuevo gasto en piezas sueltas / repuestos para el Set #${activePartsSetId} (€):`, currentCost.toFixed(2));
    if (input === null) return;
    const newCost = parseFloat(input.replace(',', '.'));
    if (isNaN(newCost) || newCost < 0) {
        alert('Por favor introduce un importe válido en euros (ej: 1.50).');
        return;
    }
    
    try {
        const resp = await fetch(`/api/legos/${activePartsSetId}/parts-cost`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parts_cost: newCost })
        });
        if (!resp.ok) throw new Error('Error al actualizar coste de piezas');
        const updated = await resp.json();
        if (set) set.parts_cost = updated.parts_cost;
        
        const costEl = document.getElementById('parts-modal-cost-val');
        if (costEl) costEl.innerText = `${newCost.toFixed(2)} €`;
        
        updateShoppingListKPIs();
        applyFiltersAndSort();
        showNotification(`Gasto en piezas de #${activePartsSetId} actualizado a ${newCost.toFixed(2)} €`);
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

function switchPartsTab(tabName) {
    partsActiveTab = tabName;
    
    // Toggle active classes on tab buttons
    tabCurrentMissing.classList.toggle('active', tabName === 'current-missing');
    tabOfficialInventory.classList.toggle('active', tabName === 'official-inventory');
    tabManualAdd.classList.toggle('active', tabName === 'manual-add');
    
    // Toggle hidden classes on panes
    paneCurrentMissing.classList.toggle('hidden', tabName !== 'current-missing');
    paneOfficialInventory.classList.toggle('hidden', tabName !== 'official-inventory');
    paneManualAdd.classList.toggle('hidden', tabName !== 'manual-add');
    
    if (tabName === 'official-inventory') {
        loadOfficialInventory();
    }
}

function renderCurrentMissing() {
    if (!currentMissingList) return;
    currentMissingList.innerHTML = '';
    
    const setMissing = missingPieces.filter(p => p.set_id === activePartsSetId);
    
    if (setMissing.length === 0) {
        currentMissingList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">
                <p style="font-size: 1.1rem; font-weight: 600; margin: 0;">No hay piezas faltantes registradas en este set</p>
                <p style="font-size: 0.85rem; margin-top: 0.25rem;">Usa las otras pestañas para añadir piezas.</p>
            </div>
        `;
        return;
    }
    
    setMissing.forEach(p => {
        const statusClass = `status-${p.status}`;
        const statusLabel = p.status === 'needed' ? 'Necesitada' : (p.status === 'ordered' ? 'Pedida' : 'Recibida');
        const badgeClass = p.status === 'needed' ? 'badge-needed' : (p.status === 'ordered' ? 'badge-ordered' : 'badge-received');
        
        const card = document.createElement('div');
        card.className = `missing-piece-card ${statusClass}`;
        card.dataset.setId = p.set_id;
        card.dataset.partNum = p.part_num;
        card.dataset.colorId = p.color_id;
        card.title = "Haz clic para ver la ficha completa y ampliar imagen";
        card.innerHTML = `
            <div class="missing-piece-image-wrapper">
                <img class="missing-piece-img" src="${p.image_url || 'images/placeholder.png'}" alt="${esc(p.name)}" onerror="this.onerror=null; this.src='images/placeholder.png';">
            </div>
            <div class="missing-piece-details">
                <h4 class="missing-piece-name" title="${esc(p.name)}">${esc(p.name)}</h4>
                <span class="missing-piece-meta">ID: ${esc(p.part_num)} | Color: ${esc(p.color_name)}</span>
                <div>
                    <span class="badge-status ${badgeClass}">${statusLabel}</span>
                    <span class="missing-piece-qty-label">x<input type="number" class="input-qty-inline" value="${p.quantity}" min="1" onchange="changePieceQuantity('${p.set_id}', '${esc(p.part_num)}', ${p.color_id}, this.value)"></span>
                </div>
            </div>
            <div class="missing-piece-actions">
                <select class="select-status" onchange="changePieceStatus('${p.set_id}', '${esc(p.part_num)}', ${p.color_id}, this.value)">
                    <option value="needed" ${p.status === 'needed' ? 'selected' : ''}>Necesitada</option>
                    <option value="ordered" ${p.status === 'ordered' ? 'selected' : ''}>Pedida</option>
                    <option value="received" ${p.status === 'received' ? 'selected' : ''}>Recibida</option>
                </select>
                <button class="btn-delete-part" onclick="deletePiece('${p.set_id}', '${esc(p.part_num)}', ${p.color_id})">🗑️</button>
            </div>
        `;
        currentMissingList.appendChild(card);
    });
}

async function loadOfficialInventory() {
    if (!officialInventoryGrid) return;
    officialInventoryGrid.innerHTML = '';
    officialInventoryLoading.classList.remove('hidden');
    
    try {
        const response = await fetch(`/api/legos/${activePartsSetId}/parts`);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Error al obtener inventario');
        }
        officialInventory = await response.json();
        renderOfficialInventory();
    } catch (error) {
        officialInventoryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #EF4444; padding: 2rem;">
                <p style="font-weight: bold; margin: 0;">⚠️ No se pudo cargar el inventario oficial</p>
                <p style="font-size: 0.85rem; margin-top: 0.25rem;">${error.message}</p>
            </div>
        `;
    } finally {
        officialInventoryLoading.classList.add('hidden');
    }
}

function renderOfficialInventory() {
    if (!officialInventoryGrid) return;
    officialInventoryGrid.innerHTML = '';
    
    const query = inventorySearchInput.value.toLowerCase().trim();
    const filtered = officialInventory.filter(p => 
        p.part_num.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.color_name.toLowerCase().includes(query)
    );
    
    if (filtered.length === 0) {
        officialInventoryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">
                <p>No se encontraron piezas que coincidan con la búsqueda.</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'inventory-part-card';
        card.innerHTML = `
            <div class="inventory-part-img-wrapper">
                <span class="inventory-part-qty-badge">x${p.quantity} en set</span>
                <img src="${p.image_url || 'images/placeholder.png'}" alt="${esc(p.name)}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.onerror=null; this.src='images/placeholder.png';">
            </div>
            <div class="inventory-part-details">
                <h4 class="inventory-part-name" title="${esc(p.name)}">${esc(p.name)}</h4>
                <span class="inventory-part-code">Código: ${esc(p.part_num)}</span>
                <span class="inventory-part-color">${esc(p.color_name)}</span>
            </div>
            <div class="inventory-part-actions">
                <input type="number" class="input-qty-selector" id="qty-${esc(p.part_num)}-${p.color_id}" min="1" max="${p.quantity}" value="1">
                <button class="btn-add-part" onclick="addOfficialPart('${esc(p.part_num)}', ${p.color_id})">➕ Añadir</button>
            </div>
        `;
        officialInventoryGrid.appendChild(card);
    });
}

async function addOfficialPart(partNum, colorId) {
    const part = officialInventory.find(x => x.part_num === partNum && x.color_id === colorId);
    if (!part) return;
    
    const qtyInput = document.getElementById(`qty-${partNum}-${colorId}`);
    const qty = parseInt(qtyInput.value) || 1;
    
    const payload = {
        set_id: activePartsSetId,
        part_num: part.part_num,
        name: part.name,
        color_id: part.color_id,
        color_name: part.color_name,
        quantity: qty,
        status: 'needed',
        image_url: part.image_url
    };
    
    try {
        const response = await fetch('/api/missing-pieces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Error al añadir pieza faltante');
        const data = await response.json();
        
        // Update local state
        const idx = missingPieces.findIndex(x => x.set_id === activePartsSetId && x.part_num === partNum && x.color_id === colorId);
        if (idx !== -1) {
            missingPieces[idx] = data;
        } else {
            missingPieces.push(data);
        }
        
        updateShoppingListKPIs();
        showNotification('Pieza añadida a la lista de faltantes');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function addManualPart(event) {
    event.preventDefault();
    
    const fieldPartNum = document.getElementById('field-part-num');
    const fieldPartName = document.getElementById('field-part-name');
    const fieldPartColor = document.getElementById('field-part-color');
    const fieldPartQty = document.getElementById('field-part-qty');
    const fieldPartImg = document.getElementById('field-part-img');
    
    const payload = {
        set_id: activePartsSetId,
        part_num: fieldPartNum.value.trim(),
        name: fieldPartName.value.trim(),
        color_id: 0,
        color_name: fieldPartColor.value.trim(),
        quantity: parseInt(fieldPartQty.value) || 1,
        status: 'needed',
        image_url: fieldPartImg.value.trim()
    };
    
    try {
        const response = await fetch('/api/missing-pieces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Error al añadir pieza faltante');
        const data = await response.json();
        
        // Update local state
        const idx = missingPieces.findIndex(x => x.set_id === activePartsSetId && x.part_num === payload.part_num && x.color_id === 0);
        if (idx !== -1) {
            missingPieces[idx] = data;
        } else {
            missingPieces.push(data);
        }
        
        updateShoppingListKPIs();
        manualPartForm.reset();
        switchPartsTab('current-missing');
        renderCurrentMissing();
        showNotification('Pieza manual añadida con éxito');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function addPieceFromList(event) {
    event.preventDefault();

    const setId = document.getElementById('piece-set-id').value.trim() || 'MOC';
    const partNum = document.getElementById('piece-part-num').value.trim();
    const partName = document.getElementById('piece-part-name').value.trim();
    const color = document.getElementById('piece-color').value.trim();
    const qty = parseInt(document.getElementById('piece-qty').value) || 1;
    const imgUrl = document.getElementById('piece-img').value.trim();

    const payload = {
        set_id: setId,
        part_num: partNum,
        name: partName,
        color_id: 0,
        color_name: color,
        quantity: qty,
        status: 'needed',
        image_url: imgUrl
    };

    try {
        const response = await fetch('/api/missing-pieces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Error al añadir pieza');
        const data = await response.json();

        // The backend merges duplicates (same set + part + colour), so replace instead of pushing twice
        const idx = missingPieces.findIndex(x => x.set_id === data.set_id && x.part_num === data.part_num && x.color_id === data.color_id);
        if (idx !== -1) missingPieces[idx] = data;
        else missingPieces.push(data);
        updateShoppingListKPIs();
        renderShoppingList();
        pieceModal.classList.add('hidden');
        showNotification(`¡Pieza "${partName}" añadida a la lista de compras!`);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// ── Helpers for Condition Checkboxes & Minifig Checklist ───────────────────

function updateConditionFromCheckboxes() {
    const sealed = document.getElementById('cond-sealed').checked;
    const box = document.getElementById('cond-box').checked;
    const manual = document.getElementById('cond-manual').checked;
    const minifigs = document.getElementById('cond-minifigs').checked;
    const complete = document.getElementById('cond-complete').checked;
    
    const boxEl = document.getElementById('cond-box');
    const manualEl = document.getElementById('cond-manual');
    const minifigsEl = document.getElementById('cond-minifigs');
    const completeEl = document.getElementById('cond-complete');

    let condValue = 'complete_mib';
    let condText = 'Completo en caja con manual';

    if (sealed) {
        boxEl.disabled = true;
        manualEl.disabled = true;
        minifigsEl.disabled = true;
        completeEl.disabled = true;
        
        condValue = 'sealed';
        condText = 'Precintado (Sealed)';
    } else {
        boxEl.disabled = false;
        manualEl.disabled = false;
        minifigsEl.disabled = false;
        completeEl.disabled = false;

        if (complete) {
            if (minifigs) {
                if (box && manual) {
                    condValue = 'complete_mib';
                    condText = 'Completo en caja con manual (Complete MIB)';
                } else if (!box && manual) {
                    condValue = 'complete_loose';
                    condText = 'Completo sin caja, con manual (Complete Loose)';
                } else if (box && !manual) {
                    condValue = 'no_manual';
                    condText = 'Completo con caja, sin manual';
                } else {
                    condValue = 'no_box_no_manual';
                    condText = 'Completo sin caja y sin manual';
                }
            } else {
                condValue = 'no_minifigs';
                condText = 'Completo con caja, sin minifiguras';
            }
        } else {
            if (minifigs) {
                condValue = 'incomplete_with_minifigs';
                condText = 'Incompleto (falta pieza), con minifiguras';
            } else {
                condValue = 'incomplete_no_minifigs';
                condText = 'Incompleto y sin minifiguras';
            }
        }
    }

    document.getElementById('field-condition').value = condValue;
    document.getElementById('cond-computed-label').textContent = condText;
}

function setCheckboxesFromCondition(condition) {
    const sealedEl = document.getElementById('cond-sealed');
    const boxEl = document.getElementById('cond-box');
    const manualEl = document.getElementById('cond-manual');
    const minifigsEl = document.getElementById('cond-minifigs');
    const completeEl = document.getElementById('cond-complete');

    if (!sealedEl) return;

    // Reset defaults
    sealedEl.checked = false;
    boxEl.checked = true;
    manualEl.checked = true;
    minifigsEl.checked = true;
    completeEl.checked = true;

    if (condition === 'sealed') {
        sealedEl.checked = true;
    } else if (condition === 'complete_mib') {
        // already defaults
    } else if (condition === 'complete_loose') {
        boxEl.checked = false;
    } else if (condition === 'no_manual') {
        manualEl.checked = false;
    } else if (condition === 'no_box_no_manual') {
        boxEl.checked = false;
        manualEl.checked = false;
    } else if (condition === 'no_minifigs') {
        minifigsEl.checked = false;
    } else if (condition === 'incomplete_with_minifigs') {
        completeEl.checked = false;
    } else if (condition === 'incomplete_no_minifigs') {
        completeEl.checked = false;
        minifigsEl.checked = false;
    }
    updateConditionFromCheckboxes();
}

async function loadSetMinifigsChecklist(setId) {
    const panel = document.getElementById('minifig-checklist-panel');
    const loading = document.getElementById('minifig-checklist-loading');
    const grid = document.getElementById('minifig-checklist-grid');
    const status = document.getElementById('minifig-checklist-status');

    if (!panel) return;

    panel.classList.remove('hidden');
    loading.classList.remove('hidden');
    grid.innerHTML = '';
    status.textContent = '';
    currentSetMinifigs = [];

    try {
        const response = await fetch(`/api/sets/${setId}/minifigs`);
        if (!response.ok) {
            throw new Error('No se pudieron obtener las minifiguras de este set.');
        }
        const data = await response.json();
        loading.classList.add('hidden');

        if (data.length === 0) {
            panel.classList.add('hidden');
            return;
        }

        currentSetMinifigs = data.map(fig => ({
            ...fig,
            present: true
        }));

        renderMinifigsChecklistGrid();
    } catch (e) {
        loading.classList.add('hidden');
        panel.classList.add('hidden');
        console.error(e);
    }
}

function renderMinifigsChecklistGrid() {
    const grid = document.getElementById('minifig-checklist-grid');
    const status = document.getElementById('minifig-checklist-status');
    if (!grid) return;

    grid.innerHTML = '';
    
    let presentCount = 0;
    currentSetMinifigs.forEach((fig, index) => {
        if (fig.present) presentCount++;

        const card = document.createElement('div');
        card.className = `mf-check-card ${fig.present ? 'present' : 'missing'}`;
        card.innerHTML = `
            <div class="mf-status-badge">${fig.present ? '✓' : '✕'}</div>
            <img src="${fig.img_url || 'images/placeholder.png'}" alt="${esc(fig.name)}" onerror="this.onerror=null; this.src='images/placeholder.png';">
            <span class="mf-qty">x${fig.quantity}</span>
            <span class="mf-name" title="${esc(fig.name)}">${esc(fig.name)}</span>
        `;

        card.addEventListener('click', () => {
            fig.present = !fig.present;
            renderMinifigsChecklistGrid();

            // Auto toggle the minifigs checkbox in condition based on if all present or not
            const allPresent = currentSetMinifigs.every(f => f.present);
            const condMinifigsCheckbox = document.getElementById('cond-minifigs');
            if (condMinifigsCheckbox) {
                condMinifigsCheckbox.checked = allPresent;
                updateConditionFromCheckboxes();
            }
        });

        grid.appendChild(card);
    });

    if (status) {
        status.textContent = `${presentCount} de ${currentSetMinifigs.length} presentes`;
    }
}




// =====================================================================
// --- Goals (Objetivos) ---
// =====================================================================
let savedGoals = [];
let goalSearchResults = [];
let lastUsedFolder = null;
const NEW_FOLDER_VALUE = '__new__';

// --- Generic confirm dialog (replaces the browser's confirm()) ---
function confirmDialog({ title = '¿Seguro?', message = '', confirmText = 'Eliminar', danger = true } = {}) {
    const modal = document.getElementById('confirm-modal');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    const closeBtn = document.getElementById('confirm-close');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    okBtn.textContent = confirmText;
    okBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    modal.classList.remove('hidden');
    okBtn.focus();

    return new Promise(resolve => {
        const finish = (result) => {
            modal.classList.add('hidden');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            closeBtn.removeEventListener('click', onCancel);
            resolve(result);
        };
        const onOk = () => finish(true);
        const onCancel = () => finish(false);
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        closeBtn.addEventListener('click', onCancel);
    });
}

// --- Data helpers ---
function realGoals() {
    return savedGoals.filter(g => g.type !== 'folder');
}

// Folder names, including empty folders (kept as "folder" placeholder entries)
function goalFolders() {
    return [...new Set(savedGoals.map(g => g.folder).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function goalLinks(item) {
    if (item.type === 'set') {
        const setNum = item.id.includes('-') ? item.id : `${item.id}-1`;
        return {
            brickeconomy: `https://www.brickeconomy.com/search?query=${encodeURIComponent(item.id)}`,
            bricklink: `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${encodeURIComponent(setNum)}`,
            rebrickable: `https://rebrickable.com/sets/${encodeURIComponent(setNum)}/`
        };
    }
    return minifigCatalogLinks(item.id, item.name);
}

// "Sale en: 7931, 9498" -> ['7931', '9498']
function goalSetIds(goal) {
    const m = (goal.set_info || '').match(/Sale en:\s*(.*)/);
    if (!m || /desconocido/i.test(m[1])) return [];
    return m[1].split(',').map(s => s.trim()).filter(Boolean);
}

async function loadGoals() {
    try {
        const res = await fetch('/api/goals');
        // Goals saved before folders existed belong to the default folder
        savedGoals = (await res.json()).map(g => ({ ...g, folder: g.folder || 'Consejo Jedi' }));
        renderGoals();
        if (goalSearchResults.length) renderGoalSearchResults();
    } catch (e) {
        showError('No se pudieron cargar los objetivos.', e);
    }
}

// --- Cards (shared by search results and saved goals) ---
function goalCardHtml(item, { saved = false } = {}) {
    const links = goalLinks(item);
    const isSet = item.type === 'set';
    const alreadySaved = !saved && savedGoals.find(g => g.id === item.id && g.type !== 'folder');
    const setIds = saved && !isSet ? goalSetIds(item) : [];
    const ownedSet = isSet && legoSets.some(s => s.id === item.id);

    let footerInfo = '';
    if (saved && isSet) {
        footerInfo = ownedSet
            ? '<span class="goal-card-info owned">✓ Ya lo tienes en tu colección</span>'
            : `<span class="goal-card-info">${esc(item.set_info && !item.set_info.startsWith('Contiene') ? item.set_info : 'Set completo')}</span>`;
    } else if (setIds.length) {
        const shown = setIds.slice(0, 4).map(id => `<span class="goal-chip">#${esc(id)}</span>`).join('');
        footerInfo = `<span class="goal-card-info">Sale en</span><div class="goal-chips">${shown}${setIds.length > 4 ? `<span class="goal-chip more">+${setIds.length - 4}</span>` : ''}</div>`;
    }

    return `
        <article class="goal-card${alreadySaved ? ' is-saved' : ''}" data-goal-id="${esc(item.id)}">
            <div class="goal-card-stage" data-action="open" title="${saved ? 'Ver objetivo' : 'Añadir a objetivos'}">
                <span class="goal-type-badge ${isSet ? 'set' : 'fig'}">${isSet ? '🧱 Set' : '👤 Figura'}</span>
                ${saved ? '<button type="button" class="set-tool danger goal-card-delete" data-action="delete" title="Eliminar objetivo">🗑️</button>' : ''}
                ${alreadySaved ? `<span class="goal-saved-badge" title="Carpeta: ${esc(alreadySaved.folder)}">✓ En objetivos</span>` : ''}
                <img src="${esc(item.image_url || 'images/placeholder.png')}" alt="${esc(item.name)}" loading="lazy" onerror="this.onerror=null; this.src='images/placeholder.png'">
            </div>
            <span class="set-card-id">#${esc(item.id)}</span>
            <h3 class="goal-card-name" data-action="open" title="${esc(item.name)}">${esc(item.name)}</h3>
            <div class="goal-card-footer">${footerInfo}</div>
            <div class="set-card-links">
                <a href="${esc(links.brickeconomy)}" target="_blank" rel="noopener" class="set-link link-be">📈 BrickEconomy</a>
                <a href="${esc(links.bricklink)}" target="_blank" rel="noopener" class="set-link link-bl">BrickLink</a>
                <a href="${esc(links.rebrickable)}" target="_blank" rel="noopener" class="set-link link-rb">Rebrickable</a>
            </div>
        </article>`;
}

function renderGoals() {
    const goals = realGoals();
    const folders = goalFolders();
    const countEl = document.getElementById('goals-total-count');
    if (countEl) countEl.textContent = goals.length ? `${goals.length}` : '';

    if (folders.length === 0) {
        goalsFoldersContainer.innerHTML = `
            <div class="empty-state goals-empty">
                <div class="empty-icon">🎯</div>
                <h3>Aún no tienes objetivos</h3>
                <p>Busca arriba una minifigura que quieras conseguir y añádela a una carpeta.</p>
            </div>`;
        return;
    }

    goalsFoldersContainer.innerHTML = folders.map(folder => {
        const items = goals.filter(g => g.folder === folder);
        return `
            <section class="goal-folder" data-folder="${esc(folder)}">
                <div class="goal-folder-header">
                    <h3>📁 ${esc(folder)} <span class="goals-count">${items.length}</span></h3>
                    ${items.length === 0 ? `<button type="button" class="btn-link-danger" data-action="delete-folder" title="Eliminar carpeta vacía">Eliminar carpeta</button>` : ''}
                </div>
                ${items.length
                    ? `<div class="goals-grid">${items.map(g => goalCardHtml(g, { saved: true })).join('')}</div>`
                    : '<p class="goal-folder-empty">Carpeta vacía. Busca una figura arriba y elige esta carpeta al añadirla.</p>'}
            </section>`;
    }).join('');
}

function renderGoalSearchResults() {
    const grid = document.getElementById('goals-search-grid');
    grid.innerHTML = goalSearchResults.length
        ? goalSearchResults.map(m => goalCardHtml({ ...m, type: 'minifig' })).join('')
        : '<p class="goals-hint">No se encontraron minifiguras con ese nombre.</p>';
}

async function searchGoals(query) {
    const resultsBox = document.getElementById('goals-search-results');
    const grid = document.getElementById('goals-search-grid');
    const title = document.getElementById('goals-results-title');
    resultsBox.classList.remove('hidden');
    title.textContent = `Buscando «${query}»…`;
    grid.innerHTML = '<div class="loading-inline"><div class="spinner"></div><span>Buscando en Rebrickable…</span></div>';
    try {
        const res = await fetch(`/api/rebrickable/search-minifigs?search=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error((await res.json()).detail || `HTTP ${res.status}`);
        goalSearchResults = await res.json();
        title.textContent = `${goalSearchResults.length} resultado${goalSearchResults.length === 1 ? '' : 's'} para «${query}»`;
        renderGoalSearchResults();
    } catch (e) {
        goalSearchResults = [];
        title.textContent = 'Error en la búsqueda';
        grid.innerHTML = `<p class="goals-hint">No se pudo buscar en Rebrickable: ${esc(e.message)}</p>`;
    }
}

// --- Goal modal: 'add' (from search), 'saved' (existing goal), 'view' (figure from your collection) ---
const goalModal = { mode: 'add', item: null, sets: [], selected: null, requestId: 0 };
const goalDetailModal = document.getElementById('goal-detail-modal');

function closeGoalModal() {
    goalDetailModal.classList.add('hidden');
    goalModal.requestId++;
}

// Entry point used by the minifigure cards of your collection
function openGoalDetail(id, name, img_url, type) {
    openGoalModal('view', { id, name, image_url: img_url, type });
}

function fillFolderSelect(current) {
    const select = document.getElementById('goal-folder-select');
    const input = document.getElementById('goal-new-folder-input');
    const folders = goalFolders();
    select.innerHTML = folders.map(f => `<option value="${esc(f)}">📁 ${esc(f)}</option>`).join('') +
        `<option value="${NEW_FOLDER_VALUE}">➕ Nueva carpeta…</option>`;
    const preferred = current || (lastUsedFolder && folders.includes(lastUsedFolder) ? lastUsedFolder : folders[0]);
    select.value = preferred || NEW_FOLDER_VALUE;
    input.value = '';
    input.classList.toggle('hidden', select.value !== NEW_FOLDER_VALUE);
}

function goalOptionHtml(opt, { selectable, selected }) {
    const owned = opt.type === 'set' && legoSets.some(s => s.id === opt.id);
    return `
        <button type="button" class="goal-option${selected ? ' selected' : ''}${selectable ? '' : ' static'}${owned ? ' owned' : ''}"
                data-option-id="${esc(opt.id)}" data-option-type="${opt.type}" ${selectable ? '' : 'tabindex="-1"'}>
            <div class="goal-option-img">
                ${owned ? '<span class="goal-set-owned-badge">✓ Lo tienes</span>' : ''}
                ${selectable ? '<span class="goal-option-check">✓</span>' : ''}
                <img src="${esc(opt.image_url || 'images/placeholder.png')}" alt="" loading="lazy" onerror="this.onerror=null; this.src='images/placeholder.png'">
            </div>
            <span class="goal-option-kind">${opt.type === 'set' ? `Set #${esc(opt.id)}` : 'Figura suelta'}</span>
            <span class="goal-option-name" title="${esc(opt.name)}">${esc(opt.name)}</span>
        </button>`;
}

function renderGoalOptions() {
    const grid = document.getElementById('goal-detail-sets-grid');
    const { mode, item, sets, selected } = goalModal;
    const selectable = mode === 'add';

    const options = [];
    if (selectable) options.push({ id: item.id, name: item.name, image_url: item.image_url, type: 'minifig' });
    sets.forEach(s => options.push({ id: s.id, name: s.name, image_url: s.image_url, type: 'set' }));

    if (item.type === 'set') {
        grid.innerHTML = goalOptionHtml({ ...item, type: 'set' }, { selectable: false, selected: false });
        return;
    }
    if (options.length === 0) {
        grid.innerHTML = '<p class="goal-sets-empty">No se encontraron sets para esta minifigura.</p>';
        return;
    }
    grid.innerHTML = options.map(o => goalOptionHtml(o, {
        selectable,
        selected: selectable && selected && selected.id === o.id && selected.type === o.type
    })).join('');
}

async function openGoalModal(mode, item) {
    const requestId = ++goalModal.requestId;
    Object.assign(goalModal, { mode, item, sets: [], selected: mode === 'add' ? { id: item.id, type: 'minifig' } : null });

    const isSet = item.type === 'set';
    const kicker = {
        add: 'AÑADIR OBJETIVO',
        saved: `OBJETIVO · 📁 ${item.folder || ''}`.toUpperCase(),
        view: 'MINIFIGURA DE TU COLECCIÓN'
    }[mode];
    document.getElementById('goal-detail-type').textContent = kicker;
    document.getElementById('goal-detail-title').textContent = item.name;
    document.getElementById('goal-detail-id-badge').textContent = `#${item.id}`;
    const img = document.getElementById('goal-detail-image');
    img.onerror = () => { img.onerror = null; img.src = 'images/placeholder.png'; };
    img.src = item.image_url || 'images/placeholder.png';

    const links = goalLinks(item);
    document.getElementById('goal-detail-brickeconomy-link').href = links.brickeconomy;
    document.getElementById('goal-detail-bricklink-link').href = links.bricklink;
    document.getElementById('goal-detail-rebrickable-link').href = links.rebrickable;

    // Steps & footer per mode
    document.getElementById('goal-step1-title').textContent = mode === 'add'
        ? '¿Qué quieres conseguir?'
        : (isSet ? 'Objetivo' : 'Sets en los que aparece');
    const step2 = document.getElementById('goal-folder-select').closest('.goal-step');
    step2.classList.toggle('hidden', mode === 'view');
    document.querySelectorAll('#goal-detail-modal .goal-step-num').forEach(n => n.classList.toggle('hidden', mode === 'view'));
    if (mode !== 'view') fillFolderSelect(mode === 'saved' ? item.folder : null);

    const saveBtn = document.getElementById('goal-btn-save');
    saveBtn.classList.toggle('hidden', mode === 'view');
    saveBtn.textContent = mode === 'add' ? '🎯 Añadir objetivo' : '💾 Guardar carpeta';
    saveBtn.disabled = false;
    document.getElementById('goal-btn-cancel').textContent = mode === 'view' ? 'Cerrar' : 'Cancelar';
    document.getElementById('goal-btn-delete').classList.toggle('hidden', mode !== 'saved');

    const grid = document.getElementById('goal-detail-sets-grid');
    const loading = document.getElementById('goal-detail-sets-loading');
    grid.innerHTML = '';
    goalDetailModal.classList.remove('hidden');

    if (isSet) {
        loading.classList.add('hidden');
        renderGoalOptions();
        return;
    }

    // BrickLink-style codes (sw0001c...) are unknown to Rebrickable
    if (!item.id.startsWith('fig-')) {
        loading.classList.add('hidden');
        grid.innerHTML = `
            <p class="goal-sets-empty">
                Esta figura usa el código de BrickLink <strong>${esc(item.id)}</strong>, que Rebrickable no reconoce.<br>
                <a href="https://www.bricklink.com/catalogItemIn.asp?M=${encodeURIComponent(item.id)}&in=S" target="_blank" rel="noopener">Ver en qué sets aparece en BrickLink ↗</a>
            </p>`;
        return;
    }

    loading.classList.remove('hidden');
    try {
        const res = await fetch(`/api/rebrickable/minifigs/${encodeURIComponent(item.id)}/sets`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sets = await res.json();
        if (requestId !== goalModal.requestId) return;
        goalModal.sets = sets || [];
    } catch (e) {
        if (requestId !== goalModal.requestId) return;
        goalModal.sets = [];
        console.error('Error loading sets for minifig:', e);
    }
    loading.classList.add('hidden');
    renderGoalOptions();
}

function resolveGoalFolder() {
    const select = document.getElementById('goal-folder-select');
    if (select.value !== NEW_FOLDER_VALUE) return select.value;
    const name = document.getElementById('goal-new-folder-input').value.trim();
    if (!name) {
        showNotification('Escribe un nombre para la nueva carpeta');
        document.getElementById('goal-new-folder-input').focus();
        return null;
    }
    return name;
}

async function saveGoalModal() {
    const { mode, item, sets, selected } = goalModal;
    const folder = resolveGoalFolder();
    if (!folder) return;
    const saveBtn = document.getElementById('goal-btn-save');
    saveBtn.disabled = true;

    try {
        if (mode === 'saved') {
            if (folder !== item.folder) {
                const res = await fetch(`/api/goals/${encodeURIComponent(item.id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folder })
                });
                if (!res.ok) throw new Error((await res.json()).detail || 'No se pudo mover');
                showNotification(`📁 Movido a «${folder}»`);
            }
        } else {
            let payload;
            if (selected && selected.type === 'set') {
                const s = sets.find(x => x.id === selected.id);
                payload = { id: s.id, name: s.name, type: 'set', image_url: s.image_url || '', folder,
                            set_info: `Contiene: ${item.name}` };
            } else {
                const setInfo = sets.length ? `Sale en: ${sets.map(s => s.id).join(', ')}` : '';
                payload = { id: item.id, name: item.name, type: 'minifig', image_url: item.image_url || '', folder,
                            set_info: setInfo };
            }
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).detail || 'No se pudo añadir');
            showNotification(`🎯 «${payload.name}» añadido a ${folder}`);
        }
        lastUsedFolder = folder;
        closeGoalModal();
        await loadGoals();
    } catch (e) {
        showError('No se pudo guardar el objetivo.', e);
    } finally {
        saveBtn.disabled = false;
    }
}

async function deleteGoal(goal) {
    const ok = await confirmDialog({
        title: '¿Eliminar objetivo?',
        message: `Se quitará «${goal.name}» de la carpeta «${goal.folder}».`
    });
    if (!ok) return false;
    try {
        const res = await fetch(`/api/goals/${encodeURIComponent(goal.id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo eliminar');
        showNotification('Objetivo eliminado');
        await loadGoals();
        return true;
    } catch (e) {
        showError('No se pudo eliminar el objetivo.', e);
        return false;
    }
}

async function createGoalFolder(name) {
    if (goalFolders().some(f => f.toLowerCase() === name.toLowerCase())) {
        showNotification(`La carpeta «${name}» ya existe`);
        return false;
    }
    try {
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'folder_' + Date.now(), name: '[Carpeta Vacía]', type: 'folder', image_url: '', folder: name, set_info: '' })
        });
        if (!res.ok) throw new Error('No se pudo crear la carpeta');
        showNotification(`📁 Carpeta «${name}» creada`);
        await loadGoals();
        return true;
    } catch (e) {
        showError('No se pudo crear la carpeta.', e);
        return false;
    }
}

async function deleteGoalFolder(folder) {
    const placeholders = savedGoals.filter(g => g.folder === folder && g.type === 'folder');
    try {
        for (const p of placeholders) {
            await fetch(`/api/goals/${encodeURIComponent(p.id)}`, { method: 'DELETE' });
        }
        showNotification(`Carpeta «${folder}» eliminada`);
        await loadGoals();
    } catch (e) {
        showError('No se pudo eliminar la carpeta.', e);
    }
}

// --- Wiring ---
(function setupGoals() {
    if (navGoals) {
        navGoals.addEventListener('click', () => {
            if (activeView === 'goals') return;
            activeView = 'goals';

            navGoals.classList.add('active');
            if (navSets) navSets.classList.remove('active');
            if (navMinifigs) navMinifigs.classList.remove('active');
            if (navShoppingList) navShoppingList.classList.remove('active');

            if (goalsView) goalsView.classList.remove('hidden');
            if (emptyState) emptyState.classList.add('hidden');

            document.querySelector('.stats-section').classList.add('hidden');
            const catSection = document.querySelector('.category-selection-section');
            if (catSection) catSection.classList.add('hidden');
            setMainToolbarVisible(false);
            if (categoryHero) categoryHero.classList.add('hidden');

            if (setsGrid) setsGrid.classList.add('hidden');
            if (minifigsGrid) minifigsGrid.classList.add('hidden');
            if (shoppingListView) shoppingListView.classList.add('hidden');

            if (btnAddSet) btnAddSet.classList.add('hidden');
            if (btnAddMinifig) btnAddMinifig.classList.add('hidden');
            if (btnAddPiece) btnAddPiece.classList.add('hidden');

            loadGoals();
        });
    }

    document.getElementById('goals-search-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = goalsSearchInput.value.trim();
        if (q) searchGoals(q);
    });

    document.getElementById('btn-clear-goals')?.addEventListener('click', () => {
        goalsSearchInput.value = '';
        goalSearchResults = [];
        goalsSearchResults.classList.add('hidden');
    });

    // New folder inline form
    const newFolderForm = document.getElementById('new-folder-form');
    const newFolderInput = document.getElementById('new-folder-input');
    document.getElementById('btn-new-folder')?.addEventListener('click', () => {
        newFolderForm.classList.toggle('hidden');
        if (!newFolderForm.classList.contains('hidden')) newFolderInput.focus();
    });
    document.getElementById('btn-cancel-new-folder')?.addEventListener('click', () => {
        newFolderInput.value = '';
        newFolderForm.classList.add('hidden');
    });
    newFolderForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = newFolderInput.value.trim();
        if (!name) return;
        if (await createGoalFolder(name)) {
            newFolderInput.value = '';
            newFolderForm.classList.add('hidden');
        }
    });

    // Search result cards: open the "add" modal
    document.getElementById('goals-search-grid')?.addEventListener('click', (e) => {
        if (!e.target.closest('[data-action="open"]')) return;
        const card = e.target.closest('.goal-card');
        const result = goalSearchResults.find(m => m.id === card?.dataset.goalId);
        if (result) openGoalModal('add', { ...result, type: 'minifig' });
    });

    // Saved goal cards: open / delete; empty folders: delete
    goalsFoldersContainer?.addEventListener('click', async (e) => {
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (action === 'delete-folder') {
            const folder = actionEl.closest('.goal-folder')?.dataset.folder;
            if (folder) deleteGoalFolder(folder);
            return;
        }
        const card = e.target.closest('.goal-card');
        const goal = savedGoals.find(g => g.id === card?.dataset.goalId);
        if (!goal) return;
        if (action === 'delete') deleteGoal(goal);
        else if (action === 'open') openGoalModal('saved', goal);
    });

    // Modal: option selection, folder picker, buttons
    document.getElementById('goal-detail-sets-grid')?.addEventListener('click', (e) => {
        const opt = e.target.closest('.goal-option');
        if (!opt || goalModal.mode !== 'add') return;
        goalModal.selected = { id: opt.dataset.optionId, type: opt.dataset.optionType };
        renderGoalOptions();
    });
    document.getElementById('goal-folder-select')?.addEventListener('change', (e) => {
        const input = document.getElementById('goal-new-folder-input');
        const isNew = e.target.value === NEW_FOLDER_VALUE;
        input.classList.toggle('hidden', !isNew);
        if (isNew) input.focus();
    });
    document.getElementById('goal-new-folder-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveGoalModal(); }
    });
    document.getElementById('btn-close-goal-detail')?.addEventListener('click', closeGoalModal);
    document.getElementById('goal-btn-cancel')?.addEventListener('click', closeGoalModal);
    document.getElementById('goal-btn-save')?.addEventListener('click', saveGoalModal);
    document.getElementById('goal-btn-delete')?.addEventListener('click', async () => {
        if (goalModal.mode !== 'saved') return;
        if (await deleteGoal(goalModal.item)) closeGoalModal();
    });
})();

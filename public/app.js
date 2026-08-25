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
const setsKpis = document.getElementById('sets-kpis');
const minifigsKpis = document.getElementById('minifigs-kpis');
const shoppingListKpis = document.getElementById('shopping-list-kpis');
const minifigsGrid = document.getElementById('minifigs-grid');
const shoppingListView = document.getElementById('shopping-list-view');
const shoppingListContainer = document.getElementById('shopping-list-container');

// KPI elements for Shopping List
const valTotalMissingParts = document.getElementById('val-total-missing-parts');
const valMissingPartsTypes = document.getElementById('val-missing-parts-types');
const valOrderedMissingParts = document.getElementById('val-ordered-missing-parts');
const valReceivedMissingParts = document.getElementById('val-received-missing-parts');
const btnGroupBySet = document.getElementById('btn-group-by-set');
const btnGroupByPart = document.getElementById('btn-group-by-part');

// Add Piece Modal elements
const btnAddPiece = document.getElementById('btn-add-piece');
const pieceModal = document.getElementById('piece-modal');
const pieceForm = document.getElementById('piece-form');
const btnClosePieceModal = document.getElementById('btn-close-piece-modal');
const btnCancelPiece = document.getElementById('btn-cancel-piece');

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
    let totalRetailVal = 0;
    let totalPaidVal = 0;

    legoSets.forEach(s => {
        if (s.subcategory === 'Loose Minifigure') return; // Exclude loose minifigures
        
        const spentOnSet = s.purchase_price + s.extra_costs;
        totalInvested += spentOnSet;
        totalSpentExtra += s.extra_costs;
        
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
        totalInvestedSpeculation += (s.purchase_price + s.extra_costs);
        totalMarketValInvestment += s.market_price;
    });

    const investmentProfit = totalMarketValInvestment - totalInvestedSpeculation;
    const investmentRoi = totalInvestedSpeculation > 0 ? (investmentProfit / totalInvestedSpeculation) * 100 : 0;

    // Set Investment/Overall Values
    valTotalSpent.innerText = `${totalInvested.toFixed(2)} €`;
    subSpentExtra.innerText = `(incl. ${totalSpentExtra.toFixed(2)} € de costes ocultos)`;
    
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
}

// --- Category Selector & Hero Banner updates ---
function updateCategoryCounts() {
    // Only count actual sets, excluding loose minifigures
    const actualSets = legoSets.filter(s => s.subcategory !== 'Loose Minifigure');
    let allCount = actualSets.length;
    let swCount = 0;
    let batCount = 0;
    let pirCount = 0;
    let hpCount = 0;
    let otherCount = 0;
    
    actualSets.forEach(set => {
        const themeLower = set.theme.toLowerCase();
        if (themeLower.includes('star wars') || themeLower.includes('starwars')) {
            swCount++;
        } else if (themeLower.includes('batman')) {
            batCount++;
        } else if (themeLower.includes('pirate') || themeLower.includes('pirata')) {
            pirCount++;
        } else if (themeLower.includes('harry potter') || themeLower.includes('harrypotter')) {
            hpCount++;
        } else {
            otherCount++;
        }
    });
    
    if (countAll) countAll.innerText = `${allCount} ${allCount === 1 ? 'set' : 'sets'}`;
    if (countSw) countSw.innerText = `${swCount} ${swCount === 1 ? 'set' : 'sets'}`;
    if (countBat) countBat.innerText = `${batCount} ${batCount === 1 ? 'set' : 'sets'}`;
    if (countPir) countPir.innerText = `${pirCount} ${pirCount === 1 ? 'set' : 'sets'}`;
    if (countOther) countOther.innerText = `${otherCount} ${otherCount === 1 ? 'sets' : 'sets'}`;
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

// --- Card Rendering ---
function renderCards() {
    setsGrid.innerHTML = '';
    
    if (filteredSets.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');

    filteredSets.forEach(set => {
        const card = document.createElement('div');
        card.className = `lego-card`;
        
        // Theme Accents
        const tLower = set.theme.toLowerCase();
        if (tLower.includes('star wars') || tLower.includes('starwars')) {
            card.classList.add('theme-starwars');
        } else if (tLower.includes('batman')) {
            card.classList.add('theme-batman');
        } else if (tLower.includes('pirate') || tLower.includes('pirata')) {
            card.classList.add('theme-pirates');
        }

        // Financial Purpose Accent
        if (set.goal === 'investment') {
            card.classList.add('goal-investment');
        } else if (set.goal === 'collection' || set.goal === 'legacy') {
            card.classList.add('goal-collection');
            if (set.goal === 'legacy') {
                card.classList.add('legacy-set');
            }
        }

        // Calculations for card
        const spentOnSet = set.purchase_price + set.extra_costs;
        const savedOnSet = set.retail_price - set.purchase_price;
        const savingPct = set.retail_price > 0 ? (savedOnSet / set.retail_price) * 100 : 0;
        
        const isLegacy = set.goal === 'legacy';
        const potentialProfit = set.market_price - spentOnSet;
        const roiPct = spentOnSet > 0 ? (potentialProfit / spentOnSet) * 100 : 0;

        let isObsoleteSaving = false;
        if (set.purchase_date && set.retirement_date && set.retirement_date !== 'Active') {
            const purDt = new Date(set.purchase_date);
            const retDt = new Date(set.retirement_date);
            if (!isNaN(purDt) && !isNaN(retDt)) {
                if ((purDt - retDt) / (1000 * 60 * 60 * 24 * 365.25) > 5.0) {
                    isObsoleteSaving = true;
                }
            }
        }

        // Condition Badge Label
        const conditionLabels = {
            'sealed': 'Sealed 📦',
            'complete_mib': 'MIB 📂',
            'complete_loose': 'Loose 🧱',
            'no_manual': 'No Manual 📖',
            'no_box_no_manual': 'No Box/Manual 🗑️',
            'no_minifigs': 'No Minifigs 👥',
            'incomplete_with_minifigs': 'Inc. + Figs ⚠️',
            'incomplete_no_minifigs': 'Incomplete ⚠️'
        };
        const conditionText = conditionLabels[set.condition] || set.condition;

        // Resolve image URL (autocomplete using local image if empty or points to brickset)
        let imgUrl = set.image_url;
        if (!imgUrl || imgUrl.includes('brickset.com')) {
            imgUrl = `images/${set.id}.png`;
        }

        // Build Card HTML
        card.innerHTML = `
            <div class="card-image-wrapper">
                <div class="card-badges-floating">
                    <span class="badge badge-condition condition-${set.condition}">${conditionText}</span>
                    <span class="badge badge-goal goal-${set.goal}">${set.goal === 'investment' ? 'Inversión 📈' : (set.goal === 'legacy' ? 'Legado 👑' : 'Colección ✨')}</span>
                </div>
                <img class="card-image" src="${imgUrl}" alt="${set.name}" loading="lazy" onerror="if (this.src.endsWith('.png') || this.src.includes('.png')) { this.src = 'images/${set.id}.jpg'; } else { this.style.display='none'; this.nextElementSibling.style.display='flex'; }">
                <div class="image-fallback" style="display: none;">
                    <img src="images/logo.png" class="fallback-logo" alt="Lego">
                    <span class="fallback-text">#${set.id}</span>
                </div>
            </div>
            
            <div class="card-header">
                <span class="set-id">#${set.id}</span>
                <h3 class="set-name">${set.name}</h3>
                <span class="set-sub">${set.theme} ${set.subcategory ? `• ${set.subcategory}` : ''}</span>
            </div>
            
            <div class="card-details">
                <div class="detail-row">
                    <span class="detail-label">PVP Oficial:</span>
                    <span class="detail-val">${set.retail_price.toFixed(2)} €</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Adquisición:</span>
                    <span class="detail-val highlight-val">${isLegacy ? 'Legacy (Infancia/Regalo)' : `${set.purchase_price.toFixed(2)} €`}</span>
                </div>
                ${set.extra_costs > 0 ? `
                <div class="detail-row small-row">
                    <span class="detail-label">Costes Extra:</span>
                    <span class="detail-val">+${set.extra_costs.toFixed(2)} €</span>
                </div>` : ''}
                <div class="detail-row">
                    <span class="detail-label">Valor de Mercado:</span>
                    <span class="detail-val market-val">${set.market_price.toFixed(2)} €</span>
                </div>
            </div>

            <!-- Financial Analysis Widget -->
            <div class="financial-widget">
                ${set.goal === 'investment' ? `
                    <div class="profit-row">
                        <span class="widget-lbl">Plusvalía:</span>
                        <span class="widget-val ${potentialProfit >= 0 ? 'profit-gain' : 'profit-loss'}">
                            ${potentialProfit >= 0 ? '+' : ''}${potentialProfit.toFixed(2)} € (${roiPct.toFixed(0)}% ROI)
                        </span>
                    </div>
                    ${savingPct > 0 ? `
                    <div class="savings-progress">
                        <div class="progress-bar" style="width: ${Math.min(savingPct, 100)}%"></div>
                        <span class="progress-lbl">Ahorraste un ${savingPct.toFixed(0)}% en compra</span>
                    </div>` : ''}
                ` : `
                    ${isLegacy ? `
                        <div class="legacy-badge-box">
                            <span class="legacy-lbl">👑 Joya Familiar (100% Equity)</span>
                            <span class="legacy-sub">Valuación neta: ${set.market_price.toFixed(2)} €</span>
                        </div>
                    ` : `
                        ${isObsoleteSaving ? `
                            <div class="legacy-badge-box" style="border-left-color: var(--accent-primary);">
                                <span class="legacy-lbl" style="color: var(--text-secondary);">🕰️ Adquirido Descatalogado</span>
                                <span class="legacy-sub">PVP Original: ${set.retail_price.toFixed(2)} €</span>
                            </div>
                        ` : `
                            <div class="profit-row">
                                <span class="widget-lbl">Ahorro en PVP:</span>
                                <span class="widget-val ${savedOnSet >= 0 ? 'profit-gain' : 'profit-loss'}">
                                    ${savedOnSet.toFixed(2)} € (${savingPct.toFixed(0)}%)
                                </span>
                            </div>
                        `}
                    `}
                `}
            </div>

            <div class="purchase-store-info">
                ${set.purchase_store || set.purchase_location ? `
                    <span>🛍️ ${set.purchase_store || 'Desconocido'} (${set.purchase_location || 'Canal'})</span>
                ` : '<span>🛒 Canal de compra no especificado</span>'}
            </div>

            ${set.notes ? `
            <div class="card-notes">
                <p>📝 ${set.notes}</p>
            </div>` : ''}

            <div class="card-dates-info">
                <span>📅 Salida: ${set.release_date}</span>
                <span>📅 Retirada: ${set.retirement_date}</span>
            </div>

            <div class="card-actions">
                <a href="${set.official_url || `https://www.lego.com/es-es/search?q=${set.id}`}" target="_blank" class="btn-card-action btn-url" title="Ver en Lego Oficial">🔗 Lego</a>
                <a href="https://www.brickeconomy.com/search?query=${set.id}" target="_blank" class="btn-card-action btn-url" style="background: rgba(16, 185, 129, 0.08); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.15);" title="Ver Valor de Mercado en BrickEconomy">📈 Valor</a>
                <a href="https://www.bricklink.com/v2/catalog/catalogitem.page?S=${set.id}-1" target="_blank" class="btn-card-action btn-url" style="background: rgba(59, 130, 246, 0.08); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.15);" title="Ver en BrickLink">📊 BrickLink</a>
            </div>
            <div class="card-actions" style="border-top: none; margin-top: -0.2rem; padding-top: 0;">
                <button class="btn-card-action" style="background: rgba(245, 158, 11, 0.08); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.15); font-size: 0.72rem; padding: 0.4rem;" onclick="openPartsModal('${set.id}')">🔧 Piezas</button>
                <button class="btn-card-action btn-edit" onclick="openEditModal('${set.id}')">✏️ Editar</button>
                <button class="btn-card-action btn-delete" onclick="openDeleteModal('${set.id}', '${set.name.replace(/'/g, "\\'")}')">🗑️ Borrar</button>
            </div>
        `;
        setsGrid.appendChild(card);
    });
}


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
        const tLower = fig.theme.toLowerCase();
        if (tLower.includes('star wars') || tLower.includes('starwars')) {
            card.classList.add('theme-starwars');
        } else if (tLower.includes('batman')) {
            card.classList.add('theme-batman');
        } else if (tLower.includes('pirate') || tLower.includes('pirata')) {
            card.classList.add('theme-pirates');
        } else {
            card.classList.add('theme-other');
        }
        
        // Resolve image URL
        let imgUrl = fig.image_url;
        if (imgUrl && imgUrl.startsWith('images/')) {
            imgUrl = `${imgUrl}?t=${Date.now()}`;
        } else if (!imgUrl) {
            imgUrl = `https://img.bricklink.com/ItemImage/MN/0/${fig.code}.png`;
        }
        
        // Build Sets Origin List
        const setsHtml = fig.sets.map(s => `
            <div class="origin-set-item">
                <span class="origin-set-id">#${s.id}</span>
                <span class="origin-set-name">${s.name}</span>
                <span class="origin-set-qty">x${s.qty_in_set} ${s.qty_owned > 1 ? `<small class="qty-owned-label">(${s.qty_owned}x sets)</small>` : ''}</span>
            </div>
        `).join('');
        
        card.innerHTML = `
            <div class="minifig-image-wrapper">
                <span class="minifig-qty-badge">x${fig.quantity}</span>
                <img class="minifig-image" src="${imgUrl}" alt="${fig.name}" loading="lazy" onerror="if(!this.src.startsWith('https://img.bricklink.com/')) { this.src='https://img.bricklink.com/ItemImage/MN/0/${fig.code}.png'; } else { this.style.display='none'; this.nextElementSibling.style.display='flex'; }">
                <div class="minifig-fallback" style="display:none;">
                    <span>👥</span>
                    <small>${fig.code}</small>
                </div>
            </div>
            
            <div class="minifig-header">
                <span class="minifig-code-label">#${fig.code}</span>
                <h3 class="minifig-name-label" title="${fig.name}">${fig.name}</h3>
                <span class="minifig-theme-label">${fig.theme}</span>
            </div>
            
            <div class="minifig-origins">
                <h4 class="origins-title">📍 Incluida en:</h4>
                <div class="origins-list">
                    ${setsHtml}
                </div>
            </div>
            
            <div class="minifig-actions">
                ${fig.code.startsWith('fig-') ? `
                    <a href="https://rebrickable.com/minifigs/${fig.code}/" target="_blank" class="btn-minifig-action btn-rebrickable" title="Ver catálogo en Rebrickable">📊 Rebrickable</a>
                ` : `
                    <a href="https://www.bricklink.com/v2/catalog/catalogitem.page?M=${fig.code}" target="_blank" class="btn-minifig-action btn-bricklink" title="Ver catálogo en BrickLink">📊 BrickLink</a>
                `}
            </div>
            ${fig.sets.some(s => s.id === 'Loose') ? `
            <div class="minifig-actions" style="border-top: none; margin-top: -0.2rem; padding-top: 0;">
                <button class="btn-minifig-action btn-edit" style="font-size: 0.72rem; padding: 0.4rem;" onclick="openEditModal('${fig.code}')">✏️ Editar</button>
                <button class="btn-minifig-action btn-delete" style="font-size: 0.72rem; padding: 0.4rem;" onclick="openDeleteModal('${fig.code}', '${fig.name.replace(/'/g, "\\'")}')">🗑️ Borrar</button>
            </div>
            ` : ''}
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
            let matchesTheme = true;
            if (activeThemeFilter !== 'all') {
                const themeLower = fig.theme.toLowerCase();
                if (activeThemeFilter === 'other') {
                    matchesTheme = !themeLower.includes('star wars') && 
                                   !themeLower.includes('starwars') && 
                                   !themeLower.includes('batman') && 
                                   !themeLower.includes('pirate');
                } else {
                    matchesTheme = themeLower.includes(activeThemeFilter.toLowerCase());
                }
            }

            return matchesSearch && matchesTheme;
        });

        // 3. Sorting
        const sortVal = sortSelect.value;
        filteredMinifigures.sort((a, b) => {
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
        let matchesTheme = true;
        if (activeThemeFilter !== 'all') {
            const setThemes = set.theme.toLowerCase();
            if (activeThemeFilter === 'other') {
                matchesTheme = !setThemes.includes('star wars') && 
                               !setThemes.includes('starwars') && 
                               !setThemes.includes('batman') && 
                               !setThemes.includes('pirate');
            } else {
                matchesTheme = setThemes.includes(activeThemeFilter.toLowerCase());
            }
        }

        // Goal Filter matches
        let matchesGoal = true;
        const goalValue = filterGoalSelect.value;
        if (goalValue !== 'all') {
            matchesGoal = (set.goal === goalValue);
        }

        return matchesSearch && matchesTheme && matchesGoal;
    });

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
    
    // Sync active KPI card borders
    const goalVal = filterGoalSelect.value;
    document.querySelectorAll('.kpi-card').forEach(card => card.classList.remove('active-filter'));
    if (goalVal === 'investment') {
        document.getElementById('kpi-total-spent')?.classList.add('active-filter');
        document.getElementById('kpi-total-saved')?.classList.add('active-filter');
        document.getElementById('kpi-investment-roi')?.classList.add('active-filter');
    } else if (goalVal === 'collection') {
        document.getElementById('kpi-portfolio-equity')?.classList.add('active-filter');
    } else if (goalVal === 'legacy') {
        document.getElementById('kpi-legacy-count')?.classList.add('active-filter');
    }

    renderCards();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Tab Navigation
    if (navSets && navMinifigs && navShoppingList) {
        navSets.addEventListener('click', () => {
            if (activeView === 'sets') return;
            activeView = 'sets';
            
            navSets.classList.add('active');
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
                <option value="qty_desc">Cantidad: Mayor primero</option>
                <option value="qty_asc">Cantidad: Menor primero</option>
                <option value="name_asc">Nombre: A-Z</option>
                <option value="code_asc">Código: A-Z</option>
                <option value="set_asc">Set: Por número de set</option>
            `;
            sortSelect.value = 'qty_desc';
            
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

    // KPI Cards clicks
    const kpiTotalSpent = document.getElementById('kpi-total-spent');
    const kpiTotalSaved = document.getElementById('kpi-total-saved');
    const kpiInvestmentRoi = document.getElementById('kpi-investment-roi');
    const kpiPortfolioEquity = document.getElementById('kpi-portfolio-equity');
    const kpiLegacyCount = document.getElementById('kpi-legacy-count');

    const handleKpiClick = (targetValue) => {
        if (filterGoalSelect.value === targetValue) {
            filterGoalSelect.value = 'all';
        } else {
            filterGoalSelect.value = targetValue;
        }
        filterGoalSelect.dispatchEvent(new Event('change'));
    };

    if (kpiTotalSpent) kpiTotalSpent.addEventListener('click', () => handleKpiClick('investment'));
    if (kpiTotalSaved) kpiTotalSaved.addEventListener('click', () => handleKpiClick('investment'));
    if (kpiInvestmentRoi) kpiInvestmentRoi.addEventListener('click', () => handleKpiClick('investment'));
    if (kpiPortfolioEquity) kpiPortfolioEquity.addEventListener('click', () => handleKpiClick('collection'));
    if (kpiLegacyCount) kpiLegacyCount.addEventListener('click', () => handleKpiClick('legacy'));

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
            const card = document.createElement('div');
            card.className = 'piece-inventory-card';
            const imgSrc = part.image_url || 'https://cdn.rebrickable.com/static/img/nil.png';
            card.innerHTML = `
                <div class="part-add-badge">+</div>
                <img src="${imgSrc}" alt="${part.name}" onerror="this.src='https://cdn.rebrickable.com/static/img/nil.png'">
                <span class="part-code">${part.part_num}</span>
                <span class="part-name">${part.name}</span>
                <span class="part-color-badge">${part.color_name || 'Sin color'}</span>
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
    banner.innerHTML = `<strong>⚠️ ${title}</strong><br><small>${error.message}</small>`;
    document.body.appendChild(banner);
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
                    <div class="missing-piece-card ${statusClass}">
                        <div class="missing-piece-image-wrapper">
                            <img class="missing-piece-img" src="${p.image_url || 'images/placeholder.png'}" alt="${p.name}" onerror="this.onerror=null; this.src='images/placeholder.png';">
                        </div>
                        <div class="missing-piece-details">
                            <h4 class="missing-piece-name" title="${p.name}">${p.name}</h4>
                            <span class="missing-piece-meta">ID: ${p.part_num} | Color: ${p.color_name}</span>
                            <div>
                                <span class="badge-status ${badgeClass}">${statusLabel}</span>
                                <span class="missing-piece-qty-label">x<input type="number" class="input-qty-inline" value="${p.quantity}" min="1" onchange="changePieceQuantity('${p.set_id}', '${p.part_num}', ${p.color_id}, this.value)"></span>
                            </div>
                        </div>
                        <div class="missing-piece-actions">
                            <select class="select-status" onchange="changePieceStatus('${p.set_id}', '${p.part_num}', ${p.color_id}, this.value)">
                                <option value="needed" ${p.status === 'needed' ? 'selected' : ''}>Necesitada</option>
                                <option value="ordered" ${p.status === 'ordered' ? 'selected' : ''}>Pedida</option>
                                <option value="received" ${p.status === 'received' ? 'selected' : ''}>Recibida</option>
                            </select>
                            <button class="btn-delete-part" onclick="deletePiece('${p.set_id}', '${p.part_num}', ${p.color_id})" title="Eliminar de la lista">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            section.innerHTML = `
                <h3 class="shopping-set-title">
                    <span>🧱 ${setName}</span>
                    <span class="shopping-set-id">#${setId}</span>
                </h3>
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
                return `<div style="font-size: 0.72rem; color: var(--text-secondary);">• #${s.set_id} - ${name} (x${s.qty})</div>`;
            }).join('');
            
            const badgeClass = p.status === 'needed' ? 'badge-needed' : (p.status === 'ordered' ? 'badge-ordered' : 'badge-received');
            const statusLabel = p.status === 'needed' ? 'Necesitada' : (p.status === 'ordered' ? 'Pedida' : 'Recibida');
            
            grid.innerHTML += `
                <div class="missing-piece-card" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div class="missing-piece-image-wrapper">
                            <img class="missing-piece-img" src="${p.image_url || 'images/placeholder.png'}" alt="${p.name}" onerror="this.onerror=null; this.src='images/placeholder.png';">
                        </div>
                        <div class="missing-piece-details">
                            <h4 class="missing-piece-name" title="${p.name}">${p.name}</h4>
                            <span class="missing-piece-meta">ID: ${p.part_num} | Color: ${p.color_name}</span>
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
        showNotification('Estado de pieza actualizado');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

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
        showNotification('Cantidad de pieza actualizada');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
window.changePieceQuantity = changePieceQuantity;

async function deletePiece(setId, partNum, colorId) {
    if (!confirm('¿Seguro que quieres eliminar esta pieza de la lista de faltantes?')) return;
    
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
        showNotification('Pieza eliminada con éxito');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// --- Parts Modal Functions ---

window.openPartsModal = function(setId) {
    const set = legoSets.find(s => s.id === setId);
    const setName = set ? set.name : (setId === 'Loose' ? 'Minifiguras sueltas' : `Set #${setId}`);
    
    activePartsSetId = setId;
    partsModalSetTitle.innerText = `${setName} (#${setId})`;
    
    // Reset tab and panes
    switchPartsTab('current-missing');
    
    // Render current missing
    renderCurrentMissing();
    
    partsModal.classList.remove('hidden');
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
        card.innerHTML = `
            <div class="missing-piece-image-wrapper">
                <img class="missing-piece-img" src="${p.image_url || 'images/placeholder.png'}" alt="${p.name}" onerror="this.onerror=null; this.src='images/placeholder.png';">
            </div>
            <div class="missing-piece-details">
                <h4 class="missing-piece-name" title="${p.name}">${p.name}</h4>
                <span class="missing-piece-meta">ID: ${p.part_num} | Color: ${p.color_name}</span>
                <div>
                    <span class="badge-status ${badgeClass}">${statusLabel}</span>
                    <span class="missing-piece-qty-label">x<input type="number" class="input-qty-inline" value="${p.quantity}" min="1" onchange="changePieceQuantity('${p.set_id}', '${p.part_num}', ${p.color_id}, this.value)"></span>
                </div>
            </div>
            <div class="missing-piece-actions">
                <select class="select-status" onchange="changePieceStatus('${p.set_id}', '${p.part_num}', ${p.color_id}, this.value)">
                    <option value="needed" ${p.status === 'needed' ? 'selected' : ''}>Necesitada</option>
                    <option value="ordered" ${p.status === 'ordered' ? 'selected' : ''}>Pedida</option>
                    <option value="received" ${p.status === 'received' ? 'selected' : ''}>Recibida</option>
                </select>
                <button class="btn-delete-part" onclick="deletePiece('${p.set_id}', '${p.part_num}', ${p.color_id})">🗑️</button>
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
                <img src="${p.image_url || 'images/placeholder.png'}" alt="${p.name}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.onerror=null; this.src='images/placeholder.png';">
            </div>
            <div class="inventory-part-details">
                <h4 class="inventory-part-name" title="${p.name}">${p.name}</h4>
                <span class="inventory-part-code">Código: ${p.part_num}</span>
                <span class="inventory-part-color">${p.color_name}</span>
            </div>
            <div class="inventory-part-actions">
                <input type="number" class="input-qty-selector" id="qty-${p.part_num}-${p.color_id}" min="1" max="${p.quantity}" value="1">
                <button class="btn-add-part" onclick="addOfficialPart('${p.part_num}', ${p.color_id})">➕ Añadir</button>
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

        missingPieces.push(data);
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
            <img src="${fig.img_url || 'images/placeholder.png'}" alt="${fig.name}" onerror="this.onerror=null; this.src='images/placeholder.png';">
            <span class="mf-qty">x${fig.quantity}</span>
            <span class="mf-name" title="${fig.name}">${fig.name}</span>
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


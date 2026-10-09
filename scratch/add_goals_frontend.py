import os, re

# 1. Update index.html
html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Add nav tab
if 'id="nav-goals"' not in html:
    html = html.replace(
        '<button id="nav-shopping-list" class="nav-btn">🛒 Lista de Compras</button>',
        '<button id="nav-shopping-list" class="nav-btn">🛒 Lista de Compras</button>\n            <button id="nav-goals" class="nav-btn">🎯 Objetivos</button>'
    )

# Add view
goals_html = '''
            <div id="goals-view" class="goals-view hidden">
                <div class="toolbar-section" style="margin-top: 0;">
                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" id="goals-search-input" placeholder="Buscar figura en Rebrickable (ej: Mace Windu)...">
                        <button id="btn-search-goals" class="btn btn-primary" style="margin-left: 10px;">Buscar</button>
                    </div>
                </div>
                
                <div id="goals-search-results" class="minifigs-grid hidden" style="margin-bottom: 30px;">
                    <!-- Search results here -->
                </div>

                <div class="kpi-group-title">
                    <h2>Mi Consejo Jedi (Objetivos Guardados)</h2>
                </div>
                <div id="goals-grid" class="minifigs-grid">
                    <!-- Saved goals here -->
                </div>
            </div>
'''
if 'id="goals-view"' not in html:
    html = html.replace(
        '            <div id="empty-state" class="empty-state hidden">',
        goals_html + '\n            <div id="empty-state" class="empty-state hidden">'
    )

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update style.css
css_path = 'public/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

if '.goals-view' not in css:
    css += '''\n
.goals-view {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.goal-sets-list {
    margin-top: 10px;
    font-size: 0.9em;
    background: var(--bg-hover);
    padding: 10px;
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
}
.goal-set-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}
.goal-set-item img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}
'''
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css)

# 3. Update app.js
js_path = 'public/app.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

if 'const navGoals =' not in js:
    # Add elements
    js = js.replace(
        'const navShoppingList = document.getElementById(\'nav-shopping-list\');',
        'const navShoppingList = document.getElementById(\'nav-shopping-list\');\nconst navGoals = document.getElementById(\'nav-goals\');'
    )
    js = js.replace(
        'const shoppingListView = document.getElementById(\'shopping-list-view\');',
        'const shoppingListView = document.getElementById(\'shopping-list-view\');\nconst goalsView = document.getElementById(\'goals-view\');\nconst goalsGrid = document.getElementById(\'goals-grid\');\nconst goalsSearchResults = document.getElementById(\'goals-search-results\');\nconst goalsSearchInput = document.getElementById(\'goals-search-input\');\nconst btnSearchGoals = document.getElementById(\'btn-search-goals\');'
    )
    
    # Hide views logic
    js = js.replace(
        'shoppingListView.classList.add(\'hidden\');',
        'shoppingListView.classList.add(\'hidden\');\n    if(goalsView) goalsView.classList.add(\'hidden\');'
    )
    js = js.replace(
        'navShoppingList.classList.remove(\'active\');',
        'navShoppingList.classList.remove(\'active\');\n    if(navGoals) navGoals.classList.remove(\'active\');'
    )
    
    # Navigation logic
    nav_goals_logic = '''
if(navGoals) {
    navGoals.addEventListener('click', () => {
        hideAllViews();
        navGoals.classList.add('active');
        goalsView.classList.remove('hidden');
        emptyState.classList.add('hidden');
        document.querySelector('.stats-section').classList.add('hidden');
        document.querySelector('.category-selection-section').classList.add('hidden');
        document.querySelector('.toolbar-section').classList.add('hidden'); // hide main toolbar
        loadGoals();
    });
}
'''
    js = js.replace('navShoppingList.addEventListener(\'click\',', nav_goals_logic + '\nnavShoppingList.addEventListener(\'click\',')

    # Load goals and search logic
    goals_logic = """
let savedGoals = [];

async function loadGoals() {
    try {
        const res = await fetch('/api/goals');
        savedGoals = await res.json();
        renderGoals();
    } catch (e) {
        console.error(e);
    }
}

function renderGoals() {
    goalsGrid.innerHTML = '';
    if(savedGoals.length === 0) {
        goalsGrid.innerHTML = '<p>Aún no tienes objetivos guardados. ¡Busca una minifigura arriba!</p>';
        return;
    }
    
    savedGoals.forEach(g => {
        const card = document.createElement('div');
        card.className = 'set-card';
        card.innerHTML = `
            <div class="set-card-header">
                <img src="${g.image_url}" alt="${g.name}" class="set-card-img" onerror="this.src='images/placeholder.png'">
            </div>
            <div class="set-card-body">
                <div class="set-card-badges"><span class="badge badge-investment">Objetivo</span></div>
                <h3 class="set-card-title">${g.name}</h3>
                <div class="set-card-meta"><span>ID: ${g.id}</span></div>
                <button class="btn btn-danger btn-sm" style="margin-top:10px; width:100%;" onclick="deleteGoal('${g.id}')">Eliminar</button>
            </div>
        `;
        goalsGrid.appendChild(card);
    });
}

async function deleteGoal(id) {
    if(confirm('¿Eliminar objetivo?')) {
        await fetch(`/api/goals/${id}`, { method: 'DELETE' });
        loadGoals();
    }
}

if(btnSearchGoals) {
    btnSearchGoals.addEventListener('click', async () => {
        const q = goalsSearchInput.value.trim();
        if(!q) return;
        
        goalsSearchResults.innerHTML = '<div class="spinner"></div><p>Buscando en Rebrickable...</p>';
        goalsSearchResults.classList.remove('hidden');
        
        try {
            const res = await fetch(`/api/rebrickable/search-minifigs?search=${encodeURIComponent(q)}`);
            const data = await res.json();
            
            goalsSearchResults.innerHTML = '<h3>Resultados (click en una para ver en qué sets sale o añadirla)</h3><div class="minifigs-grid" id="goals-search-grid"></div>';
            const grid = document.getElementById('goals-search-grid');
            
            data.forEach(m => {
                const card = document.createElement('div');
                card.className = 'set-card';
                const safeName = m.name.replace(/'/g, "\\\\'");
                card.innerHTML = `
                    <div class="set-card-header">
                        <img src="${m.image_url}" alt="${m.name}" class="set-card-img" onerror="this.src='images/placeholder.png'">
                    </div>
                    <div class="set-card-body">
                        <h3 class="set-card-title">${m.name}</h3>
                        <div class="set-card-meta"><span>ID: ${m.id}</span></div>
                        <button class="btn btn-secondary btn-sm" style="margin-top:10px; width:100%;" onclick="showSetsForGoalMinifig('${m.id}', '${safeName}', '${m.image_url}', this)">Ver Sets / Añadir</button>
                        <div class="goal-sets-list hidden"></div>
                    </div>
                `;
                grid.appendChild(card);
            });
        } catch (e) {
            goalsSearchResults.innerHTML = '<p>Error al buscar.</p>';
        }
    });
}

async function showSetsForGoalMinifig(id, name, img, btn) {
    const listDiv = btn.nextElementSibling;
    if(!listDiv.classList.contains('hidden')) {
        listDiv.classList.add('hidden');
        return;
    }
    
    listDiv.innerHTML = 'Cargando sets...';
    listDiv.classList.remove('hidden');
    
    try {
        const res = await fetch(`/api/rebrickable/minifigs/${id}/sets`);
        const sets = await res.json();
        
        const safeName = name.replace(/'/g, "\\\\'");
        let html = `<button class="btn btn-primary btn-sm" style="width:100%; margin-bottom:10px;" onclick="addGoal('${id}','${safeName}','minifig','${img}')">Añadir Figura Suelta</button>`;
        
        if(sets.length > 0) {
            html += `<p>O añade un Set que la contenga:</p>`;
            sets.forEach(s => {
                const safeSetName = s.name.replace(/'/g, "\\\\'");
                html += `
                <div class="goal-set-item">
                    <img src="${s.image_url}" onerror="this.src='images/placeholder.png'">
                    <div>
                        <div>${s.name}</div>
                        <button class="btn btn-outline-parts btn-sm" onclick="addGoal('${s.id}','${safeSetName}','set','${s.image_url}')">+ Set ${s.id}</button>
                    </div>
                </div>`;
            });
        } else {
            html += '<p>No se encontraron sets para esta figura.</p>';
        }
        listDiv.innerHTML = html;
        
    } catch (e) {
        listDiv.innerHTML = 'Error al cargar sets.';
    }
}

async function addGoal(id, name, type, img) {
    try {
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id, name, type, image_url: img})
        });
        if(res.ok) {
            alert('¡Añadido a objetivos!');
            loadGoals();
        } else {
            const e = await res.json();
            alert(e.detail || 'Error al añadir');
        }
    } catch(e) {
        alert('Error de conexión');
    }
}
"""
    with open(js_path, 'a', encoding='utf-8') as f:
        f.write('\n' + goals_logic)

print("Modificaciones realizadas con éxito.")

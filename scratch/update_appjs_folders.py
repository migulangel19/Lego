with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace goalsGrid element fetch
js = js.replace("const goalsGrid = document.getElementById('goals-grid');", "const goalsFoldersContainer = document.getElementById('goals-folders-container');")

# Replace renderGoals() function
old_render_goals = """function renderGoals() {
    goalsGrid.innerHTML = '';
    if(savedGoals.length === 0) {
        goalsGrid.innerHTML = '<p>Aún no tienes objetivos guardados. ¡Busca una minifigura arriba!</p>';
        return;
    }
    
    savedGoals.forEach(g => {
        const card = document.createElement('div');
        card.innerHTML = `
            <div class="minifig-image-wrapper">
                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; font-size: 0.7em; color: white; border: 1px solid var(--accent-primary); z-index: 10;">OBJETIVO</div>
                <img src="${g.image_url}" alt="${g.name}" class="minifig-image" style="object-fit: contain;" onerror="this.src='images/placeholder.png'">
            </div>
            <div class="minifig-info" style="display:flex; flex-direction:column; justify-content:space-between; flex-grow:1;">
                <div>
                    <div class="minifig-id">${g.id}</div>
                    <h4 class="minifig-name" style="font-size: 0.95rem; margin-bottom: 5px;">${g.name}</h4>
                </div>
                <div style="margin-top:10px; display:flex; flex-direction:column; gap:5px;">
                    <a href="https://rebrickable.com/${g.type === 'set' ? 'sets' : 'minifigs'}/${(g.type === 'set' && !g.id.includes('-')) ? g.id + '-1' : g.id}/" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem;">Ver en Rebrickable</a>
                    <a href="https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(g.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem; background: #0055A5; color: white; margin-top: 5px;">BrickLink</a>
                    <a href="https://www.brickeconomy.com/search?query=${encodeURIComponent(g.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem; background: #28a745; color: white; margin-top: 5px;">BrickEconomy</a>
                    <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g.id}')">Eliminar</button>
                </div>
            </div>
        `;
        card.className = 'minifig-card';
        goalsGrid.appendChild(card);
    });
}"""

new_render_goals = """function renderGoals() {
    goalsFoldersContainer.innerHTML = '';
    if(savedGoals.length === 0) {
        goalsFoldersContainer.innerHTML = '<p>Aún no tienes objetivos guardados. ¡Busca una minifigura arriba!</p>';
        return;
    }
    
    // Group goals by folder
    const folders = {};
    savedGoals.forEach(g => {
        const f = g.folder || 'Consejo Jedi';
        if(!folders[f]) folders[f] = [];
        folders[f].push(g);
    });
    
    // Render each folder
    Object.keys(folders).sort().forEach(folderName => {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'goal-folder';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'kpi-group-title';
        titleDiv.innerHTML = `<h2>📁 ${folderName}</h2>`;
        folderDiv.appendChild(titleDiv);
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'minifigs-grid';
        
        folders[folderName].forEach(g => {
            const card = document.createElement('div');
            card.innerHTML = `
                <div class="minifig-image-wrapper">
                    <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; font-size: 0.7em; color: white; border: 1px solid var(--accent-primary); z-index: 10;">OBJETIVO</div>
                    <img src="${g.image_url}" alt="${g.name}" class="minifig-image" style="object-fit: contain;" onerror="this.src='images/placeholder.png'">
                </div>
                <div class="minifig-info" style="display:flex; flex-direction:column; justify-content:space-between; flex-grow:1;">
                    <div>
                        <div class="minifig-id">${g.id}</div>
                        <h4 class="minifig-name" style="font-size: 0.95rem; margin-bottom: 5px;">${g.name}</h4>
                    </div>
                    <div style="margin-top:10px; display:flex; flex-direction:column; gap:5px;">
                        <a href="https://rebrickable.com/${g.type === 'set' ? 'sets' : 'minifigs'}/${(g.type === 'set' && !g.id.includes('-')) ? g.id + '-1' : g.id}/" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem;">Ver en Rebrickable</a>
                        <a href="https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(g.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem; background: #0055A5; color: white; margin-top: 5px;">BrickLink</a>
                        <a href="https://www.brickeconomy.com/search?query=${encodeURIComponent(g.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem; background: #28a745; color: white; margin-top: 5px;">BrickEconomy</a>
                        <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g.id}')">Eliminar</button>
                    </div>
                </div>
            `;
            card.className = 'minifig-card';
            gridDiv.appendChild(card);
        });
        
        folderDiv.appendChild(gridDiv);
        goalsFoldersContainer.appendChild(folderDiv);
    });
}"""
js = js.replace(old_render_goals, new_render_goals)


# Replace addGoal() logic
old_add_goal = """async function addGoal(id, name, type, img) {
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
}"""

new_add_goal = """let lastUsedFolder = 'Consejo Jedi';
async function addGoal(id, name, type, img) {
    const folder = prompt('¿A qué carpeta quieres añadirlo? (ej: Consejo Jedi, Villanos, Siths)', lastUsedFolder);
    if (folder === null) return; // user cancelled
    lastUsedFolder = folder.trim() || 'Consejo Jedi';

    try {
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id, name, type, image_url: img, folder: lastUsedFolder})
        });
        if(res.ok) {
            loadGoals();
        } else {
            const e = await res.json();
            alert(e.detail || 'Error al añadir');
        }
    } catch(e) {
        alert('Error de conexión');
    }
}"""
js = js.replace(old_add_goal, new_add_goal)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

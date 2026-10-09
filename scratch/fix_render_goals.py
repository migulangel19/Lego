import re

with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

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
                        ${g.set_info ? `<div style="font-size: 0.75rem; color: #aaa; margin-top: 5px; line-height: 1.2;">${g.set_info}</div>` : ''}
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

# regex replace
js = re.sub(r'function renderGoals\(\)\s*\{.*?\}\s*async function deleteGoal', new_render_goals + '\n\nasync function deleteGoal', js, flags=re.DOTALL)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

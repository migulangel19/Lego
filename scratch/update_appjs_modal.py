import re

with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add openGoalDetail function
new_func = """
const goalDetailModal = document.getElementById('goal-detail-modal');
const btnCloseGoalDetail = document.getElementById('btn-close-goal-detail');

if (btnCloseGoalDetail) {
    btnCloseGoalDetail.addEventListener('click', () => {
        if(goalDetailModal) goalDetailModal.classList.add('hidden');
    });
}

async function openGoalDetail(id, name, img_url, type) {
    if(!goalDetailModal) return;
    
    document.getElementById('goal-detail-title').textContent = name;
    document.getElementById('goal-detail-id-badge').textContent = '#' + id;
    document.getElementById('goal-detail-image').src = img_url;
    document.getElementById('goal-detail-type').textContent = type === 'set' ? 'OBJETIVO / SET' : 'OBJETIVO / MINIFIGURA';
    
    document.getElementById('goal-detail-rebrickable-link').href = `https://rebrickable.com/${type === 'set' ? 'sets' : 'minifigs'}/${(type === 'set' && !id.includes('-')) ? id + '-1' : id}/`;
    document.getElementById('goal-detail-bricklink-link').href = `https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(name)}`;
    document.getElementById('goal-detail-brickeconomy-link').href = `https://www.brickeconomy.com/search?query=${encodeURIComponent(name)}`;
    
    const setsGrid = document.getElementById('goal-detail-sets-grid');
    const spinner = document.getElementById('goal-detail-sets-loading');
    
    setsGrid.innerHTML = '';
    
    if (type === 'minifig') {
        spinner.classList.remove('hidden');
        goalDetailModal.classList.remove('hidden');
        
        try {
            const res = await fetch(`/api/rebrickable/minifigs/${id}/sets`);
            const sets = await res.json();
            
            spinner.classList.add('hidden');
            
            if (sets && sets.length > 0) {
                sets.forEach(s => {
                    const setCard = document.createElement('div');
                    setCard.className = 'part-item-card';
                    setCard.innerHTML = `
                        <div class="part-item-img-wrapper">
                            <img src="${s.image_url}" onerror="this.src='images/placeholder.png'">
                        </div>
                        <div class="part-item-info">
                            <div class="part-item-id">Set ${s.id}</div>
                            <div class="part-item-name" style="font-size: 0.8rem; margin-top: 5px;">${s.name}</div>
                            <a href="https://rebrickable.com/sets/${s.id.includes('-') ? s.id : s.id + '-1'}/" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:10px; width:100%; font-size:0.75rem;">Ver en Rebrickable</a>
                        </div>
                    `;
                    setsGrid.appendChild(setCard);
                });
            } else {
                setsGrid.innerHTML = '<p>No se encontraron sets para esta minifigura.</p>';
            }
        } catch (e) {
            spinner.classList.add('hidden');
            setsGrid.innerHTML = '<p>Error al cargar los sets.</p>';
        }
    } else {
        setsGrid.innerHTML = '<p>Esto es un set, no contiene otros sets.</p>';
        goalDetailModal.classList.remove('hidden');
    }
}
"""
if "function openGoalDetail" not in js:
    js += new_func

# Update renderGoals to add click listener to the image wrapper
old_render_html = """<div class="minifig-image-wrapper">"""
new_render_html = """<div class="minifig-image-wrapper" style="cursor:pointer;" onclick="openGoalDetail('${g.id}', '${g.name.replace(/'/g, "\\'")}', '${g.image_url}', '${g.type}')">"""
js = js.replace(old_render_html, new_render_html)

# Update goals search results to add click listener
old_search_html = """<div class="minifig-image-wrapper">
                        <img src="${m.image_url}\""""
new_search_html = """<div class="minifig-image-wrapper" style="cursor:pointer;" onclick="openGoalDetail('${m.id}', '${m.name.replace(/'/g, "\\'")}', '${m.image_url}', 'minifig')">
                        <img src="${m.image_url}\""""
js = js.replace(old_search_html, new_search_html)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

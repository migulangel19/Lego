with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update addGoal
old_add_goal = """        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id, name, type, image_url: img, folder: lastUsedFolder})
        });"""

new_add_goal = """        let set_info = '';
        if (type === 'minifig') {
            try {
                const setsRes = await fetch(`/api/rebrickable/minifigs/${id}/sets`);
                if (setsRes.ok) {
                    const sets = await setsRes.json();
                    if (sets && sets.length > 0) {
                        set_info = `Sale en: ${sets.map(s => s.id).join(', ')}`;
                    } else {
                        set_info = 'Sale en: Desconocido';
                    }
                }
            } catch(e) {}
        } else if (type === 'set') {
            set_info = `Set: ${id}`;
        }

        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id, name, type, image_url: img, folder: lastUsedFolder, set_info: set_info})
        });"""
js = js.replace(old_add_goal, new_add_goal)

# Update renderGoals to show set_info
old_render_goals = """                        <div class="minifig-id">${g.id}</div>
                        <h4 class="minifig-name" style="font-size: 0.95rem; margin-bottom: 5px;">${g.name}</h4>
                    </div>"""

new_render_goals = """                        <div class="minifig-id">${g.id}</div>
                        <h4 class="minifig-name" style="font-size: 0.95rem; margin-bottom: 5px;">${g.name}</h4>
                        ${g.set_info ? `<div style="font-size: 0.75rem; color: #aaa; margin-top: 5px; line-height: 1.2;">${g.set_info}</div>` : ''}
                    </div>"""
js = js.replace(old_render_goals, new_render_goals)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

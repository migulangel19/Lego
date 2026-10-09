with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Replace goalsGrid render
old_goals_render = """
            <div class=\"set-card-header\">
                <img src=\"${g.image_url}\" alt=\"${g.name}\" class=\"set-card-img\" onerror=\"this.src='images/placeholder.png'\">
            </div>
            <div class=\"set-card-body\">
                <div class=\"set-card-badges\"><span class=\"badge badge-investment\">Objetivo</span></div>
                <h3 class=\"set-card-title\">${g.name}</h3>
                <div class=\"set-card-meta\"><span>ID: ${g.id}</span></div>
                <button class=\"btn btn-danger btn-sm\" style=\"margin-top:10px; width:100%;\" onclick=\"deleteGoal('${g.id}')\">Eliminar</button>
            </div>
        `;
        goalsGrid.appendChild(card);
"""
new_goals_render = """
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
                    <a href="https://rebrickable.com/${g.type === 'set' ? 'sets' : 'minifigs'}/${g.id}/" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none;">Ver en Rebrickable</a>
                    <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g.id}')">Eliminar</button>
                </div>
            </div>
        `;
        card.className = 'minifig-card';
        goalsGrid.appendChild(card);
"""
js = js.replace(old_goals_render, new_goals_render)

# Clean up any leftover set-card assignments
js = js.replace("card.className = 'set-card';", "")

# 2. Replace goals search results render
old_search_render = """
                    <div class=\"set-card-header\">
                        <img src=\"${m.image_url}\" alt=\"${m.name}\" class=\"set-card-img\" onerror=\"this.src='images/placeholder.png'\">
                    </div>
                    <div class=\"set-card-body\">
                        <h3 class=\"set-card-title\">${m.name}</h3>
                        <div class=\"set-card-meta\"><span>ID: ${m.id}</span></div>
                        <button class=\"btn btn-secondary btn-sm\" style=\"margin-top:10px; width:100%;\" onclick=\"showSetsForGoalMinifig('${m.id}', '${safeName}', '${m.image_url}', this)\">Ver Sets / Añadir</button>
                        <div class=\"goal-sets-list hidden\"></div>
                    </div>
                `;
                grid.appendChild(card);
"""
new_search_render = """
                    <div class="minifig-image-wrapper">
                        <img src="${m.image_url}" alt="${m.name}" class="minifig-image" style="object-fit: contain;" onerror="this.src='images/placeholder.png'">
                    </div>
                    <div class="minifig-info" style="display:flex; flex-direction:column; justify-content:space-between; flex-grow:1;">
                        <div>
                            <div class="minifig-id">${m.id}</div>
                            <h4 class="minifig-name" style="font-size: 0.95rem; margin-bottom: 5px;">${m.name}</h4>
                        </div>
                        <div style="margin-top:10px; display:flex; flex-direction:column; gap:5px;">
                            <a href="https://rebrickable.com/minifigs/${m.id}/" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; margin-bottom:5px;">Enlace a Rebrickable</a>
                            <button class="btn btn-primary btn-sm" onclick="showSetsForGoalMinifig('${m.id}', '${safeName}', '${m.image_url}', this)">Ver Sets / Añadir</button>
                            <div class="goal-sets-list hidden" style="margin-top: 10px; padding: 5px;"></div>
                        </div>
                    </div>
                `;
                card.className = 'minifig-card';
                grid.appendChild(card);
"""
js = js.replace(old_search_render, new_search_render)


# 3. Update showSetsForGoalMinifig logic to include rebrickable links
old_sets_logic = """
                <div class=\"goal-set-item\">
                    <img src=\"${s.image_url}\" onerror=\"this.src='images/placeholder.png'\">
                    <div>
                        <div>${s.name}</div>
                        <button class=\"btn btn-outline-parts btn-sm\" onclick=\"addGoal('${s.id}','${safeSetName}','set','${s.image_url}')\">+ Set ${s.id}</button>
                    </div>
                </div>`;
"""
new_sets_logic = """
                <div class="goal-set-item" style="margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                    <img src="${s.image_url}" onerror="this.src='images/placeholder.png'" style="width: 50px; height: 50px; object-fit: contain;">
                    <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
                        <div style="font-size:0.85rem; line-height: 1.2;">${s.name}</div>
                        <div style="display:flex; gap:5px; flex-wrap: wrap;">
                            <a href="https://rebrickable.com/sets/${s.id}/" target="_blank" class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding:2px 5px; text-decoration:none; display: inline-block;">Rebrickable</a>
                            <button class="btn btn-outline-parts btn-sm" style="font-size:0.75rem; padding:2px 5px;" onclick="addGoal('${s.id}','${safeSetName}','set','${s.image_url}')">+ Objetivo</button>
                        </div>
                    </div>
                </div>`;
"""
js = js.replace(old_sets_logic, new_sets_logic)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

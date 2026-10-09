with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# For the search results render
old_search_render = """<a href="https://rebrickable.com/minifigs/${m.id}/" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; margin-bottom:5px;">Enlace a Rebrickable</a>"""
new_search_render = """<a href="https://rebrickable.com/minifigs/${m.id}/" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; margin-bottom:5px; font-size: 0.8rem;">Ver en Rebrickable</a>
                            <a href="https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(m.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; margin-bottom:5px; font-size: 0.8rem; background: #0055A5; color: white;">Buscar en BrickLink</a>"""
js = js.replace(old_search_render, new_search_render)

# For the saved goals render
old_goals_render = """<a href="https://rebrickable.com/${g.type === 'set' ? 'sets' : 'minifigs'}/${g.id}/" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none;">Ver en Rebrickable</a>"""
new_goals_render = """<a href="https://rebrickable.com/${g.type === 'set' ? 'sets' : 'minifigs'}/${g.id}/" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem;">Ver en Rebrickable</a>
                    <a href="https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(g.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem; background: #0055A5; color: white; margin-top: 5px;">Buscar en BrickLink</a>"""
js = js.replace(old_goals_render, new_goals_render)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

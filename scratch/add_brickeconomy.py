with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add BrickEconomy to search render
bricklink_btn = """<a href="https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(m.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; margin-bottom:5px; font-size: 0.8rem; background: #0055A5; color: white;">Buscar en BrickLink</a>"""
bricklink_plus_economy = """<a href="https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(m.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; margin-bottom:5px; font-size: 0.8rem; background: #0055A5; color: white;">BrickLink</a>
                            <a href="https://www.brickeconomy.com/search?query=${encodeURIComponent(m.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; margin-bottom:5px; font-size: 0.8rem; background: #28a745; color: white;">BrickEconomy</a>"""
js = js.replace(bricklink_btn, bricklink_plus_economy)

# Add BrickEconomy to goals render
bricklink_goals_btn = """<a href="https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(g.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem; background: #0055A5; color: white; margin-top: 5px;">Buscar en BrickLink</a>"""
bricklink_plus_economy_goals = """<a href="https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(g.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem; background: #0055A5; color: white; margin-top: 5px;">BrickLink</a>
                    <a href="https://www.brickeconomy.com/search?query=${encodeURIComponent(g.name)}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center; text-decoration:none; font-size: 0.8rem; background: #28a745; color: white; margin-top: 5px;">BrickEconomy</a>"""
js = js.replace(bricklink_goals_btn, bricklink_plus_economy_goals)


with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix sets logic link
old_sets_link = 'href="https://rebrickable.com/sets/${s.id}/"'
new_sets_link = 'href="https://rebrickable.com/sets/${s.id.includes(\'-\') ? s.id : s.id + \'-1\'}/"'
js = js.replace(old_sets_link, new_sets_link)

# Fix goals logic link
old_goals_link = "href=\"https://rebrickable.com/${g.type === 'set' ? 'sets' : 'minifigs'}/${g.id}/\""
new_goals_link = "href=\"https://rebrickable.com/${g.type === 'set' ? 'sets' : 'minifigs'}/${(g.type === 'set' && !g.id.includes('-')) ? g.id + '-1' : g.id}/\""
js = js.replace(old_goals_link, new_goals_link)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

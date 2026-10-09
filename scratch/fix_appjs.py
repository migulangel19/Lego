with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix navGoals listener to hide toolbar and properly hide categories
old_goals_listener = '''
        document.querySelector('.stats-section').classList.add('hidden');
        document.querySelector('.category-selection-section').classList.add('hidden');
        
        if(setsGrid) setsGrid.classList.add('hidden');
'''
new_goals_listener = '''
        document.querySelector('.stats-section').classList.add('hidden');
        const catSection = document.querySelector('.category-selection-section');
        if(catSection) catSection.classList.add('hidden');
        const toolbar = document.querySelector('.toolbar-section');
        if(toolbar) toolbar.classList.add('hidden');
        
        if(setsGrid) setsGrid.classList.add('hidden');
'''
js = js.replace(old_goals_listener, new_goals_listener)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

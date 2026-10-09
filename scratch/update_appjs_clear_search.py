with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add clear goals button logic
if "btn-clear-goals" not in js:
    search_logic = """if(btnSearchGoals) {
    const btnClearGoals = document.getElementById('btn-clear-goals');
    if (btnClearGoals) {
        btnClearGoals.addEventListener('click', () => {
            goalsSearchInput.value = '';
            goalsSearchResults.innerHTML = '';
            goalsSearchResults.classList.add('hidden');
        });
    }"""
    js = js.replace("if(btnSearchGoals) {", search_logic)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

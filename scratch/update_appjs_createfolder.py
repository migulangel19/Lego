with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update renderGoals to ignore dummy goals when rendering cards
old_render_card = """        folders[folderName].forEach(g => {
            const card = document.createElement('div');
            card.innerHTML = `
                <div class="minifig-image-wrapper">"""

new_render_card = """        folders[folderName].forEach(g => {
            if (g.type === 'folder') return;
            const card = document.createElement('div');
            card.innerHTML = `
                <div class="minifig-image-wrapper">"""
js = js.replace(old_render_card, new_render_card)

# Add createEmptyFolder function
if "function createEmptyFolder" not in js:
    create_func = """
async function createEmptyFolder() {
    const folder = prompt('Nombre de la nueva carpeta:');
    if (!folder || !folder.trim()) return;
    
    try {
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: 'folder_' + Date.now(), name: '[Carpeta Vacía]', type: 'folder', image_url: '', folder: folder.trim(), set_info: ''})
        });
        if(res.ok) {
            loadGoals();
        }
    } catch(e) {
        alert('Error');
    }
}
"""
    js += create_func

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

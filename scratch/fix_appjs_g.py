import re

with open('public/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix the incorrect replacement in search results
# We need to replace `${g.id}` with `${m.id}` etc ONLY inside the search results render block.
# Let's find the block:
# data.forEach(m => { ... <div class="minifig-image-wrapper" style="cursor:pointer;" onclick="openGoalDetail('${g.id}', '${g.name.replace(/'/g, "\'")}', '${g.image_url}', '${g.type}')">
# We can just replace the specific string:

wrong_string = """<div class="minifig-image-wrapper" style="cursor:pointer;" onclick="openGoalDetail('${g.id}', '${g.name.replace(/'/g, "\\'")}', '${g.image_url}', '${g.type}')">
                        <img src="${m.image_url}\""""
                        
right_string = """<div class="minifig-image-wrapper" style="cursor:pointer;" onclick="openGoalDetail('${m.id}', '${m.name.replace(/'/g, "\\'")}', '${m.image_url}', 'minifig')">
                        <img src="${m.image_url}\""""

js = js.replace(wrong_string, right_string)

# Actually, the python script earlier did:
# js = js.replace(old_search_html, new_search_html)
# But old_search_html didn't match because it had already been replaced by the first replace!
# So the first replace affected ALL occurrences.

wrong_string_2 = """onclick="openGoalDetail('${g.id}', '${g.name.replace(/'/g, "\\'")}', '${g.image_url}', '${g.type}')">
                        <img src="${m.image_url}" """
                        
right_string_2 = """onclick="openGoalDetail('${m.id}', '${m.name.replace(/'/g, "\\'")}', '${m.image_url}', 'minifig')">
                        <img src="${m.image_url}" """

js = js.replace(wrong_string_2, right_string_2)

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

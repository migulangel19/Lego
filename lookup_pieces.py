import urllib.request, json, os

def get_rebrickable_key() -> str:
    key = os.environ.get("REBRICKABLE_API_KEY", "").strip()
    if key:
        return key
    if os.path.exists("rebrickable_key.txt"):
        try:
            with open("rebrickable_key.txt", "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception as e:
            print("Error reading rebrickable_key.txt: " + str(e))
    return ""

key = get_rebrickable_key()
if not key:
    print("Warning: Rebrickable API key not found. Set REBRICKABLE_API_KEY env var or create rebrickable_key.txt")
headers = {'Authorization': 'key ' + key, 'User-Agent': 'Mozilla/5.0'}

elements = {
    '6514259': {'issue': 'danada', 'qty': 1},
    '6366391': {'issue': 'falta',  'qty': 4},
    '4114322': {'issue': 'falta',  'qty': 1},
    '6330086': {'issue': 'danada', 'qty': 1},
    '4274194': {'issue': 'danada', 'qty': 3},
    '4529240': {'issue': 'danada', 'qty': 3},
}

results = []
for elem_id, meta in elements.items():
    url = 'https://rebrickable.com/api/v3/lego/elements/' + elem_id + '/'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode())
        part = data.get('part', {})
        color = data.get('color', {})
        row = {
            'element_id': elem_id,
            'part_num': part.get('part_num', '?'),
            'name': part.get('name', '?'),
            'color_name': color.get('name', '?'),
            'color_id': color.get('id', 0),
            'img': data.get('part_img_url', ''),
            'issue': meta['issue'],
            'qty': meta['qty']
        }
        results.append(row)
        print('OK  ' + elem_id + ': ' + row['name'] + ' / ' + row['color_name'])
    except Exception as e:
        print('ERR ' + elem_id + ': ' + str(e))
        results.append({'element_id': elem_id, 'error': str(e), 'issue': meta['issue'], 'qty': meta['qty']})

with open('piece_lookup_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print('Saved to piece_lookup_results.json')

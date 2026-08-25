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
rb_headers = {'Authorization': 'key ' + key, 'User-Agent': 'Mozilla/5.0'}
api = 'http://127.0.0.1:8000'

# ── 1. Lookup all sets ───────────────────────────────────────────────────────
set_ids = ['7679', '8014', '7655']
set_info = {}
for sid in set_ids:
    req = urllib.request.Request(api + '/api/sets/lookup/' + sid)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            set_info[sid] = json.loads(r.read().decode())
        print('SET OK  ' + sid + ': ' + set_info[sid].get('name','?'))
    except Exception as e:
        print('SET ERR ' + sid + ': ' + str(e))

# ── 2. Lookup element 4211473 ────────────────────────────────────────────────
url = 'https://rebrickable.com/api/v3/lego/elements/4211473/'
req = urllib.request.Request(url, headers=rb_headers)
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        elem = json.loads(r.read().decode())
    part = elem.get('part', {})
    color = elem.get('color', {})
    elem4211473 = {
        'part_num': part.get('part_num','?'),
        'name': part.get('name','?'),
        'color_name': color.get('name','?'),
        'color_id': color.get('id', 0),
        'img': elem.get('part_img_url','')
    }
    print('ELEM OK  4211473: ' + elem4211473['name'] + ' / ' + elem4211473['color_name'])
except Exception as e:
    elem4211473 = None
    print('ELEM ERR 4211473: ' + str(e))

# ── 3. Look up the basic clone trooper minifigure for set 8014 ───────────────
# Clone Trooper Battle Pack 8014 has sw0201 (plain clone trooper phase 2)
# Let's look up the 8014 minifigs to confirm
url8014 = 'https://rebrickable.com/api/v3/lego/sets/8014-1/minifigs/'
req = urllib.request.Request(url8014, headers=rb_headers)
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        mfigs = json.loads(r.read().decode())
    print('\nMinifigs del set 8014:')
    for mf in mfigs.get('results', []):
        fig = mf.get('set_num','?')
        name = mf.get('fig_name', mf.get('name','?'))
        qty = mf.get('quantity', 1)
        print('  ' + fig + ' x' + str(qty) + '  ' + name)
    # Save for later
    minifigs_8014 = mfigs.get('results', [])
except Exception as e:
    minifigs_8014 = []
    print('MINIFIGS ERR 8014: ' + str(e))

# Save everything
with open('lote_data.json', 'w', encoding='utf-8') as f:
    json.dump({
        'sets': set_info,
        'elem4211473': elem4211473,
        'minifigs_8014': minifigs_8014
    }, f, indent=2, ensure_ascii=False)
print('\nSaved to lote_data.json')

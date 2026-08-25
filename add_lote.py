import urllib.request, json

api = 'http://127.0.0.1:8000'

def post(endpoint, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(api + endpoint, data=data,
                                 headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())

def put(endpoint, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(api + endpoint, data=data,
                                 headers={'Content-Type': 'application/json'}, method='PUT')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())

# ─── Distribución del coste del lote ────────────────────────────────────────
# 250€ / 4 sets = 62.50€ cada uno
price_each = 62.50

# ─── 1. Actualizar 7676 con precio correcto ──────────────────────────────────
# Primero leemos el set actual para no perder campos
req = urllib.request.Request(api + '/api/legos')
with urllib.request.urlopen(req, timeout=10) as r:
    all_sets = json.loads(r.read().decode())

set_7676 = next((s for s in all_sets if s['id'] == '7676'), None)
if set_7676:
    set_7676['purchase_price'] = price_each
    set_7676['notes'] = ('Lote Vinted (4 sets x 62.50€). Sin caja ni instrucciones. '
                         'Piezas danadas y faltantes (ver lista de compras). Pegatinas desgastadas.')
    resp = put('/api/legos/7676', set_7676)
    print('UPDATE 7676: ' + resp.get('name','?') + ' -> ' + str(resp.get('purchase_price','?')) + 'EUR')

# ─── 2. Añadir 7679 ─────────────────────────────────────────────────────────
resp = post('/api/legos', {
    'id': '7679',
    'name': 'Republic Fighter Tank',
    'theme': 'Star Wars',
    'subcategory': 'The Clone Wars',
    'release_date': '2008-07-26',
    'retirement_date': '2010-06-30',
    'purchase_date': '2026-07-11',
    'retail_price': 39.99,
    'purchase_price': price_each,
    'market_price': 0.0,
    'extra_costs': 0.0,
    'purchase_store': 'Vinted',
    'purchase_location': 'online',
    'condition': 'no_box_no_manual',
    'goal': 'collection',
    'notes': 'Lote Vinted (4 sets x 62.50EUR). Pendiente de limpiar y montar.',
    'official_url': 'https://www.lego.com/es-es/search?q=7679',
    'image_url': 'https://images.brickset.com/sets/images/7679-1.jpg'
})
print('ADD 7679: ' + resp.get('name','?'))

# ─── 3. Añadir 8014 ─────────────────────────────────────────────────────────
resp = post('/api/legos', {
    'id': '8014',
    'name': 'Clone Walker Battle Pack',
    'theme': 'Star Wars',
    'subcategory': 'The Clone Wars',
    'release_date': '2009-01-01',
    'retirement_date': '2010-12-31',
    'purchase_date': '2026-07-11',
    'retail_price': 12.99,
    'purchase_price': price_each,
    'market_price': 0.0,
    'extra_costs': 0.0,
    'purchase_store': 'Vinted',
    'purchase_location': 'online',
    'condition': 'incomplete_no_minifigs',
    'goal': 'collection',
    'notes': 'Lote Vinted. Faltan 2 Clone Troopers Phase I (fig-000303) y antena 4211473.',
    'official_url': 'https://www.lego.com/es-es/search?q=8014',
    'image_url': 'https://images.brickset.com/sets/images/8014-1.jpg'
})
print('ADD 8014: ' + resp.get('name','?'))

# ─── 4. Añadir 7655 ─────────────────────────────────────────────────────────
resp = post('/api/legos', {
    'id': '7655',
    'name': 'Clone Troopers Battle Pack',
    'theme': 'Star Wars',
    'subcategory': 'The Clone Wars',
    'release_date': '2007-01-01',
    'retirement_date': '2009-12-31',
    'purchase_date': '2026-07-11',
    'retail_price': 9.99,
    'purchase_price': price_each,
    'market_price': 0.0,
    'extra_costs': 0.0,
    'purchase_store': 'Vinted',
    'purchase_location': 'online',
    'condition': 'no_box_no_manual',
    'goal': 'collection',
    'notes': 'Lote Vinted. Completo.',
    'official_url': 'https://www.lego.com/es-es/search?q=7655',
    'image_url': 'https://images.brickset.com/sets/images/7655-1.jpg'
})
print('ADD 7655: ' + resp.get('name','?'))

# ─── 5. Piezas faltantes del 8014 ───────────────────────────────────────────
missing = [
    # 2x Clone Trooper Phase I (fig-000303) -- adding as loose minifig entries
    {
        'set_id': '8014',
        'part_num': 'fig-000303',
        'name': 'Clone Trooper, Phase I Armor, Brown Eyes',
        'color_id': 0,
        'color_name': 'N/A',
        'quantity': 2,
        'status': 'needed',
        'image_url': 'https://cdn.rebrickable.com/media/sets/fig-000303/64971.jpg'
    },
    # Antenna 4211473 = part 4495b Light Bluish Gray
    {
        'set_id': '8014',
        'part_num': '4495b',
        'name': 'Antenna 1 x 4 with Flat Top [FALTANTE]',
        'color_id': 71,
        'color_name': 'Light Bluish Gray',
        'quantity': 1,
        'status': 'needed',
        'image_url': ''
    }
]

for m in missing:
    try:
        resp = post('/api/missing-pieces', m)
        print('MISSING OK  ' + m['part_num'] + ' x' + str(m['quantity']) + ' -> ' + m['name'][:50])
    except Exception as e:
        print('MISSING ERR ' + m['part_num'] + ': ' + str(e))

print('\nDone.')

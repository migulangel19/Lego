import json, urllib.request

# Load lookup results
with open('piece_lookup_results.json', encoding='utf-8') as f:
    pieces = json.load(f)

base_url = 'http://127.0.0.1:8000'
set_id = '7676'

issue_labels = {
    'falta': 'needed',
    'danada': 'needed',  # damaged => also mark as needed (to replace)
}

added = []
for p in pieces:
    if 'error' in p:
        print('SKIP (error) ' + p['element_id'])
        continue

    payload = {
        'set_id': set_id,
        'part_num': p['part_num'],
        'name': p['name'] + (' [DAÑADA]' if p['issue'] == 'danada' else ''),
        'color_id': p['color_id'],
        'color_name': p['color_name'],
        'quantity': p['qty'],
        'status': 'needed',
        'image_url': p.get('img', '')
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        base_url + '/api/missing-pieces',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            resp = json.loads(r.read().decode())
            status_icon = 'FALTA' if p['issue'] == 'falta' else 'DANADA'
            print(status_icon + '  x' + str(p['qty']) + '  ' + p['name'] + ' (' + p['color_name'] + ')')
            added.append(resp)
    except Exception as e:
        print('ERR ' + p['part_num'] + ': ' + str(e))

print('\n--- Total piezas añadidas: ' + str(len(added)) + ' ---')

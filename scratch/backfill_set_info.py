import json
import urllib.request

try:
    with open('goals.json', 'r', encoding='utf-8') as f:
        goals = json.load(f)
        
    for g in goals:
        if g['type'] == 'minifig' and not g.get('set_info'):
            print(f"Fetching sets for {g['name']}...")
            url = f"http://127.0.0.1:8000/api/rebrickable/minifigs/{g['id']}/sets"
            try:
                req = urllib.request.Request(url)
                res = urllib.request.urlopen(req)
                sets = json.loads(res.read().decode('utf-8'))
                if sets:
                    set_names = [s['id'] for s in sets]
                    g['set_info'] = f"Sale en: {', '.join(set_names)}"
                else:
                    g['set_info'] = "Sale en: Desconocido"
            except Exception as e:
                print('Error fetching:', e)
                
    with open('goals.json', 'w', encoding='utf-8') as f:
        json.dump(goals, f, indent=4, ensure_ascii=False)
    print('Updated goals.json with set_info!')
except Exception as e:
    print('Failed:', e)

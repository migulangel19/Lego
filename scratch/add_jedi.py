import urllib.request
import urllib.parse
import json
import time

jedi_council = [
    'Yoda',
    'Mace Windu',
    'Obi-Wan Kenobi',
    'Anakin Skywalker',
    'Plo Koon',
    'Ki-Adi-Mundi',
    'Saesee Tiin',
    'Shaak Ti',
    'Kit Fisto',
    'Eeth Koth',
    'Even Piell',
    'Coleman Trebor',
    'Stass Allie',
    'Agen Kolar',
    'Luminara Unduli'
]

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

def post_json(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    try:
        urllib.request.urlopen(req)
        return True
    except Exception as e:
        print(f"Error posting to {url}: {e}")
        return False

# 1. Get owned minifigures
owned_minifigs = fetch_json('http://127.0.0.1:8000/api/minifigs')
owned_names = [fig.get('name', '').lower() for fig in owned_minifigs]

# 2. Get current goals so we don't duplicate
current_goals = fetch_json('http://127.0.0.1:8000/api/goals')
goal_ids = [g.get('id') for g in current_goals]
goal_names = [g.get('name', '').lower() for g in current_goals]

added_count = 0

print(f"Found {len(owned_names)} owned minifigures.")

for jedi in jedi_council:
    jedi_lower = jedi.lower()
    
    # Check if already owned
    already_owned = any(jedi_lower in name for name in owned_names)
    if already_owned:
        print(f"✅ Already owned: {jedi} (Skipping)")
        continue
        
    # Check if already in goals
    already_goal = any(jedi_lower in name for name in goal_names)
    if already_goal:
        print(f"🎯 Already in goals: {jedi} (Skipping)")
        continue

    print(f"🔍 Searching Rebrickable for: {jedi}...")
    search_url = f'http://127.0.0.1:8000/api/rebrickable/search-minifigs?search={urllib.parse.quote(jedi)}'
    results = fetch_json(search_url)
    
    if results:
        # Try to prefer a Clone Wars version or Ep III, otherwise just take the first
        best_match = results[0]
        for res in results:
            if 'clone wars' in res.get('name', '').lower():
                best_match = res
                break
                
        # Post to goals
        goal_data = {
            'id': best_match['id'],
            'name': best_match['name'],
            'type': 'minifig',
            'image_url': best_match['image_url']
        }
        
        success = post_json('http://127.0.0.1:8000/api/goals', goal_data)
        if success:
            print(f"➕ Added to goals: {best_match['name']}")
            added_count += 1
            goal_names.append(best_match['name'].lower())
    else:
        print(f"❌ No results found for: {jedi}")
        
    time.sleep(0.5)

print(f"\n🎉 Finished! Added {added_count} new Jedi to goals.")

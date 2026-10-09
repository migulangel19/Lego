import urllib.request
import re

req = urllib.request.Request('https://www.brickowl.com/catalog/lego-bar-1-x-4-21462-30374', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req).read().decode('utf-8')

# Look for color table rows or links
matches = re.findall(r'<a\s+[^>]*href="(/catalog/lego-bar-1-x-4-21462-30374[^"]*)"[^>]*>([^<]+)</a>', html)
print("Color matches for 30374:")
for href, text in matches:
    if 'purple' in text.lower() or 'trans' in text.lower():
        print(f"  {text.strip()} -> https://www.brickowl.com{href}")

# Now for 64567
req2 = urllib.request.Request('https://www.brickowl.com/catalog/lego-lightsaber-hilt-straight-64567', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html2 = urllib.request.urlopen(req2).read().decode('utf-8')
matches2 = re.findall(r'<a\s+[^>]*href="(/catalog/lego-lightsaber-hilt-straight-64567[^"]*)"[^>]*>([^<]+)</a>', html2)
print("\nColor matches for 64567:")
for href, text in matches2:
    if any(k in text.lower() for k in ['silver', 'gray', 'grey', 'chrome']):
        print(f"  {text.strip()} -> https://www.brickowl.com{href}")

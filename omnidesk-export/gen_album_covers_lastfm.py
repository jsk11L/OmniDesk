import os, json, urllib.request, urllib.parse, time
KEY = os.environ['LASTFM_KEY']
PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f'

def lastfm_cover(artist, album):
    try:
        q = urllib.parse.urlencode({'method': 'album.getinfo', 'api_key': KEY,
                                    'artist': artist, 'album': album, 'format': 'json'})
        with urllib.request.urlopen('https://ws.audioscrobbler.com/2.0/?' + q, timeout=8) as r:
            d = json.load(r)
        imgs = d.get('album', {}).get('image', [])
        # prefer the largest available real image
        for size in ('mega', 'extralarge', 'large'):
            for im in imgs:
                if im.get('size') == size and im.get('#text') and PLACEHOLDER not in im['#text']:
                    return im['#text']
    except Exception:
        pass
    return ''

path = 'omnidesk-import/backlog-music.json'
d = json.load(open(path, encoding='utf-8'))
items = d['items']
filled, checked = 0, 0
for i, it in enumerate(items):
    f = it['fields']
    if f.get('Cover'):
        continue
    checked += 1
    c = lastfm_cover(f.get('Artist', ''), it['title'])
    if c:
        f['Cover'] = c
        filled += 1
    if i % 100 == 0:
        open('albums_lastfm_progress.txt', 'w').write(f"{i}/{len(items)} newly_filled={filled}")
    time.sleep(0.2)

json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
total = sum(1 for it in items if it['fields'].get('Cover'))
open('albums_lastfm_progress.txt', 'w').write(f"DONE checked={checked} newly_filled={filled} total_covers={total}/{len(items)}")

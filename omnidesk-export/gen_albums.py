import csv, json, urllib.request, urllib.parse, time, sys

def itunes_cover(artist, album):
    try:
        term = urllib.parse.quote(f"{artist} {album}".strip())
        url = f"https://itunes.apple.com/search?term={term}&entity=album&limit=1"
        with urllib.request.urlopen(url, timeout=8) as r:
            d = json.load(r)
        res = d.get('results', [])
        if res and res[0].get('artworkUrl100'):
            return res[0]['artworkUrl100'].replace('100x100bb', '600x600bb')
    except Exception:
        pass
    return ''

rows = list(csv.reader(open('jsk11L-music-export-with-reviews.csv', encoding='utf-8')))[1:]
items, hits = [], 0
for i, r in enumerate(rows):
    if len(r) < 8: continue
    first = (r[3] or r[1]).strip()
    last = (r[4] or r[2]).strip()
    artist = (first + ' ' + last).strip()
    album = r[5].strip()
    year = r[6].strip()
    rating = r[7].strip()
    cover = itunes_cover(artist, album)
    if cover: hits += 1
    f = {'Artist': artist, 'Cover': cover}
    if year.isdigit(): f['Year'] = int(year)
    if rating.replace('.', '').isdigit(): f['Rating'] = float(rating) if '.' in rating else int(rating)
    items.append({'title': album or artist, 'fields': f})
    if i % 100 == 0:
        open('albums_progress.txt', 'w').write(f"{i}/{len(rows)} covers={hits}")
    time.sleep(0.08)

spec = {
    'name': 'Backlog Music', 'icon': '💿', 'template': 'square', 'showImage': True,
    'fields': [
        {'name': 'Artist', 'type': 'TEXT'},
        {'name': 'Year', 'type': 'NUMBER'},
        {'name': 'Rating', 'type': 'NUMBER'},
        {'name': 'Cover', 'type': 'IMAGE_URL'},
    ],
    'visibleFields': ['Artist', 'Year'],
    'actions': [{'label': '✓ Escuchado', 'color': '#22c55e', 'targetListName': 'My Music'}],
    'items': items,
}
json.dump(spec, open('omnidesk-import/backlog-music.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open('albums_progress.txt', 'w').write(f"DONE {len(items)}/{len(rows)} covers={hits}")

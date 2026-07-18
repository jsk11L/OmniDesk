import os, re, json, urllib.request, urllib.parse, time
KEY = os.environ['TMDB_KEY']
IMG = 'https://image.tmdb.org/t/p/w500'

def get(url):
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.load(r)

def enrich(title, year):
    """Return (director, runtime_min, poster_url) — best effort."""
    try:
        q = urllib.parse.quote(title)
        url = f"https://api.themoviedb.org/3/search/movie?api_key={KEY}&query={q}"
        if year: url += f"&year={year}"
        res = get(url).get('results', [])
        if not res: return ('', None, '')
        mid = res[0]['id']
        poster = (IMG + res[0]['poster_path']) if res[0].get('poster_path') else ''
        det = get(f"https://api.themoviedb.org/3/movie/{mid}?api_key={KEY}&append_to_response=credits")
        runtime = det.get('runtime') or None
        director = ''
        for c in det.get('credits', {}).get('crew', []):
            if c.get('job') == 'Director': director = c.get('name', ''); break
        return (director, runtime, poster)
    except Exception:
        return ('', None, '')

# ---------- My Movies (enrich existing from data.json) ----------
d = json.load(open('data.json', encoding='utf-8'))
mv = [l for l in d['lists'] if 'Movies' in l['name']][0]
fid = {f['id']: f['name'] for f in mv['fields']}
mm_items, mm_hits = [], 0
for it in mv['items']:
    cf = {fid.get(k, k): v for k, v in (it.get('customFields') or {}).items()}
    title = it['title']; year = cf.get('Year')
    director, runtime, poster = enrich(title, year)
    if poster: mm_hits += 1
    f = {'Cover': poster or cf.get('media') or ''}
    if year: f['Year'] = year
    if cf.get('Watched Date'): f['Watched Date'] = cf['Watched Date']
    if cf.get('Stars') is not None: f['Stars'] = cf['Stars']
    if cf.get('Letterboxd'): f['Letterboxd'] = cf['Letterboxd']
    if director: f['Director'] = director
    if runtime: f['Runtime'] = runtime
    mm_items.append({'title': title, 'fields': f})
    time.sleep(0.04)
open('movies_progress.txt','w').write(f"MyMovies done {len(mm_items)} posters={mm_hits}")

mm = {
    'name': 'My Movies', 'icon': '🎬', 'template': 'poster', 'showImage': True,
    'fields': [
        {'name': 'Director', 'type': 'TEXT'},
        {'name': 'Year', 'type': 'NUMBER'},
        {'name': 'Stars', 'type': 'NUMBER'},
        {'name': 'Runtime', 'type': 'NUMBER'},
        {'name': 'Watched Date', 'type': 'DATE'},
        {'name': 'Letterboxd', 'type': 'URL'},
        {'name': 'Cover', 'type': 'IMAGE_URL'},
    ],
    'visibleFields': ['Director', 'Year', 'Stars'],
    'items': mm_items,
}
json.dump(mm, open('omnidesk-import/my-movies-enriched.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- Movies Backlog (from txt) ----------
bl_items, bl_hits = [], 0
for line in open('moviesbacklog.txt', encoding='utf-8'):
    s = line.strip()
    if not s: continue
    m = re.match(r'^(.*?)\s*\((\d{4})\)\s*-\s*(.*)$', s)
    if not m: continue
    title, year, director_txt = m.group(1).strip(), int(m.group(2)), m.group(3).strip()
    director, runtime, poster = enrich(title, year)
    if poster: bl_hits += 1
    f = {'Year': year, 'Director': director or director_txt, 'Cover': poster or ''}
    if runtime: f['Runtime'] = runtime
    bl_items.append({'title': title, 'fields': f})
    time.sleep(0.04)

bl = {
    'name': 'Movies Backlog', 'icon': '🎬', 'template': 'poster', 'showImage': True,
    'fields': [
        {'name': 'Director', 'type': 'TEXT'},
        {'name': 'Year', 'type': 'NUMBER'},
        {'name': 'Runtime', 'type': 'NUMBER'},
        {'name': 'Cover', 'type': 'IMAGE_URL'},
    ],
    'visibleFields': ['Director', 'Year'],
    'actions': [{'label': '✓ Vista', 'color': '#22c55e', 'targetListName': 'My Movies'}],
    'items': bl_items,
}
json.dump(bl, open('omnidesk-import/movies-backlog.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open('movies_progress.txt','w').write(f"DONE MyMovies={len(mm_items)}(posters={mm_hits}) Backlog={len(bl_items)}(posters={bl_hits})")

/* global React, Icons, DATA */
const { useState: useStateLst, useMemo: useMemoLst } = React;

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

const STATE_STYLES = {
  COMPLETADO: { bg: 'rgba(99,102,241,0.14)',  fg: '#a5b4fc', label: 'Completado' },
  PLATINADO:  { bg: 'rgba(245,158,11,0.16)',  fg: '#fbbf24', label: 'Platinado'  },
  MAXEADO:    { bg: 'rgba(34,197,94,0.14)',   fg: '#86efac', label: 'Maxeado'    },
  ABANDONADO: { bg: 'rgba(239,68,68,0.14)',   fg: '#fca5a5', label: 'Abandonado' },
  PENDIENTE:  { bg: 'rgba(130,130,140,0.18)', fg: 'var(--color-text-muted)', label: 'Pendiente' },
  JUGANDO:    { bg: 'rgba(99,102,241,0.16)',  fg: 'var(--color-primary)', label: 'Jugando' },
};

function ListsScreen({ onOpenModal, completeGame, moveBacklogStatus, onShowToast }) {
  const [selectedList, setSelectedList] = useStateLst('l-games-done');

  if (selectedList === 'l-games-done')
    return <CompletedGamesList onBack={() => setSelectedList(null)} onOpenModal={onOpenModal} />;
  if (selectedList === 'l-games-back')
    return <BacklogList onBack={() => setSelectedList(null)} onOpenModal={onOpenModal} completeGame={completeGame} moveBacklogStatus={moveBacklogStatus} onShowToast={onShowToast} />;

  return <ListsHome onOpen={setSelectedList} />;
}

// ─────────────────────────────────────────────
function ListsHome({ onOpen }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="uppercase-tag">Bibliotecas personales</div>
          <h1 className="page-title mt-1">Listas</h1>
          <div className="page-subtitle">Colecciones personalizables · cualquier estructura</div>
        </div>
        <button className="btn btn-primary"><Icons.Plus size={13}/> Nueva lista</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {DATA.lists.map(l => (
          <div key={l.id} className="panel" style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={() => onOpen(l.id)}>
            <div style={{
              height: 90,
              background: `linear-gradient(135deg, ${l.cover}, ${l.cover}99)`,
              display: 'flex', alignItems: 'flex-end', padding: 14,
              position: 'relative',
            }}>
              <span style={{ fontSize: 26 }}>{l.icon}</span>
              <span className="mono" style={{ position: 'absolute', top: 12, right: 14, fontSize: 11, color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 4 }}>{l.count}</span>
            </div>
            <div className="panel-pad">
              <div style={{ fontSize: 15, fontWeight: 600 }}>{l.name}</div>
              <div className="text-xs text-muted mt-1">{l.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
function CompletedGamesList({ onBack, onOpenModal }) {
  const [groupBy, setGroupBy] = useStateLst('year');
  const [filterPlatform, setFilterPlatform] = useStateLst(null);
  const [filterState, setFilterState] = useStateLst(null);
  const [q, setQ] = useStateLst('');
  const [view, setView] = useStateLst('grid');

  const filtered = useMemoLst(() => {
    let arr = DATA.completed;
    if (q) arr = arr.filter(g => g.title.toLowerCase().includes(q.toLowerCase()));
    if (filterPlatform) arr = arr.filter(g => g.platform === filterPlatform);
    if (filterState) arr = arr.filter(g => g.state === filterState);
    return arr;
  }, [q, filterPlatform, filterState]);

  // Build groups + index per group (desc by completion date)
  const groups = useMemoLst(() => {
    const groupers = {
      year:     (g) => String(g.year),
      platform: (g) => g.platform,
      state:    (g) => g.state,
      tag:      (g) => g.tags[0] || '— sin tag —',
      none:     () => 'Todos',
    };
    const fn = groupers[groupBy] || groupers.year;
    const m = {};
    filtered.forEach(g => { (m[fn(g)] ||= []).push(g); });
    // Within each group sort by (year desc, month desc), assign index
    Object.keys(m).forEach(k => {
      m[k].sort((a, b) => b.year - a.year || b.month - a.month);
      m[k].forEach((g, i) => { g._idx = i + 1; });
    });
    // Sort the group keys
    const keys = Object.keys(m).sort((a, b) => {
      if (groupBy === 'year') return Number(b) - Number(a);
      return a.localeCompare(b);
    });
    return keys.map(k => ({ key: k, items: m[k] }));
  }, [filtered, groupBy]);

  const platforms = [...new Set(DATA.completed.map(g => g.platform))];
  const states = ['COMPLETADO','PLATINADO','MAXEADO'];

  const grouperLabel = {
    year: 'Año', platform: 'Plataforma', state: 'Estado', tag: 'Tag principal', none: 'Sin agrupar',
  };

  return (
    <div className="page-wide" style={{ padding: '20px 28px 60px' }}>
      <div className="page-header" style={{ alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div className="breadcrumb" style={{ fontSize: 12, marginBottom: 6 }}>
            <span style={{ cursor: 'pointer' }} onClick={onBack}>Listas</span>
            <span className="sep">/</span>
            <span className="current">Videojuegos · completados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 30 }}>🏆</span>
            <div>
              <h1 className="page-title">Completados</h1>
              <div className="page-subtitle mono">{filtered.length} de {DATA.completed.length} juegos · agrupados por <strong style={{ color: 'var(--color-primary)' }}>{grouperLabel[groupBy]}</strong></div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="view-switcher" style={{ display: 'flex', background: 'var(--color-surface)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            {[
              { id: 'grid', icon: Icons.Grid },
              { id: 'table', icon: Icons.Table },
              { id: 'list', icon: Icons.Lines },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                style={{
                  padding: '5px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: view === v.id ? 'var(--color-surface-hover)' : 'transparent',
                  color: view === v.id ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}><v.icon size={13}/></button>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="panel" style={{ marginBottom: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Icons.Search size={14} stroke="var(--color-text-faint)" />
        <input className="input" style={{ border: 'none', background: 'transparent', padding: 0, flex: 1, minWidth: 180 }}
          placeholder="Buscar por título…" value={q} onChange={e => setQ(e.target.value)} />

        <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

        <span className="uppercase-tag">agrupar</span>
        <select className="select" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={groupBy} onChange={e => setGroupBy(e.target.value)}>
          <option value="year">Año</option>
          <option value="platform">Plataforma</option>
          <option value="state">Estado</option>
          <option value="tag">Tag principal</option>
          <option value="none">Sin agrupar</option>
        </select>

        <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

        <span className="uppercase-tag">plataforma</span>
        <button onClick={() => setFilterPlatform(null)} className="chip"
          style={{ cursor: 'pointer', background: filterPlatform == null ? 'var(--color-primary-ghost)' : null, color: filterPlatform == null ? 'var(--color-primary)' : null }}>Todas</button>
        {platforms.map(p => (
          <button key={p} onClick={() => setFilterPlatform(p === filterPlatform ? null : p)} className="chip"
            style={{ cursor: 'pointer', background: filterPlatform === p ? 'var(--color-surface-hover)' : null, color: filterPlatform === p ? 'var(--color-text)' : null }}>{p}</button>
        ))}

        <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

        <span className="uppercase-tag">estado</span>
        {states.map(s => (
          <button key={s} onClick={() => setFilterState(s === filterState ? null : s)} className="chip"
            style={{
              cursor: 'pointer',
              background: filterState === s ? STATE_STYLES[s].bg : null,
              color: filterState === s ? STATE_STYLES[s].fg : null,
            }}>{STATE_STYLES[s].label}</button>
        ))}
      </div>

      {/* Groups */}
      {groups.map(group => (
        <div key={group.key} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border-soft)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>{group.key}</h2>
            <span className="mono text-muted text-sm">{group.items.length} {group.items.length === 1 ? 'juego' : 'juegos'}</span>
            <div style={{ flex: 1 }}/>
            <span className="uppercase-tag">índice · {grouperLabel[groupBy].toLowerCase()}</span>
          </div>

          {view === 'grid' && <CompletedGrid items={group.items} groupBy={groupBy} groupKey={group.key} />}
          {view === 'table' && <CompletedTable items={group.items} groupBy={groupBy} groupKey={group.key} />}
          {view === 'list' && <CompletedListRows items={group.items} groupBy={groupBy} groupKey={group.key} />}
        </div>
      ))}
    </div>
  );
}

function colorFor(title) {
  const palette = ['#6366f1','#22c55e','#f59e0b','#ec4899','#38bdf8','#a78bfa','#ef4444','#84cc16'];
  let h = 0; for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 1000;
  return palette[h % palette.length];
}

function CoverArt({ title, height = 140, badge }) {
  const color = colorFor(title);
  const letter = title.charAt(0).toUpperCase();
  return (
    <div style={{
      height, borderRadius: 6, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(160deg, ${color}, ${color}66 60%, var(--color-surface-2))`,
      display: 'grid', placeItems: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: height * 0.55, fontWeight: 700,
        color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.04em',
        textShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>{letter}</div>
      {badge && (
        <div className="mono" style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: 10, fontWeight: 600,
          padding: '2px 6px', background: 'rgba(0,0,0,0.45)',
          color: 'rgba(255,255,255,0.92)', borderRadius: 3, letterSpacing: '0.04em',
        }}>{badge}</div>
      )}
    </div>
  );
}

function indexBadge(g, groupBy, groupKey) {
  // Returns the "#5 · 2026 · Año" style badge
  const labels = {
    year: groupKey, platform: groupKey, state: STATE_STYLES[groupKey]?.label || groupKey,
    tag: groupKey, none: 'total',
  };
  return `#${String(g._idx).padStart(2,'0')} · ${labels[groupBy] || groupKey}`;
}

function CompletedGrid({ items, groupBy, groupKey }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
      {items.map(g => {
        const st = STATE_STYLES[g.state];
        return (
          <div key={g.id} className="panel" style={{ overflow: 'hidden', cursor: 'pointer' }}>
            <CoverArt title={g.title} height={140} badge={indexBadge(g, groupBy, groupKey)} />
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
              <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="mono text-xs text-muted">{g.platform} · {MONTHS[g.month - 1]} {g.year}</span>
                <span className="mono text-xs" style={{ color: 'var(--color-accent)' }}>★ {g.rating}</span>
              </div>
              <span className="chip" style={{ background: st.bg, color: st.fg, border: '1px solid transparent' }}>{st.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompletedTable({ items, groupBy, groupKey }) {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '60px 32px 2fr 100px 100px 100px 70px 90px', alignItems: 'center', padding: '10px 14px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border-soft)' }}>
        <div className="uppercase-tag">#</div>
        <div></div>
        <div className="uppercase-tag">Título</div>
        <div className="uppercase-tag">Plataforma</div>
        <div className="uppercase-tag">Mes · año</div>
        <div className="uppercase-tag">Estado</div>
        <div className="uppercase-tag" style={{ textAlign: 'right' }}>Horas</div>
        <div className="uppercase-tag" style={{ textAlign: 'right' }}>Rating</div>
      </div>
      {items.map((g, i) => {
        const st = STATE_STYLES[g.state];
        return (
          <div key={g.id} style={{
            display: 'grid', gridTemplateColumns: '60px 32px 2fr 100px 100px 100px 70px 90px',
            alignItems: 'center', padding: '8px 14px',
            borderTop: i > 0 ? '1px solid var(--color-border-soft)' : 'none',
            fontSize: 13, cursor: 'pointer',
          }}>
            <span className="mono text-xs" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>#{String(g._idx).padStart(2,'0')}</span>
            <div style={{
              width: 22, height: 22, borderRadius: 4,
              background: `linear-gradient(135deg, ${colorFor(g.title)}, ${colorFor(g.title)}66)`,
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.9)',
            }}>{g.title.charAt(0)}</div>
            <div style={{ fontWeight: 500 }}>{g.title}</div>
            <div className="text-muted mono text-sm">{g.platform}</div>
            <div className="mono text-xs text-muted">{MONTHS[g.month - 1]} {g.year}</div>
            <div><span className="chip" style={{ background: st.bg, color: st.fg, fontSize: 10 }}>{st.label}</span></div>
            <div className="mono text-sm" style={{ textAlign: 'right' }}>{g.hours}h</div>
            <div className="mono text-sm" style={{ textAlign: 'right', color: g.rating > 9 ? 'var(--color-accent)' : 'var(--color-text)' }}>★ {g.rating}</div>
          </div>
        );
      })}
    </div>
  );
}

function CompletedListRows({ items, groupBy, groupKey }) {
  return (
    <div className="panel">
      {items.map((g, i) => {
        const st = STATE_STYLES[g.state];
        return (
          <div key={g.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 16px',
            borderTop: i > 0 ? '1px solid var(--color-border-soft)' : 'none',
            cursor: 'pointer',
          }}>
            <span className="mono text-xs" style={{ color: 'var(--color-primary)', fontWeight: 600, minWidth: 32 }}>#{String(g._idx).padStart(2,'0')}</span>
            <div style={{
              width: 40, height: 40, borderRadius: 6,
              background: `linear-gradient(135deg, ${colorFor(g.title)}, ${colorFor(g.title)}66)`,
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.9)',
              flexShrink: 0,
            }}>{g.title.charAt(0)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{g.title}</div>
              <div className="mono text-xs text-muted">{g.platform} · {MONTHS[g.month - 1]} {g.year} · {g.hours}h</div>
            </div>
            <div className="flex gap-2">
              {g.tags.slice(0,2).map(t => <span key={t} className="chip">{t}</span>)}
            </div>
            <span className="mono text-sm" style={{ color: 'var(--color-accent)', minWidth: 50, textAlign: 'right' }}>★ {g.rating}</span>
            <span className="chip" style={{ background: st.bg, color: st.fg, minWidth: 90, justifyContent: 'center' }}>{st.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// BACKLOG
// ─────────────────────────────────────────────
function BacklogList({ onBack, onOpenModal, completeGame, moveBacklogStatus, onShowToast }) {
  const [filterStatus, setFilterStatus] = useStateLst(null);
  const [q, setQ] = useStateLst('');
  const [completingGame, setCompletingGame] = useStateLst(null);
  // re-render via app's data flush
  const _items = DATA.backlog;

  const filtered = useMemoLst(() => {
    let arr = _items;
    if (filterStatus) arr = arr.filter(g => g.status === filterStatus);
    if (q) arr = arr.filter(g => g.title.toLowerCase().includes(q.toLowerCase()));
    return arr;
  }, [q, filterStatus, _items.length]);

  const jugando = filtered.filter(g => g.status === 'JUGANDO');
  const pendientes = filtered.filter(g => g.status === 'PENDIENTE');
  const totalHours = filtered.reduce((sum, g) => sum + g.estHours, 0);

  return (
    <div className="page-wide" style={{ padding: '20px 28px 60px' }}>
      <div className="page-header" style={{ alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div className="breadcrumb" style={{ fontSize: 12, marginBottom: 6 }}>
            <span style={{ cursor: 'pointer' }} onClick={onBack}>Listas</span>
            <span className="sep">/</span>
            <span className="current">Videojuegos · backlog</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 30 }}>🎮</span>
            <div>
              <h1 className="page-title">Backlog</h1>
              <div className="page-subtitle mono">
                {jugando.length} jugando · {pendientes.length} pendientes ·
                <span style={{ color: 'var(--color-accent)' }}> ~{totalHours}h por completar</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn"><Icons.Filter size={12}/> Importar Steam</button>
          <button className="btn btn-primary"><Icons.Plus size={13}/> Añadir juego</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="panel" style={{ marginBottom: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icons.Search size={14} stroke="var(--color-text-faint)" />
        <input className="input" style={{ border: 'none', background: 'transparent', padding: 0, flex: 1 }}
          placeholder="Buscar por título…" value={q} onChange={e => setQ(e.target.value)} />
        <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />
        <span className="uppercase-tag">estado</span>
        <button onClick={() => setFilterStatus(null)} className="chip"
          style={{ cursor: 'pointer', background: filterStatus == null ? 'var(--color-primary-ghost)' : null, color: filterStatus == null ? 'var(--color-primary)' : null }}>Todos</button>
        {['JUGANDO','PENDIENTE'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s === filterStatus ? null : s)} className="chip"
            style={{
              cursor: 'pointer',
              background: filterStatus === s ? STATE_STYLES[s].bg : null,
              color: filterStatus === s ? STATE_STYLES[s].fg : null,
            }}>{STATE_STYLES[s].label}</button>
        ))}
      </div>

      {/* JUGANDO section */}
      {jugando.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <SectionHeader title="Jugando ahora" subtitle={`${jugando.length} juegos activos`} accent="var(--color-primary)" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {jugando.map(g => (
              <BacklogCard key={g.id} game={g}
                onMoveStatus={(newSt) => { moveBacklogStatus(g.id, newSt); onShowToast(`"${g.title}" → ${STATE_STYLES[newSt].label}`); }}
                onComplete={() => setCompletingGame(g)} />
            ))}
          </div>
        </div>
      )}

      {/* PENDIENTE section */}
      {pendientes.length > 0 && (
        <div>
          <SectionHeader title="Pendientes" subtitle={`${pendientes.length} en cola`} accent="var(--color-text-muted)" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {pendientes.map(g => (
              <BacklogCard key={g.id} game={g}
                onMoveStatus={(newSt) => { moveBacklogStatus(g.id, newSt); onShowToast(`"${g.title}" → ${STATE_STYLES[newSt].label}`); }}
                onComplete={() => setCompletingGame(g)} />
            ))}
          </div>
        </div>
      )}

      {completingGame && (
        <CompleteGameDialog
          game={completingGame}
          onClose={() => setCompletingGame(null)}
          onConfirm={(payload) => {
            completeGame(completingGame.id, payload);
            onShowToast(`✓ "${completingGame.title}" añadido a Completados`);
            setCompletingGame(null);
          }}
        />
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border-soft)' }}>
      <span style={{ width: 6, height: 6, borderRadius: 50, background: accent }}/>
      <h2 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
      <span className="mono text-faint text-sm">{subtitle}</span>
    </div>
  );
}

function BacklogCard({ game, onMoveStatus, onComplete }) {
  const st = STATE_STYLES[game.status];
  return (
    <div className="panel" style={{ padding: 14, display: 'flex', gap: 12 }}>
      <div style={{
        width: 64, height: 84, borderRadius: 6, flexShrink: 0,
        background: `linear-gradient(135deg, ${colorFor(game.title)}, ${colorFor(game.title)}66)`,
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 28, color: 'rgba(255,255,255,0.9)',
      }}>{game.title.charAt(0)}</div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{game.title}</div>
          <span className="chip" style={{ background: st.bg, color: st.fg, fontSize: 10, flexShrink: 0 }}>{st.label}</span>
        </div>
        <div className="mono text-xs text-muted mt-1">{game.platform} · ~{game.estHours}h · añadido {game.added.slice(0, 7)}</div>
        {game.notes && (
          <div className="text-xs text-faint mt-2" style={{ lineHeight: 1.45, fontStyle: 'italic',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {game.notes}
          </div>
        )}
        <div style={{ flex: 1 }}/>
        <div className="flex gap-1 mt-3">
          {game.status === 'PENDIENTE' && (
            <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', color: 'var(--color-primary)', borderColor: 'var(--color-primary-ghost)' }}
              onClick={() => onMoveStatus('JUGANDO')}>
              ▶ Empezar
            </button>
          )}
          {game.status === 'JUGANDO' && (
            <>
              <button className="btn btn-sm" style={{ color: 'var(--color-text-muted)' }} onClick={() => onMoveStatus('PENDIENTE')}>
                ⏸ Pausar
              </button>
              <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onComplete}>
                <Icons.Check size={11}/> Marcar completado
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPLETE GAME MODAL
// ─────────────────────────────────────────────
function CompleteGameDialog({ game, onClose, onConfirm }) {
  const today = DATA.today;
  const [state, setState] = useStateLst('COMPLETADO');
  const [month, setMonth] = useStateLst(today.getMonth() + 1);
  const [year, setYear] = useStateLst(today.getFullYear());
  const [hours, setHours] = useStateLst(game.estHours);
  const [rating, setRating] = useStateLst(8);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Marcar como completado</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icons.Close size={14}/></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, padding: 12, background: 'var(--color-surface-2)', borderRadius: 8 }}>
            <div style={{
              width: 56, height: 76, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${colorFor(game.title)}, ${colorFor(game.title)}66)`,
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 26, color: 'rgba(255,255,255,0.9)',
            }}>{game.title.charAt(0)}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{game.title}</div>
              <div className="mono text-xs text-muted mt-1">{game.platform} · estimado {game.estHours}h</div>
              <div className="text-xs text-muted mt-2">El índice por grupo se calcula automáticamente al guardar.</div>
            </div>
          </div>

          <div className="field">
            <label>Estado final</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {['COMPLETADO','PLATINADO','MAXEADO'].map(s => (
                <button key={s} onClick={() => setState(s)}
                  style={{
                    padding: '10px 8px', borderRadius: 6,
                    border: '1px solid ' + (state === s ? 'var(--color-primary)' : 'var(--color-border)'),
                    background: state === s ? STATE_STYLES[s].bg : 'transparent',
                    color: state === s ? STATE_STYLES[s].fg : 'var(--color-text-muted)',
                    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: state === s ? 600 : 400,
                  }}>{STATE_STYLES[s].label}</button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Mes de completación</label>
              <select className="select" value={month} onChange={e => setMonth(+e.target.value)}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m} · {String(i + 1).padStart(2,'0')}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Año</label>
              <select className="select" value={year} onChange={e => setYear(+e.target.value)}>
                {[2026, 2025, 2024, 2023].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Horas reales</label>
              <input className="input" type="number" value={hours} onChange={e => setHours(+e.target.value)} />
            </div>
            <div className="field">
              <label>Rating · /10</label>
              <input className="input" type="number" step="0.1" min="0" max="10" value={rating} onChange={e => setRating(+e.target.value)} />
            </div>
          </div>

          <div className="text-xs text-muted" style={{ display: 'flex', gap: 6, padding: 10, background: 'var(--color-primary-ghost)', borderRadius: 6, marginTop: 8 }}>
            <Icons.Check size={14} stroke="var(--color-primary)" />
            <span>Se autorrellenarán <strong>índice por grupo</strong>, <strong>año</strong> y <strong>mes</strong> en la lista de Completados.</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onConfirm({ state, month, year, hours, rating })}>
            <Icons.Check size={12}/> Confirmar completado
          </button>
        </div>
      </div>
    </div>
  );
}

window.ListsScreen = ListsScreen;

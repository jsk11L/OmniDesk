/* global React, Icons, DATA */
const { useState: useStateCal, useMemo: useMemoCal } = React;

function CalendarScreen({ onOpenModal }) {
  const [view, setView] = useStateCal('month');
  const [filterCat, setFilterCat] = useStateCal(null);

  // May 2026 starts on Friday (dow=5 -> mon-based 4)
  const cells = useMemoCal(() => {
    const first = new Date(2026, 4, 1);
    const startDow = (first.getDay() + 6) % 7;
    const arr = [];
    for (let i = 0; i < 35; i++) {
      const d = i - startDow + 1;
      arr.push({ day: d >= 1 && d <= 31 ? d : null, isOut: d < 1 || d > 31 });
    }
    return arr;
  }, []);

  const eventsByDay = useMemoCal(() => {
    const m = {};
    DATA.events.forEach(e => {
      if (filterCat && e.cat !== filterCat) return;
      (m[e.day] ||= []).push(e);
    });
    return m;
  }, [filterCat]);

  const cats = ['work', 'health', 'social', 'personal', 'finance'];
  const catColors = { work:'#6366f1', health:'#22c55e', social:'#ec4899', personal:'#a78bfa', finance:'#ef4444' };

  return (
    <div className="page-wide" style={{ maxWidth: '100%', padding: '20px 24px 40px' }}>
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <div className="uppercase-tag">Calendario</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h1 className="page-title mt-1">Mayo 2026</h1>
            <span className="mono text-muted">semana 20</span>
          </div>
        </div>
        <div className="flex gap-2">
          {/* View switcher */}
          <div style={{ display: 'flex', background: 'var(--color-surface)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            {['day','week','month','list'].map(v => (
              <button key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: view === v ? 'var(--color-surface-hover)' : 'transparent',
                  color: view === v ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontSize: 12, fontFamily: 'inherit', textTransform: 'capitalize',
                }}>{ {day:'Día', week:'Semana', month:'Mes', list:'Lista'}[v] }</button>
            ))}
          </div>
          <button className="btn"><Icons.Chevron size={12} style={{ transform: 'rotate(180deg)' }}/></button>
          <button className="btn">Hoy</button>
          <button className="btn"><Icons.Chevron size={12}/></button>
          <button className="btn btn-primary" onClick={() => onOpenModal('event')}><Icons.Plus size={13}/> Evento</button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        <span className="uppercase-tag">filtrar</span>
        <button onClick={() => setFilterCat(null)} className="chip"
          style={{ background: filterCat == null ? 'var(--color-primary-ghost)' : 'transparent', color: filterCat == null ? 'var(--color-primary)' : null, cursor: 'pointer' }}>Todos</button>
        {cats.map(c => (
          <button key={c} onClick={() => setFilterCat(c === filterCat ? null : c)} className="chip"
            style={{ background: filterCat === c ? catColors[c] + '22' : 'transparent', color: filterCat === c ? catColors[c] : null, cursor: 'pointer' }}>
            <span className="chip-dot" style={{ background: catColors[c] }} /> {c}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span className="mono text-xs text-faint">{Object.values(eventsByDay).flat().length} eventos visibles</span>
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border-soft)' }}>
          {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((d, i) => (
            <div key={d} className="mono text-xs text-faint"
              style={{ padding: '10px 14px', borderRight: i < 6 ? '1px solid var(--color-border-soft)' : 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, 1fr)' }}>
          {cells.map((c, i) => {
            const isToday = c.day === 16;
            const row = Math.floor(i / 7);
            const col = i % 7;
            const evs = c.day ? (eventsByDay[c.day] || []) : [];
            return (
              <div key={i} style={{
                borderRight: col < 6 ? '1px solid var(--color-border-soft)' : 'none',
                borderTop: row > 0 ? '1px solid var(--color-border-soft)' : 'none',
                padding: 6,
                minHeight: 120,
                background: c.isOut ? 'rgba(0,0,0,0.15)' : 'transparent',
                position: 'relative',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 6,
                  fontSize: 12, fontWeight: isToday ? 600 : 500,
                  background: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday ? '#fff' : c.isOut ? 'var(--color-text-faint)' : 'var(--color-text)',
                  marginBottom: 4,
                }}>{c.day || ''}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {evs.slice(0, 3).map(e => (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '2px 6px',
                      background: e.color + '22',
                      borderLeft: '2px solid ' + e.color,
                      borderRadius: 3,
                      fontSize: 11,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      cursor: 'pointer',
                    }}>
                      <span className="mono" style={{ fontSize: 9, color: e.color, flexShrink: 0 }}>{e.start}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                    </div>
                  ))}
                  {evs.length > 3 && (
                    <div className="text-xs text-faint mono" style={{ paddingLeft: 6 }}>+ {evs.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.CalendarScreen = CalendarScreen;

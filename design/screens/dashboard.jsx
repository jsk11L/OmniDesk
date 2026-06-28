/* global React, Icons, DATA */
const { useMemo: useMemoDash } = React;

function Dashboard({ onNav, onOpenModal }) {
  const today = DATA.today;
  const fmtDate = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const upcoming = useMemoDash(() => {
    return [...DATA.events]
      .filter(e => e.day >= today.getDate())
      .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
      .slice(0, 5);
  }, []);

  // Mini calendar — 6 weeks
  const miniCal = useMemoDash(() => {
    const first = new Date(2026, 4, 1); // 1 may 2026
    const startDow = (first.getDay() + 6) % 7; // L=0
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = i - startDow + 1;
      cells.push(d >= 1 && d <= 31 ? d : null);
    }
    return cells;
  }, []);

  const eventsByDay = useMemoDash(() => {
    const m = {};
    DATA.events.forEach(e => { (m[e.day] ||= []).push(e); });
    return m;
  }, []);

  return (
    <div className="page">
      {/* greeting */}
      <div className="page-header">
        <div>
          <div className="uppercase-tag">{fmtDate}</div>
          <h1 className="page-title mt-1">Buenos días, Daniel.</h1>
          <div className="page-subtitle">3 eventos hoy · 7 tareas en progreso · racha de meditación de 22 días</div>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => onOpenModal('event')}><Icons.Plus size={13} /> Evento</button>
          <button className="btn btn-primary" onClick={() => onOpenModal('todo')}><Icons.Plus size={13} /> Nueva tarea</button>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard label="Balance · mayo" value="+1.665€" sub="vs. abr +312€" tone="success" icon={Icons.TrendUp} />
        <StatCard label="Tareas hoy" value="3" sub="2 ALTA · 1 MEDIA" tone="primary" icon={Icons.Kanban} />
        <StatCard label="Eventos esta semana" value="6" sub="próximo: standup L 09:30" tone="default" icon={Icons.Calendar} />
        <StatCard label="Racha más larga" value="22d" sub="Meditar 10 min" tone="accent" icon={Icons.Flame} />
      </div>

      {/* Two-column main */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Upcoming events */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Próximos eventos</div>
                <div className="panel-sub">Hoy → mañana → resto de la semana</div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => onNav('calendar')}>Abrir calendario →</button>
            </div>
            <div>
              {upcoming.map(e => (
                <div key={e.id} style={{
                  display: 'grid', gridTemplateColumns: '60px 4px 1fr auto',
                  alignItems: 'center', gap: 14,
                  padding: '12px 18px',
                  borderTop: '1px solid var(--color-border-soft)',
                }}>
                  <div>
                    <div className="mono text-xs text-faint">{['may'][0]} {String(e.day).padStart(2,'0')}</div>
                    <div className="mono text-sm">{e.start}</div>
                  </div>
                  <div style={{ width: 3, height: 30, background: e.color, borderRadius: 3 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
                    <div className="text-xs text-muted mono">{e.cat} · {e.start}–{e.end} {e.notify ? '· 🔔 ' + e.notify + ' min antes' : ''}</div>
                  </div>
                  <button className="btn btn-ghost btn-icon"><Icons.Dots size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* In progress */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">En progreso · Proyecto OmniDesk</div>
                <div className="panel-sub">3 tareas activas, 2 en revisión</div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => onNav('todos')}>Ver tablero →</button>
            </div>
            <div style={{ padding: '6px 0 12px' }}>
              {DATA.todos.items.filter(t => t.col === 'col-progress' || t.col === 'col-review').map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: t.priority === 'ALTA' ? 'var(--color-danger)' : t.priority === 'MEDIA' ? 'var(--color-accent)' : 'var(--color-text-faint)'
                  }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{t.title}</span>
                  <span className="chip" style={{ fontSize: 10 }}>{t.col === 'col-progress' ? 'PROGRESO' : 'REVISIÓN'}</span>
                  <span className="mono text-xs text-faint" style={{ minWidth: 50, textAlign: 'right' }}>{t.due}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Finance snapshot */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Wishlist · botes de ahorro</div>
                <div className="panel-sub">3 botes activos · 2.610€ ahorrados</div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => onNav('finance')}>Ver wishlist →</button>
            </div>
            <div className="panel-pad">
              {DATA.savingPots.slice(0, 3).map(pot => {
                const pct = (pot.saved / pot.goal) * 100;
                return (
                  <div key={pot.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{ fontSize: 16 }}>{pot.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{pot.name}</span>
                      <span className="mono text-xs" style={{ color: pot.color, fontWeight: 600 }}>{Math.round(pct)}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: pct + '%', height: '100%', background: pot.color }}/>
                    </div>
                    <div className="mono text-xs text-faint mt-1">
                      <strong style={{ color: 'var(--color-text-muted)' }}>{pot.saved.toLocaleString('es-ES')}€</strong> / {pot.goal.toLocaleString('es-ES')}€ · {Math.ceil((pot.goal - pot.saved) / pot.monthly)} meses
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Mini calendar */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Mayo 2026</div>
              <div className="flex gap-1">
                <button className="btn btn-ghost btn-icon"><Icons.Chevron size={12} style={{ transform: 'rotate(180deg)' }} /></button>
                <button className="btn btn-ghost btn-icon"><Icons.Chevron size={12} /></button>
              </div>
            </div>
            <div className="panel-pad">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
                {['L','M','X','J','V','S','D'].map(d => (
                  <div key={d} className="mono text-xs text-faint" style={{ textAlign: 'center', padding: 4 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {miniCal.map((d, i) => {
                  const isToday = d === 16;
                  const has = d && eventsByDay[d];
                  return (
                    <div key={i} style={{
                      aspectRatio: '1',
                      borderRadius: 4,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12,
                      background: isToday ? 'var(--color-primary)' : 'transparent',
                      color: isToday ? '#fff' : d ? 'var(--color-text)' : 'transparent',
                      fontWeight: isToday ? 600 : 400,
                      position: 'relative',
                      cursor: d ? 'pointer' : 'default',
                    }}>
                      {d || '·'}
                      {has && !isToday && (
                        <div style={{
                          position: 'absolute', bottom: 3, display: 'flex', gap: 1,
                        }}>
                          {has.slice(0, 3).map((e, j) => (
                            <div key={j} style={{ width: 4, height: 4, borderRadius: 50, background: e.color }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Habits today */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Hábitos · hoy</div>
                <div className="panel-sub">Sábado 16 mayo</div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => onNav('habits')}>Ver todos →</button>
            </div>
            <div style={{ padding: '4px 14px 14px' }}>
              {DATA.habits.slice(0, 5).map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: h.week[6] ? 'var(--color-success)' : 'transparent',
                    border: '1px solid ' + (h.week[6] ? 'transparent' : 'var(--color-border)'),
                    display: 'grid', placeItems: 'center',
                  }}>
                    {h.week[6] === 1 && <Icons.Check size={12} stroke="#fff" />}
                  </div>
                  <span style={{ flex: 1, fontSize: 13 }}>{h.emoji} {h.name}</span>
                  <span className="mono text-xs text-muted">{h.streak}d</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent notes */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Notas recientes</div>
                <div className="panel-sub">Última actividad</div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => onNav('notes')}>Ver todas →</button>
            </div>
            <div style={{ padding: '4px 14px 14px' }}>
              {DATA.notes.slice(0, 4).map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 4px', cursor: 'pointer' }} onClick={() => onNav('notes')}>
                  <span style={{ fontSize: 16 }}>{n.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</div>
                    <div className="text-xs text-muted mono">{n.updated}</div>
                  </div>
                  {n.pinned && <Icons.Pin size={12} stroke="var(--color-accent)" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, tone, icon: I }) {
  const colorMap = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    accent: 'var(--color-accent)',
    default: 'var(--color-text-muted)',
  };
  return (
    <div className="panel panel-pad" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="uppercase-tag">{label}</div>
        <I size={14} stroke={colorMap[tone]} />
      </div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 600, marginTop: 6, letterSpacing: '-0.02em' }}>{value}</div>
      <div className="text-xs text-muted mono mt-1">{sub}</div>
    </div>
  );
}

window.Dashboard = Dashboard;

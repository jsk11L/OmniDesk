/* global React, Icons, DATA */
const { useState: useStateHab, useMemo: useMemoHab } = React;

function HabitsScreen() {
  // Build a 91-day contribution-style grid for "Meditar"
  const heatmap = useMemoHab(() => {
    const days = 91;
    const arr = [];
    let streak = 0;
    for (let i = 0; i < days; i++) {
      const r = Math.random();
      const val = r > 0.18 ? (r > 0.75 ? 3 : r > 0.4 ? 2 : 1) : 0;
      arr.push(val);
    }
    // Force last 22 to be done (streak)
    for (let i = days - 22; i < days; i++) arr[i] = 2 + (i % 2);
    return arr;
  }, []);

  const today = DATA.today;
  const weekDays = ['L','M','X','J','V','S','D'];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="uppercase-tag">Hábitos · semana 20</div>
          <h1 className="page-title mt-1">Hábitos</h1>
          <div className="page-subtitle">6 hábitos activos · 4 completados hoy</div>
        </div>
        <button className="btn btn-primary"><Icons.Plus size={13}/> Nuevo hábito</button>
      </div>

      {/* Hero: featured streak */}
      <div className="panel" style={{ marginBottom: 18, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'grid', placeItems: 'center', fontSize: 28,
          }}>🧘</div>
          <div style={{ flex: 1 }}>
            <div className="uppercase-tag">Mejor racha activa</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>Meditar 10 min</div>
            <div className="text-xs text-muted mono mt-1">desde 25 abr · objetivo diario</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>
              22<span style={{ fontSize: 14 }}>d</span>
            </div>
            <div className="text-xs text-faint mono">racha actual · próx 30d</div>
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ marginTop: 18 }}>
          <div className="uppercase-tag" style={{ marginBottom: 6 }}>Últimos 13 semanas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 3 }}>
            {Array.from({ length: 13 * 7 }).map((_, i) => {
              const week = Math.floor(i / 7);
              const dow = i % 7;
              const idx = week * 7 + dow;
              const v = heatmap[idx] || 0;
              const colors = ['var(--color-surface-2)', 'rgba(99,102,241,0.25)', 'rgba(99,102,241,0.55)', 'rgba(99,102,241,0.95)'];
              return (
                <div key={i} style={{
                  aspectRatio: '1', maxWidth: 18,
                  background: colors[v],
                  borderRadius: 3,
                }} title={`día ${idx + 1}`}/>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3 text-xs text-faint mono" style={{ alignItems: 'center' }}>
            <span>menos</span>
            {[0,1,2,3].map(v => (
              <div key={v} style={{
                width: 12, height: 12, borderRadius: 2,
                background: ['var(--color-surface-2)', 'rgba(99,102,241,0.25)', 'rgba(99,102,241,0.55)', 'rgba(99,102,241,0.95)'][v]
              }}/>
            ))}
            <span>más</span>
            <div style={{ flex: 1 }}/>
            <span>88 / 91 días</span>
          </div>
        </div>
      </div>

      {/* Habit cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {DATA.habits.map(h => (
          <HabitCard key={h.id} habit={h} weekDays={weekDays} />
        ))}
      </div>
    </div>
  );
}

function HabitCard({ habit, weekDays }) {
  const [week, setWeek] = useStateHab(habit.week);
  const toggle = (i) => setWeek(w => w.map((v, j) => j === i ? (v ? 0 : 1) : v));
  const done = week.filter(Boolean).length;

  return (
    <div className="panel panel-pad" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: 'var(--color-surface-2)',
          display: 'grid', placeItems: 'center', fontSize: 18,
        }}>{habit.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{habit.name}</div>
          <div className="text-xs text-muted mono">{habit.goal} · meta semanal</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-accent)' }}>
            <Icons.Flame size={11} stroke="var(--color-accent)" style={{ display:'inline', verticalAlign:'middle', marginRight: 2 }}/> {habit.streak}d
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {weekDays.map((d, i) => {
            const isDone = week[i];
            const isToday = i === 6;
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="mono text-xs text-faint" style={{ marginBottom: 4 }}>{d}</div>
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width: '100%', aspectRatio: '1', maxHeight: 32,
                    border: 'none', cursor: 'pointer',
                    borderRadius: 6,
                    background: isDone
                      ? (isToday ? 'var(--color-primary)' : 'var(--color-primary-soft)')
                      : 'var(--color-surface-2)',
                    color: isDone ? '#fff' : 'var(--color-text-faint)',
                    fontFamily: 'inherit', fontSize: 11,
                    outline: isToday && !isDone ? '1px solid var(--color-primary)' : 'none',
                  }}>
                  {isDone ? <Icons.Check size={14} stroke="#fff"/> : ''}
                </button>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-faint mono mt-2" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{done} / 7 esta semana</span>
          <span>{Math.round((done / 7) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

window.HabitsScreen = HabitsScreen;

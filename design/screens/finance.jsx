/* global React, Icons, DATA */
const { useState: useStateFin, useMemo: useMemoFin } = React;

const CATEGORY_ICONS = {
  Tech: '💻', Audio: '🎧', Hogar: '🪑', Hobby: '🧩', Viajes: '🗾',
  Libros: '📚', Educación: '🎓', Proyecto: '🚀', Juegos: '🎮',
};

const PRIORITY_COLORS = {
  ALTA:  '#ef4444',
  MEDIA: '#f59e0b',
  BAJA:  '#82828c',
};

const WSTATE_COLORS = {
  DESEANDO:  { bg: 'rgba(130,130,140,0.18)', fg: 'var(--color-text-muted)', label: 'Deseando' },
  COTIZANDO: { bg: 'rgba(245,158,11,0.16)',  fg: '#fbbf24', label: 'Cotizando' },
  AHORRANDO: { bg: 'rgba(99,102,241,0.16)',  fg: 'var(--color-primary)', label: 'Ahorrando' },
  COMPRADO:  { bg: 'rgba(34,197,94,0.16)',   fg: '#86efac', label: 'Comprado' },
};

function FinanceScreen({ onOpenModal, onShowToast }) {
  const [tab, setTab] = useStateFin('wishlist');

  return (
    <div className="page" style={{ maxWidth: 1300 }}>
      <div className="page-header">
        <div>
          <div className="uppercase-tag">Finanzas personales · EUR</div>
          <h1 className="page-title mt-1">Wishlist & gastos</h1>
          <div className="page-subtitle">Cotiza lo que quieres · controla lo que gastas</div>
        </div>
        <div className="flex gap-2">
          {tab === 'wishlist'
            ? <button className="btn btn-primary" onClick={() => onOpenModal('wishitem')}><Icons.Plus size={13}/> Añadir al wishlist</button>
            : <button className="btn btn-primary" onClick={() => onOpenModal('tx')}><Icons.Plus size={13}/> Transacción</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border-soft)',
        marginBottom: 24,
      }}>
        {[
          { id: 'wishlist', label: 'Wishlist · ahorros', count: DATA.wishlist.length, icon: '⭐' },
          { id: 'expenses', label: 'Gastos · presupuestos', count: DATA.expenses.transactions.length, icon: '📊' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', border: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
              color: tab === t.id ? 'var(--color-text)' : 'var(--color-text-muted)',
              borderBottom: '2px solid ' + (tab === t.id ? 'var(--color-primary)' : 'transparent'),
              marginBottom: -1, fontWeight: tab === t.id ? 500 : 400,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
            <span>{t.icon}</span> {t.label}
            <span className="mono text-xs text-faint">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'wishlist' && <WishlistTab onShowToast={onShowToast} onOpenModal={onOpenModal} />}
      {tab === 'expenses' && <ExpensesTab />}
    </div>
  );
}

// ─────────────────────────────────────────────
// WISHLIST TAB
// ─────────────────────────────────────────────
function WishlistTab({ onShowToast, onOpenModal }) {
  const [categoryFilter, setCategoryFilter] = useStateFin(null);
  const [stateFilter, setStateFilter] = useStateFin(null);
  const [q, setQ] = useStateFin('');
  const [selectedPot, setSelectedPot] = useStateFin(null);

  const filtered = useMemoFin(() => {
    let arr = DATA.wishlist;
    if (categoryFilter) arr = arr.filter(i => i.category === categoryFilter);
    if (stateFilter) arr = arr.filter(i => i.state === stateFilter);
    if (selectedPot) {
      const pot = DATA.savingPots.find(p => p.id === selectedPot);
      arr = arr.filter(i => pot.items.includes(i.id));
    }
    if (q) arr = arr.filter(i => i.title.toLowerCase().includes(q.toLowerCase()));
    return arr;
  }, [categoryFilter, stateFilter, q, selectedPot]);

  const categories = [...new Set(DATA.wishlist.map(i => i.category))];
  const totalWish = DATA.wishlist.filter(i => i.state !== 'COMPRADO').reduce((s, i) => s + i.price, 0);
  const totalSaved = DATA.savingPots.reduce((s, p) => s + p.saved, 0);
  const totalGoal = DATA.savingPots.reduce((s, p) => s + p.goal, 0);

  return (
    <div>
      {/* Top stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        <BigStat label="Valor del wishlist" value={`${totalWish.toLocaleString('es-ES')}€`}
          sub={`${DATA.wishlist.filter(i => i.state !== 'COMPRADO').length} ítems pendientes`}
          color="var(--color-primary)" icon={Icons.Star} />
        <BigStat label="Ahorrado en botes" value={`${totalSaved.toLocaleString('es-ES')}€`}
          sub={`${Math.round((totalSaved / totalGoal) * 100)}% del total · ${DATA.savingPots.length} botes activos`}
          color="var(--color-success)" icon={Icons.TrendUp} highlight />
        <BigStat label="Falta por ahorrar" value={`${(totalGoal - totalSaved).toLocaleString('es-ES')}€`}
          sub={`al ritmo actual: ~${Math.ceil((totalGoal - totalSaved) / 750)} meses`}
          color="var(--color-accent)" icon={Icons.Clock} />
      </div>

      {/* Saving pots */}
      <div className="panel" style={{ marginBottom: 22 }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">Saving pots</div>
            <div className="panel-sub">Botes de ahorro · cada ítem se asigna a uno</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-ghost"
              onClick={() => setSelectedPot(null)}
              style={{ color: selectedPot == null ? 'var(--color-primary)' : null }}>
              Ver todos
            </button>
            <button className="btn btn-sm" onClick={() => onOpenModal('pot')}><Icons.Plus size={11}/> Nuevo bote</button>
          </div>
        </div>
        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {DATA.savingPots.map(pot => {
            const pct = (pot.saved / pot.goal) * 100;
            const monthsLeft = Math.ceil((pot.goal - pot.saved) / pot.monthly);
            const active = selectedPot === pot.id;
            return (
              <div key={pot.id}
                onClick={() => setSelectedPot(active ? null : pot.id)}
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid ' + (active ? pot.color : 'var(--color-border-soft)'),
                  borderRadius: 10,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'border-color 120ms',
                  position: 'relative',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: pot.color + '22', display: 'grid', placeItems: 'center', fontSize: 20,
                  }}>{pot.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{pot.name}</div>
                    <div className="mono text-xs text-faint">{pot.items.length} ítems · {pot.monthly}€/mes</div>
                  </div>
                  <span className="mono text-xs" style={{
                    color: pct >= 100 ? 'var(--color-success)' : pot.color,
                    fontWeight: 600,
                  }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--color-background)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: Math.min(pct, 100) + '%', height: '100%',
                    background: pot.color, transition: 'width 400ms',
                  }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'baseline' }}>
                  <span className="mono text-xs">
                    <strong style={{ color: 'var(--color-text)' }}>{pot.saved.toLocaleString('es-ES')}€</strong>
                    <span className="text-faint"> / {pot.goal.toLocaleString('es-ES')}€</span>
                  </span>
                  <span className="text-xs text-faint mono">~{monthsLeft} {monthsLeft === 1 ? 'mes' : 'meses'}</span>
                </div>
                <div className="text-xs text-faint mt-2" style={{ fontStyle: 'italic',
                  display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {pot.note}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="panel" style={{ marginBottom: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Icons.Search size={14} stroke="var(--color-text-faint)" />
        <input className="input" style={{ border: 'none', background: 'transparent', padding: 0, flex: 1, minWidth: 160 }}
          placeholder="Buscar deseo…" value={q} onChange={e => setQ(e.target.value)} />
        <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />
        <span className="uppercase-tag">categoría</span>
        <button onClick={() => setCategoryFilter(null)} className="chip"
          style={{ cursor: 'pointer', background: categoryFilter == null ? 'var(--color-primary-ghost)' : null, color: categoryFilter == null ? 'var(--color-primary)' : null }}>Todas</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c === categoryFilter ? null : c)} className="chip"
            style={{ cursor: 'pointer', background: categoryFilter === c ? 'var(--color-surface-hover)' : null, color: categoryFilter === c ? 'var(--color-text)' : null }}>
            <span>{CATEGORY_ICONS[c] || '·'}</span> {c}
          </button>
        ))}
        <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />
        <span className="uppercase-tag">estado</span>
        {Object.keys(WSTATE_COLORS).map(s => (
          <button key={s} onClick={() => setStateFilter(s === stateFilter ? null : s)} className="chip"
            style={{
              cursor: 'pointer',
              background: stateFilter === s ? WSTATE_COLORS[s].bg : null,
              color: stateFilter === s ? WSTATE_COLORS[s].fg : null,
            }}>{WSTATE_COLORS[s].label}</button>
        ))}
        {selectedPot && (
          <>
            <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />
            <span className="chip" style={{ background: 'var(--color-primary-ghost)', color: 'var(--color-primary)' }}>
              {DATA.savingPots.find(p => p.id === selectedPot).icon} bote: {DATA.savingPots.find(p => p.id === selectedPot).name}
              <button onClick={() => setSelectedPot(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 4 }}>×</button>
            </span>
          </>
        )}
      </div>

      {/* Wishlist grid */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.map(item => (
          <WishItemCard key={item.id} item={item} onShowToast={onShowToast} />
        ))}
      </div>
    </div>
  );
}

function WishItemCard({ item, onShowToast }) {
  const st = WSTATE_COLORS[item.state];
  const pot = DATA.savingPots.find(p => p.items.includes(item.id));
  const c = colorForCategory(item.category);

  return (
    <div className="panel" style={{ padding: 14, display: 'flex', gap: 12 }}>
      {/* Product image placeholder */}
      <div style={{
        width: 80, height: 80, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(135deg, ${c}, ${c}66)`,
        display: 'grid', placeItems: 'center',
        fontSize: 36,
      }}>{CATEGORY_ICONS[item.category] || '⭐'}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{item.title}</div>
          <span style={{
            width: 6, height: 6, borderRadius: 50,
            background: PRIORITY_COLORS[item.priority],
            flexShrink: 0, marginTop: 5,
          }} title={`Prioridad ${item.priority}`} />
        </div>

        <div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 4, color: 'var(--color-text)' }}>
          {item.price.toLocaleString('es-ES')}{item.currency === 'EUR' ? '€' : ' ' + item.currency}
        </div>

        <div className="mono text-xs text-muted mt-1">{item.store}</div>

        {item.notes && (
          <div className="text-xs text-faint mt-2" style={{ fontStyle: 'italic',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.notes}
          </div>
        )}

        <div className="flex gap-1 mt-2" style={{ flexWrap: 'wrap' }}>
          <span className="chip" style={{ background: st.bg, color: st.fg, fontSize: 10 }}>{st.label}</span>
          <span className="chip" style={{ fontSize: 10 }}>{CATEGORY_ICONS[item.category]} {item.category}</span>
          {pot && (
            <span className="chip mono" style={{
              background: pot.color + '22', color: pot.color, fontSize: 10,
            }}>{pot.icon} {pot.name}</span>
          )}
        </div>

        <div className="flex gap-1 mt-3" style={{ alignItems: 'center' }}>
          <button className="btn btn-sm btn-ghost" style={{ padding: '3px 6px' }}
            onClick={() => onShowToast(`Abriendo ${item.url}…`)}>
            <Icons.Link size={11}/> {item.url}
          </button>
          <div style={{ flex: 1 }} />
          {item.state !== 'COMPRADO' && (
            <button className="btn btn-sm btn-primary"
              onClick={() => onShowToast(`✓ "${item.title}" marcado como comprado`)}>
              <Icons.Check size={11}/> Comprado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function colorForCategory(cat) {
  return {
    Tech: '#6366f1', Audio: '#a78bfa', Hogar: '#22c55e', Hobby: '#f59e0b',
    Viajes: '#ec4899', Libros: '#38bdf8', Educación: '#84cc16', Proyecto: '#ef4444', Juegos: '#fbbf24',
  }[cat] || '#82828c';
}

function BigStat({ label, value, color, icon: I, sub, highlight }) {
  return (
    <div className="panel panel-pad" style={{
      position: 'relative', overflow: 'hidden',
      borderLeft: highlight ? '3px solid ' + color : '1px solid var(--color-border-soft)',
    }}>
      <div className="uppercase-tag" style={{ marginBottom: 6 }}>{label}</div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color }}>
        {value}
      </div>
      <div className="text-xs text-muted mono mt-1">
        <I size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/> {sub}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPENSES TAB (the old finance dashboard)
// ─────────────────────────────────────────────
function ExpensesTab() {
  const f = DATA.expenses;
  const donut = useMemoFin(() => {
    const r = 56, cx = 70, cy = 70, stroke = 22;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const segs = f.categories.map((c) => {
      const len = (c.share / 100) * circ;
      const seg = { color: c.color, dash: `${len} ${circ - len}`, offset };
      offset += len;
      return seg;
    });
    return { r, cx, cy, stroke, circ, segs };
  }, []);

  const months = [
    { m: 'Dic', in: 3850, out: 2380 }, { m: 'Ene', in: 4100, out: 2890 },
    { m: 'Feb', in: 3850, out: 2200 }, { m: 'Mar', in: 4280, out: 2950 },
    { m: 'Abr', in: 4150, out: 2303 }, { m: 'May', in: 4280, out: 2615 },
  ];
  const maxAmt = Math.max(...months.flatMap(m => [m.in, m.out]));

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        <BigStat label="Ingresos · mayo" value={`${f.summary.income.toLocaleString('es-ES')}€`} color="var(--color-success)" icon={Icons.ArrowUp} sub="+5,2% vs abril" />
        <BigStat label="Gastos · mayo"   value={`${f.summary.expense.toLocaleString('es-ES')}€`} color="var(--color-danger)"  icon={Icons.ArrowDown} sub="+13,5% vs abril" />
        <BigStat label="Balance"          value={`+${f.summary.balance.toLocaleString('es-ES')}€`} color="var(--color-primary)" icon={Icons.TrendUp}   sub={`+${f.summary.vsLast}€ vs abril · va a saving pots`} highlight />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 18 }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Ingresos vs gastos</div>
              <div className="panel-sub">Últimos 6 meses</div>
            </div>
            <div className="flex gap-3">
              <span className="text-xs"><span className="chip-dot" style={{ background: 'var(--color-success)', display:'inline-block', marginRight: 4 }}/>Ingresos</span>
              <span className="text-xs"><span className="chip-dot" style={{ background: 'var(--color-danger)', display:'inline-block', marginRight: 4 }}/>Gastos</span>
            </div>
          </div>
          <div className="panel-pad" style={{ paddingTop: 24, paddingBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, gap: 18, height: 180, alignItems: 'end' }}>
              {months.map((m, i) => {
                const inH = (m.in / maxAmt) * 160;
                const outH = (m.out / maxAmt) * 160;
                const last = i === months.length - 1;
                return (
                  <div key={m.m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'end', height: 160 }}>
                      <div style={{ width: 12, height: inH, background: 'var(--color-success)', opacity: last ? 1 : 0.6, borderRadius: '2px 2px 0 0' }}/>
                      <div style={{ width: 12, height: outH, background: 'var(--color-danger)', opacity: last ? 1 : 0.6, borderRadius: '2px 2px 0 0' }}/>
                    </div>
                    <div className="mono text-xs text-faint">{m.m}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Gastos por categoría</div>
              <div className="panel-sub">Mayo · 2.615€</div>
            </div>
          </div>
          <div className="panel-pad" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 14, alignItems: 'center' }}>
            <svg viewBox="0 0 140 140" width="140" height="140">
              <circle cx={donut.cx} cy={donut.cy} r={donut.r} fill="none" stroke="var(--color-surface-2)" strokeWidth={donut.stroke}/>
              {donut.segs.map((s, i) => (
                <circle key={i}
                  cx={donut.cx} cy={donut.cy} r={donut.r}
                  fill="none" stroke={s.color} strokeWidth={donut.stroke}
                  strokeDasharray={s.dash}
                  strokeDashoffset={-s.offset}
                  transform={`rotate(-90 ${donut.cx} ${donut.cy})`}
                />
              ))}
              <text x={donut.cx} y={donut.cy - 4} textAnchor="middle" fill="var(--color-text)" fontFamily="var(--font-mono)" fontSize="16" fontWeight="600">2.615€</text>
              <text x={donut.cx} y={donut.cy + 14} textAnchor="middle" fill="var(--color-text-faint)" fontFamily="var(--font-mono)" fontSize="9">gastado</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {f.categories.slice(0, 6).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span className="chip-dot" style={{ background: c.color }}/>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span className="mono text-xs text-muted">{c.amount}€</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Budgets */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">Presupuestos del mes</div>
            <div className="panel-sub">5 categorías con límite</div>
          </div>
          <button className="btn btn-sm btn-ghost">Editar →</button>
        </div>
        <div className="panel-pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {f.budgets.map((b, i) => {
            const pct = (b.spent / b.total) * 100;
            const over = pct > 100;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="chip-dot" style={{ background: b.color }}/>
                    <span style={{ fontSize: 13 }}>{b.name}</span>
                  </div>
                  <span className="mono text-xs" style={{ color: over ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                    {b.spent}€ / {b.total}€
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: Math.min(pct, 100) + '%', height: '100%', background: over ? 'var(--color-danger)' : b.color }}/>
                </div>
                <div className="mono text-xs text-faint mt-1">
                  {over ? `+${(b.spent - b.total).toFixed(0)}€ sobre el límite` : `quedan ${(b.total - b.spent).toFixed(0)}€`} · {Math.round(pct)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Transacciones recientes</div>
            <div className="panel-sub">{f.transactions.length} este mes</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-ghost"><Icons.Filter size={12}/> Filtrar</button>
            <button className="btn btn-sm btn-ghost">Ver todas →</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 100px', padding: '10px 18px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border-soft)' }}>
          <div className="uppercase-tag">Fecha</div>
          <div className="uppercase-tag">Concepto</div>
          <div className="uppercase-tag">Categoría</div>
          <div className="uppercase-tag" style={{ textAlign: 'right' }}>Cantidad</div>
        </div>
        {f.transactions.map((tx, i) => (
          <div key={tx.id} style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 160px 100px',
            padding: '10px 18px', alignItems: 'center',
            borderTop: i > 0 ? '1px solid var(--color-border-soft)' : 'none',
            fontSize: 13,
          }}>
            <span className="mono text-xs text-muted">{tx.date}</span>
            <span>
              {tx.title}
              {tx.tags.length > 0 && (
                <span className="mono text-xs text-faint" style={{ marginLeft: 8 }}>
                  {tx.tags.map(t => `#${t}`).join(' ')}
                </span>
              )}
            </span>
            <span className="text-xs text-muted">{tx.cat}</span>
            <span className="mono" style={{
              textAlign: 'right', fontWeight: 600,
              color: tx.amount > 0 ? 'var(--color-success)' : tx.tags.includes('pot') ? 'var(--color-primary)' : 'var(--color-text)',
            }}>
              {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}€
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// New wishlist item modal
// ─────────────────────────────────────────────
function WishItemDialog({ onClose, onShowToast }) {
  const [title, setTitle] = useStateFin('');
  const [price, setPrice] = useStateFin('');
  const [store, setStore] = useStateFin('');
  const [url, setUrl] = useStateFin('');
  const [category, setCategory] = useStateFin('Tech');
  const [priority, setPriority] = useStateFin('MEDIA');
  const [pot, setPot] = useStateFin('');
  const [notes, setNotes] = useStateFin('');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nuevo deseo</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icons.Close size={14}/></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, marginBottom: 14 }}>
            <div className="img-placeholder" style={{ height: 110, width: 110 }}>imagen</div>
            <div>
              <div className="field" style={{ marginBottom: 8 }}>
                <label>URL de imagen</label>
                <input className="input" placeholder="https://…" />
              </div>
              <div className="field">
                <label>URL del producto</label>
                <input className="input" placeholder="amazon.es / pccomponentes.com…" value={url} onChange={e => setUrl(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="field">
            <label>Título</label>
            <input className="input" autoFocus placeholder="¿Qué quieres?" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Precio</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>€</span>
                <input className="input mono" style={{ paddingLeft: 22 }} type="number" placeholder="0,00" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Tienda</label>
              <input className="input" placeholder="Apple, Amazon, PCComponentes…" value={store} onChange={e => setStore(e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Categoría</label>
              <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                {Object.keys(CATEGORY_ICONS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Prioridad</label>
              <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option>BAJA</option><option>MEDIA</option><option>ALTA</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Asignar a un bote de ahorro (opcional)</label>
            <select className="select" value={pot} onChange={e => setPot(e.target.value)}>
              <option value="">— sin bote (solo cotizar) —</option>
              {DATA.savingPots.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name} · {p.saved}€ / {p.goal}€</option>)}
            </select>
          </div>

          <div className="field">
            <label>Notas</label>
            <textarea className="textarea" placeholder="Detalles, versiones, comparativas…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onShowToast(`✓ "${title || 'Nuevo deseo'}" añadido al wishlist`); onClose(); }}>
            Añadir al wishlist
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// New saving pot modal
// ─────────────────────────────────────────────
function SavingPotDialog({ onClose, onShowToast }) {
  const [name, setName] = useStateFin('');
  const [goal, setGoal] = useStateFin('');
  const [monthly, setMonthly] = useStateFin('');
  const [icon, setIcon] = useStateFin('💰');
  const [color, setColor] = useStateFin('#6366f1');

  const icons = ['💰','🎮','💻','🗾','🪑','📚','🎧','🚗','🏠','✈️'];
  const colors = ['#6366f1','#22c55e','#ec4899','#f59e0b','#38bdf8','#a78bfa','#ef4444','#84cc16'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Crear bote de ahorro</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icons.Close size={14}/></button>
        </div>
        <div className="modal-body">
          <div className="field-row">
            <div className="field">
              <label>Ícono</label>
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                {icons.map(i => (
                  <button key={i} onClick={() => setIcon(i)}
                    style={{
                      width: 32, height: 32, padding: 0, border: 'none', cursor: 'pointer',
                      borderRadius: 6, background: icon === i ? color + '22' : 'var(--color-surface-2)',
                      fontSize: 18,
                      outline: icon === i ? '1px solid ' + color : 'none',
                    }}>{i}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Color</label>
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                {colors.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    style={{
                      width: 26, height: 26, padding: 0, border: 'none', cursor: 'pointer',
                      borderRadius: 6, background: c,
                      outline: color === c ? '2px solid var(--color-text)' : 'none',
                      outlineOffset: 2,
                    }}/>
                ))}
              </div>
            </div>
          </div>
          <div className="field">
            <label>Nombre</label>
            <input className="input" autoFocus placeholder="Ej. Tech upgrade 2026, Viaje a Japón…" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Objetivo total</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>€</span>
                <input className="input mono" style={{ paddingLeft: 22 }} type="number" placeholder="0" value={goal} onChange={e => setGoal(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Aporte mensual</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>€</span>
                <input className="input mono" style={{ paddingLeft: 22 }} type="number" placeholder="0" value={monthly} onChange={e => setMonthly(e.target.value)} />
              </div>
            </div>
          </div>
          {goal && monthly && +goal > 0 && +monthly > 0 && (
            <div className="text-xs text-muted" style={{ padding: 10, background: color + '11', borderRadius: 6 }}>
              Al ritmo de <strong className="mono">{monthly}€/mes</strong> llegarás a la meta en{' '}
              <strong className="mono">~{Math.ceil(+goal / +monthly)} meses</strong>.
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onShowToast(`✓ Bote "${name || 'Nuevo bote'}" creado`); onClose(); }}>
            Crear bote
          </button>
        </div>
      </div>
    </div>
  );
}

window.FinanceScreen = FinanceScreen;
window.WishItemDialog = WishItemDialog;
window.SavingPotDialog = SavingPotDialog;

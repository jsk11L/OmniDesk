/* global React, Icons, DATA */
const { useState: useStateTod } = React;

function TodosScreen({ onOpenModal }) {
  const [items, setItems] = useStateTod(DATA.todos.items);
  const [dragId, setDragId] = useStateTod(null);
  const [overCol, setOverCol] = useStateTod(null);

  const onDragStart = (id) => setDragId(id);
  const onDragOverCol = (e, colId) => {
    e.preventDefault();
    if (colId !== overCol) setOverCol(colId);
  };
  const onDropCol = (e, colId) => {
    e.preventDefault();
    setItems(items.map(it => it.id === dragId ? { ...it, col: colId } : it));
    setDragId(null);
    setOverCol(null);
  };
  const onDragEnd = () => { setDragId(null); setOverCol(null); };

  const itemsByCol = DATA.todos.columns.reduce((m, c) => {
    m[c.id] = items.filter(i => i.col === c.id);
    return m;
  }, {});

  return (
    <div style={{ padding: '20px 24px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <div className="uppercase-tag">Kanban</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h1 className="page-title mt-1">{DATA.todos.name}</h1>
            <span className="mono text-muted text-sm">{items.length} tareas</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm"><Icons.Filter size={12}/> Filtrar</button>
          <button className="btn btn-sm"><Icons.ArrowDown size={12}/> Prioridad</button>
          <button className="btn">+ Columna</button>
          <button className="btn btn-primary" onClick={() => onOpenModal('todo')}><Icons.Plus size={13}/> Nueva tarea</button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${DATA.todos.columns.length}, minmax(280px, 1fr))`,
        gap: 14,
        flex: 1, minHeight: 0,
        paddingBottom: 28,
      }}>
        {DATA.todos.columns.map(col => {
          const colItems = itemsByCol[col.id];
          const isOver = overCol === col.id;
          return (
            <div key={col.id}
              onDragOver={(e) => onDragOverCol(e, col.id)}
              onDrop={(e) => onDropCol(e, col.id)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid ' + (isOver ? 'var(--color-primary)' : 'var(--color-border-soft)'),
                borderRadius: 12,
                display: 'flex', flexDirection: 'column',
                minHeight: 0,
                transition: 'border-color 120ms',
              }}>
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--color-border-soft)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span className="chip-dot" style={{ background: col.color, width: 8, height: 8 }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{col.name}</span>
                <span className="mono text-xs text-faint">{colItems.length}</span>
                <div style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-icon"><Icons.Plus size={13}/></button>
                <button className="btn btn-ghost btn-icon"><Icons.Dots size={14}/></button>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
                {colItems.map(item => (
                  <TodoCard key={item.id} item={item}
                    onDragStart={() => onDragStart(item.id)}
                    onDragEnd={onDragEnd}
                    dragging={dragId === item.id} />
                ))}
                {colItems.length === 0 && (
                  <div className="dot-grid" style={{
                    border: '1px dashed var(--color-border)',
                    borderRadius: 8,
                    minHeight: 80,
                    display: 'grid', placeItems: 'center',
                    color: 'var(--color-text-faint)', fontSize: 11,
                  }}>arrastra aquí</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TodoCard({ item, onDragStart, onDragEnd, dragging }) {
  const prioColor = {
    'BAJA': 'var(--color-text-faint)',
    'MEDIA': 'var(--color-accent)',
    'ALTA': 'var(--color-danger)',
    'URGENTE': 'var(--color-danger)',
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 8,
        padding: 10,
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
        boxShadow: dragging ? 'none' : '0 1px 0 rgba(0,0,0,0.2)',
        transition: 'opacity 120ms',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <span className="chip-dot" style={{ background: prioColor[item.priority], marginTop: 6, flexShrink: 0 }} />
        <div style={{ fontSize: 13, lineHeight: 1.4, fontWeight: 500 }}>{item.title}</div>
      </div>
      <div className="flex gap-1 mt-2" style={{ flexWrap: 'wrap' }}>
        {item.tags.map(t => <span key={t} className="chip" style={{ fontSize: 10 }}>#{t}</span>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border-soft)' }}>
        <span className="mono text-xs" style={{ color: prioColor[item.priority], fontWeight: 600 }}>
          {item.priority}
        </span>
        <span className="mono text-xs text-faint">
          <Icons.Clock size={10}/> {item.due}
        </span>
      </div>
    </div>
  );
}

window.TodosScreen = TodosScreen;

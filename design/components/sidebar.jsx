/* global React, Icons, DATA */
const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
function Sidebar({ current, onNav, onOpenPalette, onLogout, unreadCount }) {
  const nav = [
    { id: 'dashboard',     label: 'Dashboard',     icon: Icons.Dashboard },
    { id: 'calendar',      label: 'Calendario',    icon: Icons.Calendar },
    { id: 'lists',         label: 'Listas',        icon: Icons.List, count: DATA.lists.length },
    { id: 'notes',         label: 'Notas',         icon: Icons.Note, count: DATA.notes.length },
    { id: 'todos',         label: 'TO-DO',         icon: Icons.Kanban, count: DATA.todos.items.length },
    { id: 'habits',        label: 'Hábitos',       icon: Icons.Habit, count: DATA.habits.length },
    { id: 'finance',       label: 'Finanzas',      icon: Icons.Finance },
  ];
  const footer = [
    { id: 'notifications', label: 'Notificaciones', icon: Icons.Bell, badge: unreadCount },
    { id: 'settings',      label: 'Ajustes',        icon: Icons.Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">O</div>
        <div className="sidebar-title">OmniDesk</div>
        <span className="text-faint mono text-xs" style={{ marginLeft: 'auto' }}>v2.1</span>
      </div>

      <div className="sidebar-search" onClick={onOpenPalette}>
        <Icons.Search size={14} />
        <span className="sidebar-search-text">Buscar o ejecutar…</span>
        <span className="kbd">⌘K</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Espacio</div>
        {nav.map(item => (
          <div
            key={item.id}
            className={`nav-item ${current === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <item.icon />
            <span>{item.label}</span>
            {item.count != null && <span className="nav-item-count mono">{item.count}</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Favoritos</div>
        <div className="nav-item" onClick={() => onNav('lists')}><span style={{fontSize:13}}>🎮</span><span>Videojuegos</span></div>
        <div className="nav-item" onClick={() => onNav('notes')}><span style={{fontSize:13}}>🏛</span><span>Arquitectura v2</span></div>
        <div className="nav-item" onClick={() => onNav('todos')}><span style={{fontSize:13}}>📋</span><span>Proyecto OmniDesk</span></div>
      </div>

      <div className="sidebar-footer">
        {footer.map(item => (
          <div
            key={item.id}
            className={`nav-item ${current === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <item.icon />
            <span>{item.label}</span>
            {item.badge ? <span className="nav-item-count mono" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{item.badge}</span> : null}
          </div>
        ))}
        <div className="user-pill" style={{ marginTop: 6 }} onClick={onLogout} title="Cerrar sesión · volver a la landing">
          <div className="user-avatar">{DATA.user.initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{DATA.user.name}</div>
            <div className="user-status">en línea · pro</div>
          </div>
          <span className="text-faint mono text-xs">↩</span>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// TopBar — breadcrumb + page actions
// ─────────────────────────────────────────────
function TopBar({ crumbs, actions, onOpenPalette }) {
  return (
    <div className="topbar">
      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'current' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-action" onClick={onOpenPalette}>
        <Icons.Search size={13} /> <span>Buscar</span> <span className="kbd" style={{ marginLeft: 4 }}>⌘K</span>
      </div>
      {actions}
    </div>
  );
}

// ─────────────────────────────────────────────
// Command palette
// ─────────────────────────────────────────────
function CommandPalette({ open, onClose, onNav, onAction }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ(''); setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const groups = useMemo(() => {
    const all = [
      { group: 'Acciones', icon: Icons.Plus, items: [
        { id: 'a-event', label: 'Nuevo evento de calendario',  hint: 'N E', action: () => onAction('new-event') },
        { id: 'a-note',  label: 'Nueva nota',                 hint: 'N N', action: () => onAction('new-note') },
        { id: 'a-todo',  label: 'Nueva tarea',                hint: 'N T', action: () => onAction('new-todo') },
        { id: 'a-tx',    label: 'Registrar transacción',      hint: 'N $', action: () => onAction('new-tx') },
        { id: 'a-list',  label: 'Crear lista',                hint: 'N L', action: () => onAction('new-list') },
      ]},
      { group: 'Ir a', icon: Icons.Chevron, items: [
        { id: 'g-dash', label: 'Dashboard',     hint: 'G D', action: () => onNav('dashboard') },
        { id: 'g-cal',  label: 'Calendario',    hint: 'G C', action: () => onNav('calendar') },
        { id: 'g-lis',  label: 'Listas',        hint: 'G L', action: () => onNav('lists') },
        { id: 'g-not',  label: 'Notas',         hint: 'G N', action: () => onNav('notes') },
        { id: 'g-tod',  label: 'TO-DO Kanban',  hint: 'G T', action: () => onNav('todos') },
        { id: 'g-hab',  label: 'Hábitos',       hint: 'G H', action: () => onNav('habits') },
        { id: 'g-fin',  label: 'Finanzas',      hint: 'G F', action: () => onNav('finance') },
        { id: 'g-set',  label: 'Ajustes · Temas', hint: 'G S', action: () => onNav('settings') },
      ]},
      { group: 'Notas', icon: Icons.Note, items: DATA.notes.slice(0, 4).map(n => ({
        id: 'n-' + n.id, label: n.title, hint: n.updated, action: () => onNav('notes')
      }))},
      { group: 'Tareas recientes', icon: Icons.Kanban, items: DATA.todos.items.slice(0, 4).map(t => ({
        id: 't-' + t.id, label: t.title, hint: t.priority, action: () => onNav('todos')
      }))},
    ];

    if (!q.trim()) return all;
    const term = q.toLowerCase();
    return all
      .map(g => ({ ...g, items: g.items.filter(it => it.label.toLowerCase().includes(term)) }))
      .filter(g => g.items.length > 0);
  }, [q, onAction, onNav]);

  const flat = groups.flatMap(g => g.items);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, flat.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); flat[idx]?.action(); onClose(); }
    else if (e.key === 'Escape') { onClose(); }
  };

  if (!open) return null;

  let counter = -1;
  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <div className="palette-input-wrap">
          <Icons.Search size={16} />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Escribe un comando o busca…"
            value={q}
            onChange={e => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={handleKey}
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="palette-list">
          {groups.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-faint)', fontSize: 13 }}>
              Sin resultados para “{q}”
            </div>
          )}
          {groups.map(g => (
            <div key={g.group}>
              <div className="palette-group-label">{g.group}</div>
              {g.items.map(it => {
                counter += 1;
                const active = counter === idx;
                const Icon = g.icon;
                return (
                  <div
                    key={it.id}
                    className={`palette-row ${active ? 'active' : ''}`}
                    onMouseEnter={() => setIdx(counter)}
                    onClick={() => { it.action(); onClose(); }}
                  >
                    <Icon size={14} />
                    <span>{it.label}</span>
                    <span className="row-meta mono">{it.hint}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-footer">
          <span><span className="kbd">↑</span><span className="kbd" style={{ marginLeft: 4 }}>↓</span> navegar</span>
          <span><span className="kbd">↵</span> seleccionar</span>
          <span><span className="kbd">esc</span> cerrar</span>
        </div>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.TopBar = TopBar;
window.CommandPalette = CommandPalette;

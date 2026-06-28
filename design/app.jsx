/* global React, ReactDOM, DATA,
   Landing, AuthDialog,
   Sidebar, TopBar, CommandPalette,
   Dashboard, CalendarScreen, ListsScreen, NotesScreen, TodosScreen,
   FinanceScreen, HabitsScreen, NotificationsScreen, SettingsScreen,
   EventDialog, ListItemDialog, TransactionDialog, TodoDialog,
   WishItemDialog, SavingPotDialog,
   useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakSelect, Icons */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "th-obsidian",
  "primary": "#6366f1",
  "accent": "#f59e0b",
  "fontFamily": "inter",
  "radius": "soft"
}/*EDITMODE-END*/;

const THEME_PRESETS = {
  'th-obsidian': {
    bg: '#0b0b0d', surface: '#131316', surface2: '#17171c', surfaceHover: '#1d1d22',
    border: '#26262d', borderSoft: '#1c1c22', text: '#e8e8ec', textMuted: '#82828c', textFaint: '#5a5a63',
  },
  'th-notion': {
    bg: '#fbfaf8', surface: '#ffffff', surface2: '#f5f3ef', surfaceHover: '#efece6',
    border: '#e3dfd8', borderSoft: '#eeebe5', text: '#2d2d2d', textMuted: '#6c6c6c', textFaint: '#a09c95',
  },
  'th-midnight': {
    bg: '#0d1117', surface: '#161b22', surface2: '#1a212a', surfaceHover: '#222a34',
    border: '#2a3340', borderSoft: '#1e2530', text: '#e6edf3', textMuted: '#8b98a5', textFaint: '#5d6975',
  },
  'th-forest': {
    bg: '#0f1a0f', surface: '#172217', surface2: '#1d2a1d', surfaceHover: '#243124',
    border: '#2d3a2d', borderSoft: '#1f2b1f', text: '#dfe9df', textMuted: '#8a988a', textFaint: '#5d6a5d',
  },
  'th-sunset': {
    bg: '#1a0f00', surface: '#241606', surface2: '#2d1d0c', surfaceHover: '#382514',
    border: '#3d2a18', borderSoft: '#2a1c0c', text: '#f0e6d8', textMuted: '#a89880', textFaint: '#7a6c55',
  },
};

const FONT_FAMILIES = {
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  geist: "'Geist', 'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
  serif: "'Newsreader', Georgia, serif",
};

const RADII = { sharp: '2px', soft: '8px', round: '14px' };

function applyTheme(t) {
  const preset = THEME_PRESETS[t.theme] || THEME_PRESETS['th-obsidian'];
  const r = document.documentElement.style;
  r.setProperty('--color-background', preset.bg);
  r.setProperty('--color-surface', preset.surface);
  r.setProperty('--color-surface-2', preset.surface2);
  r.setProperty('--color-surface-hover', preset.surfaceHover);
  r.setProperty('--color-border', preset.border);
  r.setProperty('--color-border-soft', preset.borderSoft);
  r.setProperty('--color-text', preset.text);
  r.setProperty('--color-text-muted', preset.textMuted);
  r.setProperty('--color-text-faint', preset.textFaint);
  r.setProperty('--color-primary', t.primary);
  r.setProperty('--color-primary-soft', shade(t.primary, -10));
  r.setProperty('--color-primary-ghost', t.primary + '22');
  r.setProperty('--color-accent', t.accent);
  r.setProperty('--font-sans', FONT_FAMILIES[t.fontFamily] || FONT_FAMILIES.inter);
  r.setProperty('--radius', RADII[t.radius] || RADII.soft);
  r.setProperty('--radius-sm', RADII[t.radius] === '2px' ? '2px' : RADII[t.radius] === '14px' ? '10px' : '6px');
  r.setProperty('--radius-lg', RADII[t.radius] === '2px' ? '3px' : RADII[t.radius] === '14px' ? '20px' : '12px');
}

function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const f = pct / 100;
  r = Math.max(0, Math.min(255, Math.round(r + 255 * f)));
  g = Math.max(0, Math.min(255, Math.round(g + 255 * f)));
  b = Math.max(0, Math.min(255, Math.round(b + 255 * f)));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAKS);
  const [route, setRoute] = useStateApp('landing'); // start at landing
  const [paletteOpen, setPaletteOpen] = useStateApp(false);
  const [modal, setModal] = useStateApp(null);
  const [authMode, setAuthMode] = useStateApp(null); // 'login' | 'register'
  const [toast, setToast] = useStateApp(null);
  const [, forceTick] = useStateApp(0);

  useEffectApp(() => { applyTheme(tweaks); }, [tweaks]);

  // Cmd+K only in app
  useEffectApp(() => {
    const onKey = (e) => {
      if (route === 'landing') return;
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [route]);

  // Toast auto-dismiss
  useEffectApp(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const onShowToast = (m) => setToast(m);

  // Data mutators (live update of DATA + force re-render)
  const completeGame = (backlogId, payload) => {
    const game = DATA.backlog.find(g => g.id === backlogId);
    if (!game) return;
    DATA.backlog = DATA.backlog.filter(g => g.id !== backlogId);
    DATA.completed.unshift({
      id: 'c-' + Date.now(),
      title: game.title,
      platform: game.platform,
      year: payload.year,
      month: payload.month,
      state: payload.state,
      hours: payload.hours,
      rating: payload.rating,
      tags: ['Recién completado'],
    });
    // Update lists counts
    DATA.lists = DATA.lists.map(l => {
      if (l.id === 'l-games-done') return { ...l, count: DATA.completed.length };
      if (l.id === 'l-games-back') return { ...l, count: DATA.backlog.length };
      return l;
    });
    forceTick(t => t + 1);
  };

  const moveBacklogStatus = (id, newStatus) => {
    DATA.backlog = DATA.backlog.map(g => g.id === id ? { ...g, status: newStatus } : g);
    forceTick(t => t + 1);
  };

  // Landing flow
  if (route === 'landing') {
    return (
      <>
        <Landing
          onEnter={() => setRoute('dashboard')}
          onAuth={(mode) => setAuthMode(mode)}
        />
        {authMode && (
          <AuthDialog
            mode={authMode}
            onClose={() => setAuthMode(null)}
            onSwitch={(m) => setAuthMode(m)}
            onAuth={() => { setAuthMode(null); setRoute('dashboard'); onShowToast('¡Bienvenido, Daniel!'); }}
          />
        )}

        <TweaksPanel title="Tweaks">
          <TweakSection label="Tema">
            <TweakSelect label="Preset" value={tweaks.theme}
              options={DATA.themes.map(t => ({ value: t.id, label: t.name }))}
              onChange={(v) => setTweak('theme', v)}/>
            <TweakColor label="Primario" value={tweaks.primary}
              options={['#6366f1','#22c55e','#ec4899','#f59e0b','#38bdf8']}
              onChange={(v) => setTweak('primary', v)}/>
            <TweakColor label="Acento" value={tweaks.accent}
              options={['#f59e0b','#a78bfa','#22c55e','#38bdf8','#ec4899']}
              onChange={(v) => setTweak('accent', v)}/>
          </TweakSection>
          <TweakSection label="Tipografía">
            <TweakSelect label="Familia" value={tweaks.fontFamily}
              options={[
                { value: 'inter', label: 'Inter' },
                { value: 'geist', label: 'Geist' },
                { value: 'mono', label: 'JetBrains Mono' },
                { value: 'serif', label: 'Newsreader' },
              ]}
              onChange={(v) => setTweak('fontFamily', v)}/>
            <TweakRadio label="Radio" value={tweaks.radius}
              options={[
                { value: 'sharp', label: 'Sharp' },
                { value: 'soft', label: 'Soft' },
                { value: 'round', label: 'Round' },
              ]}
              onChange={(v) => setTweak('radius', v)}/>
          </TweakSection>
        </TweaksPanel>

        {toast && <div className="toast"><span className="dot"/><span>{toast}</span></div>}
      </>
    );
  }

  // ─────────────────────────────────────────────
  // App shell
  // ─────────────────────────────────────────────
  const crumbsByRoute = {
    dashboard: ['Daniel R.', 'Dashboard'],
    calendar: ['Daniel R.', 'Calendario'],
    lists: ['Daniel R.', 'Listas'],
    notes: ['Daniel R.', 'Notas'],
    todos: ['Daniel R.', 'TO-DO', 'Proyecto OmniDesk'],
    habits: ['Daniel R.', 'Hábitos'],
    finance: ['Daniel R.', 'Finanzas'],
    notifications: ['Daniel R.', 'Notificaciones'],
    settings: ['Daniel R.', 'Ajustes'],
  };

  const openModal = (kind) => setModal(kind);
  const closeModal = () => setModal(null);

  const onAction = (kind) => {
    if (kind === 'new-event') openModal('event');
    if (kind === 'new-note') { setRoute('notes'); onShowToast('Nueva nota lista'); }
    if (kind === 'new-todo') openModal('todo');
    if (kind === 'new-tx') openModal('tx');
    if (kind === 'new-list') setRoute('lists');
    if (kind === 'new-wish') openModal('wishitem');
  };

  const unread = DATA.notifications.inbox.filter(i => !i.read).length;

  const screen = (() => {
    switch (route) {
      case 'dashboard': return <Dashboard onNav={setRoute} onOpenModal={openModal}/>;
      case 'calendar': return <CalendarScreen onOpenModal={openModal}/>;
      case 'lists': return <ListsScreen onOpenModal={openModal} completeGame={completeGame} moveBacklogStatus={moveBacklogStatus} onShowToast={onShowToast}/>;
      case 'notes': return <NotesScreen/>;
      case 'todos': return <TodosScreen onOpenModal={openModal}/>;
      case 'finance': return <FinanceScreen onOpenModal={openModal} onShowToast={onShowToast}/>;
      case 'habits': return <HabitsScreen/>;
      case 'notifications': return <NotificationsScreen onShowToast={onShowToast}/>;
      case 'settings': return <SettingsScreen tweaks={tweaks} setTweak={setTweak}/>;
      default: return null;
    }
  })();

  return (
    <div className="app-shell">
      <Sidebar
        current={route}
        onNav={setRoute}
        onOpenPalette={() => setPaletteOpen(true)}
        onLogout={() => setRoute('landing')}
        unreadCount={unread}
      />
      <div className="main">
        <TopBar
          crumbs={crumbsByRoute[route]}
          onOpenPalette={() => setPaletteOpen(true)}
          actions={
            <button className="topbar-action" onClick={() => setRoute('notifications')}>
              <Icons.Bell size={13}/> {unread > 0 && <span style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 8, padding: '0 5px', fontSize: 10, fontWeight: 600 }}>{unread}</span>}
            </button>
          }
        />
        <div className="content">{screen}</div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNav={setRoute}
        onAction={onAction}
      />

      {modal === 'event'    && <EventDialog onClose={closeModal} onSave={() => onShowToast('✓ Evento creado')}/>}
      {modal === 'item'     && <ListItemDialog onClose={closeModal}/>}
      {modal === 'tx'       && <TransactionDialog onClose={closeModal}/>}
      {modal === 'todo'     && <TodoDialog onClose={closeModal}/>}
      {modal === 'wishitem' && <WishItemDialog onClose={closeModal} onShowToast={onShowToast}/>}
      {modal === 'pot'      && <SavingPotDialog onClose={closeModal} onShowToast={onShowToast}/>}

      {toast && (
        <div className="toast">
          <span className="dot"/>
          <span>{toast}</span>
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tema">
          <TweakSelect label="Preset" value={tweaks.theme}
            options={DATA.themes.map(t => ({ value: t.id, label: t.name }))}
            onChange={(v) => setTweak('theme', v)}/>
          <TweakColor label="Primario" value={tweaks.primary}
            options={['#6366f1','#22c55e','#ec4899','#f59e0b','#38bdf8']}
            onChange={(v) => setTweak('primary', v)}/>
          <TweakColor label="Acento" value={tweaks.accent}
            options={['#f59e0b','#a78bfa','#22c55e','#38bdf8','#ec4899']}
            onChange={(v) => setTweak('accent', v)}/>
        </TweakSection>
        <TweakSection label="Tipografía">
          <TweakSelect label="Familia" value={tweaks.fontFamily}
            options={[
              { value: 'inter', label: 'Inter' },
              { value: 'geist', label: 'Geist' },
              { value: 'mono', label: 'JetBrains Mono' },
              { value: 'serif', label: 'Newsreader' },
            ]}
            onChange={(v) => setTweak('fontFamily', v)}/>
          <TweakRadio label="Radio" value={tweaks.radius}
            options={[
              { value: 'sharp', label: 'Sharp' },
              { value: 'soft', label: 'Soft' },
              { value: 'round', label: 'Round' },
            ]}
            onChange={(v) => setTweak('radius', v)}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

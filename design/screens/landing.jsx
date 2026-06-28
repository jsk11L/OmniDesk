/* global React, Icons, DATA */
const { useState: useStateLand } = React;

function Landing({ onEnter, onAuth }) {
  return (
    <div className="landing">
      <LandingNav onAuth={onAuth} onEnter={onEnter} />
      <Hero onEnter={onEnter} />
      <Features />
      <ScreenshotShowcase />
      <Pricing onEnter={onEnter} />
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────
function LandingNav({ onAuth, onEnter }) {
  return (
    <div className="land-nav">
      <div className="land-nav-inner">
        <div className="land-logo">
          <div className="sidebar-logo" style={{ width: 28, height: 28 }}>O</div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>OmniDesk</span>
          <span className="chip mono" style={{ fontSize: 9, padding: '1px 6px', marginLeft: 4 }}>v2.1 · self-hosted</span>
        </div>
        <div className="land-nav-links">
          <a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector('#features').scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
          <a href="#demo" onClick={(e) => { e.preventDefault(); document.querySelector('#demo').scrollIntoView({ behavior: 'smooth' }); }}>Demo</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); document.querySelector('#pricing').scrollIntoView({ behavior: 'smooth' }); }}>Pricing</a>
          <a href="https://github.com" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🐙</span> GitHub
          </a>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => onAuth('login')}>Iniciar sesión</button>
          <button className="btn btn-primary" onClick={() => onAuth('register')}>Crear cuenta</button>
        </div>
      </div>
    </div>
  );
}

function Hero({ onEnter }) {
  return (
    <section className="land-hero">
      <div className="land-container">
        <div className="land-hero-grid">
          <div>
            <div className="uppercase-tag mb-3" style={{ color: 'var(--color-primary)' }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 50, background: 'var(--color-success)', marginRight: 8, verticalAlign: 'middle' }}/>
              v2.1 · publicada 12 mayo 2026
            </div>
            <h1 className="land-h1">
              Tu segundo cerebro,<br/>
              <span style={{ color: 'var(--color-primary)' }}>en tu propio servidor</span>.
            </h1>
            <p className="land-lead">
              Calendario, listas, notas, tareas, hábitos y wishlist en una sola app.
              Diseñada para uso personal · sin ads, sin trackers, sin "premium feature".
              <strong style={{ color: 'var(--color-text)' }}> Todo el código es tuyo.</strong>
            </p>
            <div className="flex gap-2 mt-6" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 14 }} onClick={onEnter}>
                Probar la demo <span style={{ marginLeft: 4 }}>→</span>
              </button>
              <button className="btn" style={{ padding: '10px 18px', fontSize: 14 }}>
                <span style={{ marginRight: 4 }}>🐙</span> Star en GitHub · 1,8k
              </button>
            </div>
            <div className="mt-6 flex gap-4 text-xs text-faint mono" style={{ flexWrap: 'wrap' }}>
              <span>✓ Self-hosted</span>
              <span>✓ AGPL-3.0</span>
              <span>✓ Docker compose</span>
              <span>✓ PWA · funciona offline</span>
            </div>
          </div>

          {/* App preview */}
          <div className="land-preview-wrap">
            <FakeAppPreview />
          </div>
        </div>
      </div>

      {/* Bg dots */}
      <div className="land-hero-bg"/>
    </section>
  );
}

function FakeAppPreview() {
  return (
    <div className="land-app-preview">
      <div className="land-app-chrome">
        <span style={{ background: '#ef4444', width: 10, height: 10, borderRadius: 50 }}/>
        <span style={{ background: '#f59e0b', width: 10, height: 10, borderRadius: 50 }}/>
        <span style={{ background: '#22c55e', width: 10, height: 10, borderRadius: 50 }}/>
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>omnidesk.app · dashboard</span>
      </div>
      <div className="land-app-body">
        {/* Mini sidebar */}
        <div className="land-app-side">
          {['Dashboard','Calendario','Listas','Notas','TO-DO','Hábitos','Finanzas'].map((n, i) => (
            <div key={n} style={{
              padding: '6px 8px', fontSize: 11, borderRadius: 5,
              color: i === 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
              background: i === 0 ? 'var(--color-surface-hover)' : 'transparent',
              borderLeft: i === 0 ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: 2,
            }}>{n}</div>
          ))}
        </div>
        {/* Mini main */}
        <div className="land-app-main">
          <div className="uppercase-tag" style={{ fontSize: 8 }}>SÁBADO · 16 MAYO</div>
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2, marginBottom: 12 }}>Buenos días, Daniel.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {[
              { label: 'Balance', value: '+1.665€', col: 'var(--color-success)' },
              { label: 'Racha mejor', value: '22d', col: 'var(--color-accent)' },
              { label: 'Tareas hoy', value: '3', col: 'var(--color-primary)' },
              { label: 'Eventos', value: '6', col: 'var(--color-text)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--color-surface-2)', padding: 8, borderRadius: 5, border: '1px solid var(--color-border-soft)' }}>
                <div style={{ fontSize: 8, color: 'var(--color-text-faint)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>{s.label.toUpperCase()}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: s.col, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: 8, background: 'var(--color-surface-2)', borderRadius: 5, border: '1px solid var(--color-border-soft)' }}>
            <div style={{ fontSize: 9, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>PRÓXIMO</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
              <span style={{ width: 3, height: 18, background: '#6366f1', borderRadius: 3 }}/>
              <div>
                <div style={{ fontSize: 11 }}>Standup semanal</div>
                <div style={{ fontSize: 9, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>L 09:30</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
function Features() {
  const features = [
    { icon: Icons.Calendar,  title: 'Calendario',   text: 'Mes, semana, día y lista. Drag-drop, eventos con color y notificaciones programadas.' },
    { icon: Icons.List,      title: 'Listas',       text: 'Bibliotecas con campos personalizados. Grid · Tabla · Galería · Lista. Plantillas para juegos, libros y películas.' },
    { icon: Icons.Note,      title: 'Notas',        text: 'Editor TipTap con bloques, código, citas y portada. Auto-guardado e historial.' },
    { icon: Icons.Kanban,    title: 'TO-DO Kanban', text: 'Columnas configurables, drag-drop, prioridades y fechas límite.' },
    { icon: Icons.Habit,     title: 'Hábitos',      text: 'Heatmap anual estilo GitHub. Rachas, metas semanales y recordatorios.' },
    { icon: Icons.Finance,   title: 'Wishlist',     text: 'Saving pots con barra de progreso. Cotiza objetos y mira cuándo te los puedes permitir.' },
    { icon: Icons.Bell,      title: 'Notificaciones',text: 'In-app, push del navegador y email. Cron visual para recurrentes.' },
    { icon: Icons.Settings,  title: 'Temas',        text: '5 presets incluidos + editor de colores, tipografía y radio. Todo cambia en vivo.' },
  ];
  return (
    <section className="land-section" id="features">
      <div className="land-container">
        <div className="uppercase-tag" style={{ color: 'var(--color-primary)' }}>todo lo que necesitas</div>
        <h2 className="land-h2">Una sola app · ocho herramientas</h2>
        <p className="land-sub">Inspirada en lo bueno de Notion y Obsidian. Hecha para tu día a día, no para vender enterprise.</p>
        <div className="land-features">
          {features.map(f => (
            <div key={f.title} className="land-feature">
              <div className="land-feature-icon"><f.icon size={18} stroke="var(--color-primary)"/></div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div className="text-sm text-muted" style={{ lineHeight: 1.55 }}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
function ScreenshotShowcase() {
  const [tab, setTab] = useStateLand('calendar');
  const tabs = [
    { id: 'calendar', label: 'Calendario' },
    { id: 'lists',    label: 'Listas' },
    { id: 'notes',    label: 'Notas' },
    { id: 'wishlist', label: 'Wishlist' },
  ];
  return (
    <section className="land-section" id="demo" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border-soft)', borderBottom: '1px solid var(--color-border-soft)' }}>
      <div className="land-container">
        <div className="uppercase-tag" style={{ color: 'var(--color-primary)' }}>en acción</div>
        <h2 className="land-h2">Mira cómo se siente</h2>
        <p className="land-sub">Cada pantalla está pensada para densidad de información sin renunciar a la respiración. Esto es real, no mockup.</p>

        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--color-background)', borderRadius: 8, border: '1px solid var(--color-border)', width: 'fit-content', margin: '24px auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: tab === t.id ? 'var(--color-surface-hover)' : 'transparent',
                color: tab === t.id ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontSize: 13, fontFamily: 'inherit',
              }}>{t.label}</button>
          ))}
        </div>

        <div className="land-showcase">
          {tab === 'calendar' && <MiniCalendarShot />}
          {tab === 'lists' && <MiniListsShot />}
          {tab === 'notes' && <MiniNoteShot />}
          {tab === 'wishlist' && <MiniWishlistShot />}
        </div>
      </div>
    </section>
  );
}

function ShotShell({ children, label }) {
  return (
    <div className="land-shot">
      <div className="land-app-chrome">
        <span style={{ background: '#ef4444', width: 10, height: 10, borderRadius: 50 }}/>
        <span style={{ background: '#f59e0b', width: 10, height: 10, borderRadius: 50 }}/>
        <span style={{ background: '#22c55e', width: 10, height: 10, borderRadius: 50 }}/>
        <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-faint)', marginLeft: 8 }}>omnidesk.app · {label}</span>
      </div>
      <div style={{ padding: 24, minHeight: 380, background: 'var(--color-background)' }}>{children}</div>
    </div>
  );
}

function MiniCalendarShot() {
  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = i - 4 + 1; return d >= 1 && d <= 31 ? d : null;
  });
  const events = {
    16: [{ t: 'Silksong', c: '#a78bfa' }],
    18: [{ t: 'Standup', c: '#6366f1' }, { t: 'Gym', c: '#f59e0b' }],
    19: [{ t: '1:1 Marta', c: '#22c55e' }],
    21: [{ t: 'Deploy', c: '#ef4444' }],
    22: [{ t: 'Cena Ana', c: '#ec4899' }],
    25: [{ t: 'Médico', c: '#22c55e' }],
  };
  return (
    <ShotShell label="calendario">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {['L','M','X','J','V','S','D'].map(d => (
          <div key={d} className="mono text-xs text-faint" style={{ padding: 6, textAlign: 'center' }}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div key={i} style={{
            minHeight: 50, padding: 4,
            background: d ? 'var(--color-surface)' : 'transparent',
            border: '1px solid var(--color-border-soft)', borderRadius: 4,
          }}>
            <div className="mono text-xs" style={{
              fontWeight: d === 16 ? 700 : 500,
              color: d === 16 ? 'var(--color-primary)' : 'var(--color-text)',
            }}>{d || ''}</div>
            {d && events[d] && events[d].map((e, j) => (
              <div key={j} style={{
                fontSize: 9, marginTop: 2, padding: '1px 4px',
                background: e.c + '22', color: e.c, borderRadius: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{e.t}</div>
            ))}
          </div>
        ))}
      </div>
    </ShotShell>
  );
}

function MiniListsShot() {
  const games = DATA.completed.slice(0, 8);
  return (
    <ShotShell label="listas · videojuegos completados">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {games.map(g => {
          const palette = ['#6366f1','#22c55e','#f59e0b','#ec4899','#38bdf8','#a78bfa','#ef4444','#84cc16'];
          const h = g.title.charCodeAt(0) % palette.length;
          const c = palette[h];
          return (
            <div key={g.id} style={{ background: 'var(--color-surface)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--color-border-soft)' }}>
              <div style={{
                height: 80,
                background: `linear-gradient(135deg, ${c}, ${c}66)`,
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
              }}>{g.title.charAt(0)}</div>
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                <div className="mono text-xs text-faint">{g.platform} · {g.year}</div>
              </div>
            </div>
          );
        })}
      </div>
    </ShotShell>
  );
}

function MiniNoteShot() {
  return (
    <ShotShell label="notas">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>arquitectura · proyecto</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '6px 0 14px' }}>Arquitectura · OmniDesk v2</h1>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Después del incidente del 13 de mayo conviene replantear el módulo de notificaciones. El scheduler actual corre dentro del proceso principal del API y, ante un spike de eventos recurrentes, bloquea las peticiones del usuario.
        </p>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '14px 0 8px' }}>Propuesta</h2>
        <ul style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 20, color: 'var(--color-text)' }}>
          <li>Extraer el scheduler a un worker Node.js dedicado.</li>
          <li>Cola Redis (BullMQ) para encolar disparos individuales.</li>
          <li>Backpressure si la cola supera 10k eventos.</li>
        </ul>
        <pre className="mono" style={{
          background: 'var(--color-surface-2)', borderRadius: 4, padding: 10,
          fontSize: 11, marginTop: 12, border: '1px solid var(--color-border-soft)',
        }}>{'await queue.add(\'fire\', { configId });'}</pre>
      </div>
    </ShotShell>
  );
}

function MiniWishlistShot() {
  const pot = DATA.savingPots[1];
  const pct = (pot.saved / pot.goal) * 100;
  return (
    <ShotShell label="wishlist · saving pots">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {DATA.savingPots.map(p => {
          const pp = (p.saved / p.goal) * 100;
          return (
            <div key={p.id} style={{ background: 'var(--color-surface)', borderRadius: 6, padding: 12, border: '1px solid var(--color-border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                  <div className="mono text-xs text-faint">{p.saved}€ / {p.goal}€</div>
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--color-surface-2)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: pp + '%', height: '100%', background: p.color }}/>
              </div>
            </div>
          );
        })}
      </div>
    </ShotShell>
  );
}

// ─────────────────────────────────────────────
function Pricing({ onEnter }) {
  return (
    <section className="land-section" id="pricing">
      <div className="land-container">
        <div className="uppercase-tag" style={{ color: 'var(--color-primary)' }}>pricing</div>
        <h2 className="land-h2">Gratis. Siempre. En serio.</h2>
        <p className="land-sub">Cero ads, cero trackers, cero "premium feature". Si te gusta, podés apoyar el proyecto con una donación.</p>

        <div className="land-pricing">
          <div className="land-price-card">
            <div className="uppercase-tag">Self-hosted</div>
            <div className="land-price">0€</div>
            <div className="text-xs text-muted mb-3 mono">para siempre · AGPL-3.0</div>
            <ul className="land-features-list">
              <li>✓ Todo el código en GitHub</li>
              <li>✓ Docker compose listo</li>
              <li>✓ Todos los módulos</li>
              <li>✓ Notificaciones push y email</li>
              <li>✓ Backup en JSON / Markdown</li>
              <li>✓ Sin límite de espacio</li>
            </ul>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              <span style={{ marginRight: 6 }}>🐙</span> Ver en GitHub
            </button>
          </div>

          <div className="land-price-card featured">
            <div className="land-price-badge">RECOMENDADO</div>
            <div className="uppercase-tag" style={{ color: 'var(--color-primary)' }}>Demo en la nube</div>
            <div className="land-price">0€</div>
            <div className="text-xs text-muted mb-3 mono">probar sin instalar</div>
            <ul className="land-features-list">
              <li>✓ Tu cuenta en demo.omnidesk.app</li>
              <li>✓ Todos los módulos</li>
              <li>✓ Notificaciones push reales</li>
              <li>✓ 1 GB de datos</li>
              <li>✓ Cancela cuando quieras</li>
              <li>✓ Datos exportables siempre</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} onClick={onEnter}>
              Probar ahora →
            </button>
          </div>

          <div className="land-price-card">
            <div className="uppercase-tag">Apoyo opcional</div>
            <div className="land-price">5€<span style={{ fontSize: 14, color: 'var(--color-text-faint)' }}>/mes</span></div>
            <div className="text-xs text-muted mb-3 mono">solo si lo usas y te gusta</div>
            <ul className="land-features-list">
              <li>☕ Pagás un café al mes</li>
              <li>☕ Acceso a roadmap privado</li>
              <li>☕ Tu nombre en CONTRIBUTORS.md</li>
              <li>☕ Sticker físico (envío gratis)</li>
              <li>☕ Cancelás cuando quieras</li>
              <li>☕ Sin features bloqueadas</li>
            </ul>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              Donar en GitHub Sponsors
            </button>
          </div>
        </div>

        <div className="land-honest mt-6">
          <div className="uppercase-tag" style={{ color: 'var(--color-accent)' }}>nota honesta</div>
          <p className="text-sm text-muted mt-2">
            OmniDesk lo construyo yo solo en mi tiempo libre. No es un negocio.
            Es una herramienta personal que liberé porque pensé que a alguien más le sería útil.
            Sin SLA, sin equipo de soporte, sin promesas — pero con código limpio, issues respondidos
            y un roadmap honesto en GitHub.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
function Footer() {
  return (
    <footer className="land-footer">
      <div className="land-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div className="flex gap-2 items-center">
          <div className="sidebar-logo" style={{ width: 22, height: 22 }}>O</div>
          <span style={{ fontSize: 13, fontWeight: 500 }}>OmniDesk</span>
          <span className="mono text-xs text-faint">construido por @daniel-r · 2025-2026</span>
        </div>
        <div className="flex gap-3 mono text-xs text-muted">
          <a href="#" style={{ color: 'inherit' }}>GitHub</a>
          <a href="#" style={{ color: 'inherit' }}>Docs</a>
          <a href="#" style={{ color: 'inherit' }}>Privacidad</a>
          <a href="#" style={{ color: 'inherit' }}>Términos</a>
          <a href="#" style={{ color: 'inherit' }}>Status</a>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// Auth modal
function AuthDialog({ mode, onClose, onAuth, onSwitch }) {
  const [email, setEmail] = useStateLand(mode === 'login' ? 'daniel@omnidesk.app' : '');
  const [password, setPassword] = useStateLand(mode === 'login' ? '••••••••••' : '');
  const [name, setName] = useStateLand('');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icons.Close size={14}/></button>
        </div>
        <div className="modal-body">
          {mode === 'register' && (
            <div className="field">
              <label>Nombre</label>
              <input className="input" placeholder="Cómo te llamas" autoFocus value={name} onChange={e => setName(e.target.value)}/>
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="tu@email.com" autoFocus={mode === 'login'} value={email} onChange={e => setEmail(e.target.value)}/>
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}/>
          </div>
          {mode === 'register' && (
            <div className="text-xs text-muted mt-2">
              Al registrarte aceptas los términos. Cero spam — solo verificación de email.
            </div>
          )}
          {mode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <label className="checkbox">
                <input type="checkbox" defaultChecked/> Recordarme
              </label>
              <a href="#" style={{ fontSize: 12, color: 'var(--color-primary)' }}>¿Olvidaste tu contraseña?</a>
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '10px' }} onClick={onAuth}>
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0', color: 'var(--color-text-faint)', fontSize: 11 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border-soft)' }}/>
            <span className="mono">o</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border-soft)' }}/>
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} onClick={onAuth}>
            <span style={{ marginRight: 6 }}>🐙</span> Continuar con GitHub
          </button>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(mode === 'login' ? 'register' : 'login'); }} style={{ color: 'var(--color-primary)' }}>
              {mode === 'login' ? 'Crear una' : 'Iniciar sesión'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Landing = Landing;
window.AuthDialog = AuthDialog;

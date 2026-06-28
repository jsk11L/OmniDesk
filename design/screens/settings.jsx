/* global React, Icons, DATA */
const { useState: useStateSet } = React;

function SettingsScreen({ tweaks, setTweak }) {
  const [section, setSection] = useStateSet('theme');

  const sections = [
    { id: 'theme', label: 'Apariencia · temas' },
    { id: 'profile', label: 'Perfil' },
    { id: 'notif', label: 'Notificaciones globales' },
    { id: 'integ', label: 'Integraciones' },
    { id: 'data', label: 'Datos · backup' },
  ];

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div>
          <div className="uppercase-tag">Cuenta</div>
          <h1 className="page-title mt-1">Ajustes</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        <div>
          {sections.map(s => (
            <div key={s.id}
              onClick={() => setSection(s.id)}
              className="nav-item"
              style={{
                background: section === s.id ? 'var(--color-surface-hover)' : 'transparent',
                color: section === s.id ? 'var(--color-text)' : 'var(--color-text-muted)',
              }}>
              {s.label}
            </div>
          ))}
        </div>

        <div>
          {section === 'theme' && <ThemeSection tweaks={tweaks} setTweak={setTweak}/>}
          {section === 'profile' && <ProfileSection/>}
          {section === 'notif' && <NotifGlobalSection/>}
          {section === 'integ' && <IntegrationsSection/>}
          {section === 'data' && <DataSection/>}
        </div>
      </div>
    </div>
  );
}

function ThemeSection({ tweaks, setTweak }) {
  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Tema activo</h2>
      <p className="text-muted text-sm mb-4">Personaliza la paleta y la tipografía. El cambio es inmediato en toda la app.</p>

      <div className="grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {DATA.themes.map(th => {
          const active = tweaks.theme === th.id;
          return (
            <div key={th.id}
              onClick={() => setTweak('theme', th.id)}
              className="panel"
              style={{
                cursor: 'pointer',
                border: '1px solid ' + (active ? 'var(--color-primary)' : 'var(--color-border-soft)'),
                overflow: 'hidden',
              }}>
              <div style={{ height: 60, background: th.swatch[1], position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 10, left: 10, right: 30, height: 6,
                  background: th.swatch[2], borderRadius: 3,
                }}/>
                <div style={{
                  position: 'absolute', top: 24, left: 10, width: 60, height: 14,
                  background: th.swatch[0], borderRadius: 3,
                }}/>
                <div style={{
                  position: 'absolute', top: 24, left: 76, right: 30, height: 14,
                  background: th.swatch[2], borderRadius: 3,
                }}/>
              </div>
              <div className="panel-pad" style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{th.name}</span>
                  {active && <Icons.Check size={12} stroke="var(--color-primary)"/>}
                </div>
                <div className="text-xs text-faint mono mt-1">{th.isDark ? 'oscuro' : 'claro'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Personalización rápida</h3>
      <div className="panel panel-pad">
        <div className="field-row" style={{ marginBottom: 14 }}>
          <ColorRow label="Color primario" tokens={[
            { v: '#6366f1', l: 'Indigo' },
            { v: '#22c55e', l: 'Verde' },
            { v: '#ec4899', l: 'Rosa' },
            { v: '#f59e0b', l: 'Ámbar' },
            { v: '#38bdf8', l: 'Cielo' },
          ]} value={tweaks.primary} onSet={v => setTweak('primary', v)}/>
          <ColorRow label="Color de acento" tokens={[
            { v: '#f59e0b', l: 'Ámbar' },
            { v: '#a78bfa', l: 'Violeta' },
            { v: '#22c55e', l: 'Verde' },
            { v: '#38bdf8', l: 'Cielo' },
            { v: '#ec4899', l: 'Rosa' },
          ]} value={tweaks.accent} onSet={v => setTweak('accent', v)}/>
        </div>

        <div className="field">
          <label>Familia tipográfica</label>
          <div className="flex gap-2">
            {[
              { id: 'inter', label: 'Inter', font: 'Inter, sans-serif' },
              { id: 'geist', label: 'Geist', font: 'Geist, sans-serif' },
              { id: 'mono', label: 'JetBrains Mono', font: 'JetBrains Mono, monospace' },
              { id: 'serif', label: 'Newsreader', font: 'Newsreader, serif' },
            ].map(f => (
              <button key={f.id}
                onClick={() => setTweak('fontFamily', f.id)}
                style={{
                  padding: '10px 16px', borderRadius: 8,
                  border: '1px solid ' + (tweaks.fontFamily === f.id ? 'var(--color-primary)' : 'var(--color-border)'),
                  background: tweaks.fontFamily === f.id ? 'var(--color-primary-ghost)' : 'var(--color-surface-2)',
                  color: 'var(--color-text)', cursor: 'pointer',
                  fontFamily: f.font, fontSize: 13,
                }}>{f.label}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Radio de las esquinas</label>
          <div className="flex gap-2">
            {[
              { v: 'sharp', label: 'Sharp', r: '2px' },
              { v: 'soft', label: 'Soft', r: '8px' },
              { v: 'round', label: 'Round', r: '16px' },
            ].map(r => (
              <button key={r.v}
                onClick={() => setTweak('radius', r.v)}
                style={{
                  padding: '8px 16px',
                  borderRadius: r.r,
                  border: '1px solid ' + (tweaks.radius === r.v ? 'var(--color-primary)' : 'var(--color-border)'),
                  background: tweaks.radius === r.v ? 'var(--color-primary-ghost)' : 'var(--color-surface-2)',
                  color: 'var(--color-text)', cursor: 'pointer',
                  fontSize: 13,
                }}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Preview</h3>
      <div className="panel panel-pad">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button className="btn btn-primary"><Icons.Plus size={13}/> Botón primario</button>
          <button className="btn">Botón secundario</button>
          <button className="btn btn-ghost">Botón fantasma</button>
          <span className="chip">tag</span>
          <span className="kbd">⌘K</span>
        </div>
        <div className="text-muted text-sm">Texto secundario en tono atenuado. <span className="mono">monoespaciado para metadatos</span>.</div>
      </div>
    </div>
  );
}

function ColorRow({ label, tokens, value, onSet }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        {tokens.map(t => (
          <button key={t.v}
            onClick={() => onSet(t.v)}
            title={t.l}
            style={{
              width: 32, height: 32, padding: 0, border: 'none', cursor: 'pointer',
              borderRadius: 8, background: t.v,
              outline: value === t.v ? '2px solid var(--color-text)' : 'none',
              outlineOffset: 2,
            }}/>
        ))}
      </div>
    </div>
  );
}

function ProfileSection() {
  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Perfil</h2>
      <div className="panel panel-pad">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 50,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 600, fontSize: 18,
          }}>DR</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Daniel R.</div>
            <div className="text-xs text-muted mono">daniel@omnidesk.app · verificado ✓</div>
          </div>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm">Cambiar avatar</button>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Nombre</label>
            <input className="input" defaultValue="Daniel R."/>
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" defaultValue="daniel@omnidesk.app"/>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Zona horaria</label>
            <select className="select"><option>Europe/Madrid (CET)</option></select>
          </div>
          <div className="field">
            <label>Idioma</label>
            <select className="select"><option>Español</option><option>English</option></select>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Seguridad</h3>
      <div className="panel panel-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Cambiar contraseña</div>
            <div className="text-xs text-muted">Última vez: hace 3 meses</div>
          </div>
          <button className="btn btn-sm">Cambiar</button>
        </div>
        <div style={{ height: 1, background: 'var(--color-border-soft)', margin: '14px 0' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Verificación en dos pasos</div>
            <div className="text-xs text-muted">Añade una capa de seguridad con TOTP</div>
          </div>
          <button className="btn btn-sm btn-primary">Activar</button>
        </div>
      </div>
    </div>
  );
}

function NotifGlobalSection() {
  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Canales activos</h2>
      <div className="panel panel-pad">
        {[
          { name: 'En la app', desc: 'Aparecen en el centro y la campana del sidebar', on: true },
          { name: 'Push del navegador', desc: 'Requiere permiso del navegador', on: true },
          { name: 'Email', desc: 'Solo para notificaciones críticas', on: false },
        ].map((c, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0',
            borderTop: i > 0 ? '1px solid var(--color-border-soft)' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
              <div className="text-xs text-muted">{c.desc}</div>
            </div>
            <Switch on={c.on}/>
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Horario silencioso</h3>
      <div className="panel panel-pad">
        <div className="field-row">
          <div className="field">
            <label>Desde</label>
            <input className="input" type="time" defaultValue="22:00"/>
          </div>
          <div className="field">
            <label>Hasta</label>
            <input className="input" type="time" defaultValue="08:00"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function Switch({ on }) {
  return (
    <span style={{
      display: 'inline-block', width: 36, height: 20, borderRadius: 12,
      background: on ? 'var(--color-primary)' : 'var(--color-border)',
      position: 'relative', cursor: 'pointer', transition: 'background 120ms',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: 50, background: '#fff',
        transition: 'left 160ms',
      }}/>
    </span>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: 'Google Calendar', desc: 'Sincronizar eventos · solo lectura', logo: '📆', on: true },
    { name: 'Steam', desc: 'Importar biblioteca de juegos', logo: '🎮', on: false },
    { name: 'Spotify', desc: 'Sincronizar álbumes guardados', logo: '🎧', on: false },
    { name: 'GitHub', desc: 'Crear tareas desde issues', logo: '🐙', on: true },
    { name: 'Notion', desc: 'Importar páginas como notas', logo: '📓', on: false },
  ];
  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Integraciones</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {integrations.map(i => (
          <div key={i.name} className="panel panel-pad" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{i.logo}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</div>
                <div className="text-xs text-muted">{i.desc}</div>
              </div>
              <Switch on={i.on}/>
            </div>
            {i.on && <div className="mono text-xs text-faint">Última sync · hace 4 h</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataSection() {
  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Datos · backup</h2>
      <div className="panel panel-pad">
        <div className="uppercase-tag" style={{ marginBottom: 12 }}>Exportar</div>
        <div className="text-sm text-muted mb-3">Descarga todo tu workspace en JSON para llevarlo a otra instancia.</div>
        <div className="flex gap-2">
          <button className="btn">Exportar como JSON</button>
          <button className="btn">Exportar como Markdown</button>
        </div>
      </div>
      <div className="panel panel-pad" style={{ marginTop: 12, borderColor: 'rgba(239,68,68,0.3)' }}>
        <div className="uppercase-tag" style={{ marginBottom: 12, color: 'var(--color-danger)' }}>Zona peligrosa</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Eliminar cuenta</div>
            <div className="text-xs text-muted">Acción irreversible. Se borrarán todos tus datos.</div>
          </div>
          <button className="btn" style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.4)' }}><Icons.Trash size={12}/> Eliminar</button>
        </div>
      </div>
    </div>
  );
}

window.SettingsScreen = SettingsScreen;

/* global React, Icons, DATA */
const { useState: useStateNotif } = React;

function NotificationsScreen({ onShowToast }) {
  const [tab, setTab] = useStateNotif('inbox');
  const [inbox, setInbox] = useStateNotif(DATA.notifications.inbox);
  const [configs, setConfigs] = useStateNotif(DATA.notifications.configs);

  const markRead = (id) => setInbox(inbox.map(i => i.id === id ? { ...i, read: true } : i));
  const markAllRead = () => { setInbox(inbox.map(i => ({ ...i, read: true }))); onShowToast?.('Todas marcadas como leídas'); };
  const clearOne = (id) => { setInbox(inbox.filter(i => i.id !== id)); onShowToast?.('Notificación eliminada'); };
  const toggleConfig = (id) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, on: !c.on } : c));
    onShowToast?.(`Notificación ${configs.find(c => c.id === id).on ? 'pausada' : 'activada'}`);
  };

  const unread = inbox.filter(i => !i.read).length;

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div>
          <div className="uppercase-tag">Centro de notificaciones</div>
          <h1 className="page-title mt-1">Notificaciones</h1>
          <div className="page-subtitle">{unread} sin leer · {configs.filter(c => c.on).length} configuradas activas</div>
        </div>
        <div className="flex gap-2">
          {tab === 'inbox' && unread > 0 && (
            <button className="btn btn-sm" onClick={markAllRead}>Marcar todas como leídas</button>
          )}
          <button className="btn btn-primary"><Icons.Plus size={13}/> Nueva notificación</button>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border-soft)',
        marginBottom: 18,
      }}>
        {[
          { id: 'inbox', label: 'Bandeja', count: inbox.length },
          { id: 'configs', label: 'Configuradas', count: configs.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px', border: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
              color: tab === t.id ? 'var(--color-text)' : 'var(--color-text-muted)',
              borderBottom: '2px solid ' + (tab === t.id ? 'var(--color-primary)' : 'transparent'),
              marginBottom: -1, fontWeight: tab === t.id ? 500 : 400,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
            {t.label}
            <span className="mono text-xs text-faint">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'inbox' && (
        <div className="panel">
          {inbox.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'var(--color-text-faint)' }}>
              <Icons.Bell size={32} stroke="var(--color-text-faint)"/>
              <div style={{ marginTop: 12 }}>Bandeja vacía</div>
            </div>
          ) : inbox.map((it, i) => (
            <div key={it.id}
              onClick={() => markRead(it.id)}
              style={{
                display: 'grid', gridTemplateColumns: '6px 36px 1fr 100px 28px',
                alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderTop: i > 0 ? '1px solid var(--color-border-soft)' : 'none',
                background: it.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                cursor: 'pointer',
                transition: 'background 120ms',
              }}>
              <div style={{ width: 6, height: 6, borderRadius: 50, background: it.read ? 'transparent' : 'var(--color-primary)' }}/>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: it.color + '22', color: it.color,
                display: 'grid', placeItems: 'center',
              }}><Icons.Bell size={14}/></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: it.read ? 400 : 600 }}>{it.title}</div>
                <div className="text-xs text-muted mt-1">{it.message}</div>
              </div>
              <div className="mono text-xs text-faint" style={{ textAlign: 'right' }}>{it.when}</div>
              <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); clearOne(it.id); }}
                style={{ opacity: 0.6 }}>
                <Icons.Close size={12}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'configs' && (
        <div className="panel">
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 200px 180px 60px 80px', padding: '10px 18px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border-soft)' }}>
            <div></div>
            <div className="uppercase-tag">Notificación</div>
            <div className="uppercase-tag">Cuándo</div>
            <div className="uppercase-tag">Canales</div>
            <div className="uppercase-tag">Tipo</div>
            <div className="uppercase-tag" style={{ textAlign: 'right' }}>Activa</div>
          </div>
          {configs.map((c, i) => (
            <div key={c.id} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr 200px 180px 60px 80px',
              alignItems: 'center', padding: '12px 18px',
              borderTop: i > 0 ? '1px solid var(--color-border-soft)' : 'none',
              opacity: c.on ? 1 : 0.55,
            }}>
              <Icons.Bell size={14} stroke={c.on ? 'var(--color-primary)' : 'var(--color-text-faint)'}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.title}</div>
                <div className="text-xs text-muted mt-1">{c.message}</div>
              </div>
              <div className="mono text-xs text-muted">{c.when}</div>
              <div className="flex gap-1">
                {c.channels.map(ch => (
                  <span key={ch} className="chip" style={{ fontSize: 10 }}>
                    {ch === 'IN_APP' ? 'app' : ch === 'PUSH' ? 'push' : 'email'}
                  </span>
                ))}
              </div>
              <div className="mono text-xs text-faint">{c.type === 'recurring' ? '↻ rec.' : '⏰ once'}</div>
              <div style={{ textAlign: 'right' }} onClick={() => toggleConfig(c.id)}>
                <Switch on={c.on}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Switch({ on }) {
  return (
    <span style={{
      display: 'inline-block', width: 30, height: 16, borderRadius: 8,
      background: on ? 'var(--color-primary)' : 'var(--color-border)',
      position: 'relative', cursor: 'pointer', transition: 'background 120ms',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 12, height: 12, borderRadius: 50, background: '#fff',
        transition: 'left 160ms',
      }}/>
    </span>
  );
}

window.NotificationsScreen = NotificationsScreen;

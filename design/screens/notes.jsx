/* global React, Icons, DATA */
const { useState: useStateNot } = React;

function NotesScreen() {
  const [selected, setSelected] = useStateNot('n1');
  const note = DATA.notes.find(n => n.id === selected);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '100%' }}>
      {/* Notes list */}
      <div style={{ borderRight: '1px solid var(--color-border-soft)', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div className="uppercase-tag">Notas</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{DATA.notes.length} notas</div>
          </div>
          <button className="btn btn-primary btn-sm"><Icons.Plus size={12}/></button>
        </div>
        <div style={{ padding: '10px 12px 6px' }}>
          <div style={{ position: 'relative' }}>
            <Icons.Search size={13} stroke="var(--color-text-faint)" />
            <input className="input" placeholder="Buscar nota o tag…"
              style={{ paddingLeft: 30, fontSize: 12 }} />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <Icons.Search size={13} stroke="var(--color-text-faint)" />
            </span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="uppercase-tag" style={{ padding: '10px 16px 6px' }}>Fijadas</div>
          {DATA.notes.filter(n => n.pinned).map(n => (
            <NoteRow key={n.id} note={n} active={selected === n.id} onClick={() => setSelected(n.id)} />
          ))}
          <div className="uppercase-tag" style={{ padding: '14px 16px 6px' }}>Todas</div>
          {DATA.notes.filter(n => !n.pinned).map(n => (
            <NoteRow key={n.id} note={n} active={selected === n.id} onClick={() => setSelected(n.id)} />
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ overflowY: 'auto' }}>
        <NoteEditor note={note} />
      </div>
    </div>
  );
}

function NoteRow({ note, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '10px 16px',
      cursor: 'pointer',
      background: active ? 'var(--color-surface-hover)' : 'transparent',
      borderLeft: active ? '2px solid var(--color-primary)' : '2px solid transparent',
      transition: 'background 100ms',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 14 }}>{note.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</span>
        {note.pinned && <Icons.Pin size={10} stroke="var(--color-accent)" />}
      </div>
      <div className="text-xs text-faint mono">{note.updated}</div>
      <div className="text-xs text-muted" style={{
        marginTop: 4, lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{note.preview}</div>
      <div className="flex gap-1 mt-2">
        {note.tags.map(t => <span key={t} className="chip" style={{ fontSize: 9, padding: '1px 6px' }}>#{t}</span>)}
      </div>
    </div>
  );
}

function NoteEditor({ note }) {
  // Editor toolbar
  const tools = [
    { icon: Icons.Bold, label: 'Bold' },
    { icon: Icons.Italic, label: 'Italic' },
    null,
    { icon: () => <span className="mono" style={{fontSize:11,fontWeight:700}}>H1</span>, label: 'H1' },
    { icon: () => <span className="mono" style={{fontSize:11,fontWeight:700}}>H2</span>, label: 'H2' },
    null,
    { icon: Icons.Lines, label: 'Lista' },
    { icon: Icons.Quote, label: 'Cita' },
    { icon: Icons.Code, label: 'Código' },
    null,
    { icon: Icons.Link, label: 'Link' },
    { icon: Icons.Image, label: 'Imagen' },
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 60px 80px' }}>
      {/* Cover */}
      <div style={{ height: 140, marginTop: 0,
        background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
        borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
        marginLeft: -60, marginRight: -60,
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', bottom: -30, left: 0 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'grid', placeItems: 'center', fontSize: 32,
          }}>{note.icon}</div>
        </div>
      </div>

      {/* Header */}
      <div style={{ paddingTop: 44, paddingBottom: 16, borderBottom: '1px solid var(--color-border-soft)', marginBottom: 18 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, marginBottom: 8 }}>
          {note.title}
        </h1>
        <div className="flex gap-2 mt-2" style={{ alignItems: 'center' }}>
          {note.tags.map(t => <span key={t} className="chip">#{t}</span>)}
          <button className="btn btn-sm btn-ghost"><Icons.Plus size={11}/> Tag</button>
          <div style={{ flex: 1 }} />
          <div className="mono text-xs text-faint">Editado {note.updated} · auto-guardado</div>
          {note.pinned && (
            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-accent)' }}>
              <Icons.Pin size={11}/> Fijada
            </button>
          )}
          <button className="btn btn-ghost btn-icon"><Icons.Dots size={14}/></button>
        </div>
      </div>

      {/* Toolbar (sticky-like) */}
      <div className="flex" style={{
        gap: 2, padding: '4px 4px', marginBottom: 18,
        border: '1px solid var(--color-border-soft)', borderRadius: 8,
        background: 'var(--color-surface)',
        width: 'fit-content',
      }}>
        {tools.map((t, i) => t === null
          ? <div key={i} style={{ width: 1, height: 18, background: 'var(--color-border)', alignSelf: 'center', margin: '0 4px' }}/>
          : (
            <button key={i} className="btn btn-ghost btn-icon" title={t.label}><t.icon size={13}/></button>
          ))}
      </div>

      {/* Content */}
      <div style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--color-text)' }}>
        {DATA.selectedNoteContent.map((b, i) => {
          if (b.type === 'h1') return <h1 key={i} style={{ fontSize: 28, fontWeight: 700, margin: '24px 0 8px', letterSpacing: '-0.02em' }}>{b.text}</h1>;
          if (b.type === 'h2') return <h2 key={i} style={{ fontSize: 19, fontWeight: 600, margin: '28px 0 8px', letterSpacing: '-0.01em' }}>{b.text}</h2>;
          if (b.type === 'meta') return <div key={i} className="mono text-xs text-faint" style={{ marginBottom: 16 }}>{b.text}</div>;
          if (b.type === 'p') return <p key={i} style={{ margin: '10px 0' }}>{b.text}</p>;
          if (b.type === 'list') return (
            <ul key={i} style={{ paddingLeft: 22, margin: '10px 0' }}>
              {b.items.map((it, j) => <li key={j} style={{ marginBottom: 6 }}>{it}</li>)}
            </ul>
          );
          if (b.type === 'quote') return (
            <blockquote key={i} style={{
              borderLeft: '3px solid var(--color-primary)',
              paddingLeft: 14, margin: '14px 0',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
            }}>{b.text}</blockquote>
          );
          if (b.type === 'code') return (
            <pre key={i} className="mono" style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 6,
              padding: '12px 14px',
              fontSize: 12.5, lineHeight: 1.6,
              overflow: 'auto',
              margin: '14px 0',
            }}>{b.text}</pre>
          );
          return null;
        })}

        {/* Cursor placeholder */}
        <p style={{ color: 'var(--color-text-faint)' }}>
          <span style={{ display: 'inline-block', width: 2, height: 18, background: 'var(--color-primary)', verticalAlign: 'text-bottom', animation: 'blink 1.1s infinite' }}/>
        </p>
      </div>
      <style>{`@keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }`}</style>
    </div>
  );
}

window.NotesScreen = NotesScreen;

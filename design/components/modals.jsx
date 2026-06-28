/* global React, Icons */
const { useState: useStateM, useEffect: useEffectM } = React;

// Shared modal shell
function Modal({ title, onClose, children, footer, width }) {
  useEffectM(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={width ? { width } : null} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icons.Close size={14} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Event dialog
// ─────────────────────────────────────────────
function EventDialog({ onClose, onSave }) {
  const [title, setTitle] = useStateM('');
  const [desc, setDesc] = useStateM('');
  const [start, setStart] = useStateM('2026-05-18T10:00');
  const [end, setEnd] = useStateM('2026-05-18T10:30');
  const [allDay, setAllDay] = useStateM(false);
  const [color, setColor] = useStateM('#6366f1');
  const [location, setLocation] = useStateM('');
  const [notifs, setNotifs] = useStateM([{ id: 1, mins: 15 }]);

  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#38bdf8', '#a78bfa', '#82828c'];

  return (
    <Modal
      title="Nuevo evento"
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => onSave({ title }) || onClose()}>Guardar evento</button>
      </>}
    >
      <div className="field">
        <label>Título</label>
        <input className="input" autoFocus placeholder="¿Qué hay que hacer?" value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div className="field">
        <label>Descripción</label>
        <textarea className="textarea" placeholder="Notas, agenda, enlaces…" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Inicio</label>
          <input className="input" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} disabled={allDay} />
        </div>
        <div className="field">
          <label>Fin</label>
          <input className="input" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} disabled={allDay} />
        </div>
      </div>

      <label className="checkbox mb-3">
        <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
        Todo el día
      </label>

      <div className="field">
        <label>Color</label>
        <div className="flex gap-2">
          {colors.map(c => (
            <button key={c}
              onClick={() => setColor(c)}
              style={{
                width: 22, height: 22, borderRadius: 6,
                background: c, border: '2px solid ' + (color === c ? '#fff' : 'transparent'),
                cursor: 'pointer', padding: 0,
                boxShadow: color === c ? '0 0 0 2px ' + c : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <label>Lugar (opcional)</label>
        <input className="input" placeholder="Meet, sala, dirección…" value={location} onChange={e => setLocation(e.target.value)} />
      </div>

      <div className="field">
        <label>Notificaciones</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifs.map((n, i) => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
              <Icons.Bell size={13} />
              <select className="select" style={{ flex: 1, padding: '2px 6px' }} value={n.mins}
                onChange={e => setNotifs(notifs.map((x,j) => j===i ? {...x, mins: +e.target.value} : x))}>
                <option value={0}>al iniciar</option>
                <option value={5}>5 minutos antes</option>
                <option value={15}>15 minutos antes</option>
                <option value={30}>30 minutos antes</option>
                <option value={60}>1 hora antes</option>
                <option value={1440}>1 día antes</option>
              </select>
              <button className="btn btn-ghost btn-icon" onClick={() => setNotifs(notifs.filter((_,j) => j!==i))}><Icons.Close size={12} /></button>
            </div>
          ))}
          <button className="btn btn-sm btn-ghost" style={{ alignSelf:'flex-start' }} onClick={() => setNotifs([...notifs, { id: Date.now(), mins: 15 }])}>
            <Icons.Plus size={12} /> Añadir notificación
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// List item dialog (game)
// ─────────────────────────────────────────────
function ListItemDialog({ onClose }) {
  const [title, setTitle] = useStateM('');
  const [imageUrl, setImageUrl] = useStateM('');
  const [platform, setPlatform] = useStateM('PC');
  const [year, setYear] = useStateM(2025);
  const [rating, setRating] = useStateM(0);
  const [hours, setHours] = useStateM(0);
  const [status, setStatus] = useStateM('Pendiente');
  const [tags, setTags] = useStateM(['Indie']);

  return (
    <Modal
      title="Nuevo ítem · Videojuegos"
      onClose={onClose}
      width={620}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={onClose}>Guardar</button>
      </>}
    >
      <div className="field">
        <label>Título</label>
        <input className="input" autoFocus placeholder="Nombre del juego…" value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, marginBottom: 14 }}>
        <div className="img-placeholder" style={{ width: 120, height: 160 }}>cover</div>
        <div>
          <div className="field">
            <label>URL de imagen</label>
            <input className="input" placeholder="https://…" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          </div>
          <div className="field">
            <label>Tags</label>
            <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
              {tags.map((t,i) => (
                <span key={i} className="chip" style={{ background: 'var(--color-primary-ghost)', color: 'var(--color-primary)', border: '1px solid transparent' }}>
                  {t} <Icons.Close size={10} />
                </span>
              ))}
              <button className="btn btn-sm btn-ghost"><Icons.Plus size={12} /> Tag</button>
            </div>
          </div>
        </div>
      </div>

      <div className="uppercase-tag" style={{ marginBottom: 10 }}>Campos personalizados</div>
      <div className="field-row">
        <div className="field">
          <label>Plataforma</label>
          <select className="select" value={platform} onChange={e => setPlatform(e.target.value)}>
            <option>PC</option><option>PS5</option><option>Xbox</option><option>Switch</option><option>Steam Deck</option>
          </select>
        </div>
        <div className="field">
          <label>Año</label>
          <input className="input" type="number" value={year} onChange={e => setYear(+e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Estado</label>
          <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
            <option>Pendiente</option><option>Jugando</option><option>Completado</option><option>Abandonado</option>
          </select>
        </div>
        <div className="field">
          <label>Horas jugadas</label>
          <input className="input" type="number" value={hours} onChange={e => setHours(+e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Rating</label>
        <div className="flex gap-1" style={{ alignItems: 'center' }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n}
              onClick={() => setRating(n)}
              style={{
                width: 22, height: 22, borderRadius: 4,
                background: n <= rating ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                color: n <= rating ? '#fff' : 'var(--color-text-faint)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10,
              }}
            >{n}</button>
          ))}
          <span className="mono text-xs text-faint" style={{ marginLeft: 6 }}>{rating}/10</span>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Transaction dialog
// ─────────────────────────────────────────────
function TransactionDialog({ onClose }) {
  const [type, setType] = useStateM('EXPENSE');
  const [amount, setAmount] = useStateM('');
  const [title, setTitle] = useStateM('');
  const [date, setDate] = useStateM('2026-05-16');
  const [category, setCategory] = useStateM('Comida · super');
  const [notes, setNotes] = useStateM('');

  const cats = type === 'EXPENSE'
    ? ['Vivienda','Comida · super','Restaurantes','Transporte','SaaS · Suscripc.','Salud','Ocio','Otros']
    : ['Salario','Freelance','Otros ingresos'];

  return (
    <Modal
      title="Registrar transacción"
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={onClose}>Guardar</button>
      </>}
    >
      <div className="field">
        <label>Tipo</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'var(--color-background)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
          {['EXPENSE','INCOME'].map(t => (
            <button key={t}
              onClick={() => { setType(t); setCategory(t === 'EXPENSE' ? 'Comida · super' : 'Salario'); }}
              style={{
                padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: type === t ? 'var(--color-surface-hover)' : 'transparent',
                color: type === t ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontSize: 13, fontWeight: type === t ? 500 : 400, fontFamily: 'inherit',
              }}
            >
              {t === 'EXPENSE' ? '↓ Gasto' : '↑ Ingreso'}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Cantidad</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13
          }}>€</span>
          <input className="input mono" style={{ paddingLeft: 26, fontSize: 18, fontWeight: 600 }}
            type="number" step="0.01" autoFocus placeholder="0,00"
            value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Concepto</label>
        <input className="input" placeholder="¿En qué fue?" value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Categoría</label>
          <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Fecha</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Notas (opcional)</label>
        <textarea className="textarea" placeholder="Detalles…" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Todo dialog
// ─────────────────────────────────────────────
function TodoDialog({ onClose }) {
  const [title, setTitle] = useStateM('');
  const [desc, setDesc] = useStateM('');
  const [priority, setPriority] = useStateM('MEDIA');
  const [col, setCol] = useStateM('Backlog');

  return (
    <Modal
      title="Nueva tarea"
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={onClose}>Crear tarea</button>
      </>}
    >
      <div className="field">
        <label>Título</label>
        <input className="input" autoFocus placeholder="¿Qué hay que hacer?" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label>Descripción</label>
        <textarea className="textarea" placeholder="Contexto, criterios de aceptación…" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Prioridad</label>
          <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
            <option>BAJA</option><option>MEDIA</option><option>ALTA</option><option>URGENTE</option>
          </select>
        </div>
        <div className="field">
          <label>Columna</label>
          <select className="select" value={col} onChange={e => setCol(e.target.value)}>
            <option>Backlog</option><option>En progreso</option><option>En revisión</option><option>Completado</option>
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Fecha límite</label>
          <input className="input" type="date" />
        </div>
        <div className="field">
          <label>Tags</label>
          <input className="input" placeholder="frontend, urgente…" />
        </div>
      </div>
    </Modal>
  );
}

window.Modal = Modal;
window.EventDialog = EventDialog;
window.ListItemDialog = ListItemDialog;
window.TransactionDialog = TransactionDialog;
window.TodoDialog = TodoDialog;

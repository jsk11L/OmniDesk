/* global React */
// Mock data — vida real de un dev/usuario personal

const COMPLETED = [
  // 2026
  { id: 'c-2026-may',  title: 'Hollow Knight: Silksong',          platform: 'PC',     year: 2026, month: 5,  state: 'COMPLETADO', hours: 38, rating: 9.4, tags: ['Metroidvania','Indie'] },
  { id: 'c-2026-apr',  title: 'Elden Ring: Nightreign',           platform: 'PS5',    year: 2026, month: 4,  state: 'PLATINADO',  hours: 56, rating: 8.6, tags: ['Souls','Co-op'] },
  { id: 'c-2026-mar',  title: 'Avowed',                            platform: 'PC',     year: 2026, month: 3,  state: 'COMPLETADO', hours: 32, rating: 8.2, tags: ['RPG'] },
  { id: 'c-2026-feb',  title: 'Like a Dragon: Pirate Yakuza',     platform: 'PS5',    year: 2026, month: 2,  state: 'COMPLETADO', hours: 28, rating: 8.5, tags: ['JRPG','Acción'] },
  { id: 'c-2026-jan',  title: 'Indiana Jones y el Gran Círculo',  platform: 'Xbox',   year: 2026, month: 1,  state: 'COMPLETADO', hours: 22, rating: 8.9, tags: ['Aventura'] },

  // 2025
  { id: 'c-2025-dec',  title: 'Hades II',                          platform: 'PC',     year: 2025, month: 12, state: 'MAXEADO',    hours: 64, rating: 9.6, tags: ['Roguelike','Indie'] },
  { id: 'c-2025-nov',  title: 'Balatro',                            platform: 'Switch', year: 2025, month: 11, state: 'MAXEADO',    hours: 88, rating: 9.7, tags: ['Cartas','Roguelike'] },
  { id: 'c-2025-oct',  title: 'Astro Bot',                          platform: 'PS5',    year: 2025, month: 10, state: 'PLATINADO',  hours: 17, rating: 9.5, tags: ['Plataformas'] },
  { id: 'c-2025-sep',  title: 'Final Fantasy VII Rebirth',         platform: 'PS5',    year: 2025, month: 9,  state: 'PLATINADO',  hours: 110, rating: 9.3, tags: ['JRPG','AAA'] },
  { id: 'c-2025-aug',  title: 'Animal Well',                        platform: 'PC',     year: 2025, month: 8,  state: 'MAXEADO',    hours: 18, rating: 9.2, tags: ['Metroidvania','Indie'] },
  { id: 'c-2025-jul',  title: 'Split Fiction',                      platform: 'PC',     year: 2025, month: 7,  state: 'COMPLETADO', hours: 14, rating: 9.0, tags: ['Co-op','Aventura'] },
  { id: 'c-2025-jun',  title: 'Clair Obscur: Expedition 33',       platform: 'PC',     year: 2025, month: 6,  state: 'COMPLETADO', hours: 42, rating: 9.5, tags: ['JRPG','Narrativo'] },
  { id: 'c-2025-may',  title: 'Monster Hunter Wilds',              platform: 'PC',     year: 2025, month: 5,  state: 'COMPLETADO', hours: 78, rating: 8.8, tags: ['Acción','Co-op'] },
  { id: 'c-2025-mar',  title: 'Kingdom Come: Deliverance II',      platform: 'PC',     year: 2025, month: 3,  state: 'COMPLETADO', hours: 95, rating: 9.1, tags: ['RPG','Narrativo'] },
  { id: 'c-2025-feb',  title: 'Stellar Blade',                      platform: 'PS5',    year: 2025, month: 2,  state: 'PLATINADO',  hours: 36, rating: 8.4, tags: ['Acción','AAA'] },
  { id: 'c-2025-jan',  title: 'Helldivers 2',                       platform: 'PS5',    year: 2025, month: 1,  state: 'COMPLETADO', hours: 48, rating: 8.6, tags: ['Co-op','Disparos'] },

  // 2024
  { id: 'c-2024-dec',  title: 'Sea of Stars',                       platform: 'Switch', year: 2024, month: 12, state: 'COMPLETADO', hours: 30, rating: 8.7, tags: ['JRPG','Indie'] },
  { id: 'c-2024-nov',  title: 'Outer Wilds',                        platform: 'PC',     year: 2024, month: 11, state: 'COMPLETADO', hours: 22, rating: 9.9, tags: ['Exploración','Indie'] },
  { id: 'c-2024-sep',  title: 'Pentiment',                          platform: 'PC',     year: 2024, month: 9,  state: 'MAXEADO',    hours: 19, rating: 9.1, tags: ['Narrativo'] },
  { id: 'c-2024-jul',  title: 'Disco Elysium',                      platform: 'PC',     year: 2024, month: 7,  state: 'MAXEADO',    hours: 36, rating: 9.8, tags: ['RPG','Narrativo'] },
  { id: 'c-2024-may',  title: 'Pizza Tower',                        platform: 'PC',     year: 2024, month: 5,  state: 'COMPLETADO', hours: 9,  rating: 8.9, tags: ['Plataformas','Indie'] },
  { id: 'c-2024-mar',  title: 'Cocoon',                             platform: 'PC',     year: 2024, month: 3,  state: 'MAXEADO',    hours: 6,  rating: 8.8, tags: ['Puzzle','Indie'] },
  { id: 'c-2024-feb',  title: 'Tunic',                              platform: 'PC',     year: 2024, month: 2,  state: 'MAXEADO',    hours: 14, rating: 8.7, tags: ['Puzzle','Indie'] },
];

const BACKLOG = [
  // JUGANDO
  { id: 'b-1',  title: 'Path of Exile 2',           platform: 'PC',     status: 'JUGANDO', estHours: 60,  added: '2026-04-02', notes: 'Esperando final del Act 4 antes de mainear otra clase.' },
  { id: 'b-2',  title: 'Mario & Luigi: Brothership',platform: 'Switch', status: 'JUGANDO', estHours: 35,  added: '2026-03-18', notes: 'Combate por turnos divertido, va lento pero gustazo.' },
  { id: 'b-3',  title: 'Persona 5 Royal',           platform: 'PS5',    status: 'JUGANDO', estHours: 110, added: '2026-01-09', notes: 'Pausé en septiembre del juego. Volver al palacio 5.' },

  // PENDIENTES
  { id: 'b-4',  title: 'Metaphor: ReFantazio',      platform: 'PC',     status: 'PENDIENTE', estHours: 80, added: '2026-05-02', notes: 'Empezar cuando termine Persona 5 R.' },
  { id: 'b-5',  title: 'Dragon Quest III HD-2D',    platform: 'Switch', status: 'PENDIENTE', estHours: 30, added: '2025-12-15', notes: 'Para un fin de semana de manta y sofá.' },
  { id: 'b-6',  title: 'Ys X: Nordics',             platform: 'PC',     status: 'PENDIENTE', estHours: 35, added: '2025-11-04', notes: 'Pendiente desde el sale de Steam.' },
  { id: 'b-7',  title: 'Slay the Spire 2',          platform: 'PC',     status: 'PENDIENTE', estHours: 100, added: '2026-04-22', notes: 'Early access. Esperar 1.0 para no quemarme.' },
  { id: 'b-8',  title: 'Lego Horizon Adventures',   platform: 'PS5',    status: 'PENDIENTE', estHours: 8,  added: '2025-12-08', notes: 'Para jugar con sobrino en navidades.' },
  { id: 'b-9',  title: 'Tales of Graces f Remastered', platform: 'Switch', status: 'PENDIENTE', estHours: 50, added: '2026-02-10', notes: 'Asbel best protagonist. Nostalgia pura.' },
  { id: 'b-10', title: 'Tactical Breach Wizards',   platform: 'PC',     status: 'PENDIENTE', estHours: 12, added: '2025-09-19', notes: 'Recomendado por Tom en el podcast.' },
  { id: 'b-11', title: 'UFO 50',                    platform: 'PC',     status: 'PENDIENTE', estHours: 100, added: '2025-09-25', notes: '50 minijuegos. Picar de uno en uno.' },
  { id: 'b-12', title: 'Marvel Rivals',             platform: 'PC',     status: 'PENDIENTE', estHours: 0,  added: '2026-01-12', notes: 'Solo si convencen a los del grupo.' },
];

const WISHLIST = [
  { id: 'w-1',  title: 'PS5 Pro',                       price: 800,  currency: 'EUR', store: 'Sony · El Corte Inglés', url: 'sony.es', category: 'Tech',       priority: 'ALTA',  added: '2025-11-12', state: 'AHORRANDO', notes: 'Para FF7 Part 3 y para reemplazar la PS5 base que se va a oficina.' },
  { id: 'w-2',  title: 'MacBook Pro 14" M5 Pro',         price: 2400, currency: 'EUR', store: 'Apple',            url: 'apple.com',   category: 'Tech',       priority: 'MEDIA', added: '2026-02-04', state: 'COTIZANDO', notes: 'Reemplazo del M1 cuando salga Sequoia 16.' },
  { id: 'w-3',  title: 'Steam Deck OLED 1TB',            price: 679,  currency: 'EUR', store: 'Valve',            url: 'steamdeck.com', category: 'Tech',     priority: 'ALTA',  added: '2025-10-08', state: 'AHORRANDO', notes: 'Para acabar el backlog en sofá y viajes.' },
  { id: 'w-4',  title: 'Sennheiser HD 600',              price: 350,  currency: 'EUR', store: 'Thomann',          url: 'thomann.de',  category: 'Audio',      priority: 'BAJA',  added: '2025-08-19', state: 'DESEANDO',  notes: 'Headphones planar para mezclar y trabajar.' },
  { id: 'w-5',  title: 'Edifier MR4 monitores',          price: 130,  currency: 'EUR', store: 'PCComponentes',    url: 'pccomponentes.com', category: 'Audio', priority: 'MEDIA', added: '2026-03-22', state: 'COTIZANDO', notes: 'Para reemplazar los altavoces del salón.' },
  { id: 'w-6',  title: 'Silla Herman Miller Aeron · talla B', price: 1450, currency: 'EUR', store: 'HM España', url: 'hermanmiller.com', category: 'Hogar', priority: 'BAJA', added: '2025-07-02', state: 'DESEANDO', notes: 'Pendiente reseña a 5 años de la Embody.' },
  { id: 'w-7',  title: 'Mesa eléctrica Flexispot E7',    price: 489,  currency: 'EUR', store: 'Flexispot',        url: 'flexispot.es', category: 'Hogar',     priority: 'ALTA',  added: '2026-04-30', state: 'AHORRANDO', notes: 'Versión 160×80 negra mate.' },
  { id: 'w-8',  title: 'Lego Pirates of Barracuda Bay',  price: 230,  currency: 'EUR', store: 'Lego Store',       url: 'lego.com',    category: 'Hobby',      priority: 'BAJA',  added: '2026-05-01', state: 'DESEANDO',  notes: 'Edición retirada, watch en BrickLink.' },
  { id: 'w-9',  title: 'Viaje a Japón · 14 noches',      price: 2500, currency: 'EUR', store: 'Skyscanner + Booking', url: 'skyscanner.com', category: 'Viajes', priority: 'ALTA', added: '2025-09-04', state: 'AHORRANDO', notes: 'Otoño 2026. Tokyo · Kyoto · Osaka · Hakone.' },
  { id: 'w-10', title: 'Kindle Paperwhite Signature',    price: 200,  currency: 'EUR', store: 'Amazon',           url: 'amazon.es',   category: 'Libros',     priority: 'MEDIA', added: '2026-05-08', state: 'COTIZANDO', notes: 'El antiguo va lento y la batería ya no aguanta.' },
  { id: 'w-11', title: 'Curso Frontend Masters · anual', price: 240,  currency: 'EUR', store: 'Frontend Masters', url: 'frontendmasters.com', category: 'Educación', priority: 'MEDIA', added: '2026-04-15', state: 'COTIZANDO', notes: 'Renovación enero 2027. Workshops de Svelte y Rust.' },
  { id: 'w-12', title: 'Dominio omnidesk.app',           price: 14,   currency: 'EUR', store: 'Cloudflare',       url: 'cloudflare.com', category: 'Proyecto', priority: 'ALTA', added: '2026-05-14', state: 'COMPRADO', notes: 'Para cuando publique el repo.' },
];

const SAVING_POTS = [
  { id: 'p-1', name: 'Tech · upgrade 2026',  goal: 3500, saved: 1240, color: '#6366f1', icon: '💻', items: ['w-1','w-2'], monthly: 350,
    note: 'Objetivo: PS5 Pro y MacBook M5 para Q4.' },
  { id: 'p-2', name: 'Japón · otoño 2026',   goal: 2500, saved: 850,  color: '#ec4899', icon: '🗾', items: ['w-9'], monthly: 200,
    note: 'Reservar vuelos en julio para mejor precio.' },
  { id: 'p-3', name: 'Setup oficina',         goal: 2200, saved: 320,  color: '#22c55e', icon: '🪑', items: ['w-6','w-7'], monthly: 120,
    note: 'Aeron + mesa eléctrica + monitor extra.' },
  { id: 'p-4', name: 'Steam Deck',            goal: 679,  saved: 510,  color: '#f59e0b', icon: '🎮', items: ['w-3'], monthly: 80,
    note: '85% — falta un mes más.' },
];

const DATA = {
  user: { name: 'Daniel R.', email: 'daniel@omnidesk.app', initials: 'DR' },

  today: new Date(2026, 4, 16), // 16 mayo 2026, sábado

  events: [
    { id: 'e1', title: 'Standup semanal',     day: 18, start: '09:30', end: '10:00', color: '#6366f1', cat: 'work',     notify: 15 },
    { id: 'e2', title: '1:1 con Marta',       day: 19, start: '11:00', end: '11:30', color: '#22c55e', cat: 'work',     notify: 10 },
    { id: 'e3', title: 'Gym · pierna',         day: 18, start: '19:00', end: '20:00', color: '#f59e0b', cat: 'health',   notify: 30 },
    { id: 'e4', title: 'Review PR #142',       day: 20, start: '14:00', end: '15:30', color: '#6366f1', cat: 'work',     notify: 15 },
    { id: 'e5', title: 'Cena con Ana',         day: 22, start: '21:00', end: '23:00', color: '#ec4899', cat: 'social',   notify: 60 },
    { id: 'e6', title: 'Deploy v2.1.0',       day: 21, start: '16:00', end: '17:00', color: '#ef4444', cat: 'work',     notify: 30 },
    { id: 'e7', title: 'Médico · revisión',    day: 25, start: '10:00', end: '11:00', color: '#22c55e', cat: 'health',   notify: 60 },
    { id: 'e8', title: 'Postmortem incidente',day: 26, start: '15:00', end: '16:00', color: '#6366f1', cat: 'work',     notify: 10 },
    { id: 'e9', title: 'Renovar pasaporte',   day: 28, start: '09:00', end: '10:30', color: '#f59e0b', cat: 'personal', notify: 1440 },
    { id: 'e10',title: 'Cumple de Luis',       day: 30, start: '20:00', end: '23:30', color: '#ec4899', cat: 'social',   notify: 1440 },
    { id: 'e11',title: 'Silksong · final',    day: 16, start: '22:00', end: '23:30', color: '#a78bfa', cat: 'personal', notify: 0 },
    { id: 'e12',title: 'Transferencia bote · Japón',day: 1, start: '09:00', end: '09:15', color: '#ef4444', cat: 'finance', notify: 1440 },
    { id: 'e13',title: 'Yoga · sesión',        day: 17, start: '10:00', end: '11:00', color: '#22c55e', cat: 'health',   notify: 15 },
    { id: 'e14',title: 'Reserva sushi · 4 pax',day: 24, start: '20:30', end: '22:30', color: '#ec4899', cat: 'social',   notify: 120 },
  ],

  lists: [
    { id: 'l-games-done', name: 'Videojuegos · completados', icon: '🏆', count: COMPLETED.length, cover: '#6366f1', view: 'grid', sub: 'colección histórica' },
    { id: 'l-games-back', name: 'Videojuegos · backlog',    icon: '🎮', count: BACKLOG.length,   cover: '#a78bfa', view: 'list', sub: 'pendientes + jugando' },
    { id: 'l-books',      name: 'Libros',                    icon: '📚', count: 28,                cover: '#22c55e', view: 'gallery', sub: 'lectura 2024-2026' },
    { id: 'l-music',      name: 'Música · álbumes',          icon: '🎧', count: 128,               cover: '#ec4899', view: 'gallery', sub: 'biblioteca personal' },
    { id: 'l-films',      name: 'Películas',                 icon: '🎬', count: 89,                cover: '#f59e0b', view: 'gallery', sub: 'salón + cine' },
    { id: 'l-shows',      name: 'Series',                    icon: '📺', count: 24,                cover: '#ec4899', view: 'table',   sub: 'en seguimiento' },
    { id: 'l-tools',      name: 'Herramientas dev',          icon: '🛠', count: 18,                cover: '#38bdf8', view: 'list',    sub: 'stack favorito' },
    { id: 'l-recipes',    name: 'Recetas',                   icon: '🍳', count: 42,                cover: '#22c55e', view: 'gallery', sub: 'probadas y buenas' },
  ],

  completed: COMPLETED,
  backlog: BACKLOG,
  wishlist: WISHLIST,
  savingPots: SAVING_POTS,

  notes: [
    { id: 'n1', title: 'Arquitectura · OmniDesk v2', icon: '🏛', tags: ['arquitectura','proyecto'], pinned: true,  updated: 'hace 2 h',  preview: 'Mover el scheduler a un worker dedicado para no bloquear el event loop del API.' },
    { id: 'n2', title: 'Receta · pan de masa madre',  icon: '🍞', tags: ['recetas'],                  pinned: true,  updated: 'ayer',     preview: '500 g harina, 350 g agua, 100 g masa madre activa. Autólisis 1 h.' },
    { id: 'n3', title: 'DDIA cap. 7 · transacciones', icon: '📘', tags: ['libros','lectura'],         pinned: false, updated: 'hace 3 d', preview: 'Transacciones distribuidas y consenso. ACID vs BASE.' },
    { id: 'n4', title: 'Postmortem · caída 13 mayo',  icon: '🔥', tags: ['trabajo','sre'],            pinned: false, updated: 'hace 4 d', preview: 'Causa raíz: connection pool del Prisma se agotó tras un spike.' },
    { id: 'n5', title: 'Setlist · jam casera junio',  icon: '🎸', tags: ['música'],                   pinned: false, updated: 'hace 1 sem', preview: 'Wish You Were Here, Black, Hotel California.' },
    { id: 'n6', title: 'Diario · viaje a Lisboa',     icon: '✈️', tags: ['viajes','diario'],          pinned: false, updated: 'hace 2 sem', preview: 'Día 1. Tram 28 a Alfama. Cena en Time Out Market.' },
    { id: 'n7', title: 'Snippets · TypeScript 5',     icon: '⚡', tags: ['código'],                    pinned: false, updated: 'hace 3 sem', preview: 'Discriminated unions, branded types, satisfies operator.' },
    { id: 'n8', title: 'Idea · podcast indie devs',   icon: '🎙', tags: ['proyecto','ideas'],         pinned: false, updated: 'hace 1 mes', preview: 'Charlas de 30 min con devs solo-founders.' },
  ],

  selectedNoteContent: [
    { type: 'h1', text: 'Arquitectura · OmniDesk v2' },
    { type: 'meta', text: 'arquitectura · proyecto · 16 may 2026' },
    { type: 'p', text: 'Después del incidente del 13 de mayo conviene replantear el módulo de notificaciones. El scheduler actual corre dentro del proceso principal del API y, ante un spike de eventos recurrentes, bloquea las peticiones del usuario durante 2-4 segundos.' },
    { type: 'h2', text: 'Propuesta' },
    { type: 'list', items: [
      'Extraer el scheduler a un worker Node.js dedicado.',
      'Cola Redis (BullMQ) para encolar disparos individuales.',
      'El API solo escribe la configuración; el worker la consume.',
      'Backpressure si la cola supera 10 k eventos pendientes.',
    ]},
    { type: 'h2', text: 'Riesgos' },
    { type: 'quote', text: '"Una cola es una solución y también una nueva fuente de bugs." — alguien sabio' },
    { type: 'p', text: 'Hay que cuidar el orden de los recurrentes vs el job at-most-once para evitar duplicar el push. Idempotency key sobre {configId, firedSlot}.' },
    { type: 'h2', text: 'Snippet borrador' },
    { type: 'code', text: 'await queue.add(\'fire\', { configId }, {\n  jobId: `${configId}:${slot}`,\n  removeOnComplete: true,\n});' },
    { type: 'p', text: 'Próxima sesión: maquetar el editor de notificaciones recurrentes con preview del cron y el siguiente disparo en lenguaje natural.' },
  ],

  todos: {
    name: 'Proyecto OmniDesk',
    columns: [
      { id: 'col-backlog',  name: 'Backlog',      color: '#82828c' },
      { id: 'col-progress', name: 'En progreso',  color: '#6366f1' },
      { id: 'col-review',   name: 'En revisión',  color: '#f59e0b' },
      { id: 'col-done',     name: 'Completado',   color: '#22c55e' },
    ],
    items: [
      { id: 't1',  col: 'col-backlog',  title: 'Editor visual de cron para notificaciones recurrentes', priority: 'MEDIA', due: '28 may', tags: ['notifs','ux'] },
      { id: 't2',  col: 'col-backlog',  title: 'Soporte de adjuntos en notas (S3 compatible)',         priority: 'BAJA',  due: '—',      tags: ['notes'] },
      { id: 't3',  col: 'col-backlog',  title: 'Importar Steam · GOG para el backlog',                 priority: 'BAJA',  due: '—',      tags: ['listas','integ.'] },
      { id: 't4',  col: 'col-backlog',  title: 'Vista anual de hábitos tipo GitHub contributions',     priority: 'MEDIA', due: 'jun',    tags: ['hábitos'] },
      { id: 't5',  col: 'col-progress', title: 'Mover scheduler a worker dedicado + BullMQ',           priority: 'ALTA',  due: '22 may', tags: ['backend','sre'] },
      { id: 't6',  col: 'col-progress', title: 'Drag-drop reorder de ítems en Kanban',                 priority: 'MEDIA', due: '20 may', tags: ['frontend'] },
      { id: 't7',  col: 'col-progress', title: 'Tests E2E del flujo de auth + reset password',         priority: 'ALTA',  due: '19 may', tags: ['tests'] },
      { id: 't8',  col: 'col-review',   title: 'PR #142 · Tema claro accesibilidad AA',                priority: 'MEDIA', due: 'hoy',    tags: ['ui','review'] },
      { id: 't9',  col: 'col-review',   title: 'PR #145 · Wishlist + saving pots',                     priority: 'ALTA',  due: 'hoy',    tags: ['finance','feat'] },
      { id: 't10', col: 'col-done',     title: 'Migrar a Angular 18 standalone components',            priority: 'ALTA',  due: '—',      tags: ['migración'] },
      { id: 't11', col: 'col-done',     title: 'Suscripción web-push + VAPID',                          priority: 'ALTA',  due: '—',      tags: ['notifs'] },
      { id: 't12', col: 'col-done',     title: 'Editor TipTap básico de notas',                        priority: 'MEDIA', due: '—',      tags: ['notes'] },
      { id: 't13', col: 'col-done',     title: 'Seed de temas predefinidos',                            priority: 'BAJA',  due: '—',      tags: ['temas'] },
    ],
  },

  habits: [
    { id: 'h1', name: 'Leer 30 min',          emoji: '📖', streak: 14, week: [1,1,1,1,1,1,0], goal: 'diario'   },
    { id: 'h2', name: 'Gym',                  emoji: '🏋️', streak: 6,  week: [1,0,1,1,0,1,0], goal: '4 / sem'  },
    { id: 'h3', name: 'Meditar 10 min',       emoji: '🧘', streak: 22, week: [1,1,1,1,1,1,0], goal: 'diario'   },
    { id: 'h4', name: 'No azúcar añadida',    emoji: '🥗', streak: 4,  week: [1,1,0,1,1,1,0], goal: 'diario'   },
    { id: 'h5', name: 'Sin redes antes 10:00',emoji: '📵', streak: 9,  week: [1,1,1,1,1,1,0], goal: 'diario'   },
    { id: 'h6', name: 'Side project · 1h',    emoji: '💻', streak: 3,  week: [0,1,1,0,1,1,0], goal: '5 / sem'  },
  ],

  expenses: {
    summary: { income: 4280, expense: 2615, balance: 1665, vsLast: +312 },
    categories: [
      { id: 'c1', name: 'Vivienda',           color: '#6366f1', amount: 950, share: 36 },
      { id: 'c2', name: 'Comida · super',     color: '#22c55e', amount: 420, share: 16 },
      { id: 'c3', name: 'Restaurantes',       color: '#f59e0b', amount: 285, share: 11 },
      { id: 'c4', name: 'Transporte',         color: '#38bdf8', amount: 180, share: 7  },
      { id: 'c5', name: 'SaaS · suscrip.',    color: '#ec4899', amount: 215, share: 8  },
      { id: 'c6', name: 'Salud',              color: '#a78bfa', amount: 120, share: 5  },
      { id: 'c7', name: 'Ocio',               color: '#ef4444', amount: 245, share: 9  },
      { id: 'c8', name: 'Otros',              color: '#82828c', amount: 200, share: 8  },
    ],
    budgets: [
      { name: 'Comida · super',  spent: 420, total: 500, color: '#22c55e' },
      { name: 'Restaurantes',    spent: 285, total: 250, color: '#f59e0b' },
      { name: 'SaaS · suscrip.', spent: 215, total: 200, color: '#ec4899' },
      { name: 'Ocio',            spent: 245, total: 300, color: '#ef4444' },
      { name: 'Transporte',      spent: 180, total: 220, color: '#38bdf8' },
    ],
    transactions: [
      { id: 'tx1',  date: '15 may', title: 'GitHub Copilot Pro',     cat: 'SaaS · suscrip.', amount: -10,    tags:['dev']    },
      { id: 'tx2',  date: '15 may', title: 'Mercadona',                cat: 'Comida · super', amount: -68.40, tags:[]         },
      { id: 'tx3',  date: '14 may', title: 'Cursor Pro',                cat: 'SaaS · suscrip.', amount: -20,   tags:['dev']    },
      { id: 'tx4',  date: '14 may', title: 'Cloudflare · dominio',     cat: 'SaaS · suscrip.', amount: -14,   tags:['proyecto'] },
      { id: 'tx5',  date: '13 may', title: 'Cena con Ana · El Pintor', cat: 'Restaurantes',    amount: -42.50,tags:['social'] },
      { id: 'tx6',  date: '12 may', title: 'Nómina · Acme Corp',       cat: 'Salario',         amount: +3850, tags:['income'] },
      { id: 'tx7',  date: '11 may', title: 'Metro · mensual',           cat: 'Transporte',      amount: -54.60,tags:[]         },
      { id: 'tx8',  date: '10 may', title: 'Bote · Japón',              cat: 'Ahorro',          amount: -200,  tags:['pot']    },
      { id: 'tx9',  date: '10 may', title: 'Bote · Tech upgrade',       cat: 'Ahorro',          amount: -350,  tags:['pot']    },
      { id: 'tx10', date: '10 may', title: 'Freelance · landing',       cat: 'Freelance',       amount: +430,  tags:['income'] },
      { id: 'tx11', date: '09 may', title: 'Farmacia · trazadora',      cat: 'Salud',           amount: -23.10,tags:[]         },
      { id: 'tx12', date: '08 may', title: 'Notion AI',                 cat: 'SaaS · suscrip.', amount: -8,    tags:['dev']    },
      { id: 'tx13', date: '06 may', title: 'Alquiler · mayo',           cat: 'Vivienda',        amount: -950,  tags:[]         },
      { id: 'tx14', date: '05 may', title: 'Lidl',                       cat: 'Comida · super', amount: -41.20,tags:[]         },
      { id: 'tx15', date: '04 may', title: 'Steam · Silksong',          cat: 'Ocio',            amount: -19.99,tags:['games']  },
    ],
  },

  notifications: {
    configs: [
      { id: 'nc1', title: 'Standup diario',          message: 'Standup en 5 minutos',         when: 'L-V · 09:25',      channels: ['IN_APP','PUSH'],         type: 'recurring', on: true },
      { id: 'nc2', title: 'Recordatorio · leer',     message: 'Es la hora de leer 30 min',    when: 'diario · 21:00',  channels: ['IN_APP','PUSH'],         type: 'recurring', on: true },
      { id: 'nc3', title: 'Pago de alquiler',        message: 'Mañana se carga el alquiler',  when: 'mensual · día 30',channels: ['IN_APP','EMAIL'],         type: 'recurring', on: true },
      { id: 'nc4', title: 'Bote mensual · Japón',    message: 'Transferir 200€ a la cuenta',  when: 'mensual · día 1', channels: ['IN_APP','PUSH'],         type: 'recurring', on: true },
      { id: 'nc5', title: 'Deploy v2.1.0',           message: 'Ventana de deploy abierta',    when: '21 may · 15:45',  channels: ['IN_APP','PUSH','EMAIL'], type: 'scheduled', on: true },
      { id: 'nc6', title: 'Médico revisión',         message: 'Cita con Dr. García',           when: '25 may · 09:00',  channels: ['PUSH'],                  type: 'scheduled', on: true },
      { id: 'nc7', title: 'Renovar dominio',         message: 'omnidesk.app renueva en 30 d', when: '14 abr · 09:00',  channels: ['EMAIL'],                 type: 'scheduled', on: false },
    ],
    inbox: [
      { id: 'i1', title: 'Standup diario',                 message: 'Standup en 5 minutos',                       when: 'hace 8 min',  read: false, color: '#6366f1' },
      { id: 'i2', title: 'PR #142 listo para review',      message: 'Marta solicitó tu revisión en frontend',     when: 'hace 1 h',    read: false, color: '#f59e0b' },
      { id: 'i3', title: 'Hábito: Meditar 10 min',         message: 'Llevas 22 días seguidos 🎉',                 when: 'hoy · 07:30', read: false, color: '#22c55e' },
      { id: 'i4', title: 'Presupuesto · Restaurantes',     message: 'Has superado el límite mensual en 35€',      when: 'ayer',        read: true,  color: '#ef4444' },
      { id: 'i5', title: 'Wishlist · Steam Deck',           message: 'Solo te faltan 169€ para alcanzar el bote',  when: 'hace 2 d',    read: true,  color: '#a78bfa' },
      { id: 'i6', title: 'Cumple de Luis en 14 días',      message: 'Mira las ideas de regalo en notas',         when: 'hace 3 d',    read: true,  color: '#ec4899' },
    ],
  },

  themes: [
    { id: 'th-obsidian', name: 'Obsidian Dark', isDark: true,  swatch: ['#6366f1','#0b0b0d','#131316'] },
    { id: 'th-notion',   name: 'Notion Light',  isDark: false, swatch: ['#2d2d2d','#fbfaf8','#f5f3ef'] },
    { id: 'th-midnight', name: 'Midnight Blue', isDark: true,  swatch: ['#3b82f6','#0d1117','#161b22'] },
    { id: 'th-forest',   name: 'Forest',        isDark: true,  swatch: ['#22c55e','#0f1a0f','#172217'] },
    { id: 'th-sunset',   name: 'Sunset',        isDark: true,  swatch: ['#f59e0b','#1a0f00','#241606'] },
  ],
};

window.DATA = DATA;

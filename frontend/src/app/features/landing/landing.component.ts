import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

interface PriceTier {
  badge?: string;
  eyebrow: string;
  price: string;
  priceSuffix?: string;
  blurb: string;
  features: string[];
  ctaLabel: string;
  ctaRoute?: string;
  ctaHref?: string;
  featured?: boolean;
}

type ShowcaseTab = 'calendar' | 'lists' | 'notes' | 'wishlist';

const FEATURES: Feature[] = [
  { icon: '📅', title: 'Calendario',     text: 'Mes, semana, día y lista. Drag-drop, eventos con color y notificaciones programadas.' },
  { icon: '📚', title: 'Listas',         text: 'Bibliotecas con campos personalizados. Grid · Tabla · Galería · Lista. Sin plantillas: configurás todo.' },
  { icon: '📝', title: 'Notas',          text: 'Editor TipTap con bloques, código, citas y portada. Auto-guardado e historial.' },
  { icon: '✓',  title: 'TO-DO Kanban',   text: 'Columnas configurables, drag-drop, prioridades y fechas límite opcionales.' },
  { icon: '🔥', title: 'Hábitos',         text: 'Tracking semanal con rachas, días activos y metas. Recordatorios por canal.' },
  { icon: '💰', title: 'Wishlist',       text: 'Saving pots con barra de progreso. Cotiza objetos y mira cuándo te los puedes permitir.' },
  { icon: '🔔', title: 'Notificaciones', text: 'In-app, push del navegador y email. Cron visual para recurrentes.' },
  { icon: '🎨', title: 'Temas',          text: '12 presets incluidos + editor de colores, tipografía y radio. Todo cambia en vivo.' },
];

const TIERS: PriceTier[] = [
  {
    eyebrow: 'Self-hosted',
    price: '0€',
    blurb: 'para siempre · MIT',
    features: [
      '✓ Todo el código en GitHub',
      '✓ Docker compose listo',
      '✓ Todos los módulos',
      '✓ Notificaciones push y email',
      '✓ Sin límite de espacio',
      '✓ Backup exportable',
    ],
    ctaLabel: 'Ver en GitHub',
    ctaHref: 'https://github.com',
  },
  {
    badge: 'RECOMENDADO',
    eyebrow: 'Demo en la nube',
    price: '0€',
    blurb: 'probar sin instalar',
    features: [
      '✓ Tu cuenta en demo.omnidesk.app',
      '✓ Todos los módulos',
      '✓ Notificaciones push reales',
      '✓ 1 GB de datos',
      '✓ Cancela cuando quieras',
      '✓ Datos exportables siempre',
    ],
    ctaLabel: 'Probar ahora →',
    ctaRoute: '/auth/register',
    featured: true,
  },
  {
    eyebrow: 'Apoyo opcional',
    price: '5€',
    priceSuffix: '/mes',
    blurb: 'solo si lo usas y te gusta',
    features: [
      '☕ Pagás un café al mes',
      '☕ Acceso a roadmap privado',
      '☕ Tu nombre en CONTRIBUTORS.md',
      '☕ Sticker físico (envío gratis)',
      '☕ Cancelás cuando quieras',
      '☕ Sin features bloqueadas',
    ],
    ctaLabel: 'Donar en GitHub Sponsors',
    ctaHref: 'https://github.com/sponsors',
  },
];

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="landing">
      <!-- ─── Sticky Nav ─── -->
      <header class="land-nav">
        <div class="land-nav-inner">
          <div class="land-logo">
            <div class="logo-mark">O</div>
            <span class="brand">OmniDesk</span>
            <span class="version-chip mono">v3 · self-hosted</span>
          </div>
          <nav class="land-nav-links">
            <a (click)="scrollTo('features', $event)" href="#features">Features</a>
            <a (click)="scrollTo('demo', $event)" href="#demo">Demo</a>
            <a (click)="scrollTo('pricing', $event)" href="#pricing">Pricing</a>
            <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
          </nav>
          <div class="nav-actions">
            <a routerLink="/auth/login" class="btn btn-ghost">Iniciar sesión</a>
            <a routerLink="/auth/register" class="btn btn-primary">Crear cuenta</a>
          </div>
        </div>
      </header>

      <!-- ─── Hero ─── -->
      <section class="land-hero">
        <div class="land-hero-bg"></div>
        <div class="land-container">
          <div class="land-hero-grid">
            <div>
              <div class="uppercase-tag eyebrow-primary">
                <span class="status-dot"></span>
                v3 · publicada {{ today }}
              </div>
              <h1 class="land-h1">
                Tu segundo cerebro,<br />
                <span class="accent">en tu propio servidor</span>.
              </h1>
              <p class="land-lead">
                Calendario, listas, notas, tareas, hábitos y wishlist en una sola app.
                Diseñada para uso personal · sin ads, sin trackers, sin "premium feature".
                <strong>Todo el código es tuyo.</strong>
              </p>
              <div class="cta-group">
                <a routerLink="/auth/register" class="btn btn-primary btn-lg">Probar la demo →</a>
                <a href="https://github.com" target="_blank" rel="noopener" class="btn btn-lg">🐙 Star en GitHub</a>
              </div>
              <div class="hero-bullets mono">
                <span>✓ Self-hosted</span>
                <span>✓ MIT license</span>
                <span>✓ Docker compose</span>
                <span>✓ PWA · offline</span>
              </div>
            </div>

            <!-- Fake app preview -->
            <div class="land-preview-wrap">
              <div class="land-app-preview">
                <div class="land-app-chrome">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                  <span class="chrome-url mono">omnidesk.app · dashboard</span>
                </div>
                <div class="land-app-body">
                  <div class="land-app-side">
                    @for (n of sidebarItems; track n; let i = $index) {
                      <div class="side-item" [class.active]="i === 0">{{ n }}</div>
                    }
                  </div>
                  <div class="land-app-main">
                    <div class="uppercase-tag" style="font-size: 9px;">{{ todayLabel }}</div>
                    <div class="main-greeting">Buenos días.</div>
                    <div class="stats-grid">
                      @for (s of statTiles; track s.label) {
                        <div class="stat-tile">
                          <div class="stat-label mono">{{ s.label }}</div>
                          <div class="stat-value mono" [style.color]="s.color">{{ s.value }}</div>
                        </div>
                      }
                    </div>
                    <div class="next-tile">
                      <div class="uppercase-tag" style="font-size: 9px;">PRÓXIMO</div>
                      <div class="next-row">
                        <span class="next-bar"></span>
                        <div>
                          <div class="next-title">Standup semanal</div>
                          <div class="mono next-time">L 09:30</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Features ─── -->
      <section class="land-section" id="features">
        <div class="land-container">
          <div class="uppercase-tag eyebrow-primary">todo lo que necesitas</div>
          <h2 class="land-h2">Una sola app · ocho herramientas</h2>
          <p class="land-sub">Inspirada en lo bueno de Notion y Obsidian. Hecha para tu día a día.</p>
          <div class="land-features">
            @for (f of features; track f.title) {
              <div class="land-feature">
                <div class="land-feature-icon">{{ f.icon }}</div>
                <div class="feature-title">{{ f.title }}</div>
                <div class="feature-text">{{ f.text }}</div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ─── Showcase ─── -->
      <section class="land-section land-showcase-section" id="demo">
        <div class="land-container">
          <div class="uppercase-tag eyebrow-primary">en acción</div>
          <h2 class="land-h2">Mira cómo se siente</h2>
          <p class="land-sub">Cada pantalla está pensada para densidad de información sin renunciar a la respiración.</p>

          <div class="showcase-tabs">
            @for (t of tabs; track t.id) {
              <button type="button" (click)="tab.set(t.id)" [class.active]="tab() === t.id">{{ t.label }}</button>
            }
          </div>

          <div class="land-shot">
            <div class="land-app-chrome">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="chrome-url mono">omnidesk.app · {{ currentTabLabel() }}</span>
            </div>
            <div class="shot-body">
              @switch (tab()) {
                @case ('calendar') {
                  <div class="cal-grid">
                    @for (d of weekdayLabels; track d) {
                      <div class="cal-head mono">{{ d }}</div>
                    }
                    @for (cell of calCells; track cell.idx) {
                      <div class="cal-cell" [class.empty]="!cell.day" [class.today]="cell.day === 16">
                        <div class="cal-day mono">{{ cell.day || '' }}</div>
                        @for (ev of cell.events; track ev.t) {
                          <div class="cal-event"
                            [style.background-color]="ev.c + '22'"
                            [style.color]="ev.c">{{ ev.t }}</div>
                        }
                      </div>
                    }
                  </div>
                }
                @case ('lists') {
                  <div class="lists-grid">
                    @for (g of demoGames; track g.title) {
                      <div class="lists-card">
                        <div class="lists-cover" [style.background]="g.gradient">{{ g.initial }}</div>
                        <div class="lists-meta">
                          <div class="lists-title">{{ g.title }}</div>
                          <div class="mono lists-sub">{{ g.platform }} · {{ g.year }}</div>
                        </div>
                      </div>
                    }
                  </div>
                }
                @case ('notes') {
                  <div class="notes-pane">
                    <div class="mono notes-tag">arquitectura · proyecto</div>
                    <h3 class="notes-title">Arquitectura · OmniDesk v3</h3>
                    <p class="notes-p">
                      Después del incidente del 13 de mayo conviene replantear el módulo de notificaciones.
                      El scheduler actual corre dentro del proceso principal del API y, ante un spike de eventos
                      recurrentes, bloquea las peticiones del usuario.
                    </p>
                    <h4 class="notes-h">Propuesta</h4>
                    <ul class="notes-list">
                      <li>Extraer el scheduler a un worker Node.js dedicado.</li>
                      <li>Cola Redis (BullMQ) para encolar disparos individuales.</li>
                      <li>Backpressure si la cola supera 10k eventos.</li>
                    </ul>
                    <pre class="mono notes-code">await queue.add('fire', &#123; configId &#125;);</pre>
                  </div>
                }
                @case ('wishlist') {
                  <div class="pots-grid">
                    @for (p of demoPots; track p.name) {
                      <div class="pot-card">
                        <div class="pot-head">
                          <span class="pot-icon">{{ p.icon }}</span>
                          <div>
                            <div class="pot-name">{{ p.name }}</div>
                            <div class="mono pot-amount">{{ p.saved }}€ / {{ p.goal }}€</div>
                          </div>
                        </div>
                        <div class="pot-bar">
                          <span [style.width.%]="p.saved / p.goal * 100" [style.background]="p.color"></span>
                        </div>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Pricing ─── -->
      <section class="land-section" id="pricing">
        <div class="land-container">
          <div class="uppercase-tag eyebrow-primary">pricing</div>
          <h2 class="land-h2">Gratis. Siempre. En serio.</h2>
          <p class="land-sub">Cero ads, cero trackers, cero "premium feature". Si te gusta, podés apoyar el proyecto con una donación.</p>

          <div class="land-pricing">
            @for (tier of tiers; track tier.eyebrow) {
              <div class="price-card" [class.featured]="tier.featured">
                @if (tier.badge) {
                  <div class="price-badge">{{ tier.badge }}</div>
                }
                <div class="uppercase-tag" [class.eyebrow-primary]="tier.featured">{{ tier.eyebrow }}</div>
                <div class="price-amount mono">
                  {{ tier.price }}<span class="price-suffix">{{ tier.priceSuffix }}</span>
                </div>
                <div class="mono price-blurb">{{ tier.blurb }}</div>
                <ul class="price-features">
                  @for (line of tier.features; track line) {
                    <li>{{ line }}</li>
                  }
                </ul>
                @if (tier.ctaRoute) {
                  <a [routerLink]="tier.ctaRoute" class="btn btn-block" [class.btn-primary]="tier.featured">{{ tier.ctaLabel }}</a>
                } @else if (tier.ctaHref) {
                  <a [href]="tier.ctaHref" target="_blank" rel="noopener" class="btn btn-block">{{ tier.ctaLabel }}</a>
                }
              </div>
            }
          </div>

          <div class="land-honest">
            <div class="uppercase-tag eyebrow-accent">nota honesta</div>
            <p>
              OmniDesk lo construyo yo solo en mi tiempo libre. No es un negocio.
              Es una herramienta personal que liberé porque pensé que a alguien más le sería útil.
              Sin SLA, sin equipo de soporte, sin promesas — pero con código limpio,
              issues respondidos y un roadmap honesto en GitHub.
            </p>
          </div>
        </div>
      </section>

      <!-- ─── Footer ─── -->
      <footer class="land-footer">
        <div class="land-container footer-inner">
          <div class="footer-brand">
            <div class="logo-mark sm">O</div>
            <span>OmniDesk</span>
            <span class="mono footer-credit">construido en abierto · 2025–2026</span>
          </div>
          <div class="mono footer-links">
            <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
            <a href="#">Docs</a>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .landing { color: var(--color-text); background: var(--color-background); min-height: 100vh; }

    /* ─ Nav ─ */
    .land-nav {
      position: sticky; top: 0; z-index: 50;
      background: color-mix(in srgb, var(--color-background) 85%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-border-soft);
    }
    .land-nav-inner {
      max-width: 1180px; margin: 0 auto;
      padding: 14px 32px;
      display: flex; align-items: center; gap: 28px;
    }
    .land-logo { display: flex; align-items: center; gap: 10px; }
    .logo-mark {
      width: 28px; height: 28px; border-radius: 6px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
      display: grid; place-items: center;
      color: #fff; font-weight: 700; font-size: 13px;
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 40%, transparent);
    }
    .logo-mark.sm { width: 22px; height: 22px; font-size: 11px; }
    .brand { font-weight: 600; font-size: 15px; }
    .version-chip {
      font-size: 9px; padding: 2px 6px;
      border: 1px solid var(--color-border-soft);
      border-radius: 999px;
      color: var(--color-text-faint);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .land-nav-links {
      display: flex; gap: 24px;
      font-size: 13px;
      margin-left: 32px;
      flex: 1;
    }
    .land-nav-links a {
      color: var(--color-text-muted);
      text-decoration: none;
      cursor: pointer;
      transition: color 120ms;
    }
    .land-nav-links a:hover { color: var(--color-text); }

    .nav-actions { display: flex; gap: 8px; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
      transition: background 120ms, border-color 120ms, transform 120ms;
    }
    .btn:hover { background: var(--color-surface-hover); border-color: var(--color-text-faint); }
    .btn-primary {
      background: var(--color-primary);
      color: #fff;
      border-color: transparent;
      font-weight: 500;
    }
    .btn-primary:hover { background: var(--color-primary-soft); border-color: transparent; transform: translateY(-1px); }
    .btn-ghost { background: transparent; border-color: transparent; color: var(--color-text-muted); }
    .btn-ghost:hover { background: var(--color-surface-hover); color: var(--color-text); }
    .btn-lg { padding: 10px 18px; font-size: 14px; }
    .btn-block { width: 100%; padding: 10px; }

    /* ─ Hero ─ */
    .land-hero { position: relative; padding: 80px 0 100px; overflow: hidden; }
    .land-hero-bg {
      position: absolute; inset: 0; z-index: 0;
      background:
        radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-primary) 14%, transparent) 0%, transparent 40%),
        radial-gradient(circle at 80% 60%, color-mix(in srgb, var(--color-secondary) 10%, transparent) 0%, transparent 50%),
        radial-gradient(circle, var(--color-border-soft) 1px, transparent 1px);
      background-size: cover, cover, 22px 22px;
      pointer-events: none;
      opacity: 0.6;
    }
    .land-container { max-width: 1180px; margin: 0 auto; padding: 0 32px; position: relative; z-index: 1; }
    .land-hero-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 56px;
      align-items: center;
    }
    @media (max-width: 900px) {
      .land-hero-grid { grid-template-columns: 1fr; }
      .land-nav-links { display: none; }
    }
    .eyebrow-primary { color: var(--color-primary) !important; }
    .eyebrow-accent { color: var(--color-accent) !important; }
    .status-dot {
      display: inline-block; width: 6px; height: 6px; border-radius: 50%;
      background: var(--color-success);
      margin-right: 8px; vertical-align: middle;
    }
    .land-h1 {
      font-size: clamp(2.4rem, 5.6vw, 3.5rem);
      font-weight: 700;
      letter-spacing: -0.035em;
      line-height: 1.04;
      margin: 12px 0 20px;
    }
    .land-h1 .accent { color: var(--color-primary); }
    .land-lead {
      font-size: 17px;
      color: var(--color-text-muted);
      line-height: 1.6;
      max-width: 520px;
    }
    .land-lead strong { color: var(--color-text); }
    .cta-group { display: flex; gap: 12px; flex-wrap: wrap; margin: 24px 0 18px; }
    .hero-bullets {
      display: flex; gap: 16px; flex-wrap: wrap;
      font-size: 12px;
      color: var(--color-text-faint);
    }

    /* ─ Fake app preview ─ */
    .land-preview-wrap { position: relative; }
    .land-app-preview {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4),
                  0 0 0 1px color-mix(in srgb, var(--color-primary) 10%, transparent);
      overflow: hidden;
      transform: perspective(1400px) rotateY(-4deg) rotateX(3deg) scale(1.02);
      transition: transform 400ms;
    }
    .land-app-preview:hover { transform: perspective(1400px) rotateY(-2deg) rotateX(1.5deg) scale(1.04); }

    .land-app-chrome {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--color-border-soft);
      background: var(--color-surface-2);
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #22c55e; }
    .chrome-url { font-size: 11px; color: var(--color-text-faint); margin-left: 8px; }

    .land-app-body { display: grid; grid-template-columns: 120px 1fr; min-height: 280px; }
    .land-app-side {
      background: var(--color-surface);
      border-right: 1px solid var(--color-border-soft);
      padding: 12px 8px;
    }
    .side-item {
      padding: 6px 8px; font-size: 11px;
      border-radius: 5px;
      color: var(--color-text-muted);
      border-left: 2px solid transparent;
      margin-bottom: 2px;
    }
    .side-item.active {
      color: var(--color-text);
      background: var(--color-surface-hover);
      border-left-color: var(--color-primary);
    }
    .land-app-main { padding: 16px; }
    .main-greeting { font-size: 17px; font-weight: 600; margin: 2px 0 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .stat-tile {
      background: var(--color-surface-2);
      padding: 8px;
      border-radius: 5px;
      border: 1px solid var(--color-border-soft);
    }
    .stat-label { font-size: 8px; color: var(--color-text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 16px; font-weight: 600; margin-top: 2px; }
    .next-tile {
      margin-top: 10px; padding: 8px;
      background: var(--color-surface-2); border-radius: 5px;
      border: 1px solid var(--color-border-soft);
    }
    .next-row { display: flex; gap: 8px; align-items: center; margin-top: 2px; }
    .next-bar { width: 3px; height: 18px; background: var(--color-primary); border-radius: 3px; }
    .next-title { font-size: 11px; }
    .next-time { font-size: 9px; color: var(--color-text-faint); }

    /* ─ Sections ─ */
    .land-section { padding: 90px 0; }
    .land-h2 {
      font-size: clamp(1.8rem, 3.4vw, 2.4rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin: 8px 0 12px;
    }
    .land-sub {
      font-size: 16px;
      color: var(--color-text-muted);
      max-width: 640px;
      line-height: 1.55;
    }

    /* ─ Features ─ */
    .land-features {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-top: 36px;
    }
    @media (max-width: 900px) { .land-features { grid-template-columns: repeat(2, 1fr); } }
    .land-feature {
      background: var(--color-surface);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius);
      padding: 22px;
      transition: border-color 150ms, transform 150ms;
    }
    .land-feature:hover { border-color: var(--color-primary); transform: translateY(-2px); }
    .land-feature-icon {
      width: 36px; height: 36px;
      background: var(--color-primary-ghost);
      border-radius: var(--radius-sm);
      display: grid; place-items: center;
      margin-bottom: 14px;
      font-size: 18px;
    }
    .feature-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .feature-text { font-size: 13px; color: var(--color-text-muted); line-height: 1.55; }

    /* ─ Showcase ─ */
    .land-showcase-section {
      background: var(--color-surface);
      border-top: 1px solid var(--color-border-soft);
      border-bottom: 1px solid var(--color-border-soft);
    }
    .showcase-tabs {
      display: flex; gap: 4px; padding: 4px;
      background: var(--color-background);
      border-radius: 8px;
      border: 1px solid var(--color-border);
      width: fit-content;
      margin: 24px auto;
    }
    .showcase-tabs button {
      padding: 6px 14px;
      border-radius: 5px;
      border: none; cursor: pointer;
      background: transparent;
      color: var(--color-text-muted);
      font-size: 13px;
      font-family: inherit;
    }
    .showcase-tabs button.active {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }
    .land-shot {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
    }
    .shot-body { padding: 24px; min-height: 380px; background: var(--color-background); }

    /* showcase: calendar */
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .cal-head { padding: 6px; text-align: center; font-size: 11px; color: var(--color-text-faint); }
    .cal-cell {
      min-height: 50px; padding: 4px;
      background: var(--color-surface);
      border: 1px solid var(--color-border-soft);
      border-radius: 4px;
    }
    .cal-cell.empty { background: transparent; border-color: transparent; }
    .cal-day { font-size: 11px; font-weight: 500; }
    .cal-cell.today .cal-day { color: var(--color-primary); font-weight: 700; }
    .cal-event {
      font-size: 9px; margin-top: 2px; padding: 1px 4px; border-radius: 2px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* showcase: lists */
    .lists-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    @media (max-width: 700px) { .lists-grid { grid-template-columns: repeat(2, 1fr); } }
    .lists-card {
      background: var(--color-surface);
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--color-border-soft);
    }
    .lists-cover {
      height: 80px; display: grid; place-items: center;
      font-family: var(--font-serif);
      font-size: 38px; font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
    }
    .lists-meta { padding: 8px; }
    .lists-title { font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lists-sub { font-size: 10px; color: var(--color-text-faint); }

    /* showcase: notes */
    .notes-pane { max-width: 600px; margin: 0 auto; }
    .notes-tag { font-size: 12px; color: var(--color-text-faint); }
    .notes-title { font-size: 22px; font-weight: 700; margin: 6px 0 14px; }
    .notes-p { font-size: 13px; line-height: 1.6; color: var(--color-text-muted); margin-bottom: 12px; }
    .notes-h { font-size: 16px; font-weight: 600; margin: 14px 0 8px; }
    .notes-list { font-size: 13px; line-height: 1.6; padding-left: 20px; color: var(--color-text); margin: 0 0 12px; }
    .notes-code {
      background: var(--color-surface-2);
      border-radius: 4px;
      padding: 10px;
      font-size: 11px;
      margin-top: 12px;
      border: 1px solid var(--color-border-soft);
      overflow-x: auto;
    }

    /* showcase: wishlist pots */
    .pots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    @media (max-width: 700px) { .pots-grid { grid-template-columns: 1fr; } }
    .pot-card {
      background: var(--color-surface);
      border-radius: 6px; padding: 12px;
      border: 1px solid var(--color-border-soft);
    }
    .pot-head { display: flex; align-items: center; gap: 8px; }
    .pot-icon { font-size: 18px; }
    .pot-name { font-size: 12px; font-weight: 600; }
    .pot-amount { font-size: 11px; color: var(--color-text-faint); }
    .pot-bar {
      height: 4px; background: var(--color-surface-2);
      border-radius: 2px; margin-top: 8px; overflow: hidden;
    }
    .pot-bar span { display: block; height: 100%; }

    /* ─ Pricing ─ */
    .land-pricing {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
      margin-top: 36px;
    }
    @media (max-width: 900px) { .land-pricing { grid-template-columns: 1fr; } }
    .price-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border-soft);
      border-radius: 12px;
      padding: 24px;
      position: relative;
      display: flex; flex-direction: column;
    }
    .price-card.featured {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 1px var(--color-primary-ghost),
                  0 16px 48px color-mix(in srgb, var(--color-primary) 18%, transparent);
      transform: scale(1.03);
    }
    .price-badge {
      position: absolute; top: -10px; right: 16px;
      padding: 3px 10px;
      background: var(--color-primary);
      color: #fff;
      font-size: 10px;
      font-family: var(--font-mono);
      font-weight: 600;
      letter-spacing: 0.12em;
      border-radius: 4px;
    }
    .price-amount {
      font-size: 40px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 4px 0 0;
    }
    .price-suffix { font-size: 14px; color: var(--color-text-faint); }
    .price-blurb { font-size: 12px; color: var(--color-text-muted); margin-bottom: 12px; }
    .price-features {
      list-style: none; padding: 0;
      margin: 18px 0;
      font-size: 13px;
      color: var(--color-text-muted);
      line-height: 1.9;
      flex: 1;
    }
    .price-features li {
      border-bottom: 1px solid var(--color-border-soft);
      padding: 2px 0;
    }
    .price-features li:last-child { border-bottom: none; }

    .land-honest {
      background: var(--color-surface);
      border: 1px dashed var(--color-border);
      border-radius: 10px;
      padding: 18px 22px;
      max-width: 720px;
      margin: 32px auto 0;
    }
    .land-honest p {
      font-size: 14px;
      color: var(--color-text-muted);
      margin: 8px 0 0;
      line-height: 1.6;
    }

    /* ─ Footer ─ */
    .land-footer {
      padding: 28px 0;
      border-top: 1px solid var(--color-border-soft);
    }
    .footer-inner {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 14px;
    }
    .footer-brand { display: flex; gap: 8px; align-items: center; font-size: 13px; font-weight: 500; }
    .footer-credit { font-size: 11px; color: var(--color-text-faint); }
    .footer-links { display: flex; gap: 14px; font-size: 11px; }
    .footer-links a { color: var(--color-text-muted); text-decoration: none; }
    .footer-links a:hover { color: var(--color-text); }
  `],
})
export class LandingComponent {
  protected readonly features = FEATURES;
  protected readonly tiers = TIERS;
  protected readonly sidebarItems = ['Dashboard', 'Calendario', 'Listas', 'Notas', 'TO-DO', 'Hábitos', 'Finanzas'];
  protected readonly statTiles = [
    { label: 'BALANCE',     value: '+1.665€', color: 'var(--color-success)' },
    { label: 'RACHA',       value: '22d',     color: 'var(--color-accent)' },
    { label: 'TAREAS HOY',  value: '3',       color: 'var(--color-primary)' },
    { label: 'EVENTOS',     value: '6',       color: 'var(--color-text)' },
  ];
  protected readonly tabs: { id: ShowcaseTab; label: string }[] = [
    { id: 'calendar', label: 'Calendario' },
    { id: 'lists',    label: 'Listas' },
    { id: 'notes',    label: 'Notas' },
    { id: 'wishlist', label: 'Wishlist' },
  ];
  protected readonly tab = signal<ShowcaseTab>('calendar');

  protected readonly weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  protected readonly calCells = Array.from({ length: 35 }, (_, i) => {
    const d = i - 4 + 1;
    const day = d >= 1 && d <= 31 ? d : null;
    const events = (
      { 16: [{ t: 'Silksong',   c: '#a78bfa' }],
        18: [{ t: 'Standup',    c: '#6366f1' }, { t: 'Gym',     c: '#f59e0b' }],
        19: [{ t: '1:1 Marta',  c: '#22c55e' }],
        21: [{ t: 'Deploy',     c: '#ef4444' }],
        22: [{ t: 'Cena Ana',   c: '#ec4899' }],
        25: [{ t: 'Médico',     c: '#22c55e' }] } as Record<number, { t: string; c: string }[]>
    )[day ?? -1] ?? [];
    return { idx: i, day, events };
  });

  protected readonly demoGames = [
    { title: 'Hades II',          platform: 'PC',  year: 2026, initial: 'H', gradient: 'linear-gradient(135deg, #6366f1, #6366f166)' },
    { title: 'Silksong',          platform: 'PC',  year: 2026, initial: 'S', gradient: 'linear-gradient(135deg, #22c55e, #22c55e66)' },
    { title: 'Balatro',           platform: 'PS5', year: 2025, initial: 'B', gradient: 'linear-gradient(135deg, #f59e0b, #f59e0b66)' },
    { title: 'Persona 5 Royal',   platform: 'PS5', year: 2025, initial: 'P', gradient: 'linear-gradient(135deg, #ec4899, #ec489966)' },
    { title: 'Tunic',             platform: 'PC',  year: 2025, initial: 'T', gradient: 'linear-gradient(135deg, #38bdf8, #38bdf866)' },
    { title: 'Hollow Knight',     platform: 'PC',  year: 2024, initial: 'H', gradient: 'linear-gradient(135deg, #a78bfa, #a78bfa66)' },
    { title: 'Outer Wilds',       platform: 'PC',  year: 2024, initial: 'O', gradient: 'linear-gradient(135deg, #ef4444, #ef444466)' },
    { title: 'Disco Elysium',     platform: 'PC',  year: 2024, initial: 'D', gradient: 'linear-gradient(135deg, #84cc16, #84cc1666)' },
  ];

  protected readonly demoPots = [
    { name: 'MacBook M5',  icon: '💻', saved: 1200, goal: 2400, color: '#6366f1' },
    { name: 'Viaje Japón', icon: '🗾', saved: 800,  goal: 3500, color: '#ec4899' },
    { name: 'Curso DDIA',  icon: '📚', saved: 240,  goal: 300,  color: '#22c55e' },
    { name: 'Switch 2',    icon: '🎮', saved: 100,  goal: 500,  color: '#f59e0b' },
  ];

  protected get today(): string {
    return new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  protected get todayLabel(): string {
    return new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
  }

  protected currentTabLabel(): string {
    return this.tabs.find((t) => t.id === this.tab())?.label.toLowerCase() ?? '';
  }

  protected scrollTo(id: string, ev: Event): void {
    ev.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}

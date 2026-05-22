import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-animated-bg',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animated-bg-root">
      <div class="gradient-layer"></div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="noise-layer"></div>
    </div>
  `,
  styles: [`
    .animated-bg-root {
      position: absolute;
      inset: 0;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }

    .gradient-layer {
      position: absolute;
      inset: -10%;
      background:
        radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent 55%),
        radial-gradient(circle at 80% 30%, color-mix(in srgb, var(--color-secondary) 18%, transparent), transparent 55%),
        radial-gradient(circle at 50% 80%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 60%),
        linear-gradient(135deg, var(--color-background) 0%, color-mix(in srgb, var(--color-primary) 6%, var(--color-background)) 50%, var(--color-background) 100%);
      background-size: 200% 200%, 200% 200%, 200% 200%, 400% 400%;
      animation: omni-gradient 22s ease-in-out infinite;
      filter: saturate(1.1);
    }

    @keyframes omni-gradient {
      0%, 100% { background-position: 0% 50%, 100% 50%, 50% 100%, 0% 50%; }
      50% { background-position: 100% 50%, 0% 50%, 50% 0%, 100% 50%; }
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.35;
      mix-blend-mode: screen;
    }
    .orb-1 {
      width: 380px; height: 380px;
      background: var(--color-primary);
      top: -120px; left: -80px;
      animation: orb-float-a 18s ease-in-out infinite;
    }
    .orb-2 {
      width: 320px; height: 320px;
      background: var(--color-secondary);
      bottom: -100px; right: -60px;
      animation: orb-float-b 24s ease-in-out infinite;
    }
    .orb-3 {
      width: 240px; height: 240px;
      background: var(--color-accent);
      top: 40%; right: 35%;
      animation: orb-float-c 30s ease-in-out infinite;
      opacity: 0.22;
    }

    @keyframes orb-float-a {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(60px, 80px) scale(1.15); }
    }
    @keyframes orb-float-b {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-80px, -60px) scale(1.1); }
    }
    @keyframes orb-float-c {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(120px, -80px) scale(0.9); }
      66% { transform: translate(-80px, 60px) scale(1.1); }
    }

    .noise-layer {
      position: absolute;
      inset: 0;
      opacity: 0.04;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
  `],
})
export class AnimatedBgComponent {}

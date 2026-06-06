import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

type Doc = 'terms' | 'privacy';

@Component({
  selector: 'app-legal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-background text-text">
      <div class="max-w-2xl mx-auto px-4 py-10">
        <a routerLink="/" class="text-xs text-text-muted hover:text-text">← Back to OmniDesk</a>

        <div class="flex gap-4 mt-4 mb-6 text-sm">
          <a
            routerLink="/legal/terms"
            [class]="doc() === 'terms' ? 'text-primary font-medium' : 'text-text-muted hover:text-text'"
          >Terms of Service</a>
          <a
            routerLink="/legal/privacy"
            [class]="doc() === 'privacy' ? 'text-primary font-medium' : 'text-text-muted hover:text-text'"
          >Privacy Policy</a>
        </div>

        @if (doc() === 'terms') {
          <article class="prose prose-invert max-w-none">
            <h1>Terms of Service</h1>
            <p class="text-text-muted text-sm">Version 2026-06 · Effective 2026-06-05</p>
            <p>
              OmniDesk is a self-hosted, open-source personal organizer. The public instance is run
              by a single individual in their spare time, for free, as a hobby and dogfooding project.
            </p>
            <h2>No SLA, no guarantees</h2>
            <p>
              The service is provided <strong>"as is", with no service-level agreement and no
              guarantees</strong> of availability or durability. It may be slow, go down, lose data,
              or shut down at any time. <strong>Do not store anything you cannot afford to lose</strong>
              — export your data regularly.
            </p>
            <h2>Your account</h2>
            <p>
              Provide a valid email and keep your credentials secure. One person, one account; you are
              responsible for activity under it. The operator may suspend or remove accounts that abuse
              the service.
            </p>
            <h2>Acceptable use</h2>
            <p>
              No illegal or infringing content, no attempts to break or overload the service, no spam,
              and no exceeding published quotas or rate limits.
            </p>
            <h2>Your content</h2>
            <p>
              You keep all rights to your content. The operator gets only the technical permissions
              needed to store and show it back to you. <strong>Your data is never sold.</strong>
            </p>
            <h2>Termination</h2>
            <p>
              You can delete your account at any time (soft for a short grace period, then permanent).
              The operator may terminate accounts that violate these terms.
            </p>
            <h2>Liability</h2>
            <p>
              To the maximum extent permitted by law, the operator is not liable for any loss of data
              or any indirect or consequential damages. The service is free; you accept it at your own
              risk.
            </p>
            <p class="text-text-muted text-sm">
              The full canonical text lives in <code>docs/legal/terms.md</code> in the repository.
            </p>
          </article>
        } @else {
          <article class="prose prose-invert max-w-none">
            <h1>Privacy Policy</h1>
            <p class="text-text-muted text-sm">Version 2026-06 · Effective 2026-06-05</p>
            <ul>
              <li><strong>We never sell your data. Ever.</strong></li>
              <li>No third-party tracking, no ads, no analytics SDKs.</li>
              <li>We store only what's needed to run your account and features.</li>
              <li>You can export everything and delete everything at any time.</li>
            </ul>
            <h2>What we collect</h2>
            <p>
              Account data (email, a bcrypt hash of your password, display name, optional avatar,
              timezone, timestamps), your content, minimal operational logs, an audit log of
              destructive actions (with IP and user agent for security), and — if you enable 2FA —
              a TOTP secret and hashed backup codes.
            </p>
            <h2>How we use it</h2>
            <p>
              Only to operate your account, provide features, secure the service, and send essential
              account emails. No profiling, no advertising, no selling.
            </p>
            <h2>Sharing</h2>
            <p>
              Only with the infrastructure needed to run the instance (hosting, SMTP, and the captcha
              provider on sign-up, which receives a token and your IP) or where required by law.
            </p>
            <h2>Retention &amp; deletion</h2>
            <p>
              Data is kept while your account is active. Deletion soft-deletes for a short grace period
              (recoverable via the emailed link), then permanently erases your data and uploaded files.
            </p>
            <h2>Your rights</h2>
            <p>Access/export, rectify, and delete your data — all available in-app without asking.</p>
            <p class="text-text-muted text-sm">
              The full canonical text lives in <code>docs/legal/privacy.md</code> in the repository.
            </p>
          </article>
        }
      </div>
    </div>
  `,
})
export class LegalComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly doc = toSignal(
    this.route.data.pipe(map((d) => (d['doc'] as Doc) ?? 'terms')),
    { initialValue: 'terms' as Doc },
  );
}

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';

type Status = 'pending' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background px-4">
      <div class="w-full max-w-md bg-surface border border-border rounded p-8 shadow-2xl text-center">
        <h1 class="text-2xl font-semibold mb-4">Account verification</h1>

        @switch (status()) {
          @case ('pending') {
            <p class="text-text-muted">Verifying your account…</p>
          }
          @case ('success') {
            <p class="text-success mb-4">{{ message() }}</p>
            <a
              routerLink="/auth/login"
              class="inline-block px-4 py-2 rounded bg-primary text-white font-medium hover:opacity-90"
            >
              Sign in
            </a>
          }
          @case ('error') {
            <p class="text-danger mb-4">{{ message() }}</p>
            <a routerLink="/auth/register" class="text-primary hover:underline text-sm">
              Back to sign up
            </a>
          }
        }
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly status = signal<Status>('pending');
  protected readonly message = signal<string>('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('error');
      this.message.set('The verification token is missing from the URL');
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: (res) => {
        this.status.set('success');
        this.message.set(res.message);
      },
      error: (err: HttpErrorResponse) => {
        this.status.set('error');
        const body = err.error as { error?: { message?: string | string[] } } | null;
        const msg = body?.error?.message;
        if (Array.isArray(msg)) this.message.set(msg.join('. '));
        else if (typeof msg === 'string') this.message.set(msg);
        else this.message.set('Could not verify the account');
      },
    });
  }
}

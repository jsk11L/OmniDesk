import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { AdminService, AdminStats, AdminUser, AuditEntry } from './admin.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border">
        <h1 class="text-2xl font-semibold">Admin</h1>
        <p class="text-sm text-text-muted">Operate the instance: users, suspension, audit log.</p>
      </header>

      <div class="flex-1 overflow-auto p-6 space-y-8">
        <!-- Stats -->
        @if (stats(); as s) {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            @for (c of statCards(s); track c.label) {
              <div class="bg-surface border border-border rounded p-3 text-center">
                <p class="text-2xl font-bold">{{ c.value }}</p>
                <p class="text-xs text-text-muted">{{ c.label }}</p>
              </div>
            }
          </div>
        }

        <!-- Users -->
        <section>
          <div class="flex items-center justify-between mb-3 gap-3">
            <h2 class="text-sm font-semibold">Users</h2>
            <input
              type="search"
              [(ngModel)]="query"
              (keyup.enter)="search()"
              placeholder="Search email/name…"
              class="px-3 py-1.5 bg-surface border border-border rounded text-sm outline-none focus:border-primary"
            />
          </div>

          <div class="border border-border rounded overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-surface text-text-muted text-xs">
                <tr>
                  <th class="text-left px-3 py-2">User</th>
                  <th class="text-left px-3 py-2">Status</th>
                  <th class="text-left px-3 py-2">Last login</th>
                  <th class="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr class="border-t border-border">
                    <td class="px-3 py-2">
                      <div class="font-medium">{{ u.displayName || '—' }}</div>
                      <div class="text-xs text-text-muted">{{ u.email }}</div>
                    </td>
                    <td class="px-3 py-2 space-x-1">
                      @if (u.isAdmin) { <span class="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">admin</span> }
                      @if (u.isSuspended) { <span class="text-xs px-1.5 py-0.5 rounded bg-danger/20 text-danger">suspended</span> }
                      @if (u.deletedAt) { <span class="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-text-muted">deleting</span> }
                      @if (u.totpEnabledAt) { <span class="text-xs px-1.5 py-0.5 rounded bg-surface-hover">2FA</span> }
                      @if (!u.isEmailVerified) { <span class="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-text-muted">unverified</span> }
                    </td>
                    <td class="px-3 py-2 text-xs text-text-muted">
                      {{ u.lastLoginAt ? (u.lastLoginAt | date: 'd MMM, HH:mm') : 'never' }}
                    </td>
                    <td class="px-3 py-2 text-right whitespace-nowrap">
                      @if (u.isSuspended) {
                        <button type="button" (click)="unsuspend(u)" class="text-xs text-primary hover:underline mr-2">Unsuspend</button>
                      } @else {
                        <button type="button" (click)="suspend(u)" class="text-xs text-text-muted hover:text-danger mr-2">Suspend</button>
                      }
                      @if (u.totpEnabledAt) {
                        <button type="button" (click)="disable2fa(u)" class="text-xs text-text-muted hover:text-text mr-2">Reset 2FA</button>
                      }
                      <button type="button" (click)="remove(u)" class="text-xs text-danger hover:underline">Delete</button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="px-3 py-6 text-center text-text-muted">No users</td></tr>
                }
              </tbody>
            </table>
          </div>

          @if (userPages() > 1) {
            <div class="flex items-center justify-center gap-3 mt-3 text-sm">
              <button type="button" [disabled]="userPage() <= 1" (click)="goUsers(userPage() - 1)" class="px-2 py-1 rounded hover:bg-surface-hover disabled:opacity-40">‹ Prev</button>
              <span class="text-text-muted">Page {{ userPage() }} / {{ userPages() }}</span>
              <button type="button" [disabled]="userPage() >= userPages()" (click)="goUsers(userPage() + 1)" class="px-2 py-1 rounded hover:bg-surface-hover disabled:opacity-40">Next ›</button>
            </div>
          }
        </section>

        <!-- Audit log -->
        <section>
          <h2 class="text-sm font-semibold mb-3">Audit log</h2>
          <div class="border border-border rounded divide-y divide-border">
            @for (e of audit(); track e.id) {
              <div class="px-3 py-2 text-sm flex items-center justify-between gap-3">
                <div>
                  <span class="font-mono text-xs">{{ e.action }}</span>
                  @if (e.entityId) { <span class="text-xs text-text-muted">· {{ e.entityId }}</span> }
                </div>
                <span class="text-xs text-text-muted whitespace-nowrap">{{ e.createdAt | date: 'd MMM, HH:mm' }}</span>
              </div>
            } @empty {
              <p class="px-3 py-6 text-center text-text-muted text-sm">No audit entries</p>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private readonly service = inject(AdminService);
  private readonly dialogs = inject(DialogService);
  private readonly toastr = inject(ToastrService);

  protected readonly stats = signal<AdminStats | null>(null);
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly userPage = signal(1);
  protected readonly userPages = signal(1);
  protected readonly audit = signal<AuditEntry[]>([]);
  protected query = '';

  ngOnInit(): void {
    this.loadStats();
    this.goUsers(1);
    this.loadAudit();
  }

  protected statCards(s: AdminStats): { label: string; value: number }[] {
    return [
      { label: 'Users', value: s.total },
      { label: 'Admins', value: s.admins },
      { label: 'Verified', value: s.verified },
      { label: 'Suspended', value: s.suspended },
      { label: '2FA', value: s.twoFactor },
      { label: 'Deleting', value: s.pendingDeletion },
    ];
  }

  private loadStats(): void {
    this.service.stats().subscribe({ next: (s) => this.stats.set(s), error: () => undefined });
  }

  private loadAudit(): void {
    this.service.auditLog(1).subscribe({ next: (r) => this.audit.set(r.items), error: () => undefined });
  }

  search(): void {
    this.goUsers(1);
  }

  goUsers(page: number): void {
    this.service.users(page, this.query.trim()).subscribe({
      next: (r) => {
        this.users.set(r.items);
        this.userPage.set(r.page);
        this.userPages.set(r.totalPages);
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  suspend(u: AdminUser): void {
    this.service.suspend(u.id).subscribe({
      next: () => {
        this.toastr.success('User suspended');
        this.goUsers(this.userPage());
        this.loadStats();
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  unsuspend(u: AdminUser): void {
    this.service.unsuspend(u.id).subscribe({
      next: () => {
        this.toastr.success('User unsuspended');
        this.goUsers(this.userPage());
        this.loadStats();
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  disable2fa(u: AdminUser): void {
    this.service.disableTwoFactor(u.id).subscribe({
      next: () => {
        this.toastr.success('2FA reset for user');
        this.goUsers(this.userPage());
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  async remove(u: AdminUser): Promise<void> {
    const ok = await this.dialogs.confirm({
      title: 'Delete user',
      message: `Schedule "${u.email}" for permanent deletion?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.service.remove(u.id).subscribe({
      next: () => {
        this.toastr.success('User scheduled for deletion');
        this.goUsers(this.userPage());
        this.loadStats();
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.msg(err)),
    });
  }

  private msg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const m = body?.error?.message;
    if (Array.isArray(m)) return m.join('. ');
    if (typeof m === 'string') return m;
    return 'Something went wrong';
  }
}

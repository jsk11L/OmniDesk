import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const PLACEHOLDER_HOST = 'smtp.placeholder.local';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private fromAddress = 'noreply@omnidesk.local';
  private frontendUrl = 'http://localhost:4200';
  private mockMode = true;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('MAIL_HOST', PLACEHOLDER_HOST);
    const port = this.config.get<number>('MAIL_PORT', 465);
    const user = this.config.get<string>('MAIL_USER', '');
    const pass = this.config.get<string>('MAIL_PASS', '');
    this.fromAddress = this.config.get<string>('MAIL_FROM', this.fromAddress);
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', this.frontendUrl);

    this.mockMode = host === PLACEHOLDER_HOST || !user || !pass;

    if (this.mockMode) {
      this.logger.warn(
        `MailService running in MOCK mode (MAIL_HOST="${host}"). Emails will be logged, not sent.`,
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log(`MailService transporter ready: ${host}:${port}`);
  }

  async sendVerificationEmail(to: string, token: string, displayName?: string | null): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/auth/verify?token=${encodeURIComponent(token)}`;
    const subject = 'Verifica tu cuenta de OmniDesk';
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Hola${displayName ? ' ' + this.escapeHtml(displayName) : ''},</h2>
        <p>Gracias por registrarte en OmniDesk. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
        <p><a href="${verifyUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Verificar mi cuenta</a></p>
        <p style="color:#71717a;font-size:13px;">Si el botón no funciona, copia y pega esta URL en tu navegador:<br/>${verifyUrl}</p>
      </div>
    `;
    await this.send(to, subject, html);
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
    displayName?: string | null,
  ): Promise<void> {
    const resetUrl = `${this.frontendUrl}/auth/reset?token=${encodeURIComponent(token)}`;
    const subject = 'Restablece tu contraseña de OmniDesk';
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Hola${displayName ? ' ' + this.escapeHtml(displayName) : ''},</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña. El enlace expira en 1 hora.</p>
        <p><a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Restablecer contraseña</a></p>
        <p style="color:#71717a;font-size:13px;">Si no solicitaste este cambio, ignora este correo.<br/>URL directa: ${resetUrl}</p>
      </div>
    `;
    await this.send(to, subject, html);
  }

  async sendNotificationEmail(
    to: string,
    title: string,
    message: string,
    iconUrl?: string | null,
    accentColor?: string | null,
  ): Promise<void> {
    const color = accentColor ?? '#6366f1';
    const icon = iconUrl
      ? `<img src="${this.escapeHtml(iconUrl)}" alt="" style="width:48px;height:48px;border-radius:8px;" />`
      : '';
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; border-left: 4px solid ${color}; padding-left: 16px;">
        ${icon}
        <h2 style="margin: 8px 0;">${this.escapeHtml(title)}</h2>
        <p style="white-space: pre-wrap;">${this.escapeHtml(message)}</p>
      </div>
    `;
    await this.send(to, title, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (this.mockMode || !this.transporter) {
      this.logger.log(
        `[MOCK MAIL] to=${to} | subject="${subject}"\n${this.stripTags(html).slice(0, 500)}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      html,
    });
  }

  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

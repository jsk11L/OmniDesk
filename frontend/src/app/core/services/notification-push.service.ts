import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

interface PushSubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

@Injectable({ providedIn: 'root' })
export class NotificationPushService {
  private readonly http = inject(HttpClient);

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async subscribe(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Push notifications no soportadas en este navegador');
    }
    if (!environment.vapidPublicKey) {
      throw new Error('VAPID public key no configurada en environment');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permiso de notificación denegado');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(environment.vapidPublicKey),
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys) {
      throw new Error('Suscripción inválida del navegador');
    }

    const body: PushSubscribeBody = {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys['p256dh'],
        auth: json.keys['auth'],
      },
    };

    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/notifications/push/subscribe`, body),
    );
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await firstValueFrom(
      this.http.request('DELETE', `${environment.apiUrl}/notifications/push/unsubscribe`, {
        body: { endpoint: subscription.endpoint },
      }),
    );
    await subscription.unsubscribe();
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      output[i] = raw.charCodeAt(i);
    }
    return output;
  }
}

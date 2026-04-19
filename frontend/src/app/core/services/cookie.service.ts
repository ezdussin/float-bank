import { Injectable, inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private platformId = inject(PLATFORM_ID);
  
  // Try to inject the REQUEST token. In SSR, this will be provided by the server engine.
  private request = inject(REQUEST, { optional: true });

  get(name: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const nameLenPlus = (name.length + 1);
      return document.cookie
        .split(';')
        .map(c => c.trim())
        .filter(cookie => {
          return cookie.substring(0, nameLenPlus) === `${name}=`;
        })
        .map(cookie => {
          return decodeURIComponent(cookie.substring(nameLenPlus));
        })[0] || null;
    } else {
      // Server side: read from Request headers
      const cookieHeader = this.request?.headers?.get('cookie') || '';
      const nameLenPlus = (name.length + 1);
      return cookieHeader
        .split(';')
        .map((c: string) => c.trim())
        .filter((cookie: string) => {
          return cookie.substring(0, nameLenPlus) === `${name}=`;
        })
        .map((cookie: string) => {
          return decodeURIComponent(cookie.substring(nameLenPlus));
        })[0] || null;
    }
  }

  set(name: string, value: string, days?: number) {
    if (isPlatformBrowser(this.platformId)) {
      let expires = "";
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }
    // For simplicity, we don't set cookies from the server side in this helper,
    // as it requires injecting the RESPONSE and modifying headers before rendering starts.
    // Setting cookies is usually a client-side action after login.
  }

  delete(name: string) {
    this.set(name, "", -1);
  }
}

import { Injectable, inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private platformId = inject(PLATFORM_ID);
  private request = inject(REQUEST, { optional: true });
  // In some environments, the native Request class can be injected as a token
  private nativeRequest = inject(Request as any, { optional: true });

  get(name: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const cookieString = document.cookie;
      const nameLenPlus = (name.length + 1);
      const value = cookieString
        .split(';')
        .map(c => c.trim())
        .filter(cookie => {
          return cookie.substring(0, nameLenPlus) === `${name}=`;
        })
        .map(cookie => {
          return decodeURIComponent(cookie.substring(nameLenPlus));
        })[0] || null;

      return value;
    } else {
      // Server side: read from Request headers
      let cookieHeader = '';
      
      // Try multiple ways to get the request/headers
      const req = (this.request || this.nativeRequest) as any;
      
      console.log(`[CookieService] Server: Inspecting Request`, { 
        tokenRequest: !!this.request,
        nativeRequest: !!this.nativeRequest,
        type: req?.constructor?.name,
        hasHeaders: !!req?.headers,
        hasHeadersGet: typeof req?.headers?.get === 'function'
      });

      if (req?.headers?.get) {
        // Fetch API / Angular 19+ Engine
        cookieHeader = req.headers.get('cookie') || '';
      } else if (req?.get) {
        // Express API fallback
        cookieHeader = req.get('cookie') || '';
      } else if (req?.headers) {
        // Header object fallback
        cookieHeader = req.headers['cookie'] || '';
      }

      const nameLenPlus = (name.length + 1);
      const value = cookieHeader
        .split(';')
        .map((c: string) => c.trim())
        .filter((cookie: string) => {
          return cookie.substring(0, nameLenPlus) === `${name}=`;
        })
        .map((cookie: string) => {
          return decodeURIComponent(cookie.substring(nameLenPlus));
        })[0] || null;

      return value;
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
  }

  delete(name: string) {
    this.set(name, "", -1);
  }
}

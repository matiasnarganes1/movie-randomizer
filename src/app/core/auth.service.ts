import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { supabase } from './supabase.client';
import type { Session } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  session$ = this.sessionSubject.asObservable();

  // promesa compartida para evitar llamadas simultáneas
  private sessionLoadPromise: Promise<Session | null> | null = null;

  async loadSession(): Promise<Session | null> {
    if (this.sessionLoadPromise) return this.sessionLoadPromise;

    this.sessionLoadPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session ?? null;
        this.sessionSubject.next(session);
        return session;
      } catch (e) {
        // si falla por lock, no rompemos UI: consideramos "no session" y seguimos
        this.sessionSubject.next(null);
        return null;
      } finally {
        // liberamos para futuras llamadas (pero ya no en paralelo)
        this.sessionLoadPromise = null;
      }
    })();

    return this.sessionLoadPromise;
  }

  async isLoggedIn(): Promise<boolean> {
    const session = await this.loadSession();
    return !!session;
  }

  async sendMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    this.sessionSubject.next(null);
  }
}
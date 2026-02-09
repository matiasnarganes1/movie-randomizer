import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { supabase } from '../../core/supabase.client';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
    <div class="mx-auto max-w-md px-6 py-14">
      <div class="mb-10">
        <div class="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70">
          🎬 Movie Randomizer
        </div>
        <h1 class="mt-4 text-3xl font-semibold tracking-tight text-black">
          Entrá con un link
        </h1>
        <p class="mt-2 text-sm text-black/60">
          Te mandamos un magic link al mail. Cero contraseñas, cero quilombos.
        </p>
      </div>

      <div class="card p-6">
        <form class="space-y-4" (ngSubmit)="sendLink()">
          <div class="space-y-1.5">
            <label class="label">Email</label>
            <input
              [(ngModel)]="email"
              name="email"
              type="email"
              required
              autocomplete="email"
              class="input"
              placeholder="mati@algo.com"
            />
            <p class="hint">Abrís el link y volvés logueado automáticamente.</p>
          </div>

          <button type="submit" class="btn w-full" [disabled]="loading()">
            <span *ngIf="!loading()">Mandame el link</span>
            <span *ngIf="loading()">Enviando…</span>
          </button>
        </form>

        <div *ngIf="sent()" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✅ Listo. Revisá tu inbox (y spam). Cuando abras el link, esta página te deja adentro.
        </div>

        <div *ngIf="errorMsg()" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {{ errorMsg() }}
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-black/40">
        Hecho para decidir qué ver sin discutir 45 minutos 🤝
      </p>
    </div>
  </div>
`,
})
export class LoginComponent {
  email = '';
  loading = signal(false);
  sent = signal(false);
  errorMsg = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) { }

  async ngOnInit() {
    const logged = await this.auth.isLoggedIn();
    if (logged) this.router.navigateByUrl('/');
  }

  async sendLink() {
    this.errorMsg.set(null);
    this.sent.set(false);

    const mail = this.email.trim().toLowerCase();
    if (!mail) return;

    this.loading.set(true);
    try {
      await this.auth.sendMagicLink(mail);
      this.sent.set(true);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error enviando el link');
    } finally {
      this.loading.set(false);
    }
  }
}
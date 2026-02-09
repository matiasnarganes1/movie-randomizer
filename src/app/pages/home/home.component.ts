import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ListsService, ListRow } from '../../core/lists.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="min-h-screen bg-zinc-50">
    <header class="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur">
      <div class="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-base font-semibold text-black">Movie Randomizer</h1>
          <p class="text-xs text-black/50">Lista compartida. Un botón. Cero debate.</p>
        </div>

        <button class="btn-ghost" (click)="logout()">Salir</button>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Crear lista -->
        <section class="card p-6">
          <h2 class="text-lg font-semibold">Crear lista</h2>
          <p class="mt-1 text-sm text-black/60">Te genera un código para invitar.</p>

          <div class="mt-4 space-y-3">
            <input class="input" [(ngModel)]="listName" placeholder="Nuestra lista 🍿" />
            <button class="btn w-full" (click)="create()" [disabled]="busy() || !listName.trim()">
              {{ busy() ? 'Creando…' : 'Crear' }}
            </button>
          </div>

          <div *ngIf="errorMsg()" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {{ errorMsg() }}
          </div>
        </section>

        <!-- Unirme -->
        <section class="card p-6">
          <h2 class="text-lg font-semibold">Unirme con código</h2>
          <p class="mt-1 text-sm text-black/60">Pegá el share code que te pasaron.</p>

          <div class="mt-4 space-y-3">
            <input class="input" [(ngModel)]="joinCode" placeholder="AB12CD34" />
            <button class="btn w-full" (click)="join()" [disabled]="busy() || !joinCode.trim()">
              {{ busy() ? 'Uniéndome…' : 'Unirme' }}
            </button>
          </div>

          <p class="hint mt-3">Tip: copiá/pegá y listo. No lo escribas como si fuera un CAPTCHA 😄</p>
        </section>
      </div>

      <!-- Mis listas -->
      <section class="card p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold">Mis listas</h2>
            <p class="mt-1 text-sm text-black/60">Entrá a una lista para cargar pelis y tirar el 🎲.</p>
          </div>

          <button class="btn-ghost" (click)="loadLists()" [disabled]="busy()">
            Recargar
          </button>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2" *ngIf="lists().length; else empty">
          <a *ngFor="let l of lists()"
             class="rounded-2xl border border-black/10 bg-white p-4 hover:bg-black/5 transition"
             [routerLink]="['/list', l.id]">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-semibold">{{ l.name }}</div>
                <div class="text-xs text-black/50 mt-1">Código: <span class="font-mono">{{ l.share_code }}</span></div>
              </div>
              <div class="text-xs text-black/40">→</div>
            </div>
          </a>
        </div>

        <ng-template #empty>
          <div class="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm text-black/60">
            Todavía no tenés listas. Creá una o unite con código.
          </div>
        </ng-template>
      </section>
    </main>
  </div>
  `,
})
export class HomeComponent implements OnInit {
  listName = 'Nuestra lista 🍿';
  joinCode = '';

  lists = signal<ListRow[]>([]);
  busy = signal(false);
  errorMsg = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private listsSvc: ListsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLists();
  }

  async loadLists() {
    this.errorMsg.set(null);
    this.busy.set(true);
    try {
      const { data, error } = await this.listsSvc.myLists();
      if (error) throw error;
      this.lists.set((data ?? []) as ListRow[]);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error cargando listas');
    } finally {
      this.busy.set(false);
    }
  }

  async create() {
    this.errorMsg.set(null);
    this.busy.set(true);
    try {
      const id = await this.listsSvc.createList(this.listName.trim());
      await this.loadLists();
      this.router.navigate(['/list', id]);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error creando lista');
    } finally {
      this.busy.set(false);
    }
  }

  async join() {
    this.errorMsg.set(null);
    this.busy.set(true);
    try {
      const id = await this.listsSvc.joinByCode(this.joinCode.trim());
      await this.loadLists();
      this.router.navigate(['/list', id]);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Código inválido o error uniéndose');
    } finally {
      this.busy.set(false);
    }
  }

  logout() {
    this.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
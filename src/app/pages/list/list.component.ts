import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MoviesService, Movie } from '../../core/movies.service';
import { ListsService } from '../../core/lists.service';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { TmdbMovie, TmdbService } from '../../core/tmdb.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './list.component.html',
})
export class ListComponent implements OnInit {
setTimeout(arg0: undefined) {
throw new Error('Method not implemented.');
}
  listId = '';
  title = signal('Lista');
  shareCode = signal('—');

  movies = signal<Movie[]>([]);
  busy = signal(false);
  errorMsg = signal<string | null>(null);

  newTitle = '';
  newYear: number | null = null;

  picked = signal<Movie | null>(null);

  pendingCount = computed(() => this.movies().filter(m => !m.watched).length);
  watchedCount = computed(() => this.movies().filter(m => m.watched).length);

  search$ = new Subject<string>();
  suggestions = signal<TmdbMovie[]>([]);
  showSuggestions = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private moviesSvc: MoviesService,
    private listsSvc: ListsService,
    private tmdb: TmdbService
  ) { }

  async ngOnInit() {
    this.listId = this.route.snapshot.paramMap.get('id') ?? '';
    await this.loadListMeta();
    await this.loadMovies();
    this.search$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(q =>
          this.tmdb.searchMovies(q).pipe(catchError(() => of([])))
        )
      )
      .subscribe(list => {
        this.suggestions.set(list);
        this.showSuggestions.set(list.length > 0);
      });
  }
  onTitleInput(v: string) {
    this.newTitle = v;
    this.search$.next(v);
  }

  pickSuggestion(m: TmdbMovie) {
    this.newTitle = m.title;

    const year = m.release_date ? Number(m.release_date.slice(0, 4)) : null;
    this.newYear = Number.isFinite(year as any) ? year : null;

    this.showSuggestions.set(false);
    this.suggestions.set([]);
  }

  goBack() {
    this.router.navigateByUrl('/home');
  }

  async loadListMeta() {
    const { data, error } = await this.listsSvc.myLists();
    if (error) return;
    const list = (data ?? []).find(l => l.id === this.listId);
    if (list) {
      this.title.set(list.name);
      this.shareCode.set(list.share_code);
    }
  }

  async loadMovies() {
    this.errorMsg.set(null);
    this.busy.set(true);
    try {
      const { data, error } = await this.moviesSvc.listMovies(this.listId);
      if (error) throw error;
      this.movies.set((data ?? []) as Movie[]);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error cargando pelis');
    } finally {
      this.busy.set(false);
    }
  }

  async add() {
    this.errorMsg.set(null);
    this.busy.set(true);
    try {
      const year = this.newYear !== null && this.newYear !== undefined && this.newYear !== ('' as any)
        ? Number(this.newYear)
        : null;

      await this.moviesSvc.addMovie(this.listId, this.newTitle, year);
      this.newTitle = '';
      this.newYear = null;
      await this.loadMovies();
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error agregando peli');
    } finally {
      this.busy.set(false);
    }
  }

  async toggle(m: Movie) {
    this.errorMsg.set(null);
    this.busy.set(true);
    try {
      await this.moviesSvc.toggleWatched(m);
      await this.loadMovies();
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error actualizando');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(m: Movie) {
    if (!confirm(`Borrar "${m.title}"?`)) return;

    this.errorMsg.set(null);
    this.busy.set(true);
    try {
      await this.moviesSvc.removeMovie(m.id);
      await this.loadMovies();
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error borrando');
    } finally {
      this.busy.set(false);
    }
  }

  async randomPick() {
    this.errorMsg.set(null);
    this.busy.set(true);
    try {
      const m = await this.moviesSvc.pickRandomUnwatched(this.listId);
      if (!m) {
        this.errorMsg.set('No hay pendientes. Felicitaciones: se te terminó el backlog 😄');
      } else {
        this.picked.set(m);
      }
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error tirando random');
    } finally {
      this.busy.set(false);
    }
  }

  async markPickedWatched() {
    const m = this.picked();
    if (!m) return;

    this.busy.set(true);
    try {
      await this.moviesSvc.toggleWatched(m);
      this.picked.set(null);
      await this.loadMovies();
    } finally {
      this.busy.set(false);
    }
  }
}
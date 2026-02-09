import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
};

type TmdbSearchResponse = {
  results: TmdbMovie[];
};

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor(private http: HttpClient) {}

  searchMovies(query: string): Observable<TmdbMovie[]> {
    const q = query.trim();
    if (q.length < 2) return new Observable<TmdbMovie[]>(sub => { sub.next([]); sub.complete(); });

    const params = new HttpParams()
      .set('api_key', environment.tmdbApiKey)
      .set('query', q)
      .set('include_adult', 'false')
      .set('language', 'es-AR')
      .set('page', '1');

    return this.http.get<TmdbSearchResponse>(`${this.baseUrl}/search/movie`, { params })
      .pipe(map(r => (r.results ?? []).slice(0, 8)));
  }
}
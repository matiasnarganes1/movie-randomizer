import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export type Movie = {
  id: string;
  list_id: string;
  title: string;
  year: number | null;
  notes: string | null;
  watched: boolean;
  created_at: string;
  watched_at: string | null;
};

@Injectable({ providedIn: 'root' })
export class MoviesService {
  async listMovies(listId: string) {
    return supabase
      .from('movies')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });
  }

  async addMovie(listId: string, title: string, year?: number | null) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error('Not authenticated');

    return supabase.from('movies').insert({
      list_id: listId,
      title: title.trim(),
      year: year ?? null,
      created_by: userId,
    });
  }

  async toggleWatched(movie: Movie) {
    const watched = !movie.watched;
    return supabase
      .from('movies')
      .update({ watched, watched_at: watched ? new Date().toISOString() : null })
      .eq('id', movie.id);
  }

  async removeMovie(id: string) {
    return supabase.from('movies').delete().eq('id', id);
  }

  async pickRandomUnwatched(listId: string): Promise<Movie | null> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('list_id', listId)
      .eq('watched', false);

    if (error) throw error;
    if (!data?.length) return null;

    return data[Math.floor(Math.random() * data.length)] as Movie;
  }
}
import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export type ListRow = {
  id: string;
  name: string;
  share_code: string;
  created_at: string;
};

@Injectable({ providedIn: 'root' })
export class ListsService {
  async myLists() {
    return supabase
      .from('lists')
      .select('id,name,share_code,created_at')
      .order('created_at', { ascending: false });
  }

  async createList(name: string) {
    const { data, error } = await supabase.rpc('create_list', { p_name: name });
    if (error) throw error;
    return data as string; // list_id
  }

  async joinByCode(code: string) {
    const { data, error } = await supabase.rpc('join_list', { p_code: code });
    if (error) throw error;
    return data as string; // list_id
  }
}
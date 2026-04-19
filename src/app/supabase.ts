import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

export type FilterMode = 'active' | 'past' | 'all';

@Injectable({ providedIn: 'root' })
export class Supabase {
  supabaseUrl = 'https://wxhhbgweiznwnuidxrbb.supabase.co';
  supabaseKey = 'sb_publishable_ZknEB2vhkUN6-Ib0PMgpdw_W-eOyJuD';
  supabase = createClient(this.supabaseUrl, this.supabaseKey);

  surveys = signal<{ id: number; category: string; name: string; end_date: Date; description: string }[]>([]);
  activeSurveys = signal<{id:number, category:string, name:string, end_date:Date, description:string}[]>([]);

  async getSurveys(filter: FilterMode = 'all') {
    const today = new Date().toISOString().split('T')[0];

    let query = this.supabase.from('surveys').select('*');

    if (filter === 'active') {
      query = query.gte('end_date', today);
    } else if (filter === 'past') {
      query = query.lt('end_date', today);
    }

    const { data: surveys, error } = await query.order('end_date', { ascending: true });
    if (!surveys) return;
    this.surveys.set(surveys);
  }

  async getActiveSurveys() {
  const today = new Date().toISOString().split('T')[0];

  const { data: surveys } = await this.supabase
    .from('surveys')
    .select('*')
    .gte('end_date', today)
    .order('end_date', { ascending: true });

  if (!surveys) return;
  this.activeSurveys.set(surveys);
}
}

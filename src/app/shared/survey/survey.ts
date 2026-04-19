import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Supabase } from '../../supabase';
import { SQuestion } from '../../types';
import { Main_Header } from "../main_header/header";
import { Question } from "./question/question";
import { Header } from "./header/header";
import { ResultQuestion } from './results/question/question';

@Component({
  selector: 'app-survey',
  imports: [Main_Header, Question, Header, ResultQuestion],
  templateUrl: './survey.html',
  styleUrl: './survey.scss',
})
export class Survey implements OnInit {
  survey = signal<any>(null);
  questions = signal<SQuestion[]>([]);

  constructor(
    private route: ActivatedRoute,
    private supabaseService: Supabase
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const { data: survey } = await this.supabaseService.supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();
    this.survey.set(survey);

    const { data: questions } = await this.supabaseService.supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('survey_id', id);
    this.questions.set(questions ?? []);
  }
}

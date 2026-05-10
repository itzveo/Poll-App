import { Component, OnInit, signal, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Supabase } from '../../supabase';
import { SQuestion } from '../../types';
import { Main_Header } from '../main_header/header';
import { Question } from './question/question';
import { Header } from './header/header';
import { ResultQuestion } from './results/question/question';
import { Empty } from './results/empty/empty';

@Component({
  selector: 'app-survey',
  imports: [Main_Header, Question, Header, ResultQuestion, Empty],
  templateUrl: './survey.html',
  styleUrl: './survey.scss',
})
export class Survey implements OnInit {
  survey = signal<any>(null);
  questions = signal<SQuestion[]>([]);
  selections = new Map<number, number[]>();

  @ViewChildren(Question) questionComponents!: QueryList<Question>;

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

  onSelectionChange(event: { questionId: number; answerIds: number[] }) {
    this.selections.set(event.questionId, event.answerIds);
  }

  allAnswered(): boolean {
    return this.questions().every(
      (q) => (this.selections.get(q.id)?.length ?? 0) > 0
    );
  }

  hasResults(): boolean {
    return this.questions().some((q) =>
      q.answers.some((a) => (a.vote_count ?? 0) > 0)
    );
  }

  async submitAnswers() {
    if (!this.allAnswered()) return;

    for (const [questionId, answerIds] of this.selections.entries()) {
      for (const answerId of answerIds) {
        const { data: current } = await this.supabaseService.supabase
          .from('answers')
          .select('vote_count')
          .eq('id', answerId)
          .single();

        await this.supabaseService.supabase
          .from('answers')
          .update({ vote_count: (current?.vote_count ?? 0) + 1 })
          .eq('id', answerId);
      }
    }

    const surveyId = this.route.snapshot.paramMap.get('id');
    const { data: updated } = await this.supabaseService.supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('survey_id', surveyId);
    this.questions.set(updated ?? []);

    this.selections.clear();
    this.questionComponents.forEach((q) => q.resetSelection());
  }
}

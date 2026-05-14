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
    private supabaseService: Supabase,
  ) {}

  /**
   * Reads the survey ID from the route and loads the corresponding survey metadata and questions.
   * @returns A promise that resolves once both loads complete.
   */
  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    await this.loadSurvey(id);
    await this.loadQuestions(id);
  }

  /**
   * Fetches the survey metadata for the given ID from the database and stores it in the survey signal.
   * @param id - The ID of the survey to load.
   */
  private async loadSurvey(id: string): Promise<void> {
    const { data } = await this.supabaseService.supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();
    this.survey.set(data);
  }

  /**
   * Fetches all questions and their answers for the given survey ID and stores them in the questions signal.
   * @param id - The ID of the survey whose questions should be loaded.
   */
  private async loadQuestions(id: string): Promise<void> {
    const { data } = await this.supabaseService.supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('survey_id', id);
    this.questions.set(data ?? []);
  }

  /**
   * Records the user's answer selection for a given question.
   * @param event - Object containing the question ID and the array of selected answer IDs.
   */
  onSelectionChange(event: { questionId: number; answerIds: number[] }): void {
    this.selections.set(event.questionId, event.answerIds);
  }

  /** Returns `true` if every question has at least one answer selected. */
  allAnswered(): boolean {
    return this.questions().every((q) => (this.selections.get(q.id)?.length ?? 0) > 0);
  }

  /** Returns `true` if any answer in the survey has at least one vote. */
  hasResults(): boolean {
    return this.questions().some((q) => q.answers.some((a) => (a.vote_count ?? 0) > 0));
  }

  /**
   * Reads the current vote count of an answer and increments it by one in the database.
   * @param answerId - The ID of the answer to increment.
   */
  private async incrementVote(answerId: number): Promise<void> {
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

  /**
   * Increments the vote count for each selected answer of a given question.
   * @param questionId - The ID of the question being voted on.
   * @param answerIds - The IDs of the answers selected by the user.
   */
  private async submitVotesForQuestion(questionId: number, answerIds: number[]): Promise<void> {
    for (const answerId of answerIds) {
      await this.incrementVote(answerId);
    }
  }

  /**
   * Re-fetches all questions and their answers for the current survey from the database,
   * updating the questions signal with the latest vote counts.
   */
  private async refreshQuestions(): Promise<void> {
    const surveyId = this.route.snapshot.paramMap.get('id');
    const { data } = await this.supabaseService.supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('survey_id', surveyId);
    this.questions.set(data ?? []);
  }

  /**
   * Clears the selections map and resets the UI state of all question components
   * back to their initial unanswered state.
   */
  private resetState(): void {
    this.selections.clear();
    this.questionComponents.forEach((q) => q.resetSelection());
  }

  /**
   * Submits all selected answers if every question has been answered.
   * Increments vote counts for each selected answer, then refreshes the question data
   * and resets all selections and UI state.
   * @returns A promise that resolves once all votes are submitted and state is refreshed.
   */
  async submitAnswers(): Promise<void> {
    if (!this.allAnswered()) return;
    for (const [questionId, answerIds] of this.selections.entries()) {
      await this.submitVotesForQuestion(questionId, answerIds);
    }
    await this.refreshQuestions();
    this.resetState();
  }
}

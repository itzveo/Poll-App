import { Component, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question, QuestionModel } from './question/question';
import { WideCaretDirective } from '../wide-caret.directive';
import { Main_Header } from '../shared/main_header/header';
import { Supabase, CATEGORIES, Category } from '../supabase';

@Component({
  selector: 'app-new-survey',
  imports: [CommonModule, Question, WideCaretDirective, Main_Header],
  templateUrl: './new-survey.html',
  styleUrl: './new-survey.scss',
})
export class NewSurvey {
  isDropdownOpen = false;
  isPublishing = false;
  readonly categories = CATEGORIES;
  selectedCategory = signal<Category | null>(null);

  showErrorOverlay = false;
  showSuccessOverlay = false;
  animate = false;
  invalidFields = signal<Set<string>>(new Set());

  @ViewChild('surveyNameInput') surveyNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('endDateInput') endDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef<HTMLTextAreaElement>;

  constructor(public dbService: Supabase) {}

  questions: QuestionModel[] = [
    { id: 1, title: '', multiA: false, answers: [{ text: '' }, { text: '' }] },
  ];

  addQuestion(): void {
    this.questions.push({
      id: this.questions.length + 1,
      title: '',
      multiA: false,
      answers: [{ text: '' }, { text: '' }],
    });
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
      this.questions.forEach((q, i) => (q.id = i + 1));
    }
  }

  backToHome(): void {
    window.location.href = '';
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleCategory(category: Category) {
    const next = this.selectedCategory() === category ? null : category;
    this.selectedCategory.set(next);
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.isDropdownOpen = false;
    }
    if (
      this.showErrorOverlay &&
      !target.closest('.error-overlay') &&
      !target.closest('.publish-btn')
    ) {
      this.clearValidation();
    }
  }

  clearValidation() {
    this.showErrorOverlay = false;
    this.invalidFields.set(new Set());
  }

  isDateValid(value: string): boolean {
    if (!value) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  validate(): boolean {
    const invalid = new Set<string>();
    const name = this.surveyNameInput?.nativeElement.value.trim();
    const date = this.endDateInput?.nativeElement.value.trim();

    if (!name) invalid.add('surveyName');
    if (!this.selectedCategory()) invalid.add('category');
    if (date && !this.isDateValid(date)) invalid.add('endDate');

    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      if (!q.title.trim()) invalid.add(`question-${i}`);
      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].text.trim()) invalid.add(`answer-${i}-${j}`);
      }
    }

    this.invalidFields.set(invalid);
    return invalid.size === 0;
  }


  async publish() {
    if (this.isPublishing) return;
    if (!this.validate()) {
      this.showErrorOverlay = true;
      return;
    }

    this.isPublishing = true;

    const name = this.surveyNameInput.nativeElement.value.trim();
    const date = this.endDateInput.nativeElement.value.trim() || null;
    const description = this.descriptionInput?.nativeElement.value.trim() || null;

    const { data: surveyData, error: surveyError } = await this.dbService.supabase
      .from('surveys')
      .insert({ name, end_date: date, description, category: this.selectedCategory() })
      .select('id')
      .single();

    if (surveyError || !surveyData) {
      this.isPublishing = false;
      return;
    }

    const surveyId = surveyData.id;

    for (const q of this.questions) {
      const { data: questionData, error: questionError } = await this.dbService.supabase
        .from('questions')
        .insert({ question_text: q.title.trim(), survey_id: surveyId, multi: q.multiA })
        .select('id')
        .single();

      if (questionError || !questionData) continue;

      const questionId = questionData.id;

      const answersToInsert = q.answers.map((a) => ({
        answer_text: a.text.trim(),
        question_id: questionId,
      }));

      await this.dbService.supabase.from('answers').insert(answersToInsert);
    }

    this.isPublishing = false;
    this.showSuccessOverlay = true;
  }

  dismissSuccess(): void {
    this.showSuccessOverlay = false;
    window.location.href = 'survey/';
  }
}

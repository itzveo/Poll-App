import {
  Component,
  signal,
  HostListener,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
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
  private createdSurveyId: string | null = null;
  readonly categories = CATEGORIES;
  selectedCategory = signal<Category | null>(null);

  showErrorOverlay = false;
  showSuccessOverlay = false;
  invalidFields = signal<Set<string>>(new Set());

  @ViewChild('surveyNameInput') surveyNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('endDateInput') endDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef<HTMLTextAreaElement>;

  constructor(
    public dbService: Supabase,
    private cdr: ChangeDetectorRef,
  ) {}

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

    if (this.showSuccessOverlay || this.isPublishing) return;

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

  onDateKeydown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    if (allowed.includes(event.key)) return;

    if (!/^[\d-]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    const current = input.value;
    const selStart = input.selectionStart ?? current.length;

    if (event.key === '-') {
      event.preventDefault();
      return;
    }

    if (current.length >= 10) {
      event.preventDefault();
      return;
    }

    const nextValue = current.slice(0, selStart) + event.key + current.slice(selStart);
    const digits = nextValue.replace(/-/g, '');

    if (digits.length >= 5) {
      const month = parseInt(digits.slice(4, 6), 10);
      if (digits.length === 5 && month > 1) {
        event.preventDefault();
        return;
      }
      if (digits.length === 6 && (month < 1 || month > 12)) {
        event.preventDefault();
        return;
      }
    }

    if (digits.length >= 7) {
      const day = parseInt(digits.slice(6, 8), 10);
      if (digits.length === 7 && day > 3) {
        event.preventDefault();
        return;
      }
      if (digits.length === 8 && (day < 1 || day > 31)) {
        event.preventDefault();
        return;
      }
    }
  }

  onDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/-/g, '');
    raw = raw.replace(/\D/g, '');

    if (raw.length >= 6) {
      const month = parseInt(raw.slice(4, 6), 10);
      if (month > 12) raw = raw.slice(0, 4) + '12' + raw.slice(6);
      if (month < 1 && raw.length === 6) raw = raw.slice(0, 4) + '01' + raw.slice(6);
    }

    if (raw.length >= 8) {
      const day = parseInt(raw.slice(6, 8), 10);
      if (day > 31) raw = raw.slice(0, 6) + '31';
      if (day < 1 && raw.length === 8) raw = raw.slice(0, 6) + '01';
    }

    let formatted = raw.slice(0, 4);
    if (raw.length > 4) formatted += '-' + raw.slice(4, 6);
    if (raw.length > 6) formatted += '-' + raw.slice(6, 8);

    input.value = formatted;
  }

  isDateValid(value: string): boolean {
    if (!value) return true;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const [year, month, day] = value.split('-').map(Number);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
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
      this.cdr.detectChanges();
      return;
    }

    const surveyId = surveyData.id;
    this.createdSurveyId = surveyId;

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
    this.cdr.detectChanges();
  }

  dismissSuccess(): void {
    this.showSuccessOverlay = false;
    window.location.href = `survey/${this.createdSurveyId}`;
  }
}

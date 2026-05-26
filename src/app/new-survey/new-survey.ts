import {
  Component,
  signal,
  HostListener,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question, QuestionModel } from './question/question';
import { WideCaretDirective } from '../wide-caret.directive';
import { Supabase, CATEGORIES, Category } from '../supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-survey',
  imports: [CommonModule, Question, WideCaretDirective],
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

  isCalendarOpen = false;
  calendarMonth = new Date();
  weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  calendarDays: (Date | null)[] = [];

  @ViewChild('surveyNameInput') surveyNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('endDateInput') endDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef<HTMLTextAreaElement>;

  @Output() closed = new EventEmitter<void>();

  questions: QuestionModel[] = [
    { id: 1, title: '', multiA: false, answers: [{ text: '' }, { text: '' }] },
  ];

  constructor(
    public dbService: Supabase,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  /** Appends a new blank question with two empty answers to the questions list. */
  addQuestion(): void {
    this.questions.push({
      id: this.questions.length + 1,
      title: '',
      multiA: false,
      answers: [{ text: '' }, { text: '' }],
    });
  }

  /**
   * Removes the question at the given index and re-indexes remaining questions.
   * Does nothing if only one question remains.
   * @param index - The index of the question to remove.
   */
  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
      this.questions.forEach((q, i) => (q.id = i + 1));
    }
  }

  /** Closes the new survey dialog. */
  close(): void {
    this.closed.emit();
  }

  /** Toggles the category dropdown open/closed state. */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Selects or deselects a category and closes the dropdown.
   * If the given category is already selected, it is deselected.
   * @param category - The category to toggle.
   */
  toggleCategory(category: Category): void {
    this.selectedCategory.set(this.selectedCategory() === category ? null : category);
    this.isDropdownOpen = false;
  }

  /** Hides the error overlay and clears all invalid field markers. */
  clearValidation(): void {
    this.showErrorOverlay = false;
    this.invalidFields.set(new Set());
  }

  /**
   * Global click handler that closes the dropdown and the calendar when clicking outside it,
   * dismisses the error overlay when clicking outside it or the publish button.
   * @param event - The native mouse click event.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) this.isDropdownOpen = false;
    if (!target.closest('.date-input-wrapper')) this.closeCalendar(); // NEU
    if (this.showSuccessOverlay || this.isPublishing) return;
    if (
      this.showErrorOverlay &&
      !target.closest('.error-overlay') &&
      !target.closest('.publish-btn')
    ) {
      this.clearValidation();
    }
  }

  /**
   * Returns `true` if the given key is a navigation or editing key that should
   * always be permitted in the date input regardless of other constraints.
   * @param key - The keyboard key value to check.
   */
  private isAllowedKey(key: string): boolean {
    return ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key);
  }

  /**
   * Checks whether the month digits within a raw digit string represent a valid month value (01–12),
   * accounting for partial input during typing.
   * @param digits - The current raw digit string (dashes removed).
   * @returns `false` if the partial or complete month value is out of range; `true` otherwise.
   */
  private isMonthValid(digits: string): boolean {
    const month = parseInt(digits.slice(4, 6), 10);
    if (digits.length === 5 && month > 1) return false;
    if (digits.length === 6 && (month < 1 || month > 12)) return false;
    return true;
  }

  /**
   * Checks whether the day digits within a raw digit string represent a valid day value (01–31),
   * accounting for partial input during typing.
   * @param digits - The current raw digit string (dashes removed).
   * @returns `false` if the partial or complete day value is out of range; `true` otherwise.
   */
  private isDayValid(digits: string): boolean {
    const day = parseInt(digits.slice(6, 8), 10);
    if (digits.length === 7 && day > 3) return false;
    if (digits.length === 8 && (day < 1 || day > 31)) return false;
    return true;
  }

  /**
   * Simulates the result of inserting the pressed key at the current cursor position
   * and returns the resulting string with all dashes removed.
   * @param event - The keyboard event containing the key being pressed.
   * @param input - The date input element whose current value and cursor position are used.
   * @returns The projected raw digit string after the keystroke.
   */
  private getNextDigits(event: KeyboardEvent, input: HTMLInputElement): string {
    const current = input.value;
    const selStart = input.selectionStart ?? current.length;
    const nextValue = current.slice(0, selStart) + event.key + current.slice(selStart);
    return nextValue.replace(/-/g, '');
  }

  /**
   * Keyboard handler for the date input that restricts entry to valid date digits,
   * prevents overflow beyond 10 characters, and blocks structurally invalid month/day values mid-typing.
   * @param event - The keyboard event fired on the date input.
   */
  onDateKeydown(event: KeyboardEvent): void {
    if (this.isAllowedKey(event.key)) return;
    if (!/^[\d-]$/.test(event.key) || event.key === '-') {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.value.length >= 10) {
      event.preventDefault();
      return;
    }

    const digits = this.getNextDigits(event, input);
    if (digits.length >= 5 && !this.isMonthValid(digits)) {
      event.preventDefault();
      return;
    }
    if (digits.length >= 7 && !this.isDayValid(digits)) {
      event.preventDefault();
      return;
    }
  }

  /**
   * Clamps the month and day portions of a raw digit string to valid ranges (01–12 and 01–31).
   * @param raw - The raw digit string (dashes removed) to clamp.
   * @returns The clamped raw digit string.
   */
  private clampDatePart(raw: string): string {
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
    return raw;
  }

  /**
   * Formats a raw digit string into a YYYY-MM-DD date string by inserting dashes at the correct positions.
   * @param raw - The raw digit string to format.
   * @returns The formatted date string.
   */
  private formatDateString(raw: string): string {
    let formatted = raw.slice(0, 4);
    if (raw.length > 4) formatted += '-' + raw.slice(4, 6);
    if (raw.length > 6) formatted += '-' + raw.slice(6, 8);
    return formatted;
  }

  /**
   * Input event handler that strips non-digit characters, clamps month/day values
   * to valid ranges, and reformats the raw digits into YYYY-MM-DD format.
   * @param event - The input event fired on the date field.
   */
  onDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = this.clampDatePart(input.value.replace(/\D/g, ''));
    input.value = this.formatDateString(raw);

    if (raw.length === 8 && !this.isDateValid(input.value)) {
      this.invalidFields.update((set) => new Set([...set, 'endDate']));
      input.value = '';
    } else {
      this.invalidFields.update((set) => {
        const next = new Set(set);
        next.delete('endDate');
        return next;
      });
    }
  }

  /**
   * Validates that a date string is both structurally correct (YYYY-MM-DD)
   * and represents a real calendar date.
   * @param value - The date string to validate.
   * @returns `true` if the value is empty or a valid calendar date; `false` otherwise.
   */
  isDateValid(value: string): boolean {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(year, month - 1, day);
    const isReal =
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    if (!isReal) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  /**
   * Iterates over all questions and their answers, adding keys to the invalid set
   * for any that have empty titles or answer texts.
   * @param invalid - The set to populate with invalid field keys.
   */
  private validateQuestions(invalid: Set<string>): void {
    for (let i = 0; i < this.questions.length; i++) {
      if (!this.questions[i].title.trim()) invalid.add(`question-${i}`);
      this.questions[i].answers.forEach((a, j) => {
        if (!a.text.trim()) invalid.add(`answer-${i}-${j}`);
      });
    }
  }

  /**
   * Runs full form validation, marking all empty required fields and invalid values.
   * Checks the survey name, category selection, optional end date, and all questions/answers.
   * @returns `true` if the form has no validation errors; `false` otherwise.
   */
  validate(): boolean {
    const invalid = new Set<string>();
    const name = this.surveyNameInput?.nativeElement.value.trim();
    const date = this.endDateInput?.nativeElement.value.trim();

    if (!name) invalid.add('surveyName');
    if (!this.selectedCategory()) invalid.add('category');
    if (date && !this.isDateValid(date)) invalid.add('endDate');

    this.validateQuestions(invalid);
    this.invalidFields.set(invalid);
    return invalid.size === 0;
  }

  /**
   * Reads and trims the current values from the survey name, end date, and description inputs.
   * @returns An object containing the trimmed name, nullable date, and nullable description.
   */
  private getFormValues() {
    return {
      name: this.surveyNameInput.nativeElement.value.trim(),
      date: this.endDateInput.nativeElement.value.trim() || null,
      description: this.descriptionInput?.nativeElement.value.trim() || null,
    };
  }

  /**
   * Inserts a new survey record into the database and returns its generated ID.
   * @param name - The survey title.
   * @param date - The optional end date string in YYYY-MM-DD format, or null.
   * @param description - The optional survey description, or null.
   */
  private async insertSurvey(name: string, date: string | null, description: string | null) {
    return this.dbService.supabase
      .from('surveys')
      .insert({ name, end_date: date, description, category: this.selectedCategory() })
      .select('id')
      .single();
  }

  /**
   * Inserts a single question record into the database linked to the given survey.
   * @param q - The question model containing the title and multi-answer flag.
   * @param surveyId - The ID of the survey this question belongs to.
   */
  private async insertQuestion(q: QuestionModel, surveyId: string) {
    return this.dbService.supabase
      .from('questions')
      .insert({ question_text: q.title.trim(), survey_id: surveyId, multi: q.multiA })
      .select('id')
      .single();
  }

  /**
   * Inserts all answer records for a given question into the database.
   * @param q - The question model whose answers should be inserted.
   * @param questionId - The ID of the question these answers belong to.
   */
  private async insertAnswers(q: QuestionModel, questionId: string): Promise<void> {
    const answersToInsert = q.answers.map((a) => ({
      answer_text: a.text.trim(),
      question_id: questionId,
    }));
    await this.dbService.supabase.from('answers').insert(answersToInsert);
  }

  /**
   * Iterates over all questions and inserts each one along with its answers into the database.
   * Skips a question silently if its insertion fails.
   * @param surveyId - The ID of the survey to attach the questions to.
   */
  private async insertAllQuestions(surveyId: string): Promise<void> {
    for (const q of this.questions) {
      const { data, error } = await this.insertQuestion(q, surveyId);
      if (error || !data) continue;
      await this.insertAnswers(q, data.id);
    }
  }

  /** Toggles the calendar popup open or closed and builds the calendar grid when opening. */
  toggleCalendar(event: MouseEvent): void {
    event.stopPropagation();
    this.isCalendarOpen = !this.isCalendarOpen;
    if (this.isCalendarOpen) this.buildCalendar();
  }

  /** Closes the calendar popup. */
  closeCalendar(): void {
    this.isCalendarOpen = false;
  }

  /** Navigates the calendar one month back and rebuilds the day grid. */
  prevMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() - 1,
      1,
    );
    this.buildCalendar();
  }

  /** Navigates the calendar one month forward and rebuilds the day grid. */
  nextMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + 1,
      1,
    );
    this.buildCalendar();
  }

  /**
   * Builds the array of day cells for the currently displayed month,
   * prepending null values as empty offset cells so the first day
   * aligns to the correct weekday column (Monday-based).
   */
  buildCalendar(): void {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    let startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    this.calendarDays = days;
  }

  /**
   * Returns true if the given date is before today (time stripped).
   * @param date - The date to check.
   */
  isPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Returns true if the given date matches today's date.
   * @param date - The date to check.
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Returns true if the given date matches the value currently entered in the date input.
   * @param date - The date to check against the input value.
   */
  isSelected(date: Date): boolean {
    const val = this.endDateInput?.nativeElement.value;
    if (!val) return false;
    const [y, m, d] = val.split('-').map(Number);
    return date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d;
  }

  /**
   * Writes the selected date into the date input in YYYY-MM-DD format and closes the calendar.
   * @param date - The day the user clicked.
   */
  selectDay(date: Date): void {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    this.endDateInput.nativeElement.value = `${y}-${m}-${d}`;
    this.isCalendarOpen = false;
  }

  /**
   * Validates the form and, if valid, inserts the survey, its questions, and their
   * answers into the database. Shows the success overlay on completion or returns
   * early on validation failure or a database error.
   * @returns A promise that resolves once the publish flow completes or aborts.
   */
  async publish(): Promise<void> {
    if (this.isPublishing) return;
    if (!this.validate()) {
      this.showErrorOverlay = true;
      return;
    }

    this.isPublishing = true;
    const { name, date, description } = this.getFormValues();
    const { data, error } = await this.insertSurvey(name, date, description);

    if (error || !data) {
      this.isPublishing = false;
      this.cdr.detectChanges();
      return;
    }

    this.createdSurveyId = data.id;
    await this.insertAllQuestions(data.id);
    this.isPublishing = false;
    this.showSuccessOverlay = true;
    this.cdr.detectChanges();
  }

  /** Hides the success overlay and redirects the user to the newly created survey's detail page. */
  dismissSuccess(): void {
    this.showSuccessOverlay = false;
    this.router.navigate([`/survey/${this.createdSurveyId}`]);
  }
}

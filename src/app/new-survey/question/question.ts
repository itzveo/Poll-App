import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WideCaretDirective } from '../../wide-caret.directive';
import { UtilService } from '../../util.service';

export interface Answer {
  text: string;
}

export interface QuestionModel {
  id: number;
  title: string;
  multiA: boolean;
  answers: Answer[];
}

@Component({
  selector: 'app-question',
  imports: [CommonModule, FormsModule, WideCaretDirective],
  templateUrl: './question.html',
  styleUrl: './question.scss',
})
export class Question {
  private utilService = inject(UtilService);

  @Input() question!: QuestionModel;
  @Input() questionIndex: number = 0;
  @Input() canDelete: boolean = true;
  @Output() deleteQuestion = new EventEmitter<void>();
  @Input() invalidFields: Set<string> = new Set();

  /** Converts a zero-based index to its corresponding uppercase letter label (e.g. 0 → 'A'). */
  getLabel(index: number): string {
    return this.utilService.getLabel(index);
  }

  /** Returns `true` if the question already has the maximum of 6 answers. */
  get maxAnswersReached(): boolean {
    return this.question.answers.length >= 6;
  }

  /** Toggles whether the question allows multiple answer selections. */
  toggleMultiA(): void {
    this.question.multiA = !this.question.multiA;
  }

  /** Clears the question's title text. */
  clearTitle(): void {
    this.question.title = '';
  }

  /**
   * Clears the text of the answer at the given index.
   * @param index - The zero-based index of the answer to clear.
   */
  clearAnswer(index: number): void {
    this.question.answers[index].text = '';
  }

  /** Appends a new blank answer to the question, unless the maximum answer count has been reached. */
  addAnswer(): void {
    if (!this.maxAnswersReached) {
      this.question.answers.push({ text: '' });
    }
  }

  /**
   * Removes the answer at the given index, provided at least two answers remain.
   * @param index - The zero-based index of the answer to remove.
   */
  removeAnswer(index: number): void {
    if (this.question.answers.length > 2) {
      this.question.answers.splice(index, 1);
    }
  }

  /** Returns `true` if this question's title has been flagged as invalid by the parent form. */
  get isQuestionInvalid(): boolean {
    return this.invalidFields.has(`question-${this.questionIndex}`);
  }

  /**
   * Returns `true` if the answer at the given index has been flagged as invalid by the parent form.
   * @param answerIndex - The zero-based index of the answer to check.
   */
  isAnswerInvalid(answerIndex: number): boolean {
    return this.invalidFields.has(`answer-${this.questionIndex}-${answerIndex}`);
  }
}

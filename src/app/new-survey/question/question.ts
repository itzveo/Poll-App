import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WideCaretDirective } from '../../wide-caret.directive';

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
  @Input() question!: QuestionModel;
  @Input() questionIndex: number = 0;
  @Input() canDelete: boolean = true;
  @Output() deleteQuestion = new EventEmitter<void>();
  @Input() invalidFields: Set<string> = new Set();

  getLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  get maxAnswersReached(): boolean {
    return this.question.answers.length >= 6;
  }

  toggleMultiA(): void {
    this.question.multiA = !this.question.multiA;
  }

  clearTitle(): void {
    this.question.title = '';
  }

  clearAnswer(index: number): void {
    this.question.answers[index].text = '';
  }

  addAnswer(): void {
    if (!this.maxAnswersReached) {
      this.question.answers.push({ text: '' });
    }
  }

  removeAnswer(index: number): void {
    if (this.question.answers.length > 2) {
      this.question.answers.splice(index, 1);
    }
  }

  get isQuestionInvalid(): boolean {
    return this.invalidFields.has(`question-${this.questionIndex}`);
  }

  isAnswerInvalid(answerIndex: number): boolean {
    return this.invalidFields.has(`answer-${this.questionIndex}-${answerIndex}`);
  }
}

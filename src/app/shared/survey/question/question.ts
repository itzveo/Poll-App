import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SQuestion } from '../../../types';

@Component({
  selector: 'app-question',
  imports: [],
  templateUrl: './question.html',
  styleUrl: './question.scss',
})
export class Question {
  @Input() question!: SQuestion;
  @Input() index: number = 0;
  @Output() selectionChange = new EventEmitter<{ questionId: number; answerIds: number[] }>();

  selectedIds = new Set<number>();

  toggleAnswer(answerId: number) {
  const updated = new Set(this.selectedIds);
  if (this.question.multi) {
    if (updated.has(answerId)) {
      updated.delete(answerId);
    } else {
      updated.add(answerId);
    }
  } else {
    updated.clear();
    updated.add(answerId);
  }
  this.selectedIds = updated;
  this.selectionChange.emit({
    questionId: this.question.id,
    answerIds: Array.from(this.selectedIds),
  });
}

  isSelected(answerId: number): boolean {
    return this.selectedIds.has(answerId);
  }

  getLabel(i: number): string {
    return String.fromCharCode(65 + i);
  }

  hasSelection(): boolean {
    return this.selectedIds.size > 0;
  }

  resetSelection() {
    this.selectedIds = new Set<number>();
  }
}

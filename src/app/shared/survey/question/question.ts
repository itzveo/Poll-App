import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { SQuestion } from '../../../types';
import { UtilService } from '../../../util.service';

@Component({
  selector: 'app-question',
  imports: [],
  templateUrl: './question.html',
  styleUrl: './question.scss',
})
export class Question {
  private utilService = inject(UtilService);

  @Input() question!: SQuestion;
  @Input() index: number = 0;
  @Output() selectionChange = new EventEmitter<{ questionId: number; answerIds: number[] }>();

  selectedIds = new Set<number>();

  /**
   * Toggles the selection state of an answer.
   * In multi-select mode, adds or removes the answer from the selection set.
   * In single-select mode, replaces any existing selection with the given answer.
   * Emits the updated selection via `selectionChange`.
   * @param answerId - The ID of the answer to toggle.
   */
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
      if (!this.selectedIds.has(answerId)) {
        updated.add(answerId);
      }
    }
    this.selectedIds = updated;
    this.selectionChange.emit({
      questionId: this.question.id,
      answerIds: Array.from(this.selectedIds),
    });
  }

  /**
   * Returns `true` if the given answer is currently selected.
   * @param answerId - The ID of the answer to check.
   */
  isSelected(answerId: number): boolean {
    return this.selectedIds.has(answerId);
  }

  /** Converts a zero-based index to its corresponding uppercase letter label (e.g. 0 → 'A'). */
  getLabel(i: number): string {
    return this.utilService.getLabel(i);
  }

  /** Returns `true` if at least one answer is currently selected. */
  hasSelection(): boolean {
    return this.selectedIds.size > 0;
  }

  /** Clears all selected answers, resetting the question to its initial unanswered state. */
  resetSelection() {
    this.selectedIds = new Set<number>();
  }
}

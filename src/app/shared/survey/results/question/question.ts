import { Component, inject, Input } from '@angular/core';
import { SQuestion, SAnswer } from '../../../../types';
import { UtilService } from '../../../../util.service';

@Component({
  selector: 'app-result-question',
  imports: [],
  templateUrl: './question.html',
  styleUrl: './question.scss',
})
export class ResultQuestion {
  private utilService = inject(UtilService);

  @Input() question!: SQuestion;
  @Input() previewSelections: number[] = [];

  /**
   * Calculates the total number of votes cast across all answers for this question.
   * @returns The sum of all answer vote counts.
   */
  totalVotes(): number {
    const base = this.question.answers.reduce((sum, a) => sum + (a.vote_count ?? 0), 0);
    return base + (this.previewSelections.length > 0 ? 1 : 0);
  }

  /**
   * Calculates the percentage of total votes that a given answer received, rounded to the nearest integer.
   * Returns 0 if no votes have been cast.
   * @param answer - The answer whose vote share is to be calculated.
   * @returns The rounded percentage (0–100).
   */
  getPercent(answer: SAnswer): number {
    const total = this.totalVotes();
    if (total === 0) return 0;

    const isSelected = this.previewSelections.includes(answer.id);
    const voteCount = (answer.vote_count ?? 0) + (isSelected ? 1 : 0);

    return Math.round((voteCount / total) * 100);
  }

  /** Converts a zero-based index to its corresponding uppercase letter label (e.g. 0 → 'A'). */
  getLabel(i: number): string {
    return this.utilService.getLabel(i);
  }
}

import { Component, Input } from '@angular/core';
import { SQuestion, SAnswer } from '../../../../types';

@Component({
  selector: 'app-result-question',
  imports: [],
  templateUrl: './question.html',
  styleUrl: './question.scss',
})
export class ResultQuestion {
  @Input() question!: SQuestion;

  totalVotes(): number {
    return this.question.answers.reduce((sum, a) => sum + (a.vote_count ?? 0), 0);
  }

  getPercent(answer: SAnswer): number {
    const total = this.totalVotes();
    if (total === 0) return 0;
    return Math.round(((answer.vote_count ?? 0) / total) * 100);
  }

  getLabel(i: number): string {
    return String.fromCharCode(65 + i);
  }
}

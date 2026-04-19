import { Component, Input } from '@angular/core';
import { SQuestion } from '../../../../types';

@Component({
  selector: 'app-result-question',
  imports: [],
  templateUrl: './question.html',
  styleUrl: './question.scss',
})
export class ResultQuestion {
  @Input() question!: SQuestion;

  getLabel(i: number): string {
    return String.fromCharCode(65 + i);
  }
}

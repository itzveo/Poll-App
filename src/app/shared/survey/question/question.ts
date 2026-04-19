import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-question',
  imports: [],
  templateUrl: './question.html',
  styleUrl: './question.scss',
})
export class Question {
  @Input() question!: { question_text: string; answers: { id: number; answer_text: string }[] };
  @Input() index: number = 0;

  getLabel(i: number): string {
    return String.fromCharCode(65 + i);
  }
}

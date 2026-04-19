import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-survey-preview',
  imports: [CommonModule],
  templateUrl: './survey-preview.html',
  styleUrl: './survey-preview.scss',
})
export class SurveyPreview {
  category = input<string>('');
  name = input<string>('');
  end_date = input<Date>(new Date());
  description = input<string>('');

  daysRemaining = computed(() => {
    const end = new Date(this.end_date());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endNormalized = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const diff = endNormalized.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });
}

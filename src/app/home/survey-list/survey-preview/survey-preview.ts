import { Component, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilService } from '../../../util.service';

@Component({
  selector: 'app-survey-preview',
  imports: [CommonModule],
  templateUrl: './survey-preview.html',
  styleUrl: './survey-preview.scss',
})
export class SurveyPreview {
  private utilService = inject(UtilService);

  category = input<string>('');
  name = input<string>('');
  end_date = input<Date>(new Date());
  description = input<string>('');

  daysRemaining = computed(() => this.utilService.getDaysRemaining(this.end_date()));
}

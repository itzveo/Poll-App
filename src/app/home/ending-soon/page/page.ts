import { Component, computed, inject, input } from '@angular/core';
import { UtilService } from '../../../util.service';

@Component({
  selector: 'app-page',
  imports: [],
  templateUrl: './page.html',
  styleUrl: './page.scss',
})
export class Page {
  private utilService = inject(UtilService);

  category = input<string>('');
  name = input<string>('');
  end_date = input<Date>(new Date());
  description = input<string>('');

  daysRemaining = computed(() => this.utilService.getDaysRemaining(this.end_date()));
}

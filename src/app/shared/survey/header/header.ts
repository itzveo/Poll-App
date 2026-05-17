import { Component, computed, inject, input } from '@angular/core';
import { UtilService } from '../../../util.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  constructor(private router: Router) {}

  private utilService = inject(UtilService);

  category = input<string>('');
  name = input<string>('');
  end_date = input<Date>(new Date());
  description = input<string>('');

  /** Navigates to home page */
  backToHome() {
    this.router.navigate(['']);
  }

  /** Calculates the number of calendar days remaining until the given end date. */
  daysRemaining = computed(() => this.utilService.getDaysRemaining(this.end_date()));
}

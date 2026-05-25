import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Page } from './page/page';
import { Supabase } from '../../supabase';

@Component({
  selector: 'app-ending-soon',
  imports: [Page],
  templateUrl: './ending-soon.html',
  styleUrl: './ending-soon.scss',
})
export class EndingSoon {
  constructor(private router: Router) {}
  dbService = inject(Supabase);

  /** Fetches all active surveys from the database on component initialization. */
  ngOnInit() {
    this.dbService.getActiveSurveys();
  }

  /**
   * Navigates to the detail page of the clicked survey.
   * @param surveyId - The ID of the survey to navigate to.
   * @param endDate - The Date on which the survey ends.
   */
  onSurveyClick(surveyId: number, endDate: Date) {
    const isExpired = new Date(endDate) < new Date();
    if (isExpired) return;
    this.router.navigate(['/survey', surveyId]);
  }
}

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

  ngOnInit() {
    this.dbService.getActiveSurveys();
  }

  onSurveyClick(surveyId: number) {
    this.router.navigate(['/survey', surveyId]);
  }
}

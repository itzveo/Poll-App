import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-info',
  imports: [],
  templateUrl: './info.html',
  styleUrl: './info.scss',
})
export class Info {
  constructor(private router: Router) {}

  /** Opens the new survey page */
  openNewSurvey() {
    this.router.navigate(['/new']);
  }
}

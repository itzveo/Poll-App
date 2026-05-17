import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Main_Header {
  constructor(private router: Router) {}

  /** Opens the new survey page */
  openNewSurvey() {
    this.router.navigate(['/new']);
  }

  /** Opens the home page */
  backToHome(){
    this.router.navigate(['']);
  }
}

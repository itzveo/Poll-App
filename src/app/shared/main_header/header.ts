import { Component } from '@angular/core';

@Component({
  selector: 'app-main-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Main_Header {
  /** Opens the new survey page */
  openNewSurvey(){
    window.location.href = "/new";
  }
}

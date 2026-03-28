import { Component } from '@angular/core';

@Component({
  selector: 'app-info',
  imports: [],
  templateUrl: './info.html',
  styleUrl: './info.scss',
})
export class Info {
  openNewSurvey(){
    window.location.href = "/new";
  }
}

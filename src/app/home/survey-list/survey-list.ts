import { Component } from '@angular/core';
import { SurveyPreview } from "./survey-preview/survey-preview";

@Component({
  selector: 'app-survey-list',
  imports: [SurveyPreview],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {
  constructor(){
    
  }
}

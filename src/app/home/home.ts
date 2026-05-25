import { Component, signal } from '@angular/core';
import { Info } from './info/info';
import { SurveyList } from './survey-list/survey-list';
import { EndingSoon } from './ending-soon/ending-soon';
import { Main_Header } from '../shared/main_header/header';
import { NewSurvey } from '../new-survey/new-survey';

@Component({
  selector: 'app-home',
  imports: [Info, SurveyList, EndingSoon, Main_Header, NewSurvey],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  showNewSurvey = signal(false);

  openNewSurvey(): void {
    this.showNewSurvey.set(true);
  }

  closeNewSurvey(): void {
    this.showNewSurvey.set(false);
  }
}

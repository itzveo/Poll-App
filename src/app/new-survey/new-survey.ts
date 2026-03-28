import { Component } from '@angular/core';
import { Question } from './question/question';
import { WideCaretDirective } from '../wide-caret.directive';

@Component({
  selector: 'app-new-survey',
  imports: [Question, WideCaretDirective],
  templateUrl: './new-survey.html',
  styleUrl: './new-survey.scss',
})
export class NewSurvey {
  backToHome(){
    window.location.href = "";
  }
}

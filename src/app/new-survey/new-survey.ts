import { Component } from '@angular/core';
import { Question } from './question/question';
import { WideCaretDirective } from '../wide-caret.directive';
import { Main_Header } from "../shared/main_header/header";

@Component({
  selector: 'app-new-survey',
  imports: [Question, WideCaretDirective, Main_Header],
  templateUrl: './new-survey.html',
  styleUrl: './new-survey.scss',
})
export class NewSurvey {
  backToHome(){
    window.location.href = "";
  }
}

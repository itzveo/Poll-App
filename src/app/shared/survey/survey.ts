import { Component } from '@angular/core';
import { Main_Header } from "../main_header/header";
import { Question } from "./question/question";
import { Header } from "./header/header";
import { ResultQuestion } from './results/question/question';

@Component({
  selector: 'app-survey',
  imports: [Main_Header, Question, Header, ResultQuestion],
  templateUrl: './survey.html',
  styleUrl: './survey.scss',
})
export class Survey {}

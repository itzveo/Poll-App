import { Component } from '@angular/core';
import { Info } from "./info/info";
import { SurveyList } from "./survey-list/survey-list";
import { EndingSoon } from "./ending-soon/ending-soon";
import { Main_Header } from "../shared/main_header/header";

@Component({
  selector: 'app-home',
  imports: [Info, SurveyList, EndingSoon, Main_Header],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}

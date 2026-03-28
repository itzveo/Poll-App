import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Survey } from './shared/survey/survey';
import { NewSurvey } from './new-survey/new-survey';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'survey:/survey', component: Survey },
    { path: 'new', component: NewSurvey },
    { path: '**', redirectTo: ''}
];

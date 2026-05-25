import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Survey } from './shared/survey/survey';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'survey/:id', component: Survey },
    { path: '**', redirectTo: ''}
];

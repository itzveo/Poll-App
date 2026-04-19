import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SurveyPreview } from './survey-preview/survey-preview';
import { FilterMode, Supabase } from '../../supabase';

@Component({
  selector: 'app-survey-list',
  imports: [SurveyPreview],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList implements OnInit {
  activeFilter = signal<FilterMode>('all');
  isDropdownOpen = false;

  constructor(public dbService: Supabase, private router: Router) {}

  ngOnInit() {
    this.dbService.getSurveys('all');
  }

  setFilter(filter: 'active' | 'past') {
    const next: FilterMode = this.activeFilter() === filter ? 'all' : filter;
    this.activeFilter.set(next);
    this.dbService.getSurveys(next);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onSurveyClick(surveyId: number) {
    this.router.navigate(['/survey', surveyId]);
  }
}

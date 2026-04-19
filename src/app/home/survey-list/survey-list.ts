import { Component, OnInit, signal, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SurveyPreview } from './survey-preview/survey-preview';
import { FilterMode, Supabase, CATEGORIES, Category } from '../../supabase';
 
@Component({
  selector: 'app-survey-list',
  imports: [SurveyPreview],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList implements OnInit {
  activeFilter = signal<FilterMode>('all');
  selectedCategory = signal<Category | null>(null);
  isDropdownOpen = false;
 
  readonly categories = CATEGORIES;
 
  constructor(public dbService: Supabase, private router: Router) {}
 
  ngOnInit() {
    this.dbService.getSurveys('all');
  }
 
  setFilter(filter: 'active' | 'past') {
    const next: FilterMode = this.activeFilter() === filter ? 'all' : filter;
    this.activeFilter.set(next);
    this.dbService.getSurveys(next, this.selectedCategory());
  }
 
  toggleCategory(category: Category) {
    const next = this.selectedCategory() === category ? null : category;
    this.selectedCategory.set(next);
    this.dbService.getSurveys(this.activeFilter(), next);
    this.isDropdownOpen = false;
  }
 
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
 
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.isDropdownOpen = false;
    }
  }
 
  onSurveyClick(surveyId: number) {
    this.router.navigate(['/survey', surveyId]);
  }
}

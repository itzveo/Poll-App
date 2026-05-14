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

  constructor(
    public dbService: Supabase,
    private router: Router,
  ) {}

  /** Loads all surveys (no filter applied) on component initialization. */
  ngOnInit() {
    this.dbService.getSurveys('all');
  }

  /**
   * Toggles an active/past filter. If the given filter is already active, resets to 'all'.
   * Triggers a new survey fetch with the updated filter and current category.
   * @param filter - The filter mode to apply ('active' or 'past').
   */
  setFilter(filter: 'active' | 'past') {
    const next: FilterMode = this.activeFilter() === filter ? 'all' : filter;
    this.activeFilter.set(next);
    this.dbService.getSurveys(next, this.selectedCategory());
  }

  /**
   * Selects or deselects a category filter and closes the dropdown.
   * If the given category is already selected it is deselected.
   * Triggers a new survey fetch with the updated category and current filter.
   * @param category - The category to toggle.
   */
  toggleCategory(category: Category) {
    const next = this.selectedCategory() === category ? null : category;
    this.selectedCategory.set(next);
    this.dbService.getSurveys(this.activeFilter(), next);
    this.isDropdownOpen = false;
  }

  /** Toggles the category dropdown open/closed state. */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Global click handler that closes the category dropdown when the user clicks outside it.
   * @param event - The native mouse click event.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.isDropdownOpen = false;
    }
  }

  /**
   * Navigates to the detail page of the selected survey.
   * @param surveyId - The ID of the survey to navigate to.
   */
  onSurveyClick(surveyId: number) {
    this.router.navigate(['/survey', surveyId]);
  }
}

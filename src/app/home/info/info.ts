import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-info',
  imports: [],
  templateUrl: './info.html',
  styleUrl: './info.scss',
})
export class Info {
  @Output() newSurvey = new EventEmitter<void>();

  constructor(private router: Router) {}

  /** Opens the new survey dialog */
  openNewSurvey(): void {
    this.newSurvey.emit();
  }
}

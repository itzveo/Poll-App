import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Main_Header {
  @Output() newSurvey = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  constructor(private router: Router) {}

  /** Opens the new survey dialog */
  openNewSurvey() {
    this.newSurvey.emit();
  }

  /** Opens the home page */
  backToHome() {
    this.router.navigate(['']);
  }

  /** Closes the new survey dialog. */
  close(): void {
    this.closed.emit();
  }
}

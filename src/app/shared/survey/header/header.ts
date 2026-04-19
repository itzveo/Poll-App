import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() survey: any = null;

  backToHome() {
    window.location.href = '';
  }

  getDaysRemaining(): number | null {
    if (!this.survey?.ends_at) return null;
    const diff = new Date(this.survey.ends_at).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

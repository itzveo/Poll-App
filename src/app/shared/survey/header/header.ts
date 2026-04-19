import { Component, computed, input} from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  category = input<string>('');
  name = input<string>('');
  end_date = input<Date>(new Date());
  description = input<string>('');

  backToHome() {
    window.location.href = '';
  }

  daysRemaining = computed(() => {
    const end = new Date(this.end_date());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endNormalized = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const diff = endNormalized.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });
}

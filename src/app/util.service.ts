import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  /**
   * Converts a zero-based index to its corresponding uppercase letter label (e.g. 0 → 'A').
   * @param index - The zero-based index to convert.
   * @returns The uppercase letter for that index.
   */
  getLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /**
   * Calculates the number of calendar days remaining until the given end date.
   * Normalizes both today's date and the end date to midnight to avoid time-of-day skew.
   * Returns a negative number if the end date has already passed.
   * @param endDate - The target end date.
   * @returns The number of remaining calendar days.
   */
  getDaysRemaining(endDate: Date): number {
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endNormalized = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diff = endNormalized.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
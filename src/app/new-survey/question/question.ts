import { Component } from '@angular/core';
import { WideCaretDirective } from '../../wide-caret.directive';
@Component({
  selector: 'app-question',
  imports: [WideCaretDirective],
  templateUrl: './question.html',
  styleUrl: './question.scss',
})
export class Question {
  

  markAsChecked() {
    
  }

  getCheckBox(e: MouseEvent): HTMLElement {
    return (e.target as HTMLElement).closest('.multi-A') as HTMLElement;
  }
}
